import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import axios from 'axios';
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { decrypt } from '../utils/encryption.js';

dotenv.config();

// Initialize Composio client with Instagram toolkit version
const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: '20260203_00' }
});

// Socket.IO instance reference
let socketIO = null;

// --- Instagram Polling State ---
// Store polling intervals per user
const pollingIntervals = new Map();
// Store user info fetch timestamps (cacheKey -> timestamp)
const userInfoCache = new Map();
// Store processed message IDs to avoid duplicates (userId -> Set of messageIds)
const processedMessages = new Map();
// Store agent prompts per user
const instagramAgentPrompts = new Map();
// Store user Gemini API keys (userId -> decryptedKey)
const userGeminiKeys = new Map();
// Store conversation history per contact (userId:senderId -> messages[])
const instagramConversationHistory = new Map();

// --- MESSAGE BUFFER (Debounce de 10 segundos) ---
// Buffer para acumular mensagens do mesmo contato
const messageBuffer = new Map(); // userId:senderId -> { messages: [], timer: null }
// Tempo de espera em ms (10 segundos)
const BUFFER_DELAY_MS = 10000;

/**
 * Initialize Instagram service with Socket.IO
 * @param {object} io - Socket.IO instance
 */
export const initInstagramService = (io) => {
    socketIO = io;
};

/**
 * Generate OAuth URL for Instagram authentication
 * @param {string} userId - User's email (unique identifier) - REQUIRED
 * @returns {Promise<{success: boolean, authUrl?: string, connectionId?: string, error?: string}>}
 */
export const getAuthUrl = async (userId) => {
    if (!userId) {
        return { success: false, error: 'userId (email) is required' };
    }

    try {
        const authConfigId = process.env.COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID;
        if (!authConfigId) {
            return { success: false, error: 'Instagram Auth Config ID not configured' };
        }

        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            authConfigId,
            {
                redirectUrl: `${process.env.FRONTEND_URL}/instagram-callback`
            }
        );

        return {
            success: true,
            authUrl: connectionRequest.redirectUrl,
            connectionId: connectionRequest.connectedAccountId || connectionRequest.id
        };
    } catch (error) {
        console.error('Instagram Auth Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Handle OAuth callback after user authenticates
 * @param {string} connectionId - The connection ID returned from auth flow
 * @returns {Promise<{success: boolean, connectionId?: string, username?: string, error?: string}>}
 */
export const handleCallback = async (connectionId) => {
    if (!connectionId) {
        return { success: false, error: 'connectionId is required' };
    }

    try {
        const connectedAccount = await composio.connectedAccounts.get(connectionId);

        if (connectedAccount.status !== 'ACTIVE') {
            return { success: false, error: 'Connection not active' };
        }

        // Try to get user info
        const userInfo = await getUserInfo(connectionId);

        const result = {
            success: true,
            connectionId: connectionId,
            username: userInfo?.username || null,
            igUserId: userInfo?.id || null
        };

        // Emit connection success via Socket.IO (for real-time updates)
        if (socketIO) {
            socketIO.emit('instagram:connected', {
                success: true,
                username: result.username
            });
        }

        return result;
    } catch (error) {
        console.error('Instagram Callback Error:', error.message);
        return { success: false, error: error.message };
    }
};

// ---------------------
// 4. getUserInfo
// ---------------------
export const getUserInfo = async (connectionId) => {
    if (!connectionId) {
        return null;
    }

    try {
        // Try to execute without arguments first (often gets 'me')
        const result = await composio.tools.execute(
            'INSTAGRAM_GET_USER_INFO',
            {
                connectedAccountId: connectionId,
                arguments: {}
            }
        );

        return result.successful ? result.data : null;
    } catch (error) {
        // Log less aggressively or handle specific error codes
        console.error('Instagram Get User Info Error:', error.message);
        return null;
    }
};

// ... existing code ...

// ---------------------
// 5. sendImageDM
// ---------------------
export const sendImageDM = async (userId, recipientId, imageUrl, caption = '') => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const result = await composio.tools.execute(
            'INSTAGRAM_SEND_IMAGE',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                arguments: { recipient_id: recipientId, image_url: imageUrl, caption }
            }
        );

        return result.successful
            ? { success: true, messageId: result.data?.id }
            : { success: false, error: result.error || 'Failed to send image DM' };
    } catch (error) {
        console.error('Instagram Send Image Error:', error.message);
        return { success: false, error: error.message };
    }
};

