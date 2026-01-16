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
    const status = await getConnectionStatus(userId);
    if (!status.isConnected) {
        return { available: false, error: 'Google Calendar not connected' };
    }

    try {
        // List events in the requested time range
        const result = await composio.tools.execute(
            'GOOGLECALENDAR_EVENTS_LIST',
            {
                connectedAccountId: status.connectionId,
                userId: userId,
                dangerouslySkipVersionCheck: true,
                arguments: {
                    time_min: startDateTime,
                    time_max: endDateTime,
                    max_results: 10,
                    single_events: true,
                    order_by: 'startTime'
                }
            }
        );

        if (!result.successful) {
            return { available: false, error: result.error || 'Failed to check availability' };
        }

        const events = result.data?.items || result.data || [];

        // Filter out transparent (free) events and check for actual conflicts
        const conflictingEvents = events.filter(event => {
            // Skip if event shows as "free" (transparent)
            if (event.transparency === 'transparent') return false;

            // Check if the event actually overlaps with requested slot
            const eventStart = new Date(event.start?.dateTime || event.start?.date);
            const eventEnd = new Date(event.end?.dateTime || event.end?.date);
            const reqStart = new Date(startDateTime);
            const reqEnd = new Date(endDateTime);

            return reqStart < eventEnd && reqEnd > eventStart;
        });

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
    const status = await getConnectionStatus(userId);
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
 * Create a calendar event with optional Google Meet link
 * @param {string} userId - User's email
 * @param {object} eventData - Event details
 * @param {boolean} createMeetLink - Whether to create a Google Meet link
 * @returns {Promise<{success: boolean, event?: object, meetLink?: string, error?: string}>}
 */
export const createEventWithMeet = async (userId, eventData, createMeetLink = false) => {
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

        // Add conference data for Google Meet if requested
        if (createMeetLink) {
            params.conference_data_version = 1;
            params.create_video_conference = true;
        }

        console.log(`📅 Creating event: "${params.summary}" for ${userId} (Meet: ${createMeetLink})`);

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
            const meetLink = eventData?.hangoutLink || eventData?.conferenceData?.entryPoints?.[0]?.uri;

            console.log(`✅ Event created: ${eventData?.id || 'success'}${meetLink ? ` with Meet: ${meetLink}` : ''}`);

            return {
                success: true,
                event: eventData,
                meetLink: meetLink || null
            };
        } else {
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

    const { customerName, customerEmail, requestedStart, requestedEnd, description } = appointmentData;
    const { businessHours, serviceType, businessAddress } = businessContext || {};

    // Calculate duration in minutes
    const startDate = new Date(requestedStart);
    const endDate = new Date(requestedEnd);
    const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));

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
    const eventResult = await createEventWithMeet(userId, {
        summary: `Agendamento - ${customerName}`,
        description: description || `Agendamento com ${customerName} (${customerEmail})`,
        start: requestedStart,
        end: requestedEnd,
        attendees: [customerEmail],
        location: isOnline ? '' : (businessAddress || '')
    }, isOnline);

    if (!eventResult.success) {
        return {
            success: false,
            reason: 'creation_error',
            message: eventResult.error
        };
    }

    console.log(`✅ Appointment scheduled successfully`);

    // Return success with appropriate link/address
    const result = {
        success: true,
        event: eventResult.event,
        customerName,
        customerEmail,
        startTime: requestedStart,
        endTime: requestedEnd
    };

    if (isOnline && eventResult.meetLink) {
        result.meetLink = eventResult.meetLink;
    } else if (!isOnline && businessAddress) {
        result.address = businessAddress;
    }

    return result;
};
