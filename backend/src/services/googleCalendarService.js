import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Composio client for Google Calendar
const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { googlecalendar: 'latest' }
});

// Socket.IO instance reference
let socketIO = null;

// Default timezone for Brazil (São Paulo)
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const TIMEZONE_OFFSET = '-03:00';

/**
 * Ensure datetime has timezone offset appended
 * If already has timezone (ends with Z or +/-HH:MM), return as-is
 * Otherwise append the default Brazil timezone offset
 * @param {string} datetime - ISO datetime string
 * @returns {string} - ISO datetime with timezone
 */
const ensureTimezone = (datetime) => {
    if (!datetime) return datetime;
    // Already has timezone (Z for UTC or +/- offset)
    if (/Z$|[+-]\d{2}:\d{2}$/.test(datetime)) return datetime;
    // Append Brazil timezone
    return datetime + TIMEZONE_OFFSET;
};

/**
 * Initialize Google Calendar service with Socket.IO
 * @param {object} io - Socket.IO instance
 */
export const initGoogleCalendarService = (io) => {
    socketIO = io;
    console.log('📅 Google Calendar Service initialized');
};

/**
 * Validate if a connected account is healthy and can execute operations
 * This prevents connection issues after server restart
 * @param {string} connectionId - The connected account ID
 * @param {string} entityId - The entity ID (userId/email)
 * @returns {Promise<{valid: boolean, reason?: string, error?: string}>}
 */
const validateConnectionHealth = async (connectionId, entityId) => {
    try {
        // Try to execute a simple operation to validate the connection
        // Composio REQUIRES entityId (error 1811) when using connectedAccountId
        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_LIST',
            {
                connectedAccountId: connectionId,
                userId: entityId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    max_results: 1,
                    time_min: new Date().toISOString()
                }
            }
        );

        // If we get here without error, connection is healthy
        return { valid: result.successful !== false };
    } catch (error) {
        // Serialize the entire error to search for entity mismatch indicators
        const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
        const errorMessage = error.message || '';
        const errorCause = error.cause?.message || '';
        const errorCode = error.code || '';
        const statusCode = error.statusCode || 0;

        // Check for entity ID mismatch error (code 1812)
        // Can appear in various places in the error structure
        const isEntityMismatch =
            errorString.includes('1812') ||
            errorString.includes('entity id does not match') ||
            errorString.includes('EntityIdMismatch') ||
            errorString.includes('ConnectedAccountEntityIdMismatch') ||
            (statusCode === 400 && errorString.includes('entity'));

        // Log full error for debugging
        console.warn(`⚠️ Connection health check failed: ${errorMessage}`);
        console.warn(`   Error cause: ${JSON.stringify(error.cause, Object.getOwnPropertyNames(error.cause || {}))}`);
        console.warn(`   Error code: ${error.code || 'none'}, statusCode: ${error.statusCode || 'none'}`);

        if (isEntityMismatch) {
            console.warn(`   >>> Detected as Entity ID mismatch`);
        }

        return {
            valid: false,
            reason: isEntityMismatch ? 'entity_mismatch' : 'unknown',
            error: errorMessage
        };
    }
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
                redirectUrl: `${process.env.FRONTEND_URL}/calendar-callback`
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
 * @param {boolean} skipHealthCheck - Skip health validation (use for internal calls to avoid loops)
 * @returns {Promise<{isConnected: boolean, email?: string, connectionId?: string, needsReconnection?: boolean}>}
 */
export const getConnectionStatus = async (userId, skipHealthCheck = false) => {
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

        // Log entity ID comparison for debugging
        console.log(`📅 Found active account for ${userId}:`);
        console.log(`   - connectionId: ${activeAccount.id}`);
        console.log(`   - entityId from Composio: ${activeAccount.entityId || 'NOT SET'}`);
        console.log(`   - userId we're using: ${userId}`);

        // Validate connection health (unless skipped to prevent loops)
        if (!skipHealthCheck) {
            const health = await validateConnectionHealth(activeAccount.id, userId);

            if (!health.valid) {
                console.warn(`⚠️ Calendar connection invalid for ${userId}: ${health.reason || health.error}`);

                // If entity mismatch, auto-disconnect the invalid connection
                if (health.reason === 'entity_mismatch') {
                    console.log(`🔄 Auto-disconnecting invalid Google Calendar connection for ${userId}`);
                    try {
                        await composio.connectedAccounts.delete(activeAccount.id);
                        console.log(`✅ Invalid connection removed. User needs to reconnect.`);
                    } catch (deleteError) {
                        console.warn(`Could not delete invalid connection: ${deleteError.message}`);
                    }
                }

                return {
                    isConnected: false,
                    needsReconnection: true,
                    reason: health.reason || 'connection_invalid'
                };
            }
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
        const status = await getConnectionStatus(userId, true);

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
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        const normalizedTimeMin = timeMin ? ensureTimezone(timeMin) : new Date().toISOString();

        const params = {
            max_results: maxResults,
            time_min: normalizedTimeMin,
            single_events: true,
            order_by: 'startTime',
            time_zone: DEFAULT_TIMEZONE,
            timezone: DEFAULT_TIMEZONE
        };

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_LIST',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: params
            }
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
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        const params = {
            summary: eventData.summary || eventData.title,
            description: eventData.description || '',
            start_datetime: ensureTimezone(eventData.start || eventData.startDateTime),
            end_datetime: ensureTimezone(eventData.end || eventData.endDateTime),
            attendees: eventData.attendees || [],
            location: eventData.location || '',
            time_zone: DEFAULT_TIMEZONE,
            timezone: DEFAULT_TIMEZONE
        };

        console.log(`📅 Creating event: "${params.summary}" for ${userId}`);

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_CREATE_EVENT',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: params
            }
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
    const status = await getConnectionStatus(userId, true);
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
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    time_min: startOfDay.toISOString(),
                    time_max: endOfDay.toISOString(),
                    duration_minutes: durationMinutes
                }
            }
        );

        return result.successful
            ? { success: true, slots: result.data || [] }
            : { success: false, error: result.error || 'Failed to find available slots' };
    } catch (error) {
        console.error('Google Calendar Find Slots Error:', error.message);
        return { success: false, error: error.message };
    }
};

