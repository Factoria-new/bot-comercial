import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { baileysLogger } from '../config/logger.js';
import { chatWithAgent } from './geminiService.js';
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

// Initialize WhatsApp service with Socket.IO
export const initWhatsAppService = (io) => {
    console.log('📱 WhatsApp Service initialized');

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

        console.log(`🔧 Creating WhatsApp socket for ${sessionId} with version ${version.join('.')}`);

        // Create WhatsApp socket with robust configuration
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
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false
        });

        // Store session
        sessions.set(sessionId, sock);

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log(`📡 Connection update for ${sessionId}:`, { connection, hasQR: !!qr });

            // QR Code received
            if (qr) {
                try {
                    // Generate QR code as base64 image
                    const qrImage = await QRCode.toDataURL(qr, {
                        width: 256,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#ffffff'
                        }
                    });

                    console.log(`📷 QR Code generated for ${sessionId}`);

                    // Emit to socket
                    socket.emit('qr', { qr: qrImage, sessionId });
                    io.emit('qr', { qr: qrImage, sessionId }); // Broadcast to all
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
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                console.log(`❌ Connection closed for ${sessionId}. Status: ${statusCode}`);

                // Always clean up session and auth folder on disconnect
                // This ensures a fresh QR code is generated next time
                sessions.delete(sessionId);

                // Clean auth folder to force new QR code generation
                try {
                    if (fs.existsSync(authFolder)) {
                        fs.rmSync(authFolder, { recursive: true, force: true });
                        console.log(`🧹 Auth folder cleaned for ${sessionId}`);
                    }
                } catch (e) {
                    console.error('Error cleaning auth folder:', e);
                }

                // Clear conversation history for this session
                for (const key of conversationHistory.keys()) {
                    if (key.startsWith(`${sessionId}:`)) {
                        conversationHistory.delete(key);
                    }
                }

                // Clear agent prompt for this session
                agentPrompts.delete(sessionId);

                if (statusCode === DisconnectReason.loggedOut) {
                    socket.emit('logged-out', { sessionId });
                    io.emit('logged-out', { sessionId });
                } else {
                    socket.emit('disconnected', {
                        sessionId,
                        reason: 'connection_closed',
                        willReconnect: false
                    });
                    socket.emit('connection-error', {
                        sessionId,
                        error: 'Conexão perdida. Reconecte escaneando um novo QR code.'
                    });
                }
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages - Auto-respond with AI
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            // Only process new messages
            if (type !== 'notify') return;

            for (const msg of messages) {
                // Skip messages from self and empty messages
                if (msg.key.fromMe || !msg.message) continue;

                // Extract message text
                const messageText = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    '';

                if (!messageText) continue;

                const remoteJid = msg.key.remoteJid;
                const contactId = `${sessionId}:${remoteJid}`;

                console.log(`📩 WhatsApp [${sessionId}] Message from ${remoteJid}: ${messageText.substring(0, 50)}...`);

                // Get agent prompt for this session
                const agentPrompt = agentPrompts.get(sessionId);

                if (!agentPrompt) {
                    console.log(`⚠️ No agent prompt configured for session ${sessionId}`);
                    continue;
                }

                try {
                    // Get or create conversation history for this contact
                    if (!conversationHistory.has(contactId)) {
                        conversationHistory.set(contactId, []);
                    }
                    const history = conversationHistory.get(contactId);

                    // Add user message to history
                    history.push({ role: 'user', content: messageText });

                    // Keep history limited to last 20 messages
                    if (history.length > 20) {
                        history.splice(0, history.length - 20);
                    }

                    // Forward to Python AI Engine
                    try {
                        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                        console.log(`🤖 Forwarding message to AI Engine: ${aiServiceUrl}`);

                        await axios.post(`${aiServiceUrl}/webhook/whatsapp`, {
                            userId: sessionId, // Using sessionId as userId
                            remoteJid: remoteJid,
                            message: messageText,
                            history: history.map(h => ({ role: h.role, content: h.content })) // Optional history
                        });

                        console.log(`✅ Message forwarded to AI Engine for ${remoteJid}`);
                    } catch (webhookError) {
                        console.error(`❌ Failed to forward message to AI Engine:`, webhookError.message);
                    }

                    /* Legacy Gemini Logic - Commented out for hybrid architecture
                    // Generate AI response with history for context
                    console.log(`🤖 Generating AI response for ${remoteJid} (history: ${history.length} msgs)...`);
                    const aiResponse = await chatWithAgent(messageText, agentPrompt, history);

                    if (aiResponse.success && aiResponse.message) {
                        // Add AI response to history
                        history.push({ role: 'assistant', content: aiResponse.message });

                        // Send response via WhatsApp
                        await sock.sendMessage(remoteJid, { text: aiResponse.message });
                        console.log(`✅ AI response sent to ${remoteJid}`);

                        // Emit event for dashboard metrics
                        io.emit('whatsapp-message-handled', {
                            sessionId,
                            remoteJid,
                            userMessage: messageText,
                            aiResponse: aiResponse.message,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        console.error(`❌ AI response failed for ${remoteJid}:`, aiResponse.message);
                    }
                    */

                } catch (aiError) {
                    console.error(`❌ Error processing message from ${remoteJid}:`, aiError);
                }
            }
        });

    } catch (error) {
        console.error(`❌ Failed to create session ${sessionId}:`, error);
        socket.emit('qr-error', {
            sessionId,
            error: error.message || 'Erro ao iniciar sessão WhatsApp'
        });
        throw error;
    }
};

// Logout and clean up session
const logoutSession = async (sessionId, socket) => {
    const session = sessions.get(sessionId);

    if (session) {
        try {
            // Close socket connection
            await session.logout?.();
            session.end?.();
        } catch (e) {
            console.log(`Note: Error during logout for ${sessionId}:`, e.message);
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

    socket.emit('logged-out', { sessionId });
    console.log(`🚪 Session ${sessionId} logged out and cleaned up`);
};

// Get session status
export const getSessionStatus = (sessionId) => {
    const session = sessions.get(sessionId);

    if (!session) {
        return { connected: false, user: null };
    }

    return {
        connected: session.ws?.isOpen || false,
        user: session.user ? {
            id: session.user.id,
            phoneNumber: session.user.id?.split(':')[0],
            name: session.user.name || session.user.verifiedName
        } : null
    };
};

// Get all active sessions
export const getActiveSessions = () => {
    const activeSessions = [];

    sessions.forEach((session, sessionId) => {
        activeSessions.push({
            sessionId,
            connected: session.ws?.isOpen || false,
            user: session.user
        });
    });

    return activeSessions;
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

    // Ensure connection is open
    // Note: ws.isOpen might not be enough check in some baileys versions, but checking session existence is key

    // Format JID if it's just a number
    let remoteJid = phoneNumber;
    if (!remoteJid.includes('@s.whatsapp.net') && !remoteJid.includes('@g.us')) {
        remoteJid = `${phoneNumber}@s.whatsapp.net`;
    }

    try {
        await session.sendMessage(remoteJid, { text: message });

        // Add to history if possible
        const contactId = `${sessionId}:${remoteJid}`;
        if (!conversationHistory.has(contactId)) {
            conversationHistory.set(contactId, []);
        }
        const history = conversationHistory.get(contactId);
        history.push({ role: 'assistant', content: message });

        return true;
    } catch (error) {
        console.error(`Error sending message to ${remoteJid}:`, error);
        throw error;
    }
};

export default {
    initWhatsAppService,
    getSessionStatus,
    getActiveSessions,
    setAgentPrompt,
    getAgentPrompt,
    sendMessageToUser
};
