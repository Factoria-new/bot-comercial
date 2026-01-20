/**
 * Session Configuration Service - DB VERSION
 * 
 * Manages configuration for WhatsApp sessions including TTS settings.
 * Persists data to Postgres via Prisma instead of local JSON file.
 */

import logger from '../config/logger.js';
import prisma from '../config/prisma.js';

// Default configuration template
const DEFAULT_CONFIG = {
    name: '',
    aiProvider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    systemPrompt: '',
    temperature: 1.0,
    ttsEnabled: false,
    ttsVoice: 'Kore',
    ttsRules: '', // Regras em linguagem natural (string)
    enabled: true
};

/**
 * Find a user by various ID formats (userId, user_ID, instanceID)
 * @param {string} sessionId 
 * @returns {Promise<Object|null>}
 */
async function findUserBySessionId(sessionId) {
    try {
        if (!sessionId) return null;

        // 1. Try directly as User ID
        let user = await prisma.user.findUnique({ where: { id: sessionId } });
        if (user) return user;

        // 2. Try stripping 'user_' prefix
        if (sessionId.startsWith('user_')) {
            const cleanId = sessionId.replace('user_', '');
            user = await prisma.user.findUnique({ where: { id: cleanId } });
            if (user) return user;
        }

        // 3. Try as Instance ID
        const instance = await prisma.instance.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });
        if (instance?.user) return instance.user;

        // 4. Special Fallback for "1" or "instance_1" (Dev/Single User)
        if (sessionId === '1' || sessionId === 'instance_1') {
            // Get the first user in the system as fallback for local dev
            user = await prisma.user.findFirst();
            return user;
        }

        return null;
    } catch (error) {
        logger.error(`Error finding user for session ${sessionId}:`, error);
        return null;
    }
}

/**
 * Get configuration for a session from Database
 * @param {string} sessionId 
 * @returns {Promise<Object>} Session configuration
 */
export async function getSessionConfig(sessionId) {
    const user = await findUserBySessionId(sessionId);

    if (!user) {
        logger.warn(`⚠️ No user found for session ${sessionId}, returning defaults`);
        return { ...DEFAULT_CONFIG };
    }

    // Map DB fields to the expected config object format
    return {
        ...DEFAULT_CONFIG,
        name: user.displayName || '',
        ttsEnabled: user.ttsEnabled,
        ttsVoice: user.ttsVoice,
        ttsRules: user.ttsRules || DEFAULT_CONFIG.ttsRules,
        model: user.aiModel || DEFAULT_CONFIG.model,
        temperature: user.aiTemperature || DEFAULT_CONFIG.temperature,
        systemPrompt: user.customPrompt || ''
    };
}

/**
 * Save configuration for a session to Database
 * @param {string} sessionId 
 * @param {Object} config 
 */
export async function setSessionConfig(sessionId, config) {
    try {
        const user = await findUserBySessionId(sessionId);

        if (!user) {
            throw new Error(`User not found for session ${sessionId}`);
        }

        // Prepare update data
        const updateData = {};
        if (config.ttsEnabled !== undefined) updateData.ttsEnabled = config.ttsEnabled;
        if (config.ttsVoice !== undefined) updateData.ttsVoice = config.ttsVoice;
        if (config.ttsRules !== undefined) updateData.ttsRules = config.ttsRules;
        if (config.model !== undefined) updateData.aiModel = config.model;
        if (config.temperature !== undefined) updateData.aiTemperature = config.temperature;
        if (config.systemPrompt !== undefined) updateData.customPrompt = config.systemPrompt;

        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        logger.info(`✅ Session config updated in DB for user ${user.id} (${sessionId})`);
        return true;
    } catch (error) {
        logger.error(`❌ Error updating session config for ${sessionId}: ${error.message}`, error);
        return false;
    }
}

/**
 * Check if a session has TTS enabled
 * @param {string} sessionId 
 * @returns {Promise<boolean>}
 */
export async function isTtsEnabled(sessionId) {
    const config = await getSessionConfig(sessionId);
    return config.ttsEnabled === true;
}

/**
 * Get TTS voice for a session
 * @param {string} sessionId 
 * @returns {Promise<string>}
 */
export async function getTtsVoice(sessionId) {
    const config = await getSessionConfig(sessionId);
    return config.ttsVoice || 'Kore';
}

/**
 * Get TTS rules for a session
 * @param {string} sessionId 
 * @returns {Promise<Object|string>}
 */
export async function getTtsRules(sessionId) {
    const config = await getSessionConfig(sessionId);
    return config.ttsRules || '';
}

export default {
    getSessionConfig,
    setSessionConfig,
    isTtsEnabled,
    getTtsVoice,
    getTtsRules
};
