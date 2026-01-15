import express from 'express';
import {
    getAuthUrl,
    handleCallback,
    getConnectionStatus,
    disconnect,
    listEvents,
    createEvent,
    findAvailableSlots,
    getCalendarFunctionDeclarations,
    executeCalendarFunction
} from '../services/googleCalendarService.js';

const router = express.Router();

/**
 * GET /api/google-calendar/status
 * Get Google Calendar connection status for a user
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
 * GET /api/google-calendar/auth-url
 * Generate OAuth URL for Google Calendar connection
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
 * POST /api/google-calendar/callback
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
 * POST /api/google-calendar/disconnect
 * Disconnect Google Calendar account
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

/**
 * GET /api/google-calendar/events
 * List upcoming events
 * Query params: userId (required), maxResults (optional, default 10)
 */
router.get('/events', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        const maxResults = parseInt(req.query.maxResults) || 10;
        const result = await listEvents(userId, maxResults);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/google-calendar/events
 * Create a new event
 * Body: { userId, summary, description?, start, end, attendees?, location? }
 */
router.post('/events', async (req, res) => {
    try {
        const { userId, summary, description, start, end, attendees, location } = req.body;

        if (!userId || !summary || !start || !end) {
            return res.status(400).json({
                success: false,
                error: 'userId, summary, start, and end are required'
            });
        }

        const result = await createEvent(userId, {
            summary,
            description,
            start,
            end,
            attendees,
            location
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/google-calendar/available-slots
 * Find available time slots
 * Query params: userId (required), date (required, YYYY-MM-DD), duration (optional, minutes)
 */
router.get('/available-slots', async (req, res) => {
    try {
        const { userId, date, duration } = req.query;

        if (!userId || !date) {
            return res.status(400).json({
                success: false,
                error: 'userId and date are required'
            });
        }

        const durationMinutes = parseInt(duration) || 60;
        const result = await findAvailableSlots(userId, date, durationMinutes);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/google-calendar/function-declarations
 * Get function declarations for Gemini Function Calling
 * This endpoint is used by the AI engine to know which tools are available
 */
router.get('/function-declarations', (req, res) => {
    const declarations = getCalendarFunctionDeclarations();
    res.json({ success: true, declarations });
});

/**
 * POST /api/google-calendar/execute-function
 * Execute a calendar function (called by AI engine)
 * Body: { userId, functionName, args }
 */
router.post('/execute-function', async (req, res) => {
    try {
        const { userId, functionName, args } = req.body;

        if (!userId || !functionName) {
            return res.status(400).json({
                success: false,
                error: 'userId and functionName are required'
            });
        }

        const result = await executeCalendarFunction(functionName, args || {}, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
