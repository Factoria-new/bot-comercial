import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import axios from 'axios';
import prisma from '../config/prisma.js';
// fs and path removed

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
const pollingIntervals = new Map();
// Store processed message IDs to avoid duplicates (userId -> Set of messageIds)
const processedMessages = new Map();
// Store conversation history per contact (userId:senderId -> messages[])
const instagramConversationHistory = new Map();
// Cache for Instagram User IDs to avoid repetitive API calls (connectionId -> igUserId)
const instagramUserIds = new Map();

/**
 * Initialize Instagram service with Socket.IO
 * @param {object} io - Socket.IO instance
 */
export const initInstagramService = (io) => {
    socketIO = io;
};

// ============================================
// LOCAL MAPPING FUNCTIONS (Multi-tenancy fix)
// ============================================

/**
 * Save Instagram connection mapping locally
 * @param {string} userId - User's email (entityId)
 * @param {string} connectionId - Composio connection ID (ca_xxx)
 * @param {string} status - Connection status: 'initiated' | 'active' | 'failed'
 */
const saveInstagramConnectionMapping = async (userId, connectionId, status = 'initiated') => {
    try {
        await prisma.instagramConnection.upsert({
            where: { userId: userId.toLowerCase().trim() },
            update: { connectionId, status, updatedAt: new Date() },
            create: { userId: userId.toLowerCase().trim(), connectionId, status }
        });
        console.log(`📸 Saved Instagram connection mapping: userId=${userId}, connectionId=${connectionId}, status=${status}`);
    } catch (error) {
        console.error('Failed to save Instagram connection mapping:', error.message);
    }
};

/**
 * Get Instagram connection mapping from local DB
 * @param {string} userId - User's email (entityId)
 * @returns {Promise<{userId: string, connectionId: string, status: string} | null>}
 */
const getInstagramConnectionMapping = async (userId) => {
    try {
        return await prisma.instagramConnection.findUnique({
            where: { userId: userId.toLowerCase().trim() }
        });
    } catch (error) {
        console.error('Failed to get Instagram connection mapping:', error.message);
        return null;
    }
};

/**
 * Delete Instagram connection mapping from local DB
 * @param {string} userId - User's email (entityId)
 */
const deleteInstagramConnectionMapping = async (userId) => {
    try {
        await prisma.instagramConnection.deleteMany({
            where: { userId: userId.toLowerCase().trim() }
        });
        console.log(`🗑️ Deleted Instagram connection mapping for userId=${userId}`);
    } catch (error) {
        console.error('Failed to delete Instagram connection mapping:', error.message);
    }
};

/**
 * Update Instagram connection mapping status
 * @param {string} userId - User's email (entityId)
 * @param {string} status - New status
 */
