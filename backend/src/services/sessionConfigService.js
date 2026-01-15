/**
 * Session Configuration Service
 * 
 * Manages configuration for WhatsApp sessions including TTS settings.
 * Separated from server.js to avoid circular dependencies.
 */

import logger from '../config/logger.js';

import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'session_configs.json');

// Load configs from file on startup
let sessionConfigs = new Map();
try {
    if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        const json = JSON.parse(data);
        sessionConfigs = new Map(Object.entries(json));
        logger.info(`Loaded ${sessionConfigs.size} session configs from disk`);
    }
} catch (error) {
    logger.error('Error loading session configs:', error);
}

function saveConfigsToDisk() {
    try {
        const obj = Object.fromEntries(sessionConfigs);
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2));
    } catch (error) {
        logger.error('Error saving session configs:', error);
    }
}

// Default configuration template
const DEFAULT_CONFIG = {
    name: '',
    aiProvider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash-exp',
    systemPrompt: '',
    temperature: 1.0,
    ttsEnabled: false,
    ttsVoice: 'Kore',
    ttsRules: '', // Natural language rules for when to send audio
    enabled: true
};

/**
 * Get configuration for a session with fallback logic
 * @param {string} sessionId 
 * @returns {Object} Session configuration
 */
export function getSessionConfig(sessionId) {
    // 1. Exact match
    if (sessionConfigs.has(sessionId)) return sessionConfigs.get(sessionId);

    // 2. Strip 'user_' prefix
    if (sessionId.startsWith('user_')) {
        const cleanId = sessionId.replace('user_', '');
        if (sessionConfigs.has(cleanId)) return sessionConfigs.get(cleanId);
    }

    // 3. Fallbacks for dev/single user mode
    if (sessionConfigs.has('1')) return sessionConfigs.get('1');
    if (sessionConfigs.has('instance_1')) return sessionConfigs.get('instance_1');

    // 4. Try looking for any config that seems valid (last resort for single user)
    if (sessionConfigs.size > 0) {
        // Return the first config found
        return sessionConfigs.values().next().value;
    }

    return { ...DEFAULT_CONFIG };
}

/**
 * Set configuration for a session
 * @param {string} sessionId 
 * @param {Object} config 
 */
export function setSessionConfig(sessionId, config) {
    const existing = getSessionConfig(sessionId);
    sessionConfigs.set(sessionId, { ...existing, ...config });

    // Also save for variants to ensure consistency
    if (sessionId === '1') sessionConfigs.set('instance_1', { ...existing, ...config });
    if (sessionId === 'instance_1') sessionConfigs.set('1', { ...existing, ...config });

    saveConfigsToDisk();
    logger.info(`📝 Session config updated and saved for ${sessionId}`);
}

/**
 * Check if a session has TTS enabled
 * @param {string} sessionId 
 * @returns {boolean}
 */
export function isTtsEnabled(sessionId) {
    const config = getSessionConfig(sessionId);
    return config.ttsEnabled === true;
}

/**
 * Get TTS voice for a session
 * @param {string} sessionId 
 * @returns {string}
 */
export function getTtsVoice(sessionId) {
    const config = getSessionConfig(sessionId);
    return config.ttsVoice || 'Kore';
}

/**
 * Get TTS rules for a session
 * @param {string} sessionId 
 * @returns {string}
 */
export function getTtsRules(sessionId) {
    const config = getSessionConfig(sessionId);
    return config.ttsRules || '';
}

export default {
    getSessionConfig,
    setSessionConfig,
    isTtsEnabled,
    getTtsVoice,
    getTtsRules
};