// ============================================
// BUSINESS HOURS VALIDATION HELPERS
// ============================================

/**
 * Map day of week (0-6, Sunday=0) to Portuguese day key
 */
const DAY_MAP = {
    0: 'dom',
    1: 'seg',
    2: 'ter',
    3: 'qua',
    4: 'qui',
    5: 'sex',
    6: 'sab'
};

const DAY_NAMES = {
    'seg': 'Segunda-feira',
    'ter': 'Terça-feira',
    'qua': 'Quarta-feira',
    'qui': 'Quinta-feira',
    'sex': 'Sexta-feira',
    'sab': 'Sábado',
    'dom': 'Domingo'
};

/**
 * Format business hours for display in function descriptions
 */
const formatBusinessHoursForDescription = (businessHours) => {
    if (!businessHours) return null;

    const lines = [];
    Object.entries(DAY_NAMES).forEach(([key, name]) => {
        const day = businessHours[key];
        if (day?.enabled && day.slots?.length > 0) {
            const slots = day.slots.map(s => `${s.start}-${s.end}`).join(', ');
            lines.push(`- ${name}: ${slots}`);
        }
    });

    return lines.length > 0 ? lines.join('\n') : null;
};

/**
 * Get time string (HH:MM) from Date object
 */
const getTimeString = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Validate if an event falls within business hours
 * @param {string} startDateTime - ISO datetime string
 * @param {string} endDateTime - ISO datetime string  
 * @param {object} businessHours - Business hours JSON
 * @returns {{valid: boolean, message?: string, availableSlots?: string}}
 */
const validateEventAgainstBusinessHours = (startDateTime, endDateTime, businessHours) => {
    if (!businessHours) {
        return { valid: true }; // No restrictions if no business hours set
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const dayKey = DAY_MAP[start.getDay()];
    const daySchedule = businessHours[dayKey];
    const dayName = DAY_NAMES[dayKey];

    // Check if day is enabled
    if (!daySchedule?.enabled) {
        // Find next available day
        const availableDays = Object.entries(businessHours)
            .filter(([_, day]) => day?.enabled && day.slots?.length > 0)
            .map(([key, _]) => DAY_NAMES[key])
            .join(', ');

        return {
            valid: false,
            message: `❌ Não é possível agendar: O estabelecimento não funciona em ${dayName}.`,
            availableSlots: `Dias disponíveis: ${availableDays || 'Nenhum dia configurado'}`
        };
    }

    // Check if time is within any slot
    const startTime = getTimeString(start);
    const endTime = getTimeString(end);

    const isWithinSlots = daySchedule.slots.some(slot => {
        return startTime >= slot.start && endTime <= slot.end;
    });

    if (!isWithinSlots) {
        const availableSlots = daySchedule.slots
            .map(s => `${s.start}-${s.end}`)
            .join(', ');

        return {
            valid: false,
            message: `❌ Horário fora do funcionamento. Em ${dayName}, o horário solicitado (${startTime}-${endTime}) não está dentro dos horários disponíveis.`,
            availableSlots: `Horários disponíveis em ${dayName}: ${availableSlots}`
        };
    }

    return { valid: true };
};

/**
 * Get function declarations for Gemini Function Calling
 * These are the tools the AI agent can use when Google Calendar is connected
 * @param {object|null} businessContext - Optional business context with hours, serviceType, address
 */
export const getCalendarFunctionDeclarations = (businessContext = null) => {
    // Format business hours for injection into descriptions
    const hoursDescription = businessContext?.businessHours
        ? formatBusinessHoursForDescription(businessContext.businessHours)
        : null;

    const serviceTypeInfo = businessContext?.serviceType === 'presencial' && businessContext?.businessAddress
        ? `\nLocal: ${businessContext.businessAddress}`
        : businessContext?.serviceType === 'online'
            ? '\nAtendimento 100% Online'
            : '';

    const hoursRestriction = hoursDescription
        ? `\n\n⚠️ RESTRIÇÃO OBRIGATÓRIA - Horários de Funcionamento:\n${hoursDescription}${serviceTypeInfo}\n\nNÃO agende eventos fora destes horários. O sistema irá rejeitar automaticamente.`
        : '';

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
            description: `Cria um novo evento/compromisso no calendário. Use quando o cliente quiser agendar uma reunião, consulta ou compromisso.${hoursRestriction}`,
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
            description: `Encontra horários disponíveis no calendário para agendamento. Use quando o cliente perguntar sobre disponibilidade.${hoursRestriction ? '\n\nConsidere APENAS os horários de funcionamento ao sugerir disponibilidade.' : ''}`,
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
 * @param {object|null} businessContext - Optional business context for validation
 * @returns {Promise<{success: boolean, result?: any, error?: string}>}
 */
export const executeCalendarFunction = async (functionName, args, userId, businessContext = null) => {
    console.log(`📅 Executing calendar function: ${functionName}`, args);

    switch (functionName) {
        case 'list_calendar_events':
            return await listEvents(userId, args.max_results || 10);

        case 'create_calendar_event':
            // Validate against business hours BEFORE creating event
            if (businessContext?.businessHours) {
                const validation = validateEventAgainstBusinessHours(
                    args.start_datetime,
                    args.end_datetime,
                    businessContext.businessHours
                );

                if (!validation.valid) {
                    console.log(`⛔ Event rejected - outside business hours:`, validation);
                    return {
                        success: false,
                        error: validation.message,
                        suggestion: validation.availableSlots,
                        rejectedByBusinessHours: true
                    };
                }
            }

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

// ============================================
// SCHEDULING APPOINTMENT FUNCTIONS
// ============================================

/**
 * Check if a specific time slot is available in the calendar
 * @param {string} userId - User's email
 * @param {string} startDateTime - ISO datetime string
 * @param {string} endDateTime - ISO datetime string
 * @returns {Promise<{available: boolean, conflictingEvents?: Array}>}
 */
export const checkTimeSlotAvailability = async (userId, startDateTime, endDateTime) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { available: false, error: 'Google Calendar not connected' };
    }

    // Ensure timezone on input datetimes
    const normalizedStart = ensureTimezone(startDateTime);
    const normalizedEnd = ensureTimezone(endDateTime);

    console.log(`🔍 Checking availability: ${normalizedStart} to ${normalizedEnd}`);

    try {
        // List events in the requested time range
        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_LIST',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    time_min: normalizedStart,
                    time_max: normalizedEnd,
                    max_results: 10,
                    single_events: true,
                    order_by: 'startTime',
                    time_zone: DEFAULT_TIMEZONE,
                    timezone: DEFAULT_TIMEZONE
                }
            }
        );

        if (!result.successful) {
            console.error('❌ Failed to list events:', result.error);
            return { available: false, error: result.error || 'Failed to check availability' };
        }

        const events = result.data?.items || result.data || [];
        console.log(`📅 Found ${events.length} events in time range`);

        // Log each event found for debugging
        events.forEach((event, idx) => {
            console.log(`   Event ${idx + 1}: "${event.summary}" from ${event.start?.dateTime || event.start?.date} to ${event.end?.dateTime || event.end?.date}`);
        });

        // Filter out transparent (free) events and check for actual conflicts
        const conflictingEvents = events.filter(event => {
            // Skip if event shows as "free" (transparent)
            if (event.transparency === 'transparent') {
                console.log(`   ↳ Skipping "${event.summary}" - marked as free`);
                return false;
            }

            // Check if the event actually overlaps with requested slot
            const eventStart = new Date(event.start?.dateTime || event.start?.date);
            const eventEnd = new Date(event.end?.dateTime || event.end?.date);
            const reqStart = new Date(normalizedStart);
            const reqEnd = new Date(normalizedEnd);

            const overlaps = reqStart < eventEnd && reqEnd > eventStart;
            if (overlaps) {
                console.log(`   ⚠️ CONFLICT: "${event.summary}" overlaps with requested slot`);
            }
            return overlaps;
        });

        console.log(`🔍 Availability result: ${conflictingEvents.length === 0 ? '✅ AVAILABLE' : '❌ CONFLICT DETECTED'}`);

        return {
            available: conflictingEvents.length === 0,
            conflictingEvents: conflictingEvents
        };
    } catch (error) {
        console.error('Calendar availability check error:', error.message);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        return { available: false, error: error.message };
    }
};

