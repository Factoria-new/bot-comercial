/**
 * Chat Service - Shared logic for WhatsApp and Instagram
 * 
 * Centralizes common functionality:
 * - Audio transcription (Gemini)
 * - TTS rules evaluation
 * - Link extraction
 * - Time formatting
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Store audio mode state per contact (for "audio until stopped" feature)
const audioModeEnabled = new Map(); // contactId -> boolean

/**
 * Transcribe audio using Gemini API
 * @param {Buffer} audioBuffer - The audio file buffer
 * @param {string} mimeType - MIME type of the audio (e.g., 'audio/ogg; codecs=opus')
 * @param {string} [apiKey] - Specific API Key to use (optional, falls back to env var)
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioBuffer, mimeType = 'audio/ogg', apiKey = null) {
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
        console.error('❌ GEMINI_API_KEY not configured for audio transcription');
        return '[Áudio não transcrito - API Key ausente]';
    }

    try {
        console.log('🎤 Transcribing audio with Gemini 2.5 Flash...');
        const genAI = new GoogleGenerativeAI(finalApiKey);
        // Using gemini-2.5-flash for native audio support
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Convert buffer to base64
        const base64Audio = audioBuffer.toString('base64');

        // Gemini multimodal: send audio as inline data
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType.split(';')[0], // Remove codec info if present
                    data: base64Audio
                }
            },
            "Transcreva este áudio para texto em português. Retorne APENAS a transcrição literal do que foi dito, sem comentários ou explicações adicionais."
        ]);

        const transcription = result.response.text().trim();
        console.log(`✅ Audio transcribed: "${transcription.substring(0, 100)}..."`);
        return transcription;
    } catch (error) {
        console.error('❌ Audio transcription error:', error.message);
        // Better error message for rate limits
        if (error.message.includes('429')) {
            return '[Erro: Limite de cota da API de transcrição excedido]';
        }
        return '[Erro ao transcrever áudio]';
    }
}

/**
 * Extract URLs from text and replace them with a spoken phrase for TTS.
 * This prevents TTS from dictating URLs character by character.
 * @param {string} text - Original message text
 * @returns {{ cleanText: string, links: string[] }} - Text with links replaced + extracted links
 */
export const extractAndReplaceLinks = (text) => {
    // Regex to match URLs (http, https)
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = text.match(urlRegex) || [];

    if (links.length === 0) {
        return { cleanText: text, links: [] };
    }

    let cleanText = text;

    // Replace each link with appropriate phrase
    if (links.length === 1) {
        // Single link: "segue abaixo o link"
        cleanText = cleanText.replace(urlRegex, ', e segue abaixo o link');
    } else {
        // Multiple links: use counter
        let counter = 0;
        cleanText = cleanText.replace(urlRegex, () => {
            counter++;
            return `, e segue abaixo o link ${counter}`;
        });
    }

    // Clean up any double spaces or awkward punctuation
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    console.log(`🔗 Extracted ${links.length} link(s) from message for TTS`);

    return { cleanText, links };
};

/**
 * Evaluate TTS rules to determine if audio should be sent
 * Now uses structured object-based rules (predefined checkboxes)
 * 
 * For audioOnRequest rule: Implements PERSISTENT audio mode
 * - When user requests audio, mode is ACTIVATED and persists
 * - Mode remains active until user explicitly asks to stop
 * 
 * @param {Object} rules - Rule object with audioOnRequest, audioOnAudioReceived, audioOnly
 * @param {string} incomingType - Type of incoming message ('text' or 'audio')
 * @param {string} responseText - The response text
 * @param {string} lastUserMessage - The last message from the user (context)
 * @param {string} contactId - Unique identifier for this contact (sessionId:remoteJid)
 * @returns {Promise<boolean>}
 */