const updateInstagramConnectionMappingStatus = async (userId, status) => {
    try {
        await prisma.instagramConnection.updateMany({
            where: { userId: userId.toLowerCase().trim() },
            data: { status, updatedAt: new Date() }
        });
        console.log(`📸 Updated Instagram connection status for userId=${userId} to ${status}`);
    } catch (error) {
        console.error('Failed to update Instagram connection mapping status:', error.message);
    }
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

        console.log(`📸 Initiating Instagram auth for user: ${userId}`);

        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            authConfigId,
            {
                redirectUrl: `${process.env.FRONTEND_URL}/instagram-callback`
            }
        );

        const connectionId = connectionRequest.connectedAccountId || connectionRequest.id;

        // MULTI-TENANCY FIX: Save mapping immediately after initiating connection
        await saveInstagramConnectionMapping(userId, connectionId, 'initiated');

        console.log(`✅ Instagram auth URL generated for ${userId}`);

        return {
            success: true,
            authUrl: connectionRequest.redirectUrl,
            connectionId: connectionId
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
export const handleCallback = async (connectionId, userId = null) => {
    if (!connectionId) {
        return { success: false, error: 'connectionId is required' };
    }

    try {
        const connectedAccount = await composio.connectedAccounts.get(connectionId);

        if (connectedAccount.status !== 'ACTIVE') {
            return { success: false, error: 'Connection not active' };
        }

        // MULTI-TENANCY FIX: Update mapping status to 'active'
        if (userId) {
            await saveInstagramConnectionMapping(userId, connectionId, 'active');
        } else {
            // Fallback: try to find by connectionId
            try {
                const existingMapping = await prisma.instagramConnection.findUnique({
                    where: { connectionId }
                });
                if (existingMapping) {
                    await updateInstagramConnectionMappingStatus(existingMapping.userId, 'active');
                }
            } catch (e) {
                console.warn('Could not find existing mapping for connectionId:', connectionId);
            }
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

        console.log(`✅ Instagram connected for: ${result.username || connectionId}`);

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
            {
                connectedAccountId: connectionId,
                arguments: {}
            }
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
 * MULTI-TENANCY FIX: Uses local mapping instead of trusting Composio's entityId filter
 * @param {string} userId - User's email (unique identifier) - REQUIRED
 * @returns {Promise<{isConnected: boolean, username?: string, igUserId?: string, connectionId?: string}>}
 */
export const getConnectionStatus = async (userId) => {
    if (!userId) {
        return { isConnected: false, error: 'userId (email) is required' };
    }

    try {
        // MULTI-TENANCY FIX: First check local mapping
        const localMapping = await getInstagramConnectionMapping(userId);

        if (!localMapping) {
            console.log(`📸 No local Instagram mapping found for ${userId}`);
            return { isConnected: false };
        }

        console.log(`📸 Found local Instagram mapping for ${userId}: connectionId=${localMapping.connectionId}, status=${localMapping.status}`);

        // If mapping exists but status is not 'active', check if it's still initiating
        if (localMapping.status === 'initiated') {
            // Try to verify if the connection became active
            try {
                const account = await composio.connectedAccounts.get(localMapping.connectionId);
                if (account.status === 'ACTIVE') {
                    // Update local mapping to active
                    await updateInstagramConnectionMappingStatus(userId, 'active');
                    localMapping.status = 'active';
                } else {
                    // Connection exists but not active yet
                    return { isConnected: false, status: 'initiating' };
                }
            } catch (e) {
                // Connection not found in Composio (404) - user likely closed popup without completing
                // Clean up the orphan mapping
                console.warn(`⚠️ Instagram connection not found (user may have closed popup). Cleaning up orphan mapping for ${userId}`);
                await deleteInstagramConnectionMapping(userId);

                // Also stop polling if active
                if (pollingIntervals.has(userId)) {
                    await stopPolling(userId);
                }

                return { isConnected: false, needsReconnection: true };
            }
        }

        // Verify the connection still exists and is valid in Composio
        try {
            const account = await composio.connectedAccounts.get(localMapping.connectionId);

            if (account.status !== 'ACTIVE') {
                console.warn(`⚠️ Instagram connection ${localMapping.connectionId} is not active (status: ${account.status})`);
                await deleteInstagramConnectionMapping(userId);
                return { isConnected: false, needsReconnection: true };
            }

            // Enhanced IG User ID retrieval with caching
            let igUserId = instagramUserIds.get(localMapping.connectionId);
            let username = account.metadata?.username;

            // If not in cache and not in metadata, try to fetch it
            if (!igUserId) {
                if (account.metadata?.igUserId) {
                    igUserId = account.metadata.igUserId;
                    instagramUserIds.set(localMapping.connectionId, igUserId);
                } else {
                    // Fetch from API
                    try {
                        const userInfo = await getUserInfo(localMapping.connectionId);
                        if (userInfo?.id) {
                            igUserId = userInfo.id;
                            username = userInfo.username || username;
                            // Cache it
                            instagramUserIds.set(localMapping.connectionId, igUserId);
                            console.log(`📸 Cached Instagram User ID for ${userId}: ${igUserId}`);
                        }
                    } catch (err) {
                        console.warn(`⚠️ Failed to fetch user info for ${userId}: ${err.message}`);
                    }
                }
            }

            return {
                isConnected: true,
                connectionId: localMapping.connectionId,
                username: username || null,
                igUserId: igUserId || null
            };
        } catch (error) {
            // Connection doesn't exist in Composio anymore
            console.warn(`⚠️ Instagram connection not found in Composio, cleaning up local mapping:`, error.message);
            await deleteInstagramConnectionMapping(userId);
            return { isConnected: false, needsReconnection: true };
        }
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
 * MULTI-TENANCY FIX: Uses local mapping for reliable disconnection
 * @param {string} userId - User's email - REQUIRED
 */
export const disconnect = async (userId) => {
    if (!userId) {
        return { success: false, error: 'userId (email) is required' };
    }
    userId = userId.trim();

    try {
        // MULTI-TENANCY FIX: First get the connection from local mapping
        const localMapping = await getInstagramConnectionMapping(userId);

        if (localMapping) {
            console.log(`📸 Disconnecting Instagram via local mapping: userId=${userId}, connectionId=${localMapping.connectionId}`);

            // Delete from Composio
            try {
                await composio.connectedAccounts.delete(localMapping.connectionId);
                console.log(`✅ Deleted Instagram connection from Composio: ${localMapping.connectionId}`);
            } catch (delErr) {
                console.warn(`⚠️ Failed to delete Instagram from Composio (may already be deleted):`, delErr.message);
            }

            // Always delete local mapping
            await deleteInstagramConnectionMapping(userId);
        } else {
            console.log(`ℹ️ No local Instagram mapping found for ${userId}, trying Composio directly...`);

            // Fallback: try to find and delete from Composio directly
            const accounts = await composio.connectedAccounts.list({
                appName: 'instagram',
                entityId: userId
            });

            if (accounts?.items?.length) {
                for (const acc of accounts.items) {
                    try {
                        await composio.connectedAccounts.delete(acc.id);
                        console.log(`✅ Deleted Instagram connection: ${acc.id}`);
                    } catch (delErr) {
                        console.warn(`⚠️ Failed to delete ${acc.id}:`, delErr.message);
                    }
                }
            }
        }

        // Stop polling if active
        if (pollingIntervals.has(userId)) {
            await stopPolling(userId);
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
};

/**
 * Resume polling for all active users on valid startup
 */
export const resumeActivePolling = async () => {
    try {
        console.log('🔄 Resuming active Instagram polling sessions...');
        const activeUsers = await prisma.user.findMany({
            where: {
                isInstagramPollingActive: true,
                geminiApiKey: { not: null } // Ensure they have an API key
            }
        });

        console.log(`📊 Found ${activeUsers.length} users with active Instagram polling`);

        for (const user of activeUsers) {
            // Decrypt key to verify validity (optional but good practice)
            try {
                if (user.geminiApiKey) {
                    startPolling(user.email, 15000, false); // false = don't update DB (already true)
                }
            } catch (e) {
                console.error(`❌ Failed to resume for ${user.email}: ${e.message}`);
            }
        }
    } catch (error) {
        console.error('❌ Error resuming Instagram polling:', error);
    }
};

// Resume polling on load
// resumeActivePolling(); // Will be called from server.js instead to ensure DB connection


/**
 * Configure agent prompt for Instagram
 * @param {string} userId - User's email
 * @param {string} prompt - Agent prompt
 */
export const configureInstagramAgent = async (userId, prompt) => {
    if (!userId || !prompt) {
        console.warn('⚠️ Cannot configure Instagram agent: missing userId or prompt');
        return false;
    }

    try {
        await prisma.user.update({
            where: { email: userId },
            data: { instagramPrompt: prompt }
        });
        console.log(`✅ Instagram agent configured for ${userId} (${prompt.length} chars)`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to save Instagram prompt for ${userId}:`, error.message);
        return false;
    }
};
/**
 * Start polling for new Instagram DMs
 * @param {string} userId - User's email
 * @param {number} intervalMs - Polling interval in ms (default: 15000)
 * @param {boolean} updateDb - Whether to update status in DB (default: true)
 */


export const startPolling = async (userId, intervalMs = 15000, updateDb = true) => {
    if (!userId) {
        console.error('❌ Cannot start polling: userId required');
        return false;
    }

    // Update DB status if requested
    if (updateDb) {
        try {
            await prisma.user.update({
                where: { email: userId },
                data: { isInstagramPollingActive: true }
            });
        } catch (error) {
            console.error(`⚠️ Failed to update active status in DB for ${userId}:`, error.message);
        }
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

            // Get agent prompt from DB
            let agentPrompt = null;
            try {
                const user = await prisma.user.findUnique({
                    where: { email: userId },
                    select: { instagramPrompt: true, customPrompt: true }
                });

                // Use specific Instagram prompt or fallback to general custom prompt
                agentPrompt = user?.instagramPrompt || user?.customPrompt;
            } catch (dbError) {
                console.warn(`Could not fetch prompt from DB for ${userId}: ${dbError.message}`);
            }

            if (!agentPrompt) {
                // Only log sparingly
                if (Math.random() < 0.05) {
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

            // Check each conversation for new messages
            for (const conv of convResult.conversations) {
                const convId = conv.id || conv.conversation_id;
                if (!convId) continue;

                const msgResult = await getMessages(userId, convId, 20);
                if (!msgResult.success || !msgResult.messages?.length) continue;

                console.log(`   📬 Conv ${convId.substring(0, 15)}... → ${msgResult.messages.length} messages`);

                for (const msg of msgResult.messages) {
                    const msgId = msg.id || msg.message_id;
                    const msgTimestamp = msg.created_time || msg.timestamp || msg.created_at;

                    // Skip messages older than 24 hours (accounts for severe Instagram API delay)
                    if (msgTimestamp) {
                        const msgDate = new Date(msgTimestamp);
                        const now = new Date();
                        const ageMs = now.getTime() - msgDate.getTime();
                        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

                        if (ageMs > TWENTY_FOUR_HOURS_MS) {
                            // Silently skip very old messages
                            if (msgId && !processed.has(msgId)) {
                                processed.add(msgId);
                            }
                            continue;
                        }
                    }

                    if (!msgId || processed.has(msgId)) continue;

                    // Skip messages sent by the connected account (our responses)
                    const senderId = msg.from?.id || msg.sender_id || msg.participant_id;
                    if (!senderId || senderId === status.igUserId) {
                        processed.add(msgId);
                        continue;
                    }

                    // Extract message text - Instagram API returns it in 'message' field
                    const messageText = msg.message || msg.text || msg.message?.text || msg.content || '';
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
                        // Fetch and decrypt user's Gemini API Key
                        const user = await prisma.user.findFirst({
                            where: { email: userId },
                            select: { geminiApiKey: true }
                        });

                        let geminiApiKey = null;
                        if (user?.geminiApiKey) {
                            try {
                                geminiApiKey = decrypt(user.geminiApiKey);
                            } catch (decryptError) {
                                console.error(`❌ Error decrypting Gemini API key: ${decryptError.message}`);
                            }
                        }

                        if (!geminiApiKey) {
                            console.error(`❌ No Gemini API key found for ${userId}`);
                            continue;
                        }

                        await axios.post(`${aiServiceUrl}/webhook/instagram`, {
                            userId,
                            senderId,
                            message: messageText,
                            history: history.map(h => ({ role: h.role, content: h.content })),
                            agentPrompt,
                            geminiApiKey
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
export const stopPolling = async (userId) => {
    const intervalId = pollingIntervals.get(userId);
    if (intervalId) {
        clearInterval(intervalId);
        pollingIntervals.delete(userId);

        try {
            await prisma.user.update({
                where: { email: userId },
                data: { isInstagramPollingActive: false }
            });
            console.log(`🛑 Stopped Instagram polling for ${userId}`);
        } catch (error) {
            console.error(`⚠️ Failed to update active status in DB for ${userId}:`, error.message);
        }

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
    addToHistory,
    resumeActivePolling
};
