import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Composio client
const composio = new Composio(process.env.COMPOSIO_API_KEY);

// Store connection state
let connectionState = {
    isConnected: false,
    connectionId: null,
    igUserId: null,
    username: null,
    errorMessage: null
};

// Socket.IO instance reference
let socketIO = null;

/**
 * Initialize Instagram service with Socket.IO
 */
export const initInstagramService = (io) => {
    socketIO = io;
    console.log('📸 Instagram Service initialized');

    // Check existing connection on startup
    // checkExistingConnection(); // DISABLED: Ephemeral mode
};

/**
 * Check if there's an existing Instagram connection
 */
const checkExistingConnection = async () => {
    try {
        // List connected accounts to check for existing Instagram connection
        const accounts = await composio.connectedAccounts.list({
            appName: 'instagram'
        });

        if (accounts?.items?.length > 0) {
            const account = accounts.items[0];
            connectionState = {
                isConnected: true,
                connectionId: account.id,
                igUserId: account.metadata?.igUserId || null,
                username: account.metadata?.username || null,
                errorMessage: null
            };
            console.log('📸 Instagram: Existing connection found -', connectionState.username || account.id);
        }
    } catch (error) {
        console.log('📸 Instagram: No existing connection found', error.message || '');
    }
};

/**
 * Generate OAuth URL for Instagram authentication
 * @param {string} userId - Unique identifier for the user
 */
