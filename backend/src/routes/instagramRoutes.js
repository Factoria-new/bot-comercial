import express from 'express';
import {
    getAuthUrl,
    handleCallback,
    getConnectionStatus,
    getUserInfo,
    listConversations,
    getMessages,
    sendDM,
    sendImageDM,
    markSeen,
    disconnect
} from '../services/instagramService.js';

const router = express.Router();

/**
 * GET /api/instagram/status
 * Get Instagram connection status
 */
router.get('/status', (req, res) => {
    const status = getConnectionStatus();
    res.json({
        success: true,
        ...status
    });
});

/**
 * GET /api/instagram/auth-url
 * Generate OAuth URL for Instagram connection
 * Query params: userId (optional, defaults to 'default-user')
 */
router.get('/auth-url', async (req, res) => {
    try {
        const userId = req.query.userId || 'default-user';
        const result = await getAuthUrl(userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/instagram/callback
 * Handle OAuth callback
 * Body: { connectionId }
 */
router.post('/callback', async (req, res) => {
    try {
        const { connectionId } = req.body;

        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'connectionId is required'
            });
        }

        const result = await handleCallback(connectionId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/instagram/user-info
 * Get connected user info
 */
router.get('/user-info', async (req, res) => {
    try {
        const userInfo = await getUserInfo();

        if (userInfo) {
            res.json({
                success: true,
                data: userInfo
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'User info not available'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/instagram/conversations
 * List all DM conversations
 * Query params: limit (optional, default 25)
 */
router.get('/conversations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const result = await listConversations(limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/instagram/messages/:conversationId
 * Get messages from a specific conversation
 * Query params: limit (optional, default 25)
 */
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 25;
        const result = await getMessages(conversationId, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/instagram/send-dm
 * Send a text DM
 * Body: { recipientId, text }
 */
router.post('/send-dm', async (req, res) => {
    try {
        const { recipientId, text } = req.body;

        if (!recipientId || !text) {
            return res.status(400).json({
                success: false,
                error: 'recipientId and text are required'
            });
        }

        const result = await sendDM(recipientId, text);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/instagram/send-image
 * Send an image DM
 * Body: { recipientId, imageUrl, caption? }
 */
router.post('/send-image', async (req, res) => {
    try {
        const { recipientId, imageUrl, caption } = req.body;

        if (!recipientId || !imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'recipientId and imageUrl are required'
            });
        }

        const result = await sendImageDM(recipientId, imageUrl, caption);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/instagram/mark-seen
 * Mark messages as seen
 * Body: { recipientId }
 */
router.post('/mark-seen', async (req, res) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                error: 'recipientId is required'
            });
        }

        const result = await markSeen(recipientId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/instagram/disconnect
 * Disconnect Instagram account
 */
router.post('/disconnect', async (req, res) => {
    try {
        const result = await disconnect();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