export async function evaluateTtsRules(rules, incomingType, responseText, lastUserMessage = '', contactId = '') {
    // Handle case where rules is null/undefined
    if (!rules) {
        // No rules = always send audio when TTS is enabled
        console.log('📋 TTS Rules: No rules defined - defaulting to audio');
        return true;
    }

    // Parse JSON string to object if necessary
    if (typeof rules === 'string') {
        try {
            rules = JSON.parse(rules);
            console.log('📋 TTS Rules: Parsed JSON string to object');
        } catch {
            // Invalid JSON string = legacy format or empty, default to audio
            console.log('📋 TTS Rules: Could not parse string, defaulting to audio');
            return true;
        }
    }

    console.log(`📋 TTS Rules evaluation:`, JSON.stringify(rules));
    console.log(`📋 Context: incomingType=${incomingType}, lastUserMessage="${lastUserMessage?.substring(0, 50)}...", contactId=${contactId}`);

    // Rule 3: Audio Only (exclusive - always send audio)
    if (rules.audioOnly) {
        console.log('✅ TTS Rule: audioOnly=true -> Sending audio');
        return true;
    }

    // If no rules are active, default to send audio
    if (!rules.audioOnRequest && !rules.audioOnAudioReceived) {
        console.log('✅ TTS Rule: No rules active -> Sending audio');
        return true;
    }

    // Rule 2: Audio when receiving audio
    if (rules.audioOnAudioReceived && incomingType === 'audio') {
        console.log('✅ TTS Rule: audioOnAudioReceived=true and received audio -> Sending audio');
        return true;
    }

    // Rule 1: Audio only when requested (PERSISTENT MODE)
    if (rules.audioOnRequest && contactId) {
        const lowerMessage = (lastUserMessage || '').toLowerCase();

        // Patterns to START audio mode
        const startAudioPatterns = [
            'manda audio', 'manda áudio', 'mande audio', 'mande áudio',
            'envia audio', 'envia áudio', 'envie audio', 'envie áudio',
            'pode falar', 'fala pra mim', 'fala para mim',
            'me fala', 'me explica por audio', 'me explica por áudio',
            'audio por favor', 'áudio por favor', 'quero audio', 'quero áudio',
            'prefiro audio', 'prefiro áudio', 'por audio', 'por áudio',
            'em audio', 'em áudio', 'via audio', 'via áudio',
            'responde em audio', 'responde em áudio', 'responda em audio', 'responda em áudio'
        ];

        // Patterns to STOP audio mode
        const stopAudioPatterns = [
            'para com audio', 'para com áudio', 'parar audio', 'parar áudio',
            'desliga audio', 'desliga áudio', 'desativar audio', 'desativar áudio',
            'quero texto', 'volta pro texto', 'volta para texto', 'volta ao texto',
            'texto por favor', 'sem audio', 'sem áudio', 'cancela audio', 'cancela áudio',
            'prefiro texto', 'manda texto', 'mande texto', 'envia texto', 'envie texto',
            'responde em texto', 'responda em texto', 'só texto', 'somente texto'
        ];

        // Check if user wants to STOP audio
        const wantsToStopAudio = stopAudioPatterns.some(pattern => lowerMessage.includes(pattern));
        if (wantsToStopAudio) {
            audioModeEnabled.set(contactId, false);
            console.log(`🔇 Audio mode DEACTIVATED for ${contactId}`);
            return false; // Send text for this response
        }

        // Check if user wants to START audio
        const wantsToStartAudio = startAudioPatterns.some(pattern => lowerMessage.includes(pattern));
        if (wantsToStartAudio) {
            audioModeEnabled.set(contactId, true);
            console.log(`🔊 Audio mode ACTIVATED for ${contactId}`);
            return true; // Send audio for this response
        }

        // Check current state (persistence)
        if (audioModeEnabled.get(contactId)) {
            console.log(`🔊 Audio mode is ACTIVE for ${contactId} -> Sending audio`);
            return true;
        }

        console.log('✅ TTS Rule: audioOnRequest=true, no request/active mode -> Sending text');
        return false;
    }

    // Default Fallback
    console.log('✅ TTS Rule Fallback -> Sending audio');
    return true;
}

/**
 * Get current formatted time in Brazilian format
 * @returns {string} Formatted date string (DD/MM/YYYY HH:mm)
 */
export function getCurrentFormattedTime() {
    return format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export default {
    transcribeAudio,
    extractAndReplaceLinks,
    evaluateTtsRules,
    getCurrentFormattedTime
};
