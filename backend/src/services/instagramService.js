import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Composio client
const composio = new Composio(process.env.COMPOSIO_API_KEY);

// Socket.IO instance reference
let socketIO = null;

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
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/instagram-callback`
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

/**
 * Get connected Instagram user info
 * @param {string} connectionId - The Composio connection ID
 * @returns {Promise<object|null>}
 */
export const getUserInfo = async (connectionId) => {
    if (!connectionId) {
        return null;
    }

    try {
        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_GET_USER_INFO',
            {},
            connectionId
        );

        return result.successful ? result.data : null;
    } catch (error) {
        console.error('Instagram Get User Info Error:', error.message);
        return null;
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

/**
 * List all DM conversations for a user
 * @param {string} userId - User's email
 * @param {number} limit - Max conversations to return
 */
export const listConversations = async (userId, limit = 25) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_LIST_ALL_CONVERSATIONS',
            { limit },
            status.connectionId
        );

        return result.successful
            ? { success: true, conversations: result.data || [] }
            : { success: false, error: result.error || 'Failed to list conversations' };
    } catch (error) {
        console.error('Instagram List Conversations Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Get messages from a specific conversation
 * @param {string} userId - User's email
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Max messages to return
 */
export const getMessages = async (userId, conversationId, limit = 25) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_LIST_ALL_MESSAGES',
            { conversation_id: conversationId, limit },
            status.connectionId
        );

        return result.successful
            ? { success: true, messages: result.data || [] }
            : { success: false, error: result.error || 'Failed to get messages' };
    } catch (error) {
        console.error('Instagram Get Messages Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send a text DM to a user
 * @param {string} userId - User's email
 * @param {string} recipientId - Instagram user ID to send message to
 * @param {string} text - Message text
 */
export const sendDM = async (userId, recipientId, text) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_SEND_TEXT_MESSAGE',
            { recipient_id: recipientId, text },
            status.connectionId
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
 * Send an image DM to a user
 * @param {string} userId - User's email
 * @param {string} recipientId - Instagram user ID
 * @param {string} imageUrl - URL of the image
 * @param {string} caption - Optional caption
 */
export const sendImageDM = async (userId, recipientId, imageUrl, caption = '') => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_SEND_IMAGE',
            { recipient_id: recipientId, image_url: imageUrl, caption },
            status.connectionId
        );

        return result.successful
            ? { success: true, messageId: result.data?.id }
            : { success: false, error: result.error || 'Failed to send image DM' };
    } catch (error) {
        console.error('Instagram Send Image Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Mark messages as seen
 * @param {string} userId - User's email
 * @param {string} recipientId - Instagram user ID
 */
export const markSeen = async (userId, recipientId) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Instagram not connected' };
    }

    try {
        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_MARK_SEEN',
            { recipient_id: recipientId },
            status.connectionId
        );

        return { success: result.successful };
    } catch (error) {
        console.error('Instagram Mark Seen Error:', error.message);
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
 * Cleanup function for server shutdown (no-op in multi-tenant mode)
 */
export const cleanup = async () => {
    // No global state to cleanup in multi-tenant mode
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
    cleanup
};