// ---------------------
// 6. markSeen
// ---------------------
export const markSeen = async (userId, recipientId) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const result = await composio.tools.execute(
            'INSTAGRAM_MARK_SEEN',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                arguments: { recipient_id: recipientId }
            }
        );

        return { success: result.successful };
    } catch (error) {
        console.error('Instagram Mark Seen Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Get connection status for a specific user
 * @param {string} userId - User's email (unique identifier) - REQUIRED
 * @returns {Promise<{isConnected: boolean, username?: string, igUserId?: string, connectionId?: string}>}
 */
export const getConnectionStatus = async (userId) => {
    if (!userId) {
        return { isConnected: false, error: 'userId (email) is required' };
    }

    try {
        const accounts = await composio.connectedAccounts.list({
            appName: 'instagram',
            entityId: userId
        });

        if (!accounts?.items?.length) {
            return { isConnected: false };
        }

        // Find active Instagram account for this user
        const activeAccount = accounts.items.find(acc => acc.status === 'ACTIVE');

        if (!activeAccount) {
            return { isConnected: false };
        }

        let igUserId = activeAccount.metadata?.igUserId || activeAccount.remoteId || null;
        let username = activeAccount.metadata?.username || null;

        // If igUserId is missing, try to fetch it explicitly
        // IMPLEMENTATION FIX: Use a simple in-memory cache to prevent spamming if it fails
        const cacheKey = `user_info_${activeAccount.id}`;
        const now = Date.now();
        const lastAttempt = userInfoCache.get(cacheKey) || 0;

        // Only try fetching every 5 minutes if it fails, to avoid log spam
        if (!igUserId && (now - lastAttempt > 300000)) {
            try {
                userInfoCache.set(cacheKey, now); // Update last attempt
                console.log(`⚠️ Metadata missing igUserId for ${activeAccount.id}, fetching user info...`);

                // Check if we have it cached or need to fetch
                const userInfo = await getUserInfo(activeAccount.id);
                if (userInfo) {
                    // Normalize ID (some providers use id, others user_id)
                    igUserId = userInfo.id || userInfo.user_id || ((userInfo.username) ? null : null);
                    username = userInfo.username || username;

                    if (igUserId) {
                        console.log(`✅ Fetched igUserId: ${igUserId} for ${activeAccount.id}`);
                        // Optionally: Update metadata in Composio if possible, or just cache in memory for this session
                        activeAccount.metadata = { ...activeAccount.metadata, igUserId, username };
                    }
                }
            } catch (err) {
                console.error(`❌ Failed to fetch detailed user info: ${err.message}`);
            }
        } else if (!igUserId) {
            // If we can't fetch it, try to derive from other fields or fallback
            // console.warn(`skipping duplicate fetch for ${activeAccount.id}`);
        }

        return {
            isConnected: true,
            connectionId: activeAccount.id,
            username: username,
            igUserId: igUserId
        };
    } catch (error) {
        console.error('Instagram Status Check Error:', error.message);
        return { isConnected: false, error: error.message };
    }
};

// ---------------------
// 1. listConversations
// ---------------------
export const listConversations = async (userId, limit = 25) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const result = await composio.tools.execute(
            'INSTAGRAM_LIST_ALL_CONVERSATIONS',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                arguments: { limit }
            }
        );
        const conversations = result.data?.data || result.data || [];
        console.log(`📱 Instagram: Found ${conversations.length} conversations`);

        return result.successful
            ? { success: true, conversations: result.data?.data || result.data || [] }
            : { success: false, error: result.error || 'Failed to list conversations' };
    } catch (error) {
        console.error(`❌ Instagram List Conversations Error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// ---------------------
// 2. getMessages
// ---------------------
export const getMessages = async (userId, conversationId, limit = 25) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const result = await composio.tools.execute(
            'INSTAGRAM_LIST_ALL_MESSAGES',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                arguments: { conversation_id: conversationId, limit }
            }
        );

        return result.successful
            ? { success: true, messages: result.data?.data || result.data?.messages || result.data || [] }
            : { success: false, error: result.error || 'Failed to get messages' };
    } catch (error) {
        console.error('Instagram Get Messages Error:', error.message);
        return { success: false, error: error.message };
    }
};

// ---------------------
// 3. sendDM
// ---------------------
export const sendDM = async (userId, recipientId, text) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const result = await composio.tools.execute(
            'INSTAGRAM_SEND_TEXT_MESSAGE',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                arguments: { recipient_id: recipientId, text }
            }
        );

        if (result.successful) {
            // --- PERSISTENCE ---
            // Save outgoing message to DB
            const { saveInstagramMessage } = await import('./historyService.js');
            await saveInstagramMessage(userId, recipientId, 'model', text, result.data?.id);
            console.log(`[Instagram] 📤 Response sent to ${recipientId}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            // -------------------

            return { success: true, messageId: result.data?.id };
        } else {
            return { success: false, error: result.error || 'Failed to send DM' };
        }
    } catch (error) {
        console.error('Instagram Send DM Error:', error.message);
        return { success: false, error: error.message };
    }
};



