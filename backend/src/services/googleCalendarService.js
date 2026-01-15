import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Composio client for Google Calendar
const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY
});

// Socket.IO instance reference
let socketIO = null;

/**
 * Initialize Google Calendar service with Socket.IO
 * @param {object} io - Socket.IO instance
 */
export const initGoogleCalendarService = (io) => {
    socketIO = io;
    console.log('📅 Google Calendar Service initialized');
};

/**
 * Generate OAuth URL for Google Calendar authentication
 * @param {string} userId - User's email (unique identifier) - REQUIRED
 * @returns {Promise<{success: boolean, authUrl?: string, connectionId?: string, error?: string}>}
 */
export const getAuthUrl = async (userId) => {
    if (!userId) {
        return { success: false, error: 'userId (email) is required' };
    }

    try {
        const authConfigId = process.env.COMPOSIO_CALENDAR_AUTH_CONFIG_ID;
        if (!authConfigId) {
            return { success: false, error: 'Google Calendar Auth Config ID not configured' };
        }

        console.log(`📅 Initiating Google Calendar auth for user: ${userId}`);

        const connectionRequest = await composio.connectedAccounts.initiate(
            userId,
            authConfigId,
            {
                redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/calendar-callback`
            }
        );

        console.log(`✅ Google Calendar auth URL generated for ${userId}`);

        return {
            success: true,
            authUrl: connectionRequest.redirectUrl,
            connectionId: connectionRequest.connectedAccountId || connectionRequest.id
        };
    } catch (error) {
        console.error('Google Calendar Auth Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Handle OAuth callback after user authenticates
 * @param {string} connectionId - The connection ID returned from auth flow
 * @returns {Promise<{success: boolean, connectionId?: string, email?: string, error?: string}>}
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

        const result = {
            success: true,
            connectionId: connectionId,
            email: connectedAccount.metadata?.email || null
        };

        // Emit connection success via Socket.IO (for real-time updates)
        if (socketIO) {
            socketIO.emit('google-calendar:connected', {
                success: true,
                email: result.email
            });
        }

        console.log(`✅ Google Calendar connected for: ${result.email || connectionId}`);

        return result;
    } catch (error) {
        console.error('Google Calendar Callback Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Get connection status for a specific user
 * @param {string} userId - User's email (unique identifier) - REQUIRED
 * @returns {Promise<{isConnected: boolean, email?: string, connectionId?: string}>}
 */
export const getConnectionStatus = async (userId) => {
    if (!userId) {
        return { isConnected: false, error: 'userId (email) is required' };
    }

    try {
        const accounts = await composio.connectedAccounts.list({
            appName: 'googlecalendar',
            entityId: userId
        });

        if (!accounts?.items?.length) {
            return { isConnected: false };
        }

        // Find active Google Calendar account for this user
        const activeAccount = accounts.items.find(acc => acc.status === 'ACTIVE');

        if (!activeAccount) {
            return { isConnected: false };
        }

        return {
            isConnected: true,
            connectionId: activeAccount.id,
            email: activeAccount.metadata?.email || null
        };
    } catch (error) {
        console.error('Google Calendar Status Check Error:', error.message);
        return { isConnected: false, error: error.message };
    }
};

/**
 * Disconnect Google Calendar account for a user
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
                console.log(`✅ Google Calendar disconnected for ${userId}`);
            } catch (deleteError) {
                console.warn('Could not delete from Composio:', deleteError.message);
            }
        }

        if (socketIO) {
            socketIO.emit('google-calendar:disconnected', { userId });
        }

        return { success: true };
    } catch (error) {
        console.error('Google Calendar Disconnect Error:', error.message);
        return { success: false, error: error.message };
    }
};

// ============================================
// GOOGLE CALENDAR TOOLS (for Gemini Function Calling)
// ============================================

/**
 * List upcoming events from the user's calendar
 * @param {string} userId - User's email
 * @param {number} maxResults - Maximum number of events to return (default: 10)
 * @param {string} timeMin - Start time in ISO format (default: now)
 * @returns {Promise<{success: boolean, events?: Array, error?: string}>}
 */
export const listEvents = async (userId, maxResults = 10, timeMin = null) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        const params = {
            max_results: maxResults,
            time_min: timeMin || new Date().toISOString()
        };

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_LIST_EVENTS',
            params,
            { connectedAccountId: status.connectionId }
        );

        return result.successful
            ? { success: true, events: result.data?.items || result.data || [] }
            : { success: false, error: result.error || 'Failed to list events' };
    } catch (error) {
        console.error('Google Calendar List Events Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Create a new event on the user's calendar
 * @param {string} userId - User's email
 * @param {object} eventData - Event details (summary, description, start, end, attendees)
 * @returns {Promise<{success: boolean, event?: object, error?: string}>}
 */
export const createEvent = async (userId, eventData) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        const params = {
            summary: eventData.summary || eventData.title,
            description: eventData.description || '',
            start_datetime: eventData.start || eventData.startDateTime,
            end_datetime: eventData.end || eventData.endDateTime,
            attendees: eventData.attendees || [],
            location: eventData.location || ''
        };

        console.log(`📅 Creating event: "${params.summary}" for ${userId}`);

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_CREATE_EVENT',
            params,
            { connectedAccountId: status.connectionId }
        );

        if (result.successful) {
            console.log(`✅ Event created: ${result.data?.id || 'success'}`);
            return { success: true, event: result.data };
        } else {
            return { success: false, error: result.error || 'Failed to create event' };
        }
    } catch (error) {
        console.error('Google Calendar Create Event Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Find available time slots in the user's calendar
 * @param {string} userId - User's email
 * @param {string} date - Date to check (YYYY-MM-DD format)
 * @param {number} durationMinutes - Duration of the time slot needed
 * @returns {Promise<{success: boolean, slots?: Array, error?: string}>}
 */
export const findAvailableSlots = async (userId, date, durationMinutes = 60) => {
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        // Get all events for the specified date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_FIND_FREE_SLOTS',
            {
                time_min: startOfDay.toISOString(),
                time_max: endOfDay.toISOString(),
                duration_minutes: durationMinutes
            },
            { connectedAccountId: status.connectionId }
        );

        return result.successful
            ? { success: true, slots: result.data || [] }
            : { success: false, error: result.error || 'Failed to find available slots' };
    } catch (error) {
        console.error('Google Calendar Find Slots Error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Get function declarations for Gemini Function Calling
 * These are the tools the AI agent can use when Google Calendar is connected
 */
export const getCalendarFunctionDeclarations = () => {
    return [
        {
            name: 'list_calendar_events',
            description: 'Lista os próximos eventos do calendário do usuário. Use quando o cliente perguntar sobre compromissos, reuniões ou agenda.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    max_results: {
                        type: 'NUMBER',
                        description: 'Número máximo de eventos para retornar (padrão: 10)'
                    }
                },
                required: []
            }
        },
        {
            name: 'create_calendar_event',
            description: 'Cria um novo evento/compromisso no calendário. Use quando o cliente quiser agendar uma reunião, consulta ou compromisso.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    summary: {
                        type: 'STRING',
                        description: 'Título do evento (ex: "Reunião com João")'
                    },
                    description: {
                        type: 'STRING',
                        description: 'Descrição detalhada do evento'
                    },
                    start_datetime: {
                        type: 'STRING',
                        description: 'Data e hora de início no formato ISO (ex: "2025-01-20T10:00:00")'
                    },
                    end_datetime: {
                        type: 'STRING',
                        description: 'Data e hora de término no formato ISO (ex: "2025-01-20T11:00:00")'
                    },
                    attendees: {
                        type: 'ARRAY',
                        items: { type: 'STRING' },
                        description: 'Lista de emails dos participantes (opcional)'
                    },
                    location: {
                        type: 'STRING',
                        description: 'Local do evento (opcional)'
                    }
                },
                required: ['summary', 'start_datetime', 'end_datetime']
            }
        },
        {
            name: 'find_available_slots',
            description: 'Encontra horários disponíveis no calendário para agendamento. Use quando o cliente perguntar sobre disponibilidade.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    date: {
                        type: 'STRING',
                        description: 'Data para verificar disponibilidade no formato YYYY-MM-DD (ex: "2025-01-20")'
                    },
                    duration_minutes: {
                        type: 'NUMBER',
                        description: 'Duração necessária em minutos (padrão: 60)'
                    }
                },
                required: ['date']
            }
        }
    ];
};

/**
 * Execute a calendar function called by Gemini
 * @param {string} functionName - Name of the function to execute
 * @param {object} args - Arguments passed by Gemini
 * @param {string} userId - User's email
 * @returns {Promise<{success: boolean, result?: any, error?: string}>}
 */
export const executeCalendarFunction = async (functionName, args, userId) => {
    console.log(`📅 Executing calendar function: ${functionName}`, args);

    switch (functionName) {
        case 'list_calendar_events':
            return await listEvents(userId, args.max_results || 10);

        case 'create_calendar_event':
            return await createEvent(userId, {
                summary: args.summary,
                description: args.description,
                start: args.start_datetime,
                end: args.end_datetime,
                attendees: args.attendees,
                location: args.location
            });

        case 'find_available_slots':
            return await findAvailableSlots(userId, args.date, args.duration_minutes || 60);

        default:
            return { success: false, error: `Unknown function: ${functionName}` };
    }
};

export default {
    initGoogleCalendarService,
    getAuthUrl,
    handleCallback,
    getConnectionStatus,
    disconnect,
    listEvents,
    createEvent,
    findAvailableSlots,
    getCalendarFunctionDeclarations,
    executeCalendarFunction
};
