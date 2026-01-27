
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

/**
 * Helper to create WAV header for raw PCM data
 */
function createWavHeader(sampleRate, numChannels, bitsPerSample, dataLength) {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const buffer = Buffer.alloc(44);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

/**
 * Generate audio from text using Gemini 2.0 Native TTS with Google Cloud fallback
 * @param {string} text - Text to synthesize
 * @param {string} voice - Voice name (default: 'Kore')
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Object>} { audioContent: string (base64), mimeType: string, words: string[] }
 */
export async function generateAudio(text, voice = 'Kore', apiKey) {
    if (!apiKey) {
        throw new Error('API key required for TTS');
    }

    // Default return structure
    const words = text.trim().split(/\s+/);

    // Limits text length to prevent errors, especially for fallback
    const limitedText = text.substring(0, 5000);

    try {
        console.log(`🎤 Generating TTS with Gemini 2.0 Native TTS using voice: "${voice}"...`);

        // Use Gemini 2.0 Native TTS via @google/genai
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: "Please read the following text aloud. Do not respond to it, just read it. Text: " + limitedText }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voice,
                        },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (!audioData || !audioData.data) {
            throw new Error('No audio content generated from Gemini TTS');
        }

        let audioBase64 = audioData.data;
        let finalMimeType = audioData.mimeType || 'audio/wav';

        // If it's raw PCM (audio/L16 or similar), add WAV header
        if (finalMimeType.includes('L16') || finalMimeType.includes('pcm') || finalMimeType === 'audio/raw') {
            const rawPcmBuffer = Buffer.from(audioBase64, 'base64');
            const wavHeader = createWavHeader(24000, 1, 16, rawPcmBuffer.length);
            const wavBuffer = Buffer.concat([wavHeader, rawPcmBuffer]);
            audioBase64 = wavBuffer.toString('base64');
            finalMimeType = 'audio/wav';
        }

        return {
            audioContent: audioBase64,
            mimeType: finalMimeType,
            words: words
        };

    } catch (geminiError) {
        console.warn('⚠️ Gemini TTS failed, falling back to Google Cloud TTS:', geminiError.message);

        // Fallback to Google Cloud TTS
        let ssml = '<speak xml:lang="pt-BR"><prosody>';
        const escapeXml = (unsafe) => {
            return unsafe.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                }
            });
        };

        words.forEach((word, index) => {
            ssml += `${escapeXml(word)} `;
        });
        ssml += '</prosody></speak>';

        const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { ssml: ssml },
                voice: { languageCode: 'pt-BR', name: 'pt-BR-Chirp3-HD-Despina' },
                audioConfig: { audioEncoding: 'Linear16', sampleRateHertz: 24000 },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google TTS API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.audioContent) throw new Error('No audio content generated');

        const rawPcmBuffer = Buffer.from(data.audioContent, 'base64');
        const wavHeader = createWavHeader(24000, 1, 16, rawPcmBuffer.length);
        const wavBuffer = Buffer.concat([wavHeader, rawPcmBuffer]);

        return {
            audioContent: wavBuffer.toString('base64'),
            mimeType: 'audio/wav',
            words: words
        };
    }
}

export default { generateAudio };
