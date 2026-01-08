import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from 'baileys';
import { baileysLogger } from '../config/logger.js';
import axios from 'axios';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Store active WhatsApp sessions
const sessions = new Map();

// Store agent prompts for each session (configured during agent creation)
const agentPrompts = new Map();

// Store conversation history per contact
const conversationHistory = new Map();

// Store LID to phone number mappings (for Baileys v7 LID workaround)
const lidMapping = new Map();

// --- METRICS STATE ---
let metrics = {
    totalMessages: 0,
    newContacts: 0,
    activeChats: 0
};
// ---------------------

// Initialize WhatsApp service with Socket.IO
export const initWhatsAppService = (io) => {
    console.log('📱 WhatsApp Service initialized (Baileys v7)');

    // Listen for socket connections
    io.on('connection', (socket) => {
        console.log(`🔌 WhatsApp handler attached to socket: ${socket.id}`);

        // Handle QR code generation request
        socket.on('generate-qr', async ({ sessionId, phoneNumber }) => {
            console.log(`📲 Generate QR requested for session: ${sessionId}`);

            try {
                await createSession(sessionId, socket, io, phoneNumber);
            } catch (error) {
                console.error(`❌ Error creating session ${sessionId}:`, error);
                socket.emit('qr-error', {
                    sessionId,
                    error: error.message || 'Erro ao criar sessão'
                });
            }
        });

        // Handle logout request
        socket.on('logout', async ({ sessionId }) => {
            console.log(`🚪 Logout requested for session: ${sessionId}`);

            try {
                await logoutSession(sessionId, socket);
            } catch (error) {
                console.error(`❌ Error logging out session ${sessionId}:`, error);
            }
        });

        // --- METRICS EVENTS ---
        // Send current metrics immediately upon connection/request
        socket.on('request-metrics', () => {
            // Calculate active chats dynamically
            metrics.activeChats = sessions.size;
            socket.emit('metrics-update', metrics);
        });

        // Also emit on connection just in case
        metrics.activeChats = sessions.size;
        socket.emit('metrics-update', metrics);
        // ----------------------
    });
};