/**
 * Find up to 3 alternative time slots closest to the requested time
 * @param {string} userId - User's email
 * @param {string} requestedDateTime - ISO datetime that was unavailable
 * @param {object} businessHours - User's business hours configuration
 * @param {number} durationMinutes - Duration of appointment in minutes
 * @returns {Promise<{success: boolean, suggestions: Array}>}
 */
export const findAlternativeSlots = async (userId, requestedDateTime, businessHours, durationMinutes = 60) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected', suggestions: [] };
    }

    try {
        const requestedDate = new Date(requestedDateTime);
        const suggestions = [];

        // Search for slots in the next 7 days
        for (let dayOffset = 0; dayOffset < 7 && suggestions.length < 3; dayOffset++) {
            const searchDate = new Date(requestedDate);
            searchDate.setDate(searchDate.getDate() + dayOffset);

            const dayKey = DAY_MAP[searchDate.getDay()];
            const daySchedule = businessHours?.[dayKey];

            // Skip if day is not enabled in business hours
            if (!daySchedule?.enabled || !daySchedule.slots?.length) continue;

            // For each slot in the day's schedule
            for (const slot of daySchedule.slots) {
                if (suggestions.length >= 3) break;

                // Parse slot times
                const [startHour, startMin] = slot.start.split(':').map(Number);
                const [endHour, endMin] = slot.end.split(':').map(Number);

                // Create potential start times every 30 minutes within this slot
                let currentStart = new Date(searchDate);
                currentStart.setHours(startHour, startMin, 0, 0);

                const slotEnd = new Date(searchDate);
                slotEnd.setHours(endHour, endMin, 0, 0);

                while (currentStart.getTime() + (durationMinutes * 60 * 1000) <= slotEnd.getTime()) {
                    if (suggestions.length >= 3) break;

                    const potentialStart = currentStart.toISOString();
                    const potentialEnd = new Date(currentStart.getTime() + (durationMinutes * 60 * 1000)).toISOString();

                    // Skip if this is the same time as the original request (on day 0)
                    if (dayOffset === 0) {
                        const reqTime = new Date(requestedDateTime);
                        if (currentStart.getHours() === reqTime.getHours() &&
                            currentStart.getMinutes() === reqTime.getMinutes()) {
                            currentStart.setMinutes(currentStart.getMinutes() + 30);
                            continue;
                        }
                    }

                    // Skip past times
                    if (currentStart < new Date()) {
                        currentStart.setMinutes(currentStart.getMinutes() + 30);
                        continue;
                    }

                    // Check if this slot is available
                    const availability = await checkTimeSlotAvailability(userId, potentialStart, potentialEnd);

                    if (availability.available) {
                        const dayName = DAY_NAMES[dayKey];
                        const formattedDate = currentStart.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit'
                        });
                        const formattedTime = currentStart.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        suggestions.push({
                            start: potentialStart,
                            end: potentialEnd,
                            formatted: `${dayName}, ${formattedDate} às ${formattedTime}`
                        });
                    }

                    currentStart.setMinutes(currentStart.getMinutes() + 30);
                }
            }
        }

        return { success: true, suggestions };
    } catch (error) {
        console.error('Find alternative slots error:', error.message);
        return { success: false, error: error.message, suggestions: [] };
    }
};

/**
 * List ALL available time slots for a specific day
 * This function calculates slots based on business hours, existing events, and appointment duration
 * @param {string} userId - User's email
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} durationMinutes - Duration of appointments in minutes
 * @param {object} businessHours - User's business hours configuration
 * @param {string} period - Optional period filter: 'morning', 'afternoon', 'evening', or 'all'
 * @returns {Promise<{success: boolean, slots?: Array, error?: string}>}
 */
