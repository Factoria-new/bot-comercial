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
import { getConversationHistory, saveMessage } from './historyService.js';
import prisma from '../config/prisma.js';
import { getConnectionStatus as getCalendarConnectionStatus } from './googleCalendarService.js';

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

// Store audio mode state per contact (for "audio until stopped" feature)
// When true, bot responds with audio until user explicitly asks to stop
const audioModeEnabled = new Map(); // contactId -> boolean

// Store user emails for Google Calendar integration (sessionId -> email)
const userEmails = new Map();

// Store appointment durations for calendar scheduling (sessionId -> minutes)
const appointmentDurations = new Map();

// Store service type (online/presencial) per session
const serviceTypes = new Map();

// Store business address per session
const businessAddresses = new Map();

// --- METRICS STATE ---
let metrics = {
    totalMessages: 0,
    newContacts: 0,
    activeChats: 0
};

// Bot message identifier to prevent message loops
const BOT_IDENTIFIER = '[BOT]';

// Contador de tentativas de reconexão para backoff exponencial
const reconnectionAttempts = new Map(); // sessionId -> { count, lastAttempt }

// --- MESSAGE BUFFER (Debounce de 10 segundos) ---
// Buffer para acumular mensagens do mesmo contato
const messageBuffer = new Map(); // contactId -> { messages: [], lastIncomingType: 'text', sessionId: '', sock: null, socket: null }

/**
 * Extract URLs from text and replace them with a spoken phrase for TTS.
 * This prevents TTS from dictating URLs character by character.
 * @param {string} text - Original message text
 * @returns {{ cleanText: string, links: string[] }} - Text with links replaced + extracted links
 */
