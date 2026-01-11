/**
 * Session Configuration Service
 * 
 * Manages configuration for WhatsApp sessions including TTS settings.
 * Separated from server.js to avoid circular dependencies.
 */

import logger from '../config/logger.js';

// Storage for session configurations
const sessionConfigs = new Map();

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
 * Get configuration for a session
 * @param {string} sessionId 
 * @returns {Object} Session configuration
 */
export function getSessionConfig(sessionId) {
    return sessionConfigs.get(sessionId) || { ...DEFAULT_CONFIG };
}

/**
 * Set configuration for a session
 * @param {string} sessionId 
 * @param {Object} config 
 */
export function setSessionConfig(sessionId, config) {
    const existing = getSessionConfig(sessionId);
    sessionConfigs.set(sessionId, { ...existing, ...config });
    logger.info(`📝 Session config updated for ${sessionId}`);
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