// Create a new WhatsApp session
const createSession = async (sessionId, socket, io, phoneNumber = null) => {
    // Check if session already exists and is connected
    const existingSession = sessions.get(sessionId);
    if (existingSession?.ws?.isOpen) {
        console.log(`📱 Session ${sessionId} already connected`);

        const user = existingSession.user;
        socket.emit('already-connected', {
            sessionId,
            user: user ? {
                number: user.id?.split(':')[0] || user.id,
                name: user.name || user.verifiedName || 'WhatsApp User'
            } : null
        });
        return;
    }

    // Session storage path
    const authFolder = path.join(process.cwd(), 'auth_info', sessionId);

    // Ensure auth folder exists
    if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
    }

    try {
        // Get auth state
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);

        // Get latest Baileys version
        const { version } = await fetchLatestBaileysVersion();

        console.log(`🔧 Creating WhatsApp socket for ${sessionId} with Baileys v7 (version ${version.join('.')})`);

        // Create WhatsApp socket with configuration per Baileys v7 docs
        const sock = makeWASocket({
            version,
            logger: baileysLogger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
            },
            browser: ['Chrome (Linux)', '', ''],
            connectTimeoutMs: 60000,
            qrTimeout: 40000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 25000,
            syncFullHistory: false,
            markOnlineOnConnect: false
        });

        // Store session
        sessions.set(sessionId, sock);

        // Connection update handler - SIMPLIFIED per Baileys docs
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log(`📡 Connection update for ${sessionId}:`, { connection, hasQR: !!qr });

            // QR Code received - send to frontend
            if (qr) {
                try {
                    const qrImage = await QRCode.toDataURL(qr, {
                        width: 256,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                    });

                    console.log(`📷 QR Code generated for ${sessionId}`);
                    socket.emit('qr', { qr: qrImage, sessionId });
                    io.emit('qr', { qr: qrImage, sessionId });
                } catch (qrError) {
                    console.error(`❌ Error generating QR image:`, qrError);
                    socket.emit('qr-error', { sessionId, error: 'Erro ao gerar QR Code' });
                }
            }

            // Connection states
            if (connection === 'connecting') {
                console.log(`🔄 Connecting ${sessionId}...`);
                socket.emit('connecting', { sessionId, message: 'Conectando...' });
            }

            if (connection === 'open') {
                console.log(`✅ Connected: ${sessionId}`);

                const user = sock.user;
                sessions.set(sessionId, { ...sock, user });

                socket.emit('connected', {
                    sessionId,
                    message: 'WhatsApp conectado com sucesso!'
                });

                socket.emit('user-info', {
                    sessionId,
                    user: {
                        number: user?.id?.split(':')[0] || user?.id,
                        name: user?.name || user?.verifiedName || 'WhatsApp User'
                    }
                });

                io.emit('connected', { sessionId, message: 'WhatsApp conectado!' });

                // Update active chats metric
                metrics.activeChats = sessions.size;
                io.emit('metrics-update', metrics);
            }

            // Connection closed - handle reconnection per Baileys docs
            // IMPORTANT: After QR scan, WhatsApp forcibly disconnects - this is NORMAL!
            // We must recreate the socket in this case
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log(`❌ Connection closed for ${sessionId}. Status: ${statusCode}, Reconnect: ${shouldReconnect}`);

                // Clean up current session
                sessions.delete(sessionId);

                if (shouldReconnect) {
                    // This is normal behavior per Baileys docs - just recreate the socket
                    console.log(`🔄 Reconnecting ${sessionId}...`);
                    socket.emit('connection-status', {
                        sessionId,
                        message: 'Reconectando...',
                        retrying: true
                    });

                    // Recreate session after short delay
                    setTimeout(() => {
                        createSession(sessionId, socket, io, phoneNumber);
                    }, 2000);
                } else {
                    // User logged out - clean everything
                    console.log(`🚪 User logged out for ${sessionId}`);

                    try {
                        if (fs.existsSync(authFolder)) {
                            fs.rmSync(authFolder, { recursive: true, force: true });
                        }
                    } catch (e) {
                        console.error('Error cleaning auth folder:', e);
                    }

                    socket.emit('disconnected', { sessionId, message: 'WhatsApp desconectado', willReconnect: false });
                    io.emit('disconnected', { sessionId, message: 'WhatsApp desconectado', willReconnect: false });

                    // Update active chats metric
                    metrics.activeChats = sessions.size;
                    io.emit('metrics-update', metrics);

                    clearSessionData(sessionId);

                    socket.emit('logged-out', { sessionId });
                    io.emit('logged-out', { sessionId });
                }
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            // Only process new messages (notify type)
            if (type !== 'notify') return;

            for (const msg of messages) {
                // Skip empty messages
                if (!msg.message) {
                    console.log('⚠️ Skipping: No message content');
                    continue;
                }

                // Extract message text
                const messageText = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    '';

                console.log(`📝 Processing message: "${messageText}" from ${msg.key.remoteJid}`);


                const remoteJid = msg.key.remoteJid;
                const contactId = `${sessionId}:${remoteJid}`;

                // Baileys v7 LID workaround: store LID to phone mapping
                // Check if we have an alternate JID (phone number) available
                const remoteJidAlt = msg.key.remoteJidAlt;
                if (remoteJid?.includes('@lid') && remoteJidAlt) {
                    lidMapping.set(remoteJid, remoteJidAlt);
                    console.log(`📱 LID mapping stored: ${remoteJid} -> ${remoteJidAlt}`);
                }

                console.log(`📩 WhatsApp [${sessionId}] Message from ${remoteJid}: ${messageText.substring(0, 50)}...`);

                // Get agent prompt for this session
                const agentPrompt = agentPrompts.get(sessionId);

                if (!agentPrompt) {
                    console.log(`⚠️ No agent prompt configured for session ${sessionId}`);
                    continue;
                }

                try {
                    // Get or create conversation history for this contact
                    let isNewContact = false;
                    if (!conversationHistory.has(contactId)) {
                        conversationHistory.set(contactId, []);
                        isNewContact = true;
                    }
                    const history = conversationHistory.get(contactId);

                    // --- UPDATE METRICS ---
                    metrics.totalMessages++;
                    if (isNewContact) {
                        metrics.newContacts++;
                    }
                    metrics.activeChats = sessions.size; // Update active chats count

                    // Emit updates to all connected clients
                    io.emit('metrics-update', metrics);
                    // ---------------------

                    // Add user message to history
                    history.push({ role: 'user', content: messageText });

                    // Keep history limited to last 20 messages
                    if (history.length > 20) {
                        history.splice(0, history.length - 20);
                    }

                    // Forward to Python AI Engine
                    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                    console.log(`🤖 Forwarding message to AI Engine: ${aiServiceUrl}`);

                    await axios.post(`${aiServiceUrl}/webhook/whatsapp`, {
                        userId: sessionId,
                        remoteJid: remoteJid,
                        message: messageText,
                        history: history.map(h => ({ role: h.role, content: h.content })),
                        agentPrompt: agentPrompt
                    });

                    console.log(`✅ Message forwarded to AI Engine for ${remoteJid}`);
                } catch (error) {
                    console.error(`❌ Error handling message from ${remoteJid}:`, error.message);
                }
            }
        });

    } catch (error) {
        console.error(`❌ Error in createSession for ${sessionId}:`, error);
        socket.emit('qr-error', {
            sessionId,
            error: error.message || 'Erro ao criar sessão'
        });
    }
};

// Helper function to clear session data
const clearSessionData = (sessionId) => {
    for (const key of conversationHistory.keys()) {
        if (key.startsWith(`${sessionId}:`)) {
            conversationHistory.delete(key);
        }
    }
    agentPrompts.delete(sessionId);
};