export const listAvailableSlotsForDay = async (userId, date, durationMinutes = 60, businessHours = null, period = 'all') => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected', slots: [] };
    }

    try {
        const targetDate = new Date(date + 'T00:00:00');
        const dayKey = DAY_MAP[targetDate.getDay()];
        const daySchedule = businessHours?.[dayKey];

        // Check if business is open on this day
        if (businessHours && (!daySchedule?.enabled || !daySchedule.slots?.length)) {
            return {
                success: true,
                slots: [],
                message: `Não há expediente neste dia (${DAY_NAMES[dayKey]})`
            };
        }

        // Get business hours for the day (or use default 9-18 if not configured)
        const businessSlots = daySchedule?.slots || [{ start: '09:00', end: '18:00' }];

        // Get all events for the day
        const startOfDay = new Date(date + 'T00:00:00-03:00');
        const endOfDay = new Date(date + 'T23:59:59-03:00');

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_LIST',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    time_min: startOfDay.toISOString(),
                    time_max: endOfDay.toISOString(),
                    max_results: 50,
                    single_events: true,
                    order_by: 'startTime',
                    time_zone: DEFAULT_TIMEZONE,
                    timezone: DEFAULT_TIMEZONE
                }
            }
        );

        // Get existing events
        const existingEvents = (result.successful ? (result.data?.items || result.data || []) : [])
            .filter(e => e.transparency !== 'transparent')
            .map(e => ({
                start: new Date(e.start?.dateTime || e.start?.date),
                end: new Date(e.end?.dateTime || e.end?.date)
            }));

        console.log(`📅 Found ${existingEvents.length} events on ${date}`);

        // Calculate available slots
        const availableSlots = [];
        const now = new Date();
        const minAdvanceMs = 2 * 60 * 60 * 1000; // 2 hours minimum

        // Period filters
        const periodRanges = {
            'morning': { start: 0, end: 12 },
            'afternoon': { start: 12, end: 18 },
            'evening': { start: 18, end: 24 },
            'all': { start: 0, end: 24 }
        };
        const periodFilter = periodRanges[period] || periodRanges['all'];

        for (const slot of businessSlots) {
            const [openHour, openMin] = slot.start.split(':').map(Number);
            const [closeHour, closeMin] = slot.end.split(':').map(Number);

            // Start from opening time and increment by duration
            let currentStart = new Date(targetDate);
            currentStart.setHours(openHour, openMin, 0, 0);

            // slotEnd represents the CLOSING TIME - appointments can END at this time
            // So a slot starting at 17:00 with 60min duration ending at 18:00 is valid if close is 18:00
            const slotEnd = new Date(targetDate);
            slotEnd.setHours(closeHour, closeMin, 0, 0);

            console.log(`   📅 Checking slot ${slot.start}-${slot.end}: slotEnd=${slotEnd.toISOString()}`);

            // Use <= to include appointments that END exactly at closing time
            // Example: if closing is 18:00 and duration is 60min, 17:00 start is valid (ends at 18:00)
            while (currentStart.getTime() + durationMinutes * 60000 <= slotEnd.getTime()) {
                const currentEnd = new Date(currentStart.getTime() + durationMinutes * 60000);
                const hour = currentStart.getHours();

                // Check period filter
                if (hour < periodFilter.start || hour >= periodFilter.end) {
                    currentStart = new Date(currentStart.getTime() + durationMinutes * 60000);
                    continue;
                }

                // Check minimum advance time
                if (currentStart.getTime() < now.getTime() + minAdvanceMs) {
                    currentStart = new Date(currentStart.getTime() + durationMinutes * 60000);
                    continue;
                }

                // Check for conflicts with existing events
                const hasConflict = existingEvents.some(event =>
                    currentStart < event.end && currentEnd > event.start
                );

                if (!hasConflict) {
                    const timeStr = currentStart.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                    availableSlots.push({
                        start: currentStart.toISOString(),
                        end: currentEnd.toISOString(),
                        time: timeStr,
                        formatted: `${timeStr}`
                    });
                }

                currentStart = new Date(currentStart.getTime() + durationMinutes * 60000);
            }
        }

        console.log(`✅ Found ${availableSlots.length} available slots on ${date}`);

        // Format date for display
        const dayName = DAY_NAMES[dayKey];
        const formattedDate = targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        return {
            success: true,
            slots: availableSlots,
            dayName,
            formattedDate,
            totalSlots: availableSlots.length,
            durationMinutes
        };
    } catch (error) {
        console.error('List available slots error:', error.message);
        return { success: false, error: error.message, slots: [] };
    }
};

/**
 * Create a calendar event with optional Google Meet link
 * @param {string} userId - User's email
 * @param {object} eventData - Event details
 * @param {boolean} createMeetLink - Whether to create a Google Meet link
 * @param {number} durationMinutes - Duration of the event in minutes (default 60)
 * @returns {Promise<{success: boolean, event?: object, meetLink?: string, error?: string}>}
 */