/**
 * Disconnect Instagram account for a user
 * @param {string} userId - User's email - REQUIRED
 */
export const disconnect = async (userId) => {
    if (!userId) {
        return { success: false, error: 'userId (email) is required' };
    }

    try {
        const status = await getConnectionStatus(userId);

        if (status.connectionId) {
            try {
                await composio.connectedAccounts.delete(status.connectionId);
            } catch (deleteError) {
                // Connection might already be deleted
                console.warn('Could not delete from Composio:', deleteError.message);
            }
        }

        if (socketIO) {
            socketIO.emit('instagram:disconnected', { userId });
        }

        return { success: true };
    } catch (error) {
        console.error('Instagram Disconnect Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Cleanup function for server shutdown
 */
export const cleanup = async () => {
    // Stop all polling intervals
    for (const [userId, intervalId] of pollingIntervals.entries()) {
        clearInterval(intervalId);
        console.log(`🛑 Stopped Instagram polling for ${userId}`);
    }
    pollingIntervals.clear();
    processedMessages.clear();
    instagramAgentPrompts.clear();
    instagramConversationHistory.clear();
};

// ============================================
// INSTAGRAM POLLING SYSTEM
// ============================================

const PROMPTS_FILE = path.join(process.cwd(), 'data', 'instagram_agents.json');

/**
 * Load persisted agent prompts
 */
const loadAgentPrompts = () => {
    try {
        if (fs.existsSync(PROMPTS_FILE)) {
            const data = fs.readFileSync(PROMPTS_FILE, 'utf8');
            const prompts = JSON.parse(data);
            for (const [userId, prompt] of Object.entries(prompts)) {
                instagramAgentPrompts.set(userId, prompt);
            }
            console.log(`✅ Loaded ${instagramAgentPrompts.size} agent prompts from disk`);
        }
    } catch (error) {
        console.error('Failed to load agent prompts:', error.message);
    }
};

/**
 * Save agent prompts to disk
 */
const saveAgentPrompts = () => {
    try {
        const prompts = Object.fromEntries(instagramAgentPrompts);
        fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
    } catch (error) {
        console.error('Failed to save agent prompts:', error.message);
    }
};

// Initialize persistence
loadAgentPrompts();

/**
 * Configure agent prompt for Instagram
 * @param {string} userId - User's email
 * @param {string} prompt - Agent prompt
 */
export const configureInstagramAgent = (userId, prompt) => {
    if (!userId || !prompt) {
        console.warn('⚠️ Cannot configure Instagram agent: missing userId or prompt');
        return false;
    }
    instagramAgentPrompts.set(userId, prompt);
    saveAgentPrompts(); // Persist changes
    console.log(`✅ Instagram agent configured for ${userId} (${prompt.length} chars)`);
    return true;
};

/**
 * Process buffered messages for a specific user and sender
 */
const processBufferedMessages = async (userId, senderId, agentPrompt, geminiApiKey) => {
    const bufferKey = `${userId}:${senderId}`;
    const bufferData = messageBuffer.get(bufferKey);

    if (!bufferData || bufferData.messages.length === 0) {
        return;
    }

    // Clone messages and clear buffer immediately to avoid race conditions
    const messagesToProcess = [...bufferData.messages];
    messageBuffer.delete(bufferKey);

    // console.log(`📦 Processing ${messagesToProcess.length} buffered messages for ${senderId}`);

    // Concatenate messages
    const fullMessage = messagesToProcess.join(' ');

    // --- PERSISTENCE & HISTORY ---
    // Import history service functions (UPDATED to use Instagram-specific models)
    const { getInstagramHistory: getHistoryByUserId, saveInstagramMessage: saveMessageByUserId } = await import('./historyService.js');

    // Add processed user message to history (DB)
    // Now saves to 'instagram_messages' table
    await saveMessageByUserId(userId, senderId, 'user', fullMessage, messagesToProcess[0].id); // Assuming first message in buffer has the ID

    console.log(`[Instagram] 📩 Message from ${senderId}: "${fullMessage.substring(0, 50)}${fullMessage.length > 50 ? '...' : ''}"`);

    // --- AI PROCESSING ---
    // Get history for context
    const history = await getHistoryByUserId(userId, senderId, 10);

    // Forward to AI Engine
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const payload = {
        userId,
        senderId,
        message: fullMessage,
        history, // Use DB history
        agentPrompt,
        geminiApiKey: geminiApiKey
    };

    // Clean payload for logging
    // const logPayload = { ...payload, agentPrompt: '...', geminiApiKey: payload.geminiApiKey ? '***' : 'missing' };
    // console.log(`📤 Sending to AI Engine (Buffered):`, JSON.stringify(logPayload));

    try {
        const response = await axios.post(`${aiServiceUrl}/webhook/instagram`, payload);
        // console.log(`✅ Forwarded to AI Engine for ${senderId}. Status: ${response.status}`);

        // Save Assistant response (if returned by AI Engine - currently it sends via separate call, but let's assume we capture it here or in a separate handler)
        // NOTE: The AI Engine sends the response directly using tools. 
        // We need to capture the response if the AI Engine returns it, OR assume the AI Engine's tool execution will be logged.
        // However, standard flow is: AI calls tool -> Tool sends DM -> We need to capture that outgoing DM.
        // For now, let's trust the AI Engine's response if it returns text, otherwise we might need a webhook for outgoing messages?
        // Actually, the `sendDM` function in this file is called by the AI. We should save it THERE.
    } catch (aiError) {
        console.error(`❌ AI Engine error: ${aiError.message}`);
        if (aiError.code) console.error(`   Code: ${aiError.code}`);
        if (aiError.cause) console.error(`   Cause: ${aiError.cause}`);
        if (aiError.response) {
            console.error('   Response data:', aiError.response.data);
            console.error('   Response status:', aiError.response.status);
        }
    }
};
export const startPolling = (userId, intervalMs = 15000) => {
    if (!userId) {
        console.error('❌ Cannot start polling: userId required');
        return false;
    }

    // Check if polling is already active
    if (pollingIntervals.has(userId)) {
        console.log(`⚠️ Polling already active for ${userId}, skipping start.`);
        return true;
    }

    // Initialize processed messages set for this user
    if (!processedMessages.has(userId)) {
        processedMessages.set(userId, new Set());
    }

    // Flag to ignore existing messages on restart
    let isInitialSync = true;

    console.log(`🔄 Starting Instagram polling for ${userId} (every ${intervalMs / 1000}s)`);

    const poll = async () => {
        try {
            const status = await getConnectionStatus(userId);
            if (!status.isConnected) {
                console.log(`⚠️ Instagram not connected for ${userId}, skipping poll`);
                return;
            }

            // Get agent prompt and API Key (defaults/cache)
            let agentPrompt = instagramAgentPrompts.get(userId);
            let geminiApiKey = userGeminiKeys.get(userId);

            // Always fetch fresh data from DB to ensure prompt is up to date
            const user = await prisma.user.findFirst({
                where: { email: userId },
                select: {
                    customPrompt: true,
                    geminiApiKey: true
                }
            });

            // Update Agent Prompt
            if (user?.customPrompt) {
                agentPrompt = user.customPrompt;
                instagramAgentPrompts.set(userId, agentPrompt); // Update cache
                // console.log(`✅ Using fresh prompt from DB for ${userId}`);
            } else if (!agentPrompt) {
                // Keep existing or default if no custom prompt
            }

            // Update API Key
            if (user?.geminiApiKey) {
                const { decrypt } = await import('../utils/encryption.js');
                try {
                    const decryptedKey = decrypt(user.geminiApiKey);
                    if (decryptedKey) {
                        geminiApiKey = decryptedKey; // Assignment, not declaration
                        userGeminiKeys.set(userId, geminiApiKey);
                        // console.log(`🔓 Decryption attempt result: Success`);
                    }
                } catch (e) { console.error('Error decrypting key', e); }
            } else if (!user?.geminiApiKey) {
                console.warn(`⚠️ User ${userId} has no geminiApiKey in DB`);
            }

            if (!agentPrompt) {
                // Only log sparingly to avoid spamming logs
                if (Math.random() < 0.1) {
                    console.log(`⚠️ No agent prompt for ${userId}, skipping poll`);
                }
                return;
            }

            // List conversations
            const convResult = await listConversations(userId, 10);
            if (!convResult.success || !convResult.conversations?.length) {
                return;
            }

            const processed = processedMessages.get(userId);

            if (isInitialSync) {
                console.log(`🔄 Initial sync for ${userId}: marking existing messages as processed...`);
            }

            // Check each conversation for new messages
            for (const conv of convResult.conversations) {
                const convId = conv.id || conv.conversation_id;
                if (!convId) continue;

                const msgResult = await getMessages(userId, convId, 5);
                if (!msgResult.success || !msgResult.messages?.length) continue;

                if (!isInitialSync) {
                    // Log the IDs of messages found to debug
                    const msgIds = msgResult.messages.map(m => m.id || m.message_id);
                    // console.log(`   📬 Conv ${convId.substring(0, 15)}... → ${msgResult.messages.length} messages. IDs: ${msgIds.join(', ')}`);
                }

                for (const msg of msgResult.messages) {
                    const msgId = msg.id || msg.message_id;
                    if (!msgId) continue;

                    // Always add to processed set
                    if (processed.has(msgId)) {
                        // console.log(`   ⏩ Skipping processed msg: ${msgId}`); // Too noisy
                        continue;
                    }
                    processed.add(msgId);

                    // Skip if initial sync
                    if (isInitialSync) {
                        // console.log(`   ⏩ Skipping initial sync msg: ${msgId}`);
                        continue;
                    }

                    // Skip messages sent by the connected account (our responses)
                    const senderId = msg.from?.id || msg.sender_id || msg.participant_id;

                    // DEBUG LOGGING - TEMPORARY RESTORE TO FIX BUG
                    // console.log(`   🔍 Checking msg ${msgId} from ${senderId} (Me: ${status.igUserId})`);

                    if (!status.igUserId) {
                        console.warn(`[Instagram] ⚠️ Cannot identify self (missing igUserId). Skipping msg ${msgId} to prevent loops.`);
                        continue;
                    }

                    // Enforce string comparison
                    // console.log(`[Instagram] 🔍 Checking msg ${msgId} (Sender: ${senderId}) vs Me (${status.igUserId})`);
                    if (String(senderId) === String(status.igUserId)) {
                        console.log(`[Instagram] ⏩ Skipping own/system message from ${senderId}`);
                        continue;
                    }

                    // Extract message text - Instagram API returns it in 'message' field
                    const messageText = msg.message || msg.text || msg.message?.text || msg.content || '';
                    if (!messageText.trim()) {
                        continue;
                    }

                    console.log(`📩 New Instagram DM from ${senderId}: "${messageText.substring(0, 50)}..."`);

                    // --- BUFFERING LOGIC ---
                    const bufferKey = `${userId}:${senderId}`;

                    if (!messageBuffer.has(bufferKey)) {
                        messageBuffer.set(bufferKey, { messages: [], timer: null });
                    }

                    const bufferData = messageBuffer.get(bufferKey);

                    // Add message to buffer
                    bufferData.messages.push(messageText);

                    // Reset timer (debounce)
                    if (bufferData.timer) {
                        clearTimeout(bufferData.timer);
                        console.log(`⏱️ Debounce: Resetting timer for ${senderId}`);
                    }

                    // Set new timer
                    bufferData.timer = setTimeout(() => {
                        console.log(`⏰ Timer fired for ${senderId}, processing buffered messages...`);
                        processBufferedMessages(userId, senderId, agentPrompt, geminiApiKey);
                    }, BUFFER_DELAY_MS);

                    console.log(`⏳ Message buffered for ${senderId}. Buffer size: ${bufferData.messages.length}. Waiting ${BUFFER_DELAY_MS / 1000}s...`);
                    // -----------------------
                }
            }

            // Mark initial sync as complete after successful run
            if (isInitialSync) {
                console.log(`✅ Initial sync complete for ${userId}. Listening for new messages...`);
                isInitialSync = false;
            }

        } catch (error) {
            console.error(`❌ Polling error for ${userId}: ${error.message}`);
        }
    };

    // Run immediately, then on interval
    poll();
    const intervalId = setInterval(poll, intervalMs);
    pollingIntervals.set(userId, intervalId);

    return true;
};

/**
 * Stop polling for a user
 * @param {string} userId - User's email
 */
export const stopPolling = (userId) => {
    const intervalId = pollingIntervals.get(userId);
    if (intervalId) {
        clearInterval(intervalId);
        pollingIntervals.delete(userId);
        console.log(`🛑 Stopped Instagram polling for ${userId}`);
        return true;
    }
    return false;
};

/**
 * Add assistant response to history (called after AI sends response)
 */
/**
 * Add assistant response to history (called after AI sends response)
 */
export const addToHistory = (userId, senderId, message) => {
    const historyKey = `${userId}:${senderId}`;
    if (!instagramConversationHistory.has(historyKey)) {
        instagramConversationHistory.set(historyKey, []);
    }
    const history = instagramConversationHistory.get(historyKey);
    history.push({ role: 'assistant', content: message });
    if (history.length > 20) history.splice(0, history.length - 20);
};

/**
 * Resumes polling for all active connections on server start
 */
export const resumeActivePolling = async () => {
    try {
        console.log('🔄 Resuming active Instagram polling sessions...');
        // Find users with Instagram connected
        const connections = await prisma.instagramConnection.findMany({
            select: { userId: true } // userId here is the email
        });

        for (const conn of connections) {
            if (conn.userId) {
                startPolling(conn.userId);
            }
        }
        console.log(`✅ Resumed polling for ${connections.length} users`);
    } catch (error) {
        console.error('Failed to resume polling:', error.message);
    }
};

export default {
    initInstagramService,
    getAuthUrl,
    handleCallback,
    getUserInfo,
    getConnectionStatus,
    listConversations,
    getMessages,
    sendDM,
    sendImageDM,
    markSeen,
    disconnect,
    cleanup,
    // Polling functions
    configureInstagramAgent,
    startPolling,
    stopPolling,
    addToHistory,
    resumeActivePolling
};