const extractAndReplaceLinks = (text) => {
    // Regex to match URLs (http, https)
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = text.match(urlRegex) || [];

    if (links.length === 0) {
        return { cleanText: text, links: [] };
    }

    let cleanText = text;

    // Replace each link with appropriate phrase
    if (links.length === 1) {
        // Single link: "segue abaixo o link"
        cleanText = cleanText.replace(urlRegex, ', e segue abaixo o link');
    } else {
        // Multiple links: use counter
        let counter = 0;
        cleanText = cleanText.replace(urlRegex, () => {
            counter++;
            return `, e segue abaixo o link ${counter}`;
        });
    }

    // Clean up any double spaces or awkward punctuation
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    console.log(`🔗 Extracted ${links.length} link(s) from message for TTS`);

    return { cleanText, links };
};
// Timers de debounce por contato
const bufferTimers = new Map(); // contactId -> timeoutId
// Tempo de espera em ms (10 segundos)
const BUFFER_DELAY_MS = 10000;
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
export const initWhatsAppService = async (io) => {
    console.log('📱 WhatsApp Service initialized (Baileys v7)');

    // Restore sessions from disk
    try {
        const authInfoPath = path.join(process.cwd(), 'auth_info');
        if (fs.existsSync(authInfoPath)) {
            const folders = fs.readdirSync(authInfoPath).filter(f => fs.statSync(path.join(authInfoPath, f)).isDirectory());

            if (folders.length > 0) {
                console.log(`🔄 Found ${folders.length} saved sessions to restore:`, folders);

                // Wait small delay to ensure DB connection is ready
                setTimeout(async () => {
                    for (const sessionId of folders) {
                        try {
                            console.log(`🔄 Restoring session: ${sessionId}`);
                            // Pass null as socket since no client is connected yet during boot
                            // Pass null as userId/phone - let it recover from session data
                            await createSession(sessionId, null, io);
                        } catch (err) {
                            console.error(`❌ Failed to restore session ${sessionId}:`, err.message);
                        }
                    }
                }, 2000);
            }
        }
    } catch (restoreError) {
        console.error('❌ Error restoring sessions:', restoreError);
    }

    // Listen for socket connections
    io.on('connection', (socket) => {
        console.log(`🔌 WhatsApp handler attached to socket: ${socket.id}`);

        // Handle QR code generation request
        socket.on('generate-qr', async ({ sessionId, phoneNumber, userId }) => {
            console.log(`📲 Generate QR requested for session: ${sessionId}, userId: ${userId}`);

            if (!userId) {
                console.error('❌ Generate QR failed: userId é obrigatório');
                socket.emit('qr-error', {
                    sessionId,
                    error: 'Usuário não autenticado'
                });
                return;
            }

            try {
                // Criar ou atualizar instância vinculada ao usuário
                // Usamos findFirst + create/update pois Prisma não aceita userId no where do upsert
                // phoneNumber temporário usa o userId para garantir unicidade
                const tempPhoneNumber = phoneNumber || `pending_${userId}`;

                // Buscar instância existente para este usuário
                let instance = await prisma.instance.findFirst({
                    where: { userId }
                });

                if (!instance) {
                    // Criar nova instância se não existir
                    instance = await prisma.instance.create({
                        data: {
                            userId,
                            phoneNumber: tempPhoneNumber
                        }
                    });
                    console.log(`📱 Instance created: ${instance.id} for user ${userId}`);
                } else {
                    console.log(`📱 Instance found: ${instance.id} for user ${userId}`);
                }

                // Usar o sessionId original do frontend para manter compatibilidade
                await createSession(sessionId, socket, io, phoneNumber, userId);
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

        // Handle cancel connection request (when user closes modal without scanning QR)
        socket.on('cancel-connection', async ({ sessionId }) => {
            console.log(`🚫 Cancel connection requested for session: ${sessionId}`);

            const session = sessions.get(sessionId);
            if (session) {
                // Só cancelar se NÃO estiver conectado (evitar desconectar sessões ativas)
                const isConnected = session.sock?.ws?.isOpen === true && !!session.user?.id;

                if (!isConnected) {
                    console.log(`🧹 Cleaning up pending session: ${sessionId}`);

                    // Limpar intervals se existirem
                    if (session.keepAliveInterval) {
                        clearInterval(session.keepAliveInterval);
                    }
                    if (session.healthCheckInterval) {
                        clearInterval(session.healthCheckInterval);
                    }

                    // Fechar socket se existir
                    try {
                        if (session.sock?.ws) {
                            session.sock.ws.close();
                        }
                    } catch (e) {
                        console.log(`⚠️ Error closing socket for ${sessionId}:`, e.message);
                    }

                    // Remover sessão do mapa
                    sessions.delete(sessionId);
                    console.log(`✅ Pending session ${sessionId} cleaned up`);
                } else {
                    console.log(`⚠️ Session ${sessionId} is connected, not cancelling`);
                }
            } else {
                console.log(`⚠️ No session found for ${sessionId} to cancel`);
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
const createSession = async (sessionId, socket, io, phoneNumber = null, userId = null) => {
    // Handle background restoration where socket is null
    const isRestoring = !socket;
    if (!socket) {
        // Create dummy socket to prevent crashes on emit
        socket = {
            emit: (event, data) => {
                // If checking connection status during restore, we can log it
                if (event === 'connection-status') {
                    // console.log(`[Background Restore ${sessionId}] Status: ${data.message}`);
                }
            },
            on: () => { }
        };
    }
    // Check if session already exists and is connected
    const existingSession = sessions.get(sessionId);

    // Verificar se sessão existe e REALMENTE está conectada (WebSocket aberto E tem usuário autenticado)
    // Usar apenas sock.ws?.isOpen NÃO é suficiente pois o socket pode estar aberto antes da autenticação
    // Precisamos verificar se o WebSocket está aberto E se há um usuário autenticado
    const wsIsOpen = existingSession?.sock?.ws?.isOpen === true;
    const hasAuthenticatedUser = !!existingSession?.user?.id;
    const isConnected = wsIsOpen && hasAuthenticatedUser;

    if (existingSession && isConnected) {
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

        // Store session as an object with socket reference
        const sessionData = {
            sock,
            socket, // frontend socket
            io,
            user: null,
            userId, // ID do usuário do sistema (tabela users)
            keepAliveInterval: null,
            healthCheckInterval: null,
            keepAliveFailCount: 0
        };
        sessions.set(sessionId, sessionData);

        // Connection update handler - SIMPLIFIED per Baileys docs
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log(`📡 Connection update for ${sessionId}:`, { connection, hasQR: !!qr });

            // QR Code received - send to frontend
            // Só emitir QR se a sessão não estiver já conectada (não tem user)
            if (qr) {
                const currentSessionData = sessions.get(sessionId);

                // Se sessão já tem usuário conectado, ignorar QR (já está autenticado)
                if (currentSessionData?.user) {
                    console.log(`⚠️ QR recebido mas sessão ${sessionId} já está conectada - ignorando`);
                    return;
                }

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

                // Update session data with user info (keep same reference!)
                const sessionData = sessions.get(sessionId);
                if (sessionData) {
                    sessionData.user = sock.user;
                    console.log(`📝 Session data updated for ${sessionId} with user: ${sock.user?.id}`);
                    console.log(`📝 Session userId: ${sessionData.userId}, sock.user.id: ${sock.user?.id}`);

                    // Atualizar phoneNumber na instância do banco de dados
                    if (sessionData.userId && sock.user?.id) {
                        const connectedPhoneNumber = sock.user.id.split(':')[0];
                        console.log(`📱 Updating phoneNumber to ${connectedPhoneNumber} for userId ${sessionData.userId}`);
                        try {
                            // Usamos updateMany pois Prisma não aceita userId no where do update
                            await prisma.instance.updateMany({
                                where: { userId: sessionData.userId },
                                data: { phoneNumber: connectedPhoneNumber }
                            });
                            console.log(`✅ Instance phoneNumber updated to ${connectedPhoneNumber} for user ${sessionData.userId}`);
                        } catch (dbError) {
                            console.error(`❌ Error updating instance phoneNumber:`, dbError.message);
                        }
                    } else {
                        console.warn(`⚠️ Cannot update phoneNumber: userId=${sessionData.userId}, sock.user.id=${sock.user?.id}`);
                    }
                } else {
                    console.error(`❌ Session data not found for ${sessionId} on open!`);
                }

                socket.emit('connected', {
                    sessionId,
                    message: 'WhatsApp conectado com sucesso!'
                });

                socket.emit('user-info', {
                    sessionId,
                    user: {
                        number: sock.user?.id?.split(':')[0] || sock.user?.id,
                        name: sock.user?.name || sock.user?.verifiedName || 'WhatsApp User'
                    }
                });

                io.emit('connected', { sessionId, message: 'WhatsApp conectado!' });

                // Update active chats metric
                metrics.activeChats = sessions.size;
                io.emit('metrics-update', metrics);

                // ✨ KEEP-ALIVE APRIMORADO: enviar presença a cada 15 segundos
                const keepAliveInterval = setInterval(async () => {
                    try {
                        const session = sessions.get(sessionId);
                        const sessionExists = !!session;
                        const isOpen = session ? isSocketOpen(session, true) : false;

                        console.log(`💓 Keep-alive check para ${sessionId}: sessionExists=${sessionExists}, isOpen=${isOpen}`);

                        if (session && isOpen && session.sock) {
                            await session.sock.sendPresenceUpdate('available');
                            console.log(`💓 Keep-alive enviado com sucesso para ${sessionId}`);
                        } else {
                            console.warn(`⚠️ Keep-alive: sessão ${sessionId} não encontrada ou socket fechado - limpando interval`);
                            clearInterval(keepAliveInterval);
                        }
                    } catch (err) {
                        console.error(`❌ Erro no keep-alive para ${sessionId}:`, err?.message || err);
                        const session = sessions.get(sessionId);
                        if (session) {
                            if (!session.keepAliveFailCount) session.keepAliveFailCount = 0;
                            session.keepAliveFailCount++;
                            console.log(`⚠️ Keep-alive falha #${session.keepAliveFailCount} para ${sessionId}`);
                            if (session.keepAliveFailCount >= 3) {
                                console.warn(`⚠️ Keep-alive falhou 3 vezes para ${sessionId} - forçando reconexão`);
                                clearInterval(keepAliveInterval);
                                setTimeout(() => forceReconnect(sessionId, socket, io).catch(e => console.error('Erro ao reconectar:', e)), 1000);
                            }
                        }
                    }
                }, 15000);

                // Salvar interval na sessão
                const sessionWithIntervals = sessions.get(sessionId);
                if (sessionWithIntervals) {
                    sessionWithIntervals.keepAliveInterval = keepAliveInterval;
                    sessionWithIntervals.keepAliveFailCount = 0;
                    console.log(`✅ Keep-alive aprimorado ativado para ${sessionId} (intervalo: 15s)`);
                } else {
                    console.error(`❌ Falha ao salvar keep-alive interval - sessão ${sessionId} não encontrada no Map!`);
                }

                // 🏥 HEALTH CHECK: Verificar estado da conexão a cada 2 minutos
                const healthCheckInterval = setInterval(async () => {
                    try {
                        const session = sessions.get(sessionId);
                        if (!session) {
                            console.warn(`⚠️ Health check: sessão ${sessionId} não encontrada - limpando interval`);
                            clearInterval(healthCheckInterval);
                            return;
                        }

                        console.log(`🏥 Health check executando para ${sessionId}...`);
                        const isOpen = isSocketOpen(session, true);
                        const hasUser = !!session.user;

                        if (!isOpen || !hasUser) {
                            console.error(`❌ Health check FALHOU para ${sessionId}: isOpen=${isOpen}, hasUser=${hasUser}`);
                            console.warn(`🔄 Iniciando reconexão automática para ${sessionId}...`);
                            clearInterval(healthCheckInterval);
                            if (session.keepAliveInterval) {
                                clearInterval(session.keepAliveInterval);
                            }
                            sessions.delete(sessionId);
                            setTimeout(() => forceReconnect(sessionId, socket, io).catch(e => console.error('Erro ao reconectar no health check:', e)), 1000);
                        } else {
                            console.log(`✅ Health check OK para ${sessionId} - conexão saudável`);
                        }
                    } catch (err) {
                        console.error(`Erro no health check para ${sessionId}:`, err?.message || err);
                    }
                }, 2 * 60 * 1000);

                // Salvar health check interval
                const sessionForHealth = sessions.get(sessionId);
                if (sessionForHealth) {
                    sessionForHealth.healthCheckInterval = healthCheckInterval;
                    console.log(`🏥 Health check ativado para ${sessionId} (intervalo: 2min)`);
                } else {
                    console.error(`❌ Falha ao salvar health check interval - sessão ${sessionId} não encontrada no Map!`);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const payloadMessage = lastDisconnect?.error?.output?.payload?.message;

                // Verificar se é erro de conflito (device_removed)
                const errorData = lastDisconnect?.error?.data;
                const isDeviceRemoved = errorData?.content?.[0]?.attrs?.type === 'device_removed';

                // Tratar alguns códigos/erros como irreparáveis
                const unrecoverableStatusCodes = [440];
                const isUnrecoverableCode = unrecoverableStatusCodes.includes(Number(statusCode));
                const isLoggedOutFlag = statusCode === DisconnectReason.loggedOut || payloadMessage === 'loggedOut' || payloadMessage === 'Invalid session';

                // Se for erro 401 com device_removed, é logout definitivo
                const is401Conflict = statusCode === 401 && (isDeviceRemoved || payloadMessage?.includes('conflict'));
                const shouldReconnect = !(isUnrecoverableCode || isLoggedOutFlag || is401Conflict);

                console.log(`❌ Connection closed for ${sessionId}. statusCode=${statusCode} payloadMessage=${payloadMessage} isDeviceRemoved=${isDeviceRemoved} shouldReconnect=${shouldReconnect}`);

                // ✨ LIMPAR INTERVALS antes de qualquer coisa
                const sessionToClean = sessions.get(sessionId);

                // ✨ PRESERVAR userId ANTES de deletar a sessão (necessário para reconexão)
                const preservedUserId = sessionToClean?.userId;
                const preservedPhoneNumber = phoneNumber;

                if (sessionToClean?.keepAliveInterval) {
                    clearInterval(sessionToClean.keepAliveInterval);
                    console.log(`🧹 Keep-alive interval limpo para ${sessionId}`);
                }
                if (sessionToClean?.healthCheckInterval) {
                    clearInterval(sessionToClean.healthCheckInterval);
                    console.log(`🧹 Health check interval limpo para ${sessionId}`);
                }

                // Clean up current session
                sessions.delete(sessionId);

                if (shouldReconnect) {
                    // Backoff exponencial: aumentar delay a cada tentativa falhada
                    const attemptData = reconnectionAttempts.get(sessionId) || { count: 0, lastAttempt: 0 };
                    const now = Date.now();

                    // Resetar contador se última tentativa foi há mais de 5 minutos
                    if (now - attemptData.lastAttempt > 5 * 60 * 1000) {
                        attemptData.count = 0;
                    }

                    attemptData.count++;
                    attemptData.lastAttempt = now;
                    reconnectionAttempts.set(sessionId, attemptData);

                    // Calcular delay: 2s, 4s, 8s, 16s, 32s, máximo 60s
                    const delay = Math.min(2000 * Math.pow(2, attemptData.count - 1), 60000);

                    console.log(`🔄 Reconexão ${attemptData.count} para ${sessionId} agendada em ${delay}ms (userId: ${preservedUserId})`);
                    socket.emit('connection-status', {
                        sessionId,
                        message: `Reconectando... (tentativa ${attemptData.count})`,
                        retrying: true
                    });

                    setTimeout(async () => {
                        try {
                            console.log(`🔌 Tentando reconectar ${sessionId} (tentativa ${attemptData.count}) com userId: ${preservedUserId}...`);
                            // ✨ PASSAR userId NA RECONEXÃO para que phoneNumber possa ser atualizado
                            await createSession(sessionId, socket, io, preservedPhoneNumber, preservedUserId);
                            reconnectionAttempts.delete(sessionId);
                            console.log(`✅ Reconexão bem-sucedida para ${sessionId}`);
                        } catch (error) {
                            console.error(`❌ Erro ao reconectar ${sessionId} (tentativa ${attemptData.count}):`, error?.message || error);
                            if (attemptData.count >= 10) {
                                console.error(`❌ Limite de tentativas de reconexão atingido para ${sessionId}`);
                                reconnectionAttempts.delete(sessionId);
                                io.emit('reconnection-failed', {
                                    sessionId,
                                    error: 'Limite de tentativas de reconexão atingido. Por favor, escaneie o QR novamente.'
                                });
                            }
                        }
                    }, delay);
                } else {
                    // User logged out - clean everything
                    console.log(`🚪 User logged out for ${sessionId}`);

                    // Delay auth folder deletion to avoid race condition with saveCreds
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(authFolder)) {
                                fs.rmSync(authFolder, { recursive: true, force: true });
                                console.log(`🗑️ Auth folder deleted for ${sessionId}`);
                            }
                        } catch (e) {
                            console.error('Error cleaning auth folder:', e);
                        }
                    }, 2000); // Wait 2 seconds for any pending saveCreds calls

                    socket.emit('disconnected', { sessionId, message: 'WhatsApp desconectado', willReconnect: false });
                    io.emit('disconnected', { sessionId, message: 'WhatsApp desconectado', willReconnect: false });

                    // Update active chats metric
                    metrics.activeChats = sessions.size;
                    io.emit('metrics-update', metrics);

                    clearSessionData(sessionId);
                    reconnectionAttempts.delete(sessionId);

                    socket.emit('logged-out', { sessionId });
                    io.emit('logged-out', { sessionId });
                }
            }
        });

        // Save credentials when updated - with error handling for deleted folders
        sock.ev.on('creds.update', async () => {
            try {
                // Check if session still exists before saving
                if (sessions.has(sessionId) && fs.existsSync(authFolder)) {
                    await saveCreds();
                }
            } catch (err) {
                // Ignore ENOENT errors (folder was deleted during logout)
                if (err.code !== 'ENOENT') {
                    console.error(`Erro ao salvar credenciais para ${sessionId}:`, err.message);
                }
            }
        });

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

                // Skip archived messages - não responder conversas arquivadas
                if (msg.message?.messageContextInfo?.isForwardedMedia === false &&
                    msg.messageStubType === 36) {
                    console.log('⏭️ Skipping: Archived conversation');
                    continue;
                }

                // Verificar se a mensagem é de uma conversa arquivada (broadcast list ou status)
                if (msg.broadcast || msg.key.remoteJid === 'status@broadcast') {
                    console.log('⏭️ Skipping: Broadcast/Status message');
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
                let agentPrompt = agentPrompts.get(sessionId);

                // If not in memory, try to fetch from Database
                if (!agentPrompt) {
                    try {
                        console.log(`🔍 Prompt not in memory, fetching from DB for session ${sessionId}...`);

                        // Try to find user by ID (sessionId)
                        // If sessionId starts with 'user_', we might need to strip prefix if your logic adds it everywhere. 
                        // But usually sessionId IS the userId or instanceId.

                        // Try finding user by ID (if sessionId is a User ID)
                        let user = await prisma.user.findUnique({
                            where: { id: sessionId },
                            select: { customPrompt: true, email: true, appointmentDuration: true, serviceType: true, businessAddress: true }
                        });

                        // If not found, try stripping 'user_' prefix if present
                        if (!user && sessionId.startsWith('user_')) {
                            const cleanId = sessionId.replace('user_', '');
                            console.log(`🔄 Trying again with clean ID: ${cleanId}`);
                            user = await prisma.user.findUnique({
                                where: { id: cleanId },
                                select: { customPrompt: true, email: true, appointmentDuration: true, serviceType: true, businessAddress: true }
                            });
                        }

                        // If not found, and sessionId is like 'instance_1', we might need another strategy.
                        // But user said prompt is in 'users' table 'customPrompt'.

                        if (user && user.customPrompt) {
                            agentPrompt = user.customPrompt;
                            agentPrompts.set(sessionId, agentPrompt); // Cache it
                            console.log(`✅ Prompt loaded from DB for ${sessionId}`);

                            // Store user email for Google Calendar integration
                            if (user.email) {
                                userEmails.set(sessionId, user.email);
                                console.log(`📧 User email cached: ${user.email}`);
                            }

                            // Store user appointmentDuration for calendar scheduling
                            if (user.appointmentDuration) {
                                appointmentDurations.set(sessionId, user.appointmentDuration);
                                console.log(`⏱️ Appointment duration cached: ${user.appointmentDuration} minutes`);
                            }

                            // Store service type and address
                            if (user.serviceType) {
                                serviceTypes.set(sessionId, user.serviceType);
                                console.log(`🏢 Service type cached: ${user.serviceType}`);
                            }
                            if (user.businessAddress) {
                                businessAddresses.set(sessionId, user.businessAddress);
                                console.log(`📍 Business address cached: ${user.businessAddress}`);
                            }
                        } else {
                            console.log(`⚠️ Prompt not found in DB for ${sessionId}`);
                        }

                    } catch (dbError) {
                        console.error(`❌ Error fetching prompt from DB: ${dbError.message}`);
                    }
                }

                if (!agentPrompt) {
                    console.log(`⚠️ No agent prompt configured for session ${sessionId} (Memory + DB check failed)`);
                    continue;
                }

                // --- MESSAGE BUFFER LOGIC (Debounce de 10 segundos) ---
                // Acumula mensagens do mesmo contato e espera 10s sem novas mensagens para processar

                // Pegar ou criar buffer para este contato
                if (!messageBuffer.has(contactId)) {
                    messageBuffer.set(contactId, {
                        messages: [],
                        lastIncomingType: incomingMessageType,
                        sessionId: sessionId,
                        sock: sock,
                        socket: socket,
                        agentPrompt: agentPrompt,
                        remoteJid: remoteJid,
                        userEmail: userEmails.get(sessionId) || null,
                        appointmentDuration: appointmentDurations.get(sessionId) || 60,
                        serviceType: serviceTypes.get(sessionId) || 'online',
                        businessAddress: businessAddresses.get(sessionId) || null
                    });
                }

                const buffer = messageBuffer.get(contactId);

                // Adicionar mensagem ao buffer
                buffer.messages.push(messageText);
                buffer.lastIncomingType = incomingMessageType; // Manter o último tipo de mensagem
                console.log(`📦 Mensagem adicionada ao buffer de ${contactId} (${buffer.messages.length} mensagens acumuladas)`);

                // Cancelar timer anterior se existir (reset do debounce)
                if (bufferTimers.has(contactId)) {
                    clearTimeout(bufferTimers.get(contactId));
                    console.log(`⏱️ Timer resetado para ${contactId}`);
                }

                // Criar novo timer de 10 segundos
                const timerId = setTimeout(async () => {
                    await processBufferedMessages(contactId, io);
                }, BUFFER_DELAY_MS);

                bufferTimers.set(contactId, timerId);
                console.log(`⏱️ Timer de ${BUFFER_DELAY_MS / 1000}s iniciado para ${contactId}`);

                // --- FIM DA LÓGICA DE BUFFER ---
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

/**
 * Processa mensagens acumuladas no buffer após timeout de debounce
 * Esta função é chamada quando o timer de 10 segundos expira
 * @param {string} contactId - ID do contato (sessionId:remoteJid)
 * @param {object} io - Socket.IO instance
 */
const processBufferedMessages = async (contactId, io) => {
    const buffer = messageBuffer.get(contactId);

    if (!buffer || buffer.messages.length === 0) {
        console.log(`⚠️ Buffer vazio para ${contactId}`);
        messageBuffer.delete(contactId);
        bufferTimers.delete(contactId);
        return;
    }

    const { messages, lastIncomingType, sessionId, sock, socket, agentPrompt, remoteJid, userEmail, appointmentDuration, serviceType, businessAddress } = buffer;

    // Concatenar todas as mensagens em uma só, separadas por quebra de linha
    const combinedMessage = messages.join('\n');

    console.log(`📤 Processando ${messages.length} mensagens acumuladas de ${contactId}`);
    console.log(`📝 Mensagem combinada: "${combinedMessage.substring(0, 200)}..."`);

    // Limpar buffer e timer
    messageBuffer.delete(contactId);
    bufferTimers.delete(contactId);

    try {
        // Extrair número da instância (bot) do sessionId ou da sessão
        const session = sessions.get(sessionId);
        const instancePhone = session?.user?.id?.split(':')[0] || sessionId;
        const customerPhone = remoteJid.split('@')[0];

        // Buscar histórico do banco de dados
        const dbHistory = await getConversationHistory(instancePhone, customerPhone, 20);
        const isNewContact = dbHistory.length === 0;

        console.log(`📚 Histórico carregado do BD: ${dbHistory.length} mensagens para ${customerPhone}`);

        // --- UPDATE METRICS ---
        metrics.totalMessages += messages.length;
        if (isNewContact) {
            metrics.newContacts++;
        }
        metrics.activeChats = sessions.size;

        // Emit updates to all connected clients
        io.emit('metrics-update', metrics);
        // ---------------------

        // Salvar mensagem do usuário no banco de dados
        await saveMessage(instancePhone, customerPhone, 'user', combinedMessage);
        console.log(`💾 Mensagem do usuário salva no BD`);

        // Construir histórico para enviar à IA (DB + mensagem atual)
        const historyForAI = [
            ...dbHistory.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: combinedMessage }
        ];

        // Forward to Python AI Engine
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        console.log(`🤖 Forwarding ${messages.length} buffered messages to AI Engine: ${aiServiceUrl}`);

        // Check if Google Calendar is connected for this user
        let calendarConnected = false;
        if (userEmail) {
            try {
                const calendarStatus = await getCalendarConnectionStatus(userEmail);
                calendarConnected = calendarStatus?.isConnected || false;
                console.log(`📅 Calendar connected for ${userEmail}: ${calendarConnected}`);
            } catch (e) {
                console.log(`⚠️ Could not check calendar status: ${e.message}`);
            }
        }

        await axios.post(`${aiServiceUrl}/webhook/whatsapp`, {
            userId: sessionId,
            remoteJid: remoteJid,
            message: combinedMessage,
            history: historyForAI,
            agentPrompt: agentPrompt,
            incomingMessageType: lastIncomingType,
            instancePhone: instancePhone,
            customerPhone: customerPhone,
            userEmail: userEmail,  // Email do usuário para Google Calendar
            appointmentDuration: appointmentDuration,  // Duração padrão dos agendamentos
            serviceType: serviceType,  // Tipo de serviço (online/presencial)
            businessAddress: businessAddress,  // Endereço do estabelecimento
            calendarConnected: calendarConnected  // Se o Google Calendar está conectado
        });

        console.log(`✅ Buffered messages forwarded to AI Engine for ${remoteJid}`);
    } catch (error) {
        console.error(`❌ Error processing buffered messages for ${remoteJid}:`, error.message);
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
    lastIncomingMessageType.delete(sessionId);
};

// Helper to check if socket is open
const isSocketOpen = (sessionData, logDetails = false) => {
    // Get the actual Baileys socket from session data
    const sock = sessionData?.sock || sessionData;

    // Baileys can use different properties, check all of them
    const wsReadyState = sock?.ws?.readyState;
    const wsIsOpen = sock?.ws?.isOpen;
    const sockIsOpen = sock?.isOpen;
    const sockWsExists = !!sock?.ws;

    // isOpen is the most reliable in Baileys
    const isOpen = wsIsOpen === true || sockIsOpen === true || wsReadyState === 1;

    if (logDetails) {
        console.log(`🔍 Socket check: wsReadyState=${wsReadyState}, wsIsOpen=${wsIsOpen}, sockIsOpen=${sockIsOpen}, sockWsExists=${sockWsExists} => isOpen=${isOpen}`);
    }

    return isOpen;
};

// Force reconnect a session
const forceReconnect = async (sessionId, socket, io) => {
    console.log(`🔄 Forçando reconexão para ${sessionId}...`);

    // Limpar sessão existente
    const session = sessions.get(sessionId);

    // ✨ PRESERVAR userId ANTES de deletar a sessão
    const preservedUserId = session?.userId;

    if (session) {
        if (session.keepAliveInterval) {
            clearInterval(session.keepAliveInterval);
        }
        if (session.healthCheckInterval) {
            clearInterval(session.healthCheckInterval);
        }
        sessions.delete(sessionId);
    }

    // Limpar contador de reconexão
    reconnectionAttempts.delete(sessionId);

    // Recriar sessão com userId preservado
    console.log(`🔌 Force reconnect com userId: ${preservedUserId}`);
    await createSession(sessionId, socket, io, null, preservedUserId);

    return { success: true, message: 'Reconexão iniciada' };
};

// Logout session
const logoutSession = async (sessionId, socket) => {
    const session = sessions.get(sessionId);

    if (session) {
        // ✨ LIMPAR INTERVALS antes de logout
        if (session.keepAliveInterval) {
            clearInterval(session.keepAliveInterval);
            console.log(`🧹 Keep-alive interval limpo para ${sessionId}`);
        }
        if (session.healthCheckInterval) {
            clearInterval(session.healthCheckInterval);
            console.log(`🧹 Health check interval limpo para ${sessionId}`);
        }

        try {
            if (session.sock?.logout) {
                await session.sock.logout();
            }
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
    reconnectionAttempts.delete(sessionId);

    socket.emit('logged-out', { sessionId });
};

// Get session status for REST endpoint
export const getSessionStatus = (sessionId) => {
    const session = sessions.get(sessionId);

    if (!session) {
        return { connected: false, user: null };
    }

    const sock = session.sock;
    const user = session.user;
    const isOpen = sock?.ws?.isOpen === true || sock?.isOpen === true;

    return {
        connected: isOpen,
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

    if (!session || !session.sock) {
        console.error(`❌ Session ${sessionId} not found`);
        throw new Error('Session not found or not connected');
    }

    const sock = session.sock;

    // Check if socket is still open
    if (!isSocketOpen(session)) {
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
                const phoneNum = await sock.signalRepository?.lidMapping?.getPNForLID?.(remoteJid);
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
        const config = await getSessionConfig(sessionId);
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

            shouldSendAudio = await evaluateTtsRules(config.ttsRules, storedMessageType, message, lastUserMessage, contactId);
            console.log(`🎤 TTS enabled. Rules evaluation result: ${shouldSendAudio ? 'SEND AUDIO' : 'SEND TEXT'}`);
        }

        // Helper to simulate delay
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        if (shouldSendAudio) {
            // Generate and send audio
            try {
                // Extract links to send as separate text message (prevents TTS from dictating URLs)
                const { cleanText, links } = extractAndReplaceLinks(message);
                const textForTts = links.length > 0 ? cleanText : message;

                // Indicate "recording audio" state
                await sock.sendPresenceUpdate('recording', remoteJid);

                const voice = options.voice || config.ttsVoice || 'Kore';
                console.log(`🎤 Generating audio with voice: ${voice}`);
                const ttsResult = await generateAudio(textForTts, voice, config.apiKey || process.env.GEMINI_API_KEY);

                // Convert WAV to OGG for WhatsApp
                const wavBuffer = Buffer.from(ttsResult.audioContent, 'base64');
                const oggBuffer = await convertWavToOgg(wavBuffer);

                // Send as voice message (ptt = push-to-talk)
                await sock.sendMessage(remoteJid, {
                    audio: oggBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                });

                // Indicate "paused" state (finished recording)
                await sock.sendPresenceUpdate('paused', remoteJid);

                console.log(`🎤 Audio message sent to ${remoteJid}`);

                // If there were links, send them as text messages right after the audio
                if (links.length > 0) {
                    console.log(`🔗 Sending ${links.length} extracted link(s) as text...`);
                    await delay(500); // Small delay between audio and links

                    for (const link of links) {
                        await sock.sendMessage(remoteJid, { text: link });
                        await delay(300); // Small delay between multiple links
                    }

                    console.log(`✅ Links sent as text to ${remoteJid}`);
                }
            } catch (ttsError) {
                console.error('⚠️ TTS failed, falling back to text:', ttsError.message);

                // Indicate "paused" before falling back
                await sock.sendPresenceUpdate('paused', remoteJid);

                // Fallback to text message with composing state
                await sock.sendPresenceUpdate('composing', remoteJid);
                await delay(1000);
                await sock.sendMessage(remoteJid, { text: message });
                await sock.sendPresenceUpdate('paused', remoteJid);
            }
        } else {
            // Indicate "typing" state
            await sock.sendPresenceUpdate('composing', remoteJid);

            // Add a small delay for realism
            await delay(1500);

            // Send text message
            await sock.sendMessage(remoteJid, { text: message });

            // Indicate "paused" state
            await sock.sendPresenceUpdate('paused', remoteJid);
        }

        // Salvar resposta da IA no banco de dados
        try {
            // Extrair número da instância (bot) e do cliente
            const instancePhone = session?.user?.id?.split(':')[0] || sessionId;
            const customerPhone = remoteJid.split('@')[0];

            // Salvar mensagem da IA com role 'model' no banco
            await saveMessage(instancePhone, customerPhone, 'model', message);
            console.log(`💾 Resposta da IA salva no BD para ${customerPhone}`);
        } catch (dbError) {
            console.error(`⚠️ Erro ao salvar resposta no BD: ${dbError.message}`);
            // Não falhar a função se o salvamento falhar
        }

        console.log(`✅ Message sent to ${remoteJid}`);
        return { success: true, remoteJid };
    } catch (error) {
        console.error(`❌ Error sending message:`, error);
        throw error;
    }
};

/**
 * Evaluate TTS rules to determine if audio should be sent
 * Now uses structured object-based rules (predefined checkboxes)
 * 
 * For audioOnRequest rule: Implements PERSISTENT audio mode
 * - When user requests audio, mode is ACTIVATED and persists
 * - Mode remains active until user explicitly asks to stop
 * 
 * @param {Object} rules - Rule object with audioOnRequest, audioOnAudioReceived, audioOnly
 * @param {string} incomingType - Type of incoming message ('text' or 'audio')
 * @param {string} responseText - The response text
 * @param {string} lastUserMessage - The last message from the user (context)
 * @param {string} contactId - Unique identifier for this contact (sessionId:remoteJid)
 * @returns {Promise<boolean>}
 */
async function evaluateTtsRules(rules, incomingType, responseText, lastUserMessage = '', contactId = '') {
    // Handle case where rules is null/undefined
    if (!rules) {
        // No rules = always send audio when TTS is enabled
        console.log('📋 TTS Rules: No rules defined - defaulting to audio');
        return true;
    }

    // Parse JSON string to object if necessary
    if (typeof rules === 'string') {
        try {
            rules = JSON.parse(rules);
            console.log('📋 TTS Rules: Parsed JSON string to object');
        } catch {
            // Invalid JSON string = legacy format or empty, default to audio
            console.log('📋 TTS Rules: Could not parse string, defaulting to audio');
            return true;
        }
    }

    console.log(`📋 TTS Rules evaluation:`, JSON.stringify(rules));
    console.log(`📋 Context: incomingType=${incomingType}, lastUserMessage="${lastUserMessage?.substring(0, 50)}...", contactId=${contactId}`);

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

    // Rule 1: Audio only when requested (PERSISTENT MODE)
    if (rules.audioOnRequest && contactId) {
        const lowerMessage = (lastUserMessage || '').toLowerCase();

        // Patterns to START audio mode
        const startAudioPatterns = [
            'manda audio', 'manda áudio', 'mande audio', 'mande áudio',
            'envia audio', 'envia áudio', 'envie audio', 'envie áudio',
            'pode falar', 'fala pra mim', 'fala para mim',
            'me fala', 'me explica por audio', 'me explica por áudio',
            'audio por favor', 'áudio por favor', 'quero audio', 'quero áudio',
            'prefiro audio', 'prefiro áudio', 'por audio', 'por áudio',
            'em audio', 'em áudio', 'via audio', 'via áudio',
            'responde em audio', 'responde em áudio', 'responda em audio', 'responda em áudio'
        ];

        // Patterns to STOP audio mode
        const stopAudioPatterns = [
            'para com audio', 'para com áudio', 'parar audio', 'parar áudio',
            'desliga audio', 'desliga áudio', 'desativar audio', 'desativar áudio',
            'quero texto', 'volta pro texto', 'volta para texto', 'volta ao texto',
            'texto por favor', 'sem audio', 'sem áudio', 'cancela audio', 'cancela áudio',
            'prefiro texto', 'manda texto', 'mande texto', 'envia texto', 'envie texto',
            'responde em texto', 'responda em texto', 'só texto', 'somente texto'
        ];

        // Check if user wants to STOP audio
        const wantsToStopAudio = stopAudioPatterns.some(pattern => lowerMessage.includes(pattern));
        if (wantsToStopAudio) {
            audioModeEnabled.set(contactId, false);
            console.log(`🔇 Audio mode DEACTIVATED for ${contactId}`);
            return false; // Send text for this response
        }

        // Check if user wants to START audio
        const wantsToStartAudio = startAudioPatterns.some(pattern => lowerMessage.includes(pattern));
        if (wantsToStartAudio) {
            audioModeEnabled.set(contactId, true);
            console.log(`🎤 Audio mode ACTIVATED for ${contactId}`);
            return true; // Send audio for this response
        }

        // Check current audio mode state (persistent)
        const isAudioModeActive = audioModeEnabled.get(contactId) || false;
        if (isAudioModeActive) {
            console.log(`🎤 TTS Rule: audioOnRequest mode active for ${contactId} -> Sending audio`);
            return true;
        }

        console.log(`📝 TTS Rule: audioOnRequest but mode not active for ${contactId} -> Sending text`);
    }

    // If we got here, rules are active but conditions not met -> send text
    console.log('❌ TTS Rule: Conditions not met -> Sending text');
    return false;
}

// Get all active sessions
export const getActiveSessions = () => {
    const activeSessions = [];

    sessions.forEach((session, sessionId) => {
        const sock = session.sock;
        const isOpen = sock?.ws?.isOpen === true || sock?.isOpen === true;
        if (isOpen) {
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
                if (session.sock?.end) await session.sock.end(undefined);
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

/**
 * Check if a session is connected (WebSocket open AND user authenticated)
 * @param {string} sessionId - Session identifier (e.g., 'user_abc123')
 * @returns {boolean} - True if session is active and connected
 */
export const isSessionConnected = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return false;

    const wsIsOpen = session.sock?.ws?.isOpen === true;
    const hasUser = !!session.user?.id;

    console.log(`🔍 Checking session ${sessionId}: wsIsOpen=${wsIsOpen}, hasUser=${hasUser}`);
    return wsIsOpen && hasUser;
};
