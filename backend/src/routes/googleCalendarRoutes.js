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
    executeCalendarFunction,
    scheduleAppointment,
    findEventsByCustomerEmail,
    rescheduleAppointment,
    checkAvailability,
    cancelAppointment,
    listAvailableSlotsForDay
} from '../services/googleCalendarService.js';
import prisma from '../config/prisma.js';

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

        // Skip health check for UI status to prevent auto-disconnect loops or false negatives during polling
        // The health check is strict and might fail transiently
        const status = await getConnectionStatus(userId, true);
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
 * POST /api/google-calendar/function-declarations-with-context
 * Get function declarations with business hours context injected
 * Body: { userId } - User's email to fetch business context
 */
router.post('/function-declarations-with-context', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        // Fetch user's business context from database

        const user = await prisma.user.findFirst({
            where: { email: userId },
            select: {
                businessHours: true,
                serviceType: true,
                businessAddress: true
            }
        });

        const businessContext = user ? {
            businessHours: user.businessHours,
            serviceType: user.serviceType,
            businessAddress: user.businessAddress
        } : null;

        const declarations = getCalendarFunctionDeclarations(businessContext);

        res.json({
            success: true,
            declarations,
            hasBusinessContext: !!businessContext?.businessHours
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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

        // Fetch user's business context from database

        const user = await prisma.user.findFirst({
            where: { email: userId },
            select: {
                businessHours: true,
                serviceType: true,
                businessAddress: true
            }
        });

        const businessContext = user ? {
            businessHours: user.businessHours,
            serviceType: user.serviceType,
            businessAddress: user.businessAddress
        } : null;

        console.log(`📅 Executing function with business context:`, businessContext ? 'present' : 'none');

        const result = await executeCalendarFunction(functionName, args || {}, userId, businessContext);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/google-calendar/schedule-appointment
 * Unified endpoint for scheduling appointments with full validation
 * - Validates against business hours
 * - Checks calendar availability
 * - Suggests alternatives if unavailable
 * - Creates event with Google Meet (if online) or returns address (if presencial)
 * 
 * Body: {
 *   userId: string,         // Email of calendar owner
 *   customerName: string,   // Customer's name
 *   customerEmail: string,  // Customer's email (added as attendee)
 *   requestedStart: string, // ISO datetime
 *   requestedEnd: string,   // ISO datetime
 *   description?: string    // Optional description
 * }
 */
router.post('/schedule-appointment', async (req, res) => {
    try {
        const { userId, customerName, customerEmail, requestedStart, requestedEnd, description } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        if (!customerName || !customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'customerName and customerEmail are required'
            });
        }

        if (!requestedStart || !requestedEnd) {
            return res.status(400).json({
                success: false,
                error: 'requestedStart and requestedEnd are required'
            });
        }

        // Fetch user's business context from database (including appointmentDuration)
        const user = await prisma.user.findFirst({
            where: { email: userId },
            select: {
                businessHours: true,
                serviceType: true,
                businessAddress: true,
                appointmentDuration: true
            }
        });

        const businessContext = user ? {
            businessHours: user.businessHours,
            serviceType: user.serviceType,
            businessAddress: user.businessAddress,
            appointmentDuration: user.appointmentDuration || 60  // Default 60 minutes
        } : { appointmentDuration: 60 };

        console.log(`📅 Schedule appointment request for ${customerName} (${customerEmail})`);
        console.log(`   Requested: ${requestedStart} to ${requestedEnd}`);
        console.log(`   Business context: duration=${businessContext.appointmentDuration}min, type=${businessContext.serviceType}`);

        const result = await scheduleAppointment(userId, {
            customerName,
            customerEmail,
            requestedStart,
            requestedEnd,
            description
        }, businessContext);

        res.json(result);
    } catch (error) {
        console.error('Schedule appointment error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/google-calendar/customer-events
 * Find events for a specific customer by email
 * Query params: userId (required), customerEmail (required)
 */
router.get('/customer-events', async (req, res) => {
    try {
        const { userId, customerEmail } = req.query;

        if (!userId || !customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'userId and customerEmail are required'
            });
        }

        console.log(`📅 Finding events for customer ${customerEmail} in ${userId}'s calendar`);

        const result = await findEventsByCustomerEmail(userId, customerEmail);
        res.json(result);
    } catch (error) {
        console.error('Find customer events error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/google-calendar/reschedule-appointment
 * Reschedule an existing appointment
 * 
 * Body: {
 *   userId: string,           // Email of calendar owner
 *   eventId: string,          // ID of event to reschedule
 *   newStart: string,         // New start datetime (ISO)
 *   newEnd: string            // New end datetime (ISO)
 * }
 */
router.post('/reschedule-appointment', async (req, res) => {
    try {
        const { userId, eventId, newStart, newEnd } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        if (!eventId) {
            return res.status(400).json({
                success: false,
                error: 'eventId is required'
            });
        }

        if (!newStart || !newEnd) {
            return res.status(400).json({
                success: false,
                error: 'newStart and newEnd are required'
            });
        }

        // Fetch user's business context from database (including appointmentDuration)
        const user = await prisma.user.findFirst({
            where: { email: userId },
            select: {
                businessHours: true,
                serviceType: true,
                businessAddress: true,
                appointmentDuration: true
            }
        });

        const businessContext = {
            businessHours: user?.businessHours || null,
            serviceType: user?.serviceType || 'presencial',  // Default to presencial to avoid erroneously generating Meet links
            businessAddress: user?.businessAddress || null,
            appointmentDuration: user?.appointmentDuration || 60  // Default 60 minutes
        };

        console.log(`📅 Reschedule request for event ${eventId}`);
        console.log(`   New time: ${newStart}`);
        console.log(`   Business context: duration=${businessContext.appointmentDuration}min, type=${businessContext.serviceType}`);

        const result = await rescheduleAppointment(userId, eventId, newStart, newEnd, businessContext);
        res.json(result);
    } catch (error) {
        console.error('Reschedule appointment error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/google-calendar/check-availability
 * Check availability for a specific time slot
 * Body: { userId, date, time }
 */
router.post('/check-availability', async (req, res) => {
    try {
        const { userId, date, time } = req.body;

        if (!userId || !date || !time) {
            return res.status(400).json({
                success: false,
                error: 'userId, date, and time are required'
            });
        }

        const user = await prisma.user.findFirst({
            where: { email: userId },
            select: {
                businessHours: true,
                appointmentDuration: true
            }
        });

        const businessHours = user?.businessHours || null;
        const duration = user?.appointmentDuration || 60;

        const result = await checkAvailability(userId, date, time, duration, businessHours);
        res.json({ success: true, ...result });

    } catch (error) {
        console.error('Check availability error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/google-calendar/cancel-appointment
 * Cancel an existing appointment
 * 
 * Body: {
 *   userId: string,           // Email of calendar owner
 *   eventId: string           // ID of event to cancel
 * }
 */
router.post('/cancel-appointment', async (req, res) => {
    try {
        const { userId, eventId } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        if (!eventId) {
            return res.status(400).json({
                success: false,
                error: 'eventId is required'
            });
        }

        console.log(`📅 Cancel appointment request for event ${eventId}`);

        const result = await cancelAppointment(userId, eventId);
        res.json(result);
    } catch (error) {
        console.error('Cancel appointment error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/google-calendar/available-slots-for-day
 * List all available time slots for a specific day
 * 
 * Body: {
 *   userId: string,           // Email of calendar owner
 *   date: string,             // Date in YYYY-MM-DD format
 *   period?: string           // Optional: 'morning', 'afternoon', 'evening', or 'all'
 * }
 */
router.post('/available-slots-for-day', async (req, res) => {
    try {
        const { userId, date, period } = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId (email) is required'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'date (YYYY-MM-DD) is required'
            });
        }

        // Fetch user's business context from database
        const user = await prisma.user.findFirst({
            where: { email: userId },
            select: {
                businessHours: true,
                appointmentDuration: true
            }
        });

        const businessHours = user?.businessHours || null;
        const duration = user?.appointmentDuration || 60;

        console.log(`📅 Listing available slots for ${date}, duration=${duration}min, period=${period || 'all'}`);

        const result = await listAvailableSlotsForDay(userId, date, duration, businessHours, period || 'all');
        res.json(result);

    } catch (error) {
        console.error('List available slots error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