export const getAuthUrl = async (userId) => {
    try {
        const authConfigId = process.env.COMPOSIO_INSTAGRAM_AUTH_CONFIG_ID;
        console.log('🔍 Debug: Using Instagram Auth Config ID:', authConfigId);

        if (!authConfigId) {
            throw new Error('Instagram Auth Config ID not configured');
        }

        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            authConfigId,
            {
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/instagram-callback`
            }
        );

        console.log('📸 Instagram: Auth URL generated for user', userId);

        return {
            success: true,
            authUrl: connectionRequest.redirectUrl,
            connectionId: connectionRequest.connectedAccountId || connectionRequest.id
        };
    } catch (error) {
        console.error('📸 Instagram Auth Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Handle OAuth callback after user authenticates
 * @param {string} connectionId - The connection ID returned from auth flow
 */
export const handleCallback = async (connectionId) => {
    try {
        const connectedAccount = await composio.connectedAccounts.get(connectionId);

        if (connectedAccount.status === 'ACTIVE') {
            // Get user info
            const userInfo = await getUserInfo(connectionId);

            connectionState = {
                isConnected: true,
                connectionId: connectionId,
                igUserId: userInfo?.id || null,
                username: userInfo?.username || null,
                errorMessage: null
            };

            // Emit connection success via Socket.IO
            if (socketIO) {
                socketIO.emit('instagram:connected', {
                    success: true,
                    username: connectionState.username
                });
            }

            console.log('📸 Instagram: Connected successfully -', connectionState.username);

            return {
                success: true,
                connectionId: connectionId,
                username: connectionState.username
            };
        } else {
            throw new Error('Connection not active');
        }
    } catch (error) {
        console.error('📸 Instagram Callback Error:', error);
        connectionState.errorMessage = error.message;

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get connected Instagram user info
 */
export const getUserInfo = async (connectionId = null) => {
    try {
        const connId = connectionId || connectionState.connectionId;
        if (!connId) {
            throw new Error('No Instagram connection');
        }

        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_GET_USER_INFO',
            {},
            connId
        );

        if (result.successful) {
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('📸 Instagram Get User Info Error:', error);
        return null;
    }
};

/**
 * Get connection status - checks Composio for active connections
 */
export const getConnectionStatus = async () => {
    // If we already have a connection, return it
    if (connectionState.isConnected) {
        return {
            isConnected: connectionState.isConnected,
            username: connectionState.username,
            igUserId: connectionState.igUserId,
            errorMessage: connectionState.errorMessage
        };
    }

    // Otherwise, check Composio for new connections
    try {
        const accounts = await composio.connectedAccounts.list({
            appName: 'instagram'
        });

        if (accounts?.items?.length > 0) {
            // Find an actual Instagram account
            // Note: SDK might return appName as undefined, so we accept that if it's active
            const instagramAccount = accounts.items.find(acc =>
                (acc.appName?.toLowerCase().includes('instagram') || !acc.appName) && acc.status === 'ACTIVE'
            );

            if (instagramAccount) {
                connectionState = {
                    isConnected: true,
                    connectionId: instagramAccount.id,
                    igUserId: instagramAccount.metadata?.igUserId || null,
                    username: instagramAccount.metadata?.username || 'Instagram',
                    errorMessage: null
                };
                console.log('📸 Instagram: Connection found via polling -', connectionState.connectionId);
            }
        }
    } catch (error) {
        console.log('📸 Instagram: Error checking connection', error.message || '');
    }

    return {
        isConnected: connectionState.isConnected,
        username: connectionState.username,
        igUserId: connectionState.igUserId,
        errorMessage: connectionState.errorMessage
    };
};

/**
 * List all DM conversations
 */
export const listConversations = async (limit = 25) => {
    try {
        if (!connectionState.connectionId) {
            throw new Error('Instagram not connected');
        }

        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_LIST_ALL_CONVERSATIONS',
            { limit: limit },
            connectionState.connectionId
        );

        if (result.successful) {
            return {
                success: true,
                conversations: result.data || []
            };
        }

        return {
            success: false,
            error: result.error || 'Failed to list conversations'
        };
    } catch (error) {
        console.error('📸 Instagram List Conversations Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get messages from a specific conversation
 */
export const getMessages = async (conversationId, limit = 25) => {
    try {
        if (!connectionState.connectionId) {
            throw new Error('Instagram not connected');
        }

        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_LIST_ALL_MESSAGES',
            {
                conversation_id: conversationId,
                limit: limit
            },
            connectionState.connectionId
        );

        if (result.successful) {
            return {
                success: true,
                messages: result.data || []
            };
        }

        return {
            success: false,
            error: result.error || 'Failed to get messages'
        };
    } catch (error) {
        console.error('📸 Instagram Get Messages Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Send a text DM to a user
 * @param {string} recipientId - Instagram user ID to send message to
 * @param {string} text - Message text
 */
export const sendDM = async (recipientId, text) => {
    try {
        if (!connectionState.connectionId) {
            throw new Error('Instagram not connected');
        }

        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_SEND_TEXT_MESSAGE',
            {
                recipient_id: recipientId,
                text: text
            },
            connectionState.connectionId
        );

        if (result.successful) {
            console.log('📸 Instagram: DM sent to', recipientId);
            return {
                success: true,
                messageId: result.data?.id
            };
        }

        return {
            success: false,
            error: result.error || 'Failed to send DM'
        };
    } catch (error) {
        console.error('📸 Instagram Send DM Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Send an image DM to a user
 * @param {string} recipientId - Instagram user ID to send image to
 * @param {string} imageUrl - URL of the image
 * @param {string} caption - Optional caption
 */
export const sendImageDM = async (recipientId, imageUrl, caption = '') => {
    try {
        if (!connectionState.connectionId) {
            throw new Error('Instagram not connected');
        }

        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_SEND_IMAGE',
            {
                recipient_id: recipientId,
                image_url: imageUrl,
                caption: caption
            },
            connectionState.connectionId
        );

        if (result.successful) {
            console.log('📸 Instagram: Image DM sent to', recipientId);
            return {
                success: true,
                messageId: result.data?.id
            };
        }

        return {
            success: false,
            error: result.error || 'Failed to send image DM'
        };
    } catch (error) {
        console.error('📸 Instagram Send Image Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mark messages as seen
 * @param {string} recipientId - Instagram user ID
 */
export const markSeen = async (recipientId) => {
    try {
        if (!connectionState.connectionId) {
            throw new Error('Instagram not connected');
        }

        const toolset = composio.getToolSet();
        const result = await toolset.executeAction(
            'INSTAGRAM_MARK_SEEN',
            { recipient_id: recipientId },
            connectionState.connectionId
        );

        return {
            success: result.successful
        };
    } catch (error) {
        console.error('📸 Instagram Mark Seen Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Disconnect Instagram account
 */
export const disconnect = async () => {
    try {
        if (connectionState.connectionId) {
            console.log('📸 Instagram: Disconnecting and removing from Composio...');
            try {
                // Remove from Composio
                await composio.connectedAccounts.delete(connectionState.connectionId);
                console.log('✅ Removed connection from Composio:', connectionState.connectionId);
            } catch (compError) {
                console.warn('⚠️ Failed to remove from Composio (might already be deleted):', compError.message);
            }
        }

        connectionState = {
            isConnected: false,
            connectionId: null,
            igUserId: null,
            username: null,
            errorMessage: null
        };

        if (socketIO) {
            socketIO.emit('instagram:disconnected');
        }

        return { success: true };
    } catch (error) {
        console.error('📸 Instagram Disconnect Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Cleanup function for server shutdown
 */
export const cleanup = async () => {
    console.log('🧹 Cleaning up Instagram service...');
    connectionState = {
        isConnected: false,
        connectionId: null,
        igUserId: null,
        username: null,
        errorMessage: null
    };
    console.log('✅ Instagram service cleaned up');
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