// Logout session
const logoutSession = async (sessionId, socket) => {
    const session = sessions.get(sessionId);

    if (session) {
        try {
            await session.logout();
        } catch (e) {
            console.log(`Note: logout() threw:`, e.message);
        }
        sessions.delete(sessionId);
    }

    // Clean auth folder
    const authFolder = path.join(process.cwd(), 'auth_info', sessionId);
    try {
        if (fs.existsSync(authFolder)) {
            fs.rmSync(authFolder, { recursive: true, force: true });
        }
    } catch (e) {
        console.error('Error cleaning auth folder:', e);
    }

    clearSessionData(sessionId);

    socket.emit('logged-out', { sessionId });
};

// Get session status for REST endpoint
export const getSessionStatus = (sessionId) => {
    const session = sessions.get(sessionId);

    if (!session) {
        return { connected: false, user: null };
    }

    const user = session.user;
    return {
        connected: !!session.ws?.isOpen,
        user: user ? {
            number: user.id?.split(':')[0] || user.id,
            name: user.name || user.verifiedName || 'WhatsApp User'
        } : null
    };
};

// Set agent prompt for a session
export const setAgentPrompt = (sessionId, prompt) => {
    if (!prompt) {
        console.warn(`⚠️ Cannot set empty prompt for session ${sessionId}`);
        return false;
    }

    agentPrompts.set(sessionId, prompt);
    console.log(`✅ Agent prompt configured for session ${sessionId} (${prompt.length} chars)`);
    return true;
};

// Get agent prompt for a session
export const getAgentPrompt = (sessionId) => {
    return agentPrompts.get(sessionId) || null;
};

// Send message to user (for external tools)
export const sendMessageToUser = async (sessionId, phoneNumber, message) => {
    const session = sessions.get(sessionId);

    if (!session) {
        throw new Error('Session not found or not connected');
    }

    // Check if socket is still open
    if (!session.ws?.isOpen) {
        throw new Error('WhatsApp connection is not open');
    }

    // Format JID properly
    let remoteJid = phoneNumber;

    // If it's a LID, try to convert to phone number using our mapping
    if (remoteJid.includes('@lid')) {
        const mappedPhone = lidMapping.get(remoteJid);
        if (mappedPhone) {
            console.log(`📱 Converting LID ${remoteJid} to phone ${mappedPhone}`);
            remoteJid = mappedPhone;
        } else {
            // Try to get from Baileys signalRepository if available
            try {
                const phoneNum = await session.signalRepository?.lidMapping?.getPNForLID?.(remoteJid);
                if (phoneNum) {
                    console.log(`📱 Got phone from signalRepository: ${phoneNum}`);
                    remoteJid = phoneNum;
                } else {
                    console.warn(`⚠️ No phone mapping found for LID: ${remoteJid}. Trying to send directly.`);
                }
            } catch (e) {
                console.warn(`⚠️ Could not get phone for LID: ${e.message}`);
            }
        }
    }

    // Add suffix if it's just a number
    if (!remoteJid.includes('@s.whatsapp.net') &&
        !remoteJid.includes('@g.us') &&
        !remoteJid.includes('@lid')) {
        remoteJid = `${phoneNumber}@s.whatsapp.net`;
    }

    console.log(`📤 Sending message to ${remoteJid} (session: ${sessionId})`);

    try {
        // Add identifier to message to prevent loops
        const messageWithId = `${BOT_IDENTIFIER} ${message}`;
        await session.sendMessage(remoteJid, { text: messageWithId });

        // Add to conversation history so AI remembers context
        const contactId = `${sessionId}:${remoteJid}`;
        if (!conversationHistory.has(contactId)) {
            conversationHistory.set(contactId, []);
        }
        const history = conversationHistory.get(contactId);
        history.push({ role: 'assistant', content: message });

        // Limit history size
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }

        console.log(`✅ Message sent to ${remoteJid} and added to history`);
        return { success: true, remoteJid };
    } catch (error) {
        console.error(`❌ Error sending message:`, error);
        throw error;
    }
};

// Get all active sessions
export const getActiveSessions = () => {
    const activeSessions = [];

    sessions.forEach((session, sessionId) => {
        if (session?.ws?.isOpen) {
            activeSessions.push({
                sessionId,
                user: session.user ? {
                    number: session.user.id?.split(':')[0] || session.user.id,
                    name: session.user.name || session.user.verifiedName || 'WhatsApp User'
                } : null
            });
        }
    });

    return activeSessions;
};

/**
 * Cleanup function for server shutdown
 * Deletes all auth info to ensure ephemeral sessions
 */
export const cleanup = async () => {
    console.log('🧹 Cleaning up WhatsApp service...');

    try {
        // Logout all active sessions first
        for (const [sessionId, session] of sessions.entries()) {
            try {
                if (session.end) await session.end(undefined);
            } catch (e) {
                // Ignore errors during logout
            }
        }

        sessions.clear();

        // Delete auth_info directory
        const authInfoPath = path.join(process.cwd(), 'auth_info');
        if (fs.existsSync(authInfoPath)) {
            console.log(`🗑️ Deleting auth info at ${authInfoPath}`);
            fs.rmSync(authInfoPath, { recursive: true, force: true });
        }
        console.log('✅ WhatsApp service cleaned up (auth_info deleted)');
    } catch (error) {
        console.error('❌ Error cleaning up WhatsApp service:', error);
    }
};
