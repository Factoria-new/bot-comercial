import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadMediaMessage } from 'baileys';
import { baileysLogger } from '../config/logger.js';
import axios from 'axios';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// TTS and Config imports
import { getSessionConfig, isTtsEnabled, getTtsVoice, getTtsRules } from './sessionConfigService.js';
import { generateAudio } from './ttsService.js';
import { convertWavToOgg } from '../utils/audioConverter.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Store active WhatsApp sessions
const sessions = new Map();

// Store agent prompts for each session (configured during agent creation)
const agentPrompts = new Map();

// Store conversation history per contact
const conversationHistory = new Map();

// Store LID to phone number mappings (for Baileys v7 LID workaround)
const lidMapping = new Map();

// Store the last incoming message type per contact (for TTS rules)
const lastIncomingMessageType = new Map();

// --- METRICS STATE ---
let metrics = {
    totalMessages: 0,
    newContacts: 0,
    activeChats: 0
};

// Bot message identifier to prevent message loops
const BOT_IDENTIFIER = '[BOT]';
// ---------------------

/**
 * Transcribe audio using Gemini API
 * @param {Buffer} audioBuffer - The audio file buffer
 * @param {string} mimeType - MIME type of the audio (e.g., 'audio/ogg; codecs=opus')
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/ogg') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not configured for audio transcription');
        return '[Áudio não transcrito - API Key ausente]';
    }

    try {
        console.log('🎤 Transcribing audio with Gemini 2.5 Flash...');
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.5-flash for native audio support
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert buffer to base64
        const base64Audio = audioBuffer.toString('base64');

        // Gemini multimodal: send audio as inline data
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType.split(';')[0], // Remove codec info if present
                    data: base64Audio
                }
            },
            "Transcreva este áudio para texto em português. Retorne APENAS a transcrição literal do que foi dito, sem comentários ou explicações adicionais."
        ]);

        const transcription = result.response.text().trim();
        console.log(`✅ Audio transcribed: "${transcription.substring(0, 100)}..."`);
        return transcription;
    } catch (error) {
        console.error('❌ Audio transcription error:', error.message);
        return '[Erro ao transcrever áudio]';
    }
}

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

                // Extract message text (or transcribe audio)
                let messageText = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    '';

                let incomingMessageType = 'text';

                // Check for audio message
                if (msg.message.audioMessage) {
                    console.log('🎤 Audio message detected, downloading and transcribing...');
                    incomingMessageType = 'audio';
                    try {
                        // Download the audio
                        const audioBuffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            {
                                logger: baileysLogger,
                                reuploadRequest: sock.updateMediaMessage
                            }
                        );

                        // Get MIME type
                        const mimeType = msg.message.audioMessage.mimetype || 'audio/ogg';
                        console.log(`📥 Audio downloaded: ${audioBuffer.length} bytes, type: ${mimeType}`);

                        // Transcribe using Gemini
                        messageText = await transcribeAudio(audioBuffer, mimeType);
                    } catch (error) {
                        console.error('❌ Failed to process audio:', error.message);
                        messageText = '[Áudio recebido mas não foi possível transcrever]';
                    }
                }

                // Skip messages from ourselves (sent by the bot or manually from this device)
                if (msg.key.fromMe) {
                    console.log('⏭️ Skipping: Message sent by us (fromMe)');
                    continue;
                }

                // Skip group messages - only respond to private chats
                if (msg.key.remoteJid?.endsWith('@g.us')) {
                    console.log('⏭️ Skipping: Group message');
                    continue;
                }

                // Skip all non-private chat messages (channels, newsletters, broadcasts, status, lists, etc.)
                // Only process private chats: @s.whatsapp.net (phone) or @lid (linked device ID)
                const jid = msg.key.remoteJid || '';
                const isPrivateChat = jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid');

                if (!isPrivateChat) {
                    console.log(`⏭️ Skipping: Non-private chat (${jid})`);
                    continue;
                }

                // Skip bot-generated messages (contains BOT_IDENTIFIER)
                if (messageText.startsWith(BOT_IDENTIFIER)) {
                    console.log('⏭️ Skipping: Bot-generated message');
                    continue;
                }

                console.log(`📝 Processing message (${incomingMessageType}): "${messageText.substring(0, 100)}" from ${msg.key.remoteJid}`);


                const remoteJid = msg.key.remoteJid;

                // Skip messages from our own number (connected device)
                const session = sessions.get(sessionId);
                if (session?.user?.id) {
                    const ownNumber = session.user.id.split(':')[0];
                    const senderNumber = remoteJid?.split('@')[0];
                    if (ownNumber === senderNumber) {
                        console.log('⏭️ Skipping: Message from our own number');
                        continue;
                    }
                }

                const contactId = `${sessionId}:${remoteJid}`;

                // Store the incoming message type for TTS rules evaluation
                lastIncomingMessageType.set(contactId, incomingMessageType);
                console.log(`📋 Stored messageType=${incomingMessageType} for ${contactId}`);

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
// incomingMessageType: 'text' | 'audio' | 'image' etc. - used for TTS rule evaluation
// Modified to accept options object
export const sendMessageToUser = async (sessionId, phoneNumber, message, incomingMessageType = 'text', options = {}) => {
    const session = sessions.get(sessionId);

    if (!session) {
        console.error(`❌ Session ${sessionId} not found`);
        throw new Error('Session not found or not connected');
    }

    // Check if socket is still open
    if (!session.ws?.isOpen) {
        throw new Error('WhatsApp connection is not open');
    }

    // Format JID properly
    let remoteJid = phoneNumber;
    const originalRemoteJid = phoneNumber; // Keep track of the original ID for history lookup

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
        // Check if TTS is enabled for this session
        const config = getSessionConfig(sessionId);
        console.log(`📋 TTS Config for ${sessionId}:`, JSON.stringify(config));
        let shouldSendAudio = false;

        if (options.forceAudio) {
            shouldSendAudio = true;
            console.log(`🎤 TTS Forced via Function Calling for ${remoteJid}`);
        } else if (config.ttsEnabled) {
            // Get last user message for context using ORIGINAL ID from upstream
            // This is crucial because history is stored with the ID that received the message (likely LID)
            const contactId = `${sessionId}:${originalRemoteJid}`;

            // Fallback: try the converted ID just in case
            const contactIdConverted = `${sessionId}:${remoteJid}`;

            let history = conversationHistory.get(contactId);
            if (!history || history.length === 0) {
                history = conversationHistory.get(contactIdConverted) || [];
                if (history.length > 0) console.log('Found history on converted ID');
            } else {
                console.log('Found history on original ID');
            }

            const lastUserMsgObj = [...history].reverse().find(msg => msg.role === 'user');
            const lastUserMessage = lastUserMsgObj ? lastUserMsgObj.content : '';

            console.log(`🎤 Smart TTS Context: Last User Message="${lastUserMessage}" (History Size: ${history.length})`);

            // Retrieve stored incoming message type for TTS rules evaluation
            let storedMessageType = lastIncomingMessageType.get(contactId) || lastIncomingMessageType.get(contactIdConverted);
            if (!storedMessageType) {
                storedMessageType = 'text'; // Default fallback
            }
            console.log(`📋 Retrieved messageType=${storedMessageType} for TTS rules`);

            shouldSendAudio = await evaluateTtsRules(config.ttsRules, storedMessageType, message, lastUserMessage);
            console.log(`🎤 TTS enabled. Rules evaluation result: ${shouldSendAudio ? 'SEND AUDIO' : 'SEND TEXT'}`);
        }

        if (shouldSendAudio) {
            // Generate and send audio
            try {
                const voice = options.voice || config.ttsVoice || 'Kore';
                console.log(`🎤 Generating audio with voice: ${voice}`);
                const ttsResult = await generateAudio(message, voice, config.apiKey || process.env.GEMINI_API_KEY);

                // Convert WAV to OGG for WhatsApp
                const wavBuffer = Buffer.from(ttsResult.audioContent, 'base64');
                const oggBuffer = await convertWavToOgg(wavBuffer);

                // Send as voice message (ptt = push-to-talk)
                await session.sendMessage(remoteJid, {
                    audio: oggBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                });

                console.log(`🎤 Audio message sent to ${remoteJid}`);
            } catch (ttsError) {
                console.error('⚠️ TTS failed, falling back to text:', ttsError.message);
                // Fallback to text message
                await session.sendMessage(remoteJid, { text: message });
            }
        } else {
            // Send text message
            await session.sendMessage(remoteJid, { text: message });
        }

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

/**
 * Evaluate TTS rules to determine if audio should be sent
 * Now uses structured object-based rules (predefined checkboxes)
 * @param {Object} rules - Rule object with audioOnRequest, audioOnAudioReceived, audioOnly
 * @param {string} incomingType - Type of incoming message ('text' or 'audio')
 * @param {string} responseText - The response text
 * @param {string} lastUserMessage - The last message from the user (context)
 * @returns {Promise<boolean>}
 */
