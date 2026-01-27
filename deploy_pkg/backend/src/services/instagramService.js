import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Initialize Composio client with Instagram toolkit version
const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: '20260108_00' }
});

// Socket.IO instance reference
let socketIO = null;

// --- Instagram Polling State ---
// Store polling intervals per user
const pollingIntervals = new Map();
// Store processed message IDs to avoid duplicates (userId -> Set of messageIds)
const processedMessages = new Map();
// Store agent prompts per user
const instagramAgentPrompts = new Map();
// Store conversation history per contact (userId:senderId -> messages[])
const instagramConversationHistory = new Map();

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
        const result = await composio.tools.execute(
            'INSTAGRAM_GET_USER_INFO',
            {},
            { connectedAccountId: connectionId }
        );

        return result.successful ? result.data : null;
    } catch (error) {
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
            { recipient_id: recipientId, image_url: imageUrl, caption },
            { connectedAccountId: status.connectionId }
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
            { recipient_id: recipientId },
            { connectedAccountId: status.connectionId }
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

        return {
            isConnected: true,
            connectionId: activeAccount.id,
            username: activeAccount.metadata?.username || null,
            igUserId: activeAccount.metadata?.igUserId || null
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
            { limit },
            { connectedAccountId: status.connectionId }
        );

        return result.successful
            ? { success: true, conversations: result.data || [] }
            : { success: false, error: result.error || 'Failed to list conversations' };
    } catch (error) {
        console.error('Instagram List Conversations Error:', error.message);
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
            { conversation_id: conversationId, limit },
            { connectedAccountId: status.connectionId }
        );

        return result.successful
            ? { success: true, messages: result.data || [] }
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
            { recipient_id: recipientId, text },
            { connectedAccountId: status.connectionId }
        );

        return result.successful
            ? { success: true, messageId: result.data?.id }
            : { success: false, error: result.error || 'Failed to send DM' };
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
 * Start polling for new Instagram DMs
 * @param {string} userId - User's email
 * @param {number} intervalMs - Polling interval in ms (default: 15000)
 */
export const startPolling = (userId, intervalMs = 15000) => {
    if (!userId) {
        console.error('❌ Cannot start polling: userId required');
        return false;
    }

    // Stop existing polling if any
    if (pollingIntervals.has(userId)) {
        stopPolling(userId);
    }

    // Initialize processed messages set for this user
    if (!processedMessages.has(userId)) {
        processedMessages.set(userId, new Set());
    }

    console.log(`🔄 Starting Instagram polling for ${userId} (every ${intervalMs / 1000}s)`);

    const poll = async () => {
        try {
            const status = await getConnectionStatus(userId);
            if (!status.isConnected) {
                console.log(`⚠️ Instagram not connected for ${userId}, skipping poll`);
                return;
            }

            // Get agent prompt
            const agentPrompt = instagramAgentPrompts.get(userId);
            if (!agentPrompt) {
                console.log(`⚠️ No agent prompt for ${userId}, skipping poll`);
                return;
            }

            // List conversations
            const convResult = await listConversations(userId, 10);
            if (!convResult.success || !convResult.conversations?.length) {
                return;
            }

            const processed = processedMessages.get(userId);

            // Check each conversation for new messages
            for (const conv of convResult.conversations) {
                const convId = conv.id || conv.conversation_id;
                if (!convId) continue;

                const msgResult = await getMessages(userId, convId, 5);
                if (!msgResult.success || !msgResult.messages?.length) continue;

                for (const msg of msgResult.messages) {
                    const msgId = msg.id || msg.message_id;
                    if (!msgId || processed.has(msgId)) continue;

                    // Skip messages sent by the connected account (our responses)
                    const senderId = msg.from?.id || msg.sender_id || msg.participant_id;
                    if (!senderId || senderId === status.igUserId) {
                        processed.add(msgId);
                        continue;
                    }

                    const messageText = msg.text || msg.message?.text || msg.content || '';
                    if (!messageText.trim()) {
                        processed.add(msgId);
                        continue;
                    }

                    // Mark as processed immediately
                    processed.add(msgId);

                    console.log(`📩 New Instagram DM from ${senderId}: "${messageText.substring(0, 50)}..."`);

                    // Get/update conversation history
                    const historyKey = `${userId}:${senderId}`;
                    if (!instagramConversationHistory.has(historyKey)) {
                        instagramConversationHistory.set(historyKey, []);
                    }
                    const history = instagramConversationHistory.get(historyKey);
                    history.push({ role: 'user', content: messageText });
                    if (history.length > 20) history.splice(0, history.length - 20);

                    // Forward to AI Engine
                    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                    try {
                        await axios.post(`${aiServiceUrl}/webhook/instagram`, {
                            userId,
                            senderId,
                            message: messageText,
                            history: history.map(h => ({ role: h.role, content: h.content })),
                            agentPrompt
                        });
                        console.log(`✅ Forwarded to AI Engine for ${senderId}`);
                    } catch (aiError) {
                        console.error(`❌ AI Engine error: ${aiError.message}`);
                    }
                }
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
export const addToHistory = (userId, senderId, message) => {
    const historyKey = `${userId}:${senderId}`;
    if (!instagramConversationHistory.has(historyKey)) {
        instagramConversationHistory.set(historyKey, []);
    }
    const history = instagramConversationHistory.get(historyKey);
    history.push({ role: 'assistant', content: message });
    if (history.length > 20) history.splice(0, history.length - 20);
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
    addToHistory
};