export const createEventWithMeet = async (userId, eventData, createMeetLink = false, durationMinutes = 60) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        // Calculate hours and remaining minutes from total duration
        const durationHours = Math.floor(durationMinutes / 60);
        const durationMins = durationMinutes % 60;

        // Use Composio's expected parameters:
        // - start_datetime + event_duration_hour + event_duration_minutes (NOT end_datetime)
        // - create_meeting_room (NOT create_video_conference)
        const params = {
            summary: eventData.summary || eventData.title,
            description: eventData.description || '',
            start_datetime: eventData.start || eventData.startDateTime,
            // Explicitly set duration - Composio defaults to 30 min if not provided!
            event_duration_hour: durationHours,
            event_duration_minutes: durationMins,
            attendees: eventData.attendees || [],  // Composio expects array of email strings, not objects
            location: eventData.location || '',
            timezone: DEFAULT_TIMEZONE,
            // EXPLICITLY control Meet link creation - default is True in Composio!
            create_meeting_room: createMeetLink
        };

        console.log(`📅 Creating event: "${params.summary}" for ${userId}`);
        console.log(`   Duration: ${durationHours}h ${durationMins}min, Meet: ${createMeetLink}`);

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_CREATE_EVENT',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: params
            }
        );

        if (result.successful) {
            const eventData = result.data;
            // Google Calendar returns hangoutLink or conferenceData
            const meetLink = eventData?.hangoutLink || eventData?.conferenceData?.entryPoints?.[0]?.uri;

            console.log(`✅ Event created: ${eventData?.id || 'success'}. Meet Link: ${meetLink || 'none'}`);

            return {
                success: true,
                event: eventData,
                meetLink: meetLink || null
            };
        } else {
            console.error('❌ Event creation failed:', result.error);
            return { success: false, error: result.error || 'Failed to create event' };
        }
    } catch (error) {
        console.error('Create event with Meet error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Main function to schedule an appointment with full validation
 * This is the unified endpoint that:
 * 1. Validates against business hours
 * 2. Checks calendar availability
 * 3. Suggests alternatives if unavailable
 * 4. Creates the event with Meet link or returns address
 * 
 * @param {string} userId - User's email (calendar owner)
 * @param {object} appointmentData - Appointment details
 * @param {string} appointmentData.customerName - Customer's name
 * @param {string} appointmentData.customerEmail - Customer's email
 * @param {string} appointmentData.requestedStart - ISO datetime start
 * @param {string} appointmentData.requestedEnd - ISO datetime end
 * @param {string} appointmentData.description - Optional description
 * @param {object} businessContext - Business context (hours, type, address)
 * @returns {Promise<object>} - Result with success, meetLink/address, or suggestions
 */
export const scheduleAppointment = async (userId, appointmentData, businessContext) => {
    console.log(`📅 Scheduling appointment for ${appointmentData.customerName} (${appointmentData.customerEmail})`);

    const { customerName, customerEmail, description } = appointmentData;
    const { businessHours, serviceType, businessAddress, appointmentDuration } = businessContext || {};

    // Use appointment duration from business context (defaults to 60 min)
    const durationMinutes = appointmentDuration || 60;

    // Ensure datetimes have timezone offset (Brazil -03:00)
    const requestedStart = ensureTimezone(appointmentData.requestedStart);

    // Calculate end time based on start + duration (for logging and other uses)
    const startDate = new Date(requestedStart);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const requestedEnd = endDate.toISOString();

    console.log(`   Start: ${requestedStart}, Duration: ${durationMinutes}min`);

    // Step 0: Validate minimum advance time (2 hours)
    const now = new Date();
    const minAdvanceMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const minValidTime = new Date(now.getTime() + minAdvanceMs);

    if (startDate < minValidTime) {
        const minTimeFormatted = minValidTime.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        console.log(`⛔ Appointment rejected - less than 2 hours advance`);
        return {
            success: false,
            reason: 'insufficient_advance_time',
            message: `O horário solicitado é muito próximo. É necessário agendar com pelo menos 2 horas de antecedência. O horário mínimo disponível agora é ${minTimeFormatted}.`
        };
    }

    // Step 1: Validate against business hours
    if (businessHours) {
        const validation = validateEventAgainstBusinessHours(requestedStart, requestedEnd, businessHours);

        if (!validation.valid) {
            console.log(`⛔ Appointment rejected - outside business hours`);

            // Format business hours for display
            const formattedHours = formatBusinessHoursForDescription(businessHours);

            return {
                success: false,
                reason: 'outside_business_hours',
                message: validation.message,
                formattedHours: formattedHours,
                businessHours: businessHours
            };
        }
    }

    // Step 2: Check calendar availability
    const availability = await checkTimeSlotAvailability(userId, requestedStart, requestedEnd);

    if (!availability.available) {
        if (availability.error) {
            return {
                success: false,
                reason: 'calendar_error',
                message: availability.error
            };
        }

        console.log(`⛔ Appointment rejected - calendar conflict`);

        // Find 3 alternative slots
        const alternatives = await findAlternativeSlots(userId, requestedStart, businessHours, durationMinutes);

        return {
            success: false,
            reason: 'calendar_conflict',
            message: 'O horário solicitado não está disponível.',
            suggestions: alternatives.suggestions
        };
    }

    // Step 3: Create the event
    const isOnline = serviceType === 'online';
    // Use description (service type) as title prefix, fallback to "Agendamento" if empty
    const eventTitle = description ? `${description} - ${customerName}` : `Agendamento - ${customerName}`;
    const eventResult = await createEventWithMeet(userId, {
        summary: eventTitle,
        description: `Agendamento com ${customerName} (${customerEmail})${description ? ` - Serviço: ${description}` : ''}`,
        start: requestedStart,
        attendees: [customerEmail],
        location: isOnline ? '' : (businessAddress || '')
    }, isOnline, durationMinutes);

    if (!eventResult.success) {
        return {
            success: false,
            reason: 'creation_error',
            message: eventResult.error
        };
    }

    console.log(`✅ Appointment scheduled successfully. isOnline: ${isOnline}, Link: ${eventResult.meetLink}`);

    // Return success with appropriate link/address based on serviceType
    // Only include meetLink for online appointments to avoid confusion
    const result = {
        success: true,
        event: eventResult.event,
        customerName,
        customerEmail,
        startTime: requestedStart,
        endTime: requestedEnd,
        // Only include meetLink for online appointments
        meetLink: isOnline ? (eventResult.meetLink || null) : null,
        // Only include address for presencial appointments
        address: !isOnline ? (businessAddress || null) : null
    };

    return result;
};

/**
 * Find events by customer email (attendee)
 * @param {string} userId - User's email (calendar owner)
 * @param {string} customerEmail - Customer email to search for
 * @param {string} [fromDate] - Optional start date to search from (defaults to today)
 * @returns {Promise<{success: boolean, events?: Array, error?: string}>}
 */
export const findEventsByCustomerEmail = async (userId, customerEmail, fromDate = null) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        const searchFrom = fromDate
            ? ensureTimezone(fromDate)
            : new Date().toISOString();

        // Get events from now onwards
        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_LIST',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    time_min: searchFrom,
                    max_results: 50,
                    single_events: true,
                    order_by: 'startTime',
                    time_zone: DEFAULT_TIMEZONE,
                    timezone: DEFAULT_TIMEZONE
                }
            }
        );

        if (!result.successful) {
            return { success: false, error: result.error || 'Failed to list events' };
        }

        const allEvents = result.data?.items || result.data || [];

        // Filter events that have the customer email as an attendee
        const customerEvents = allEvents.filter(event => {
            const attendees = event.attendees || [];
            return attendees.some(att =>
                att.email?.toLowerCase() === customerEmail.toLowerCase()
            );
        });

        console.log(`📅 Found ${customerEvents.length} events for customer ${customerEmail}`);

        return {
            success: true,
            events: customerEvents.map(e => ({
                id: e.id,
                summary: e.summary,
                start: e.start?.dateTime || e.start?.date,
                end: e.end?.dateTime || e.end?.date,
                status: e.status,
                meetLink: e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri
            }))
        };
    } catch (error) {
        console.error('Find events by customer error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a calendar event
 * @param {string} userId - User's email (calendar owner)
 * @param {string} eventId - ID of the event to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteEvent = async (userId, eventId) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        console.log(`🗑️ Deleting event ${eventId} for ${userId}`);

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_DELETE_EVENT',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    event_id: eventId
                }
            }
        );

        if (result.successful) {
            console.log(`✅ Event ${eventId} deleted successfully`);
            return { success: true };
        } else {
            console.error('❌ Failed to delete event:', result.error);
            return { success: false, error: result.error || 'Failed to delete event' };
        }
    } catch (error) {
        console.error('Delete event error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Cancel an appointment (delete from calendar)
 * @param {string} userId - User's email (calendar owner)
 * @param {string} eventId - ID of the event to cancel
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const cancelAppointment = async (userId, eventId) => {
    if (!userId || !eventId) {
        return { success: false, error: 'userId and eventId are required' };
    }

    console.log(`📅 Cancel appointment request: event ${eventId} for user ${userId}`);

    const deleteResult = await deleteEvent(userId, eventId);

    if (!deleteResult.success) {
        return {
            success: false,
            reason: 'delete_error',
            error: deleteResult.error
        };
    }

    return {
        success: true,
        message: 'Agendamento cancelado com sucesso.'
    };
};

/**
 * Get a single event by ID
 * Uses EVENTS_LIST with a wide time range and filters by eventId
 * @param {string} userId - User's email (calendar owner)
 * @param {string} eventId - ID of the event to fetch
 * @returns {Promise<{success: boolean, event?: object, error?: string}>}
 */
export const getEventById = async (userId, eventId) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_GET',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    event_id: eventId
                }
            }
        );

        if (result.successful && result.data) {
            console.log(`✅ Found event by ID: ${eventId} - "${result.data?.summary}"`);
            return { success: true, event: result.data };
        } else {
            console.log(`❌ Event not found by ID: ${eventId}`);
            return { success: false, error: result.error || 'Event not found' };
        }
    } catch (error) {
        console.error('Get event by ID error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Update an existing calendar event
 * @param {string} userId - User's email (calendar owner)
 * @param {string} eventId - ID of the event to update
 * @param {object} updateData - New data for the event
 * @param {number} durationMinutes - Duration of the event in minutes (required for Composio)
 * @param {boolean} createMeetLink - Whether to keep/create Google Meet link
 * @returns {Promise<{success: boolean, event?: object, meetLink?: string, error?: string}>}
 */
export const updateEvent = async (userId, eventId, updateData, durationMinutes = 60, createMeetLink = false) => {
    const status = await getConnectionStatus(userId, true);
    if (!status.isConnected) {
        return { success: false, error: 'Google Calendar not connected' };
    }

    try {
        // Calculate hours and remaining minutes from total duration
        const durationHours = Math.floor(durationMinutes / 60);
        const durationMins = durationMinutes % 60;

        // Use Composio's expected parameters for UPDATE_EVENT
        const params = {
            event_id: eventId,
            timezone: DEFAULT_TIMEZONE,
            // Use duration instead of end_datetime
            event_duration_hour: durationHours,
            event_duration_minutes: durationMins,
            // Control Meet link explicitly
            create_meeting_room: createMeetLink
        };

        // Only include fields that are provided
        if (updateData.summary) params.summary = updateData.summary;
        if (updateData.description) params.description = updateData.description;
        if (updateData.start) params.start_datetime = ensureTimezone(updateData.start);
        if (updateData.location !== undefined) params.location = updateData.location;

        console.log(`📅 Updating event ${eventId} for ${userId}`);
        console.log(`   Duration: ${durationHours}h ${durationMins}min, Meet: ${createMeetLink}`);

        const result = await composio.tools.execute(
            'GOOGLECALENDAR_UPDATE_EVENT',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: params
            }
        );

        if (result.successful) {
            const eventData = result.data;
            const meetLink = eventData?.hangoutLink || eventData?.conferenceData?.entryPoints?.[0]?.uri;

            console.log(`✅ Event updated: ${eventId}. Meet Link: ${meetLink || 'none'}`);

            return {
                success: true,
                event: eventData,
                meetLink: meetLink || null
            };
        } else {
            console.error('❌ Event update failed:', result.error);
            return { success: false, error: result.error || 'Failed to update event' };
        }
    } catch (error) {
        console.error('Update event error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Reschedule an existing appointment
 * Preserves ALL original event data (summary, description, attendees) and only changes the date/time
 * The duration is automatically calculated from the original event
 * @param {string} userId - User's email (calendar owner)
 * @param {string} eventId - ID of the event to reschedule
 * @param {string} newStart - New start datetime (ISO format)
 * @param {string} newEnd - New end datetime (ISO format) - if not provided, uses original duration
 * @param {object} businessContext - Business context (businessHours, serviceType, businessAddress)
 * @returns {Promise<{success: boolean, event?: object, meetLink?: string, address?: string, error?: string, reason?: string}>}
 */
export const rescheduleAppointment = async (userId, eventId, newStart, newEnd, businessContext) => {
    const { businessHours, serviceType, businessAddress } = businessContext || {};
    const isOnline = serviceType === 'online';

    // 1. FIRST: Fetch the existing event to get its duration and data
    const existingEvent = await getEventById(userId, eventId);
    if (!existingEvent.success || !existingEvent.event) {
        return {
            success: false,
            reason: 'event_not_found',
            message: 'Não foi possível encontrar o agendamento original.'
        };
    }

    const originalEvent = existingEvent.event;
    console.log(`📅 Original event data:`, {
        summary: originalEvent.summary,
        description: originalEvent.description,
        start: originalEvent.start?.dateTime || originalEvent.start,
        end: originalEvent.end?.dateTime || originalEvent.end,
        attendees: originalEvent.attendees?.map(a => a.email),
        location: originalEvent.location
    });


    // Use appointmentDuration from businessContext (user's configured duration)
    const appointmentDuration = businessContext?.appointmentDuration || 60;
    const appointmentDurationMs = appointmentDuration * 60 * 1000;
    console.log(`   Using configured appointment duration: ${appointmentDuration} minutes`);

    // Normalize timezone for newStart
    const normalizedStart = ensureTimezone(newStart);
    const startDate = new Date(normalizedStart);

    // Calculate newEnd based on appointmentDuration (or use provided newEnd if available)
    let normalizedEnd;
    if (newEnd) {
        normalizedEnd = ensureTimezone(newEnd);
    } else {
        // Use configured appointment duration
        const calculatedEnd = new Date(startDate.getTime() + appointmentDurationMs);
        normalizedEnd = calculatedEnd.toISOString();
        console.log(`   Calculated new end based on configured duration: ${normalizedEnd}`);
    }

    // 2. Validate minimum advance time (2 hours)
    const now = new Date();
    const minAdvanceMs = 2 * 60 * 60 * 1000; // 2 hours
    const minValidTime = new Date(now.getTime() + minAdvanceMs);

    if (startDate < minValidTime) {
        const minTimeFormatted = minValidTime.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        console.log(`⛔ Reschedule rejected - less than 2 hours advance`);
        return {
            success: false,
            reason: 'insufficient_advance_time',
            message: `O horário solicitado é muito próximo. É necessário reagendar com pelo menos 2 horas de antecedência. O horário mínimo disponível agora é ${minTimeFormatted}.`
        };
    }

    // 1. Validate business hours
    if (businessHours) {
        const isWithinHours = isWithinBusinessHours(normalizedStart, normalizedEnd, businessHours);
        if (!isWithinHours.valid) {
            const formattedHours = formatBusinessHoursForDisplay(businessHours);
            return {
                success: false,
                reason: 'outside_business_hours',
                message: `O horário solicitado (${new Date(normalizedStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}) está fora do horário de funcionamento.`,
                formattedHours
            };
        }
    }

    // 2. Check if new time slot is available (excluding the event being rescheduled)
    const availability = await checkTimeSlotAvailability(userId, normalizedStart, normalizedEnd);

    // Filter out the event being rescheduled from conflicts
    const realConflicts = (availability.conflictingEvents || []).filter(e => e.id !== eventId);

    if (realConflicts.length > 0) {
        // Find alternatives
        const alternatives = await findAlternativeSlots(
            userId,
            normalizedStart,
            businessHours,
            Math.round((new Date(normalizedEnd) - new Date(normalizedStart)) / 60000)
        );

        return {
            success: false,
            reason: 'calendar_conflict',
            message: 'O novo horário solicitado não está disponível.',
            suggestions: alternatives.suggestions || []
        };
    }


    // Note: originalEvent already fetched at the beginning of the function

    // 4. Update the event preserving ALL original data
    const updateResult = await updateEvent(userId, eventId, {
        start: normalizedStart,
        // Preserve ALL original data
        summary: originalEvent.summary || originalEvent.title,
        description: originalEvent.description,
        location: isOnline ? '' : (businessAddress || originalEvent.location || '')
    }, appointmentDuration, isOnline);

    if (!updateResult.success) {
        return {
            success: false,
            reason: 'update_error',
            message: updateResult.error
        };
    }

    console.log(`✅ Appointment rescheduled: ${eventId} (isOnline: ${isOnline})`);

    // Return appropriate info based on serviceType
    return {
        success: true,
        event: updateResult.event,
        // Only return meetLink for ONLINE appointments
        meetLink: isOnline ? (updateResult.meetLink || null) : null,
        // Only return address for PRESENCIAL appointments
        address: !isOnline ? (businessAddress || null) : null,
        newStart: normalizedStart,
        newEnd: normalizedEnd,
        // Include original event info for context
        customerName: originalEvent.summary?.replace('Agendamento - ', '') || null
    };
};

/**
 * Check availability for a specific time and duration
 * Used by the AI Agent to validate before suggesting or confirming
 * @param {string} userId
 * @param {string} requestedDate - ISO format or just Date
 * @param {string} requestedTime - HH:mm
 * @param {number} durationMinutes
 * @param {object} businessHours
 * @returns {Promise<{available: boolean, reason?: string, message?: string, suggestions?: any[]}>}
 */
export const checkAvailability = async (userId, requestedDate, requestedTime, durationMinutes, businessHours) => {
    // Construct datetime objects
    let startDateTime;

    // If we received a full ISO string in requestedDate
    if (requestedDate.includes('T')) {
        startDateTime = ensureTimezone(requestedDate);
    } else {
        // Construct from date + time
        // Need to be careful with timezone here since we're constructing manual string
        // Assuming requestedDate is YYYY-MM-DD
        startDateTime = ensureTimezone(`${requestedDate}T${requestedTime}:00`);
    }

    const startDt = new Date(startDateTime);
    const endDt = new Date(startDt.getTime() + durationMinutes * 60000);
    const endDateTime = endDt.toISOString();

    // 0. Validate minimum advance time (2 hours)
    const now = new Date();
    const minAdvanceMs = 2 * 60 * 60 * 1000;
    const minValidTime = new Date(now.getTime() + minAdvanceMs);

    if (startDt < minValidTime) {
        return {
            available: false,
            reason: 'insufficient_advance_time',
            message: `Horário muito próximo (${startDateTime}). Necessário 2h de antecedência.`
        };
    }

    // 1. Validate Business Hours
    const isWithinHours = isWithinBusinessHours(startDateTime, endDateTime, businessHours);
    if (!isWithinHours.valid) {
        return {
            available: false,
            reason: 'outside_business_hours',
            message: 'Fora do horário de funcionamento.',
            formattedHours: formatBusinessHoursForDisplay(businessHours)
        };
    }

    // 2. Check Conflicts
    const availability = await checkTimeSlotAvailability(userId, startDateTime, endDateTime);

    if (!availability.available) {
        // Find alternatives
        const alternatives = await findAlternativeSlots(
            userId,
            startDateTime,
            businessHours,
            durationMinutes
        );

        return {
            available: false,
            reason: 'calendar_conflict',
            message: 'Horário indisponível devido a conflito.',
            suggestions: alternatives.suggestions || []
        };
    }

    return {
        available: true,
        message: 'Disponível'
    };
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Check if a time range is within business hours
 * Supports BOTH old format: { monday: { start: '09:00', end: '18:00', isOpen: true } }
 * AND new format: { seg: { enabled: true, slots: [{ start: '09:00', end: '18:00' }] } }
 * 
 * @param {string} startDateTime - ISO string
 * @param {string} endDateTime - ISO string
 * @param {object} businessHours - Business hours configuration
 * @returns {{ valid: boolean, reason?: string }}
 */
function isWithinBusinessHours(startDateTime, endDateTime, businessHours) {
    if (!businessHours) return { valid: true }; // If no hours defined, assume open

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Get day of week (0-6, Sunday=0) in America/Sao_Paulo
    const formatterDay = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: 'America/Sao_Paulo'
    });
    const dayNameEn = formatterDay.format(start).toLowerCase();

    // Map English day names to both formats
    const dayKeyMap = {
        'sunday': { old: 'sunday', new: 'dom' },
        'monday': { old: 'monday', new: 'seg' },
        'tuesday': { old: 'tuesday', new: 'ter' },
        'wednesday': { old: 'wednesday', new: 'qua' },
        'thursday': { old: 'thursday', new: 'qui' },
        'friday': { old: 'friday', new: 'sex' },
        'saturday': { old: 'saturday', new: 'sab' }
    };

    const keys = dayKeyMap[dayNameEn];
    if (!keys) return { valid: false, reason: 'invalid_day' };

    // Try new format first (seg, ter, etc with slots array)
    let daySettings = businessHours[keys.new];
    let isNewFormat = daySettings && Array.isArray(daySettings.slots);

    // Fall back to old format (monday, tuesday, etc with isOpen)
    if (!isNewFormat) {
        daySettings = businessHours[keys.old];
    }

    if (!daySettings) {
        return { valid: false, reason: 'closed_day' };
    }

    // Check if day is open
    const isOpen = isNewFormat ? daySettings.enabled : daySettings.isOpen;
    if (!isOpen) {
        return { valid: false, reason: 'closed_day' };
    }

    // Helper to get HH and MM in specific timezone
    const getParts = (date) => {
        const fmt = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            timeZone: 'America/Sao_Paulo'
        });
        const parts = fmt.formatToParts(date);
        const h = parseInt(parts.find(p => p.type === 'hour').value);
        const m = parseInt(parts.find(p => p.type === 'minute').value);
        return { h: h === 24 ? 0 : h, m };
    };

    const reqStart = getParts(start);
    const reqEnd = getParts(end);
    const reqStartMins = reqStart.h * 60 + reqStart.m;
    const reqEndMins = reqEnd.h * 60 + reqEnd.m;

    // Handle new format with slots array
    if (isNewFormat) {
        const slots = daySettings.slots || [];

        // Check if the requested time falls within ANY of the slots
        for (const slot of slots) {
            const [slotStartH, slotStartM] = slot.start.split(':').map(Number);
            const [slotEndH, slotEndM] = slot.end.split(':').map(Number);
            const slotStartMins = slotStartH * 60 + slotStartM;
            const slotEndMins = slotEndH * 60 + slotEndM;

            // Check if requested time is within this slot
            if (reqStartMins >= slotStartMins && reqEndMins <= slotEndMins) {
                return { valid: true };
            }
        }

        // No slot matched
        return { valid: false, reason: 'hours_out_of_range' };
    }

    // Handle old format with single start/end
    const startHour = parseInt(daySettings.start.split(':')[0]);
    const startMin = parseInt(daySettings.start.split(':')[1]);
    const endHour = parseInt(daySettings.end.split(':')[0]);
    const endMin = parseInt(daySettings.end.split(':')[1]);

    const dayStartMins = startHour * 60 + startMin;
    const dayEndMins = endHour * 60 + endMin;

    if (reqStartMins < dayStartMins || reqEndMins > dayEndMins) {
        return { valid: false, reason: 'hours_out_of_range' };
    }

    return { valid: true };
}

/**
 * Format business hours for display
 * Supports BOTH old format: { monday: { isOpen, start, end } }
 * AND new format: { seg: { enabled, slots: [{ start, end }] } }
 * 
 * @param {object} businessHours 
 * @returns {string}
 */
function formatBusinessHoursForDisplay(businessHours) {
    if (!businessHours) return "24 horas";

    // New format with Portuguese keys
    const newDaysMap = {
        'seg': 'Segunda', 'ter': 'Terça', 'qua': 'Quarta',
        'qui': 'Quinta', 'sex': 'Sexta', 'sab': 'Sábado', 'dom': 'Domingo'
    };

    // Old format with English keys
    const oldDaysMap = {
        'monday': 'Segunda', 'tuesday': 'Terça', 'wednesday': 'Quarta',
        'thursday': 'Quinta', 'friday': 'Sexta', 'saturday': 'Sábado', 'sunday': 'Domingo'
    };

    let lines = [];

    // Try new format first (check if 'seg' key exists)
    if (businessHours.seg !== undefined) {
        for (const [key, label] of Object.entries(newDaysMap)) {
            const day = businessHours[key];
            if (day && day.enabled && day.slots && day.slots.length > 0) {
                const slotsStr = day.slots.map(s => `${s.start} - ${s.end}`).join(', ');
                lines.push(`${label}: ${slotsStr}`);
            }
        }
    } else {
        // Fall back to old format
        for (const [key, label] of Object.entries(oldDaysMap)) {
            const day = businessHours[key];
            if (day && day.isOpen) {
                lines.push(`${label}: ${day.start} - ${day.end}`);
            }
        }
    }

    return lines.length > 0 ? lines.join('\n') : "Horários não configurados";
}