async function evaluateTtsRules(rules, incomingType, responseText, lastUserMessage = '') {
    // Handle case where rules is null/undefined or old string format
    if (!rules || typeof rules === 'string') {
        // Legacy string format or no rules = always send audio when TTS is enabled
        console.log('📋 TTS Rules: No rules or legacy format - defaulting to audio');
        return true;
    }

    console.log(`📋 TTS Rules evaluation:`, JSON.stringify(rules));
    console.log(`📋 Context: incomingType=${incomingType}, lastUserMessage="${lastUserMessage?.substring(0, 50)}..."`);

    // Rule 3: Audio Only (exclusive - always send audio)
    if (rules.audioOnly) {
        console.log('✅ TTS Rule: audioOnly=true -> Sending audio');
        return true;
    }

    // If no rules are active, default to send audio
    if (!rules.audioOnRequest && !rules.audioOnAudioReceived) {
        console.log('✅ TTS Rule: No rules active -> Sending audio');
        return true;
    }

    // Rule 2: Audio when receiving audio
    if (rules.audioOnAudioReceived && incomingType === 'audio') {
        console.log('✅ TTS Rule: audioOnAudioReceived=true and received audio -> Sending audio');
        return true;
    }

    // Rule 1: Audio only when requested
    if (rules.audioOnRequest) {
        // Check if user explicitly requested audio
        const lowerMessage = (lastUserMessage || '').toLowerCase();
        const audioRequestPatterns = [
            'manda audio', 'manda áudio', 'mande audio', 'mande áudio',
            'envia audio', 'envia áudio', 'envie audio', 'envie áudio',
            'pode falar', 'fala pra mim', 'fala para mim',
            'me fala', 'me explica por audio', 'me explica por áudio',
            'audio por favor', 'áudio por favor', 'quero audio', 'quero áudio',
            'prefiro audio', 'prefiro áudio', 'por audio', 'por áudio',
            'em audio', 'em áudio', 'via audio', 'via áudio'
        ];

        const requestedAudio = audioRequestPatterns.some(pattern => lowerMessage.includes(pattern));

        if (requestedAudio) {
            console.log('✅ TTS Rule: audioOnRequest=true and user requested audio -> Sending audio');
            return true;
        }
    }

    // If we got here, rules are active but conditions not met -> send text
    console.log('❌ TTS Rule: Conditions not met -> Sending text');
    return false;
}

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
