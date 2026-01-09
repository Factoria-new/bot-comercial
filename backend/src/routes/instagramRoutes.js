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
 * Get Instagram connection status for a user
 * Query params: userId (required - user's email)
 */
router.get('/status', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        const status = await getConnectionStatus(userId);
        res.json({ success: true, ...status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/instagram/auth-url
 * Generate OAuth URL for Instagram connection
 * Query params: userId (required - user's email)
 */
router.get('/auth-url', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        const result = await getAuthUrl(userId);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/instagram/user-info
 * Get connected user info
 * Query params: connectionId (required)
 */
router.get('/user-info', async (req, res) => {
    try {
        const connectionId = req.query.connectionId;
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'connectionId is required'
            });
        }

        const userInfo = await getUserInfo(connectionId);
        if (userInfo) {
            res.json({ success: true, data: userInfo });
        } else {
            res.status(404).json({ success: false, error: 'User info not available' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/instagram/conversations
 * List all DM conversations
 * Query params: userId (required), limit (optional, default 25)
 */
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        const limit = parseInt(req.query.limit) || 25;
        const result = await listConversations(userId, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/instagram/messages/:conversationId
 * Get messages from a specific conversation
 * Query params: userId (required), limit (optional, default 25)
 */
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 25;
        const result = await getMessages(userId, conversationId, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/instagram/send-dm
 * Send a text DM
 * Body: { userId, recipientId, text }
 */
router.post('/send-dm', async (req, res) => {
    try {
        const { userId, recipientId, text } = req.body;
        if (!userId || !recipientId || !text) {
            return res.status(400).json({
                success: false,
                error: 'userId, recipientId and text are required'
            });
        }

        const result = await sendDM(userId, recipientId, text);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/instagram/send-image
 * Send an image DM
 * Body: { userId, recipientId, imageUrl, caption? }
 */
router.post('/send-image', async (req, res) => {
    try {
        const { userId, recipientId, imageUrl, caption } = req.body;
        if (!userId || !recipientId || !imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'userId, recipientId and imageUrl are required'
            });
        }

        const result = await sendImageDM(userId, recipientId, imageUrl, caption);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/instagram/mark-seen
 * Mark messages as seen
 * Body: { userId, recipientId }
 */
router.post('/mark-seen', async (req, res) => {
    try {
        const { userId, recipientId } = req.body;
        if (!userId || !recipientId) {
            return res.status(400).json({
                success: false,
                error: 'userId and recipientId are required'
            });
        }

        const result = await markSeen(userId, recipientId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/instagram/disconnect
 * Disconnect Instagram account
 * Body: { userId }
 */
router.post('/disconnect', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        const result = await disconnect(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
