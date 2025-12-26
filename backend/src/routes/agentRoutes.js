import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { runArchitectAgent, runGeminiLiveAudioStream, chatWithAgent } from '../services/geminiService.js';

const router = express.Router();

// Check API key at startup
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY || '';
if (!API_KEY) {
    console.warn('⚠️ AVISO: Nenhuma API key do Gemini encontrada! Verifique API_GEMINI ou GEMINI_API_KEY no .env');
} else {
    console.log('✅ API key do Gemini configurada (primeiros chars:', API_KEY.substring(0, 10) + '...)');
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// ============================================
// Architect Agent Endpoint
// O cérebro que constrói outros bots - usa o prompt da Lia
// ============================================
// ============================================
// Architect Agent Endpoint
// O cérebro que constrói outros bots - usa o prompt da Lia
// ============================================
router.post('/architect', async (req, res) => {
    try {
        const { message, history, currentSystemPrompt, userId } = req.body;

        const userMessage = message || '[INÍCIO] O usuário acabou de abrir a página. Inicie a conversa se apresentando e perguntando sobre o negócio dele.';

        console.log(`🏗️ [Architect] Processando mensagem...`);

        // Get non-streaming response
        const { success, message: responseMessage, systemPrompt } = await runArchitectAgent(
            userId || 'anonymous',
            userMessage,
            null,
            history || [],
            currentSystemPrompt || ''
        );

        res.json({
            success,
            response: responseMessage,
            newSystemPrompt: systemPrompt
        });

    } catch (error) {
        console.error('❌ Erro no Architect Agent:', error);
        res.status(500).json({
            success: false,
            error: 'Erro no processamento do Architect Agent',
            response: 'Desculpe, tive um problema técnico.'
        });
    }
});

// Test endpoint - Chat with the created agent
router.post('/chat', async (req, res) => {
    try {
        const { message, systemPrompt } = req.body;

        if (!API_KEY) return res.status(500).json({ error: 'API key ausente' });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "System Instruction: " + systemPrompt }] },
                { role: "model", parts: [{ text: "Entendido. Seguirei essas instruções." }] }
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            message: text
        });

    } catch (error) {
        console.error('❌ Erro no chat de teste:', error);
        res.status(500).json({ success: false, error: 'Erro no chat' });
    }
});

// Text-to-Speech Endpoint
// Helper to create WAV header for raw PCM data
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

// Text-to-Speech Endpoint using Gemini 2.0 Native TTS with fallback
router.post('/speak', async (req, res) => {
    try {
        const { text, voice = 'Kore' } = req.body;

        if (!API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log(`🎤 Generating TTS with Gemini 2.0 Native TTS using voice: "${voice}" for: "${text.substring(0, 30)}..."`);

        try {
            // Use Gemini 2.0 Native TTS via @google/genai
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            // Call Gemini TTS with the selected voice
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: text }] }],
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

            // Get the audio data from response
            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

            if (!audioData || !audioData.data) {
                throw new Error('No audio content generated from Gemini TTS');
            }

            console.log(`✅ Gemini TTS generated audio with mimeType: ${audioData.mimeType}`);

            let audioBase64 = audioData.data;
            let finalMimeType = audioData.mimeType || 'audio/wav';

            // If it's raw PCM (audio/L16 or similar), add WAV header
            if (finalMimeType.includes('L16') || finalMimeType.includes('pcm') || finalMimeType === 'audio/raw') {
                console.log('Converting raw PCM to WAV...');
                const rawPcmBuffer = Buffer.from(audioBase64, 'base64');
                const wavHeader = createWavHeader(24000, 1, 16, rawPcmBuffer.length);
                const wavBuffer = Buffer.concat([wavHeader, rawPcmBuffer]);
                audioBase64 = wavBuffer.toString('base64');
                finalMimeType = 'audio/wav';
            }

            // Prepare response
            const words = text.trim().split(/\s+/);

            const alignedData = {
                audioContent: audioBase64,
                words: words,
                timepoints: [],
                mimeType: finalMimeType
            };

            return res.json(alignedData);

        } catch (geminiError) {
            console.warn('⚠️ Gemini TTS failed, falling back to Google Cloud TTS:', geminiError.message);

            // Fallback to Google Cloud TTS
            const words = text.trim().split(/\s+/);

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
                ssml += `<mark name="${index}"/>${escapeXml(word)} `;
            });
            ssml += '</prosody></speak>';

            const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { ssml: ssml },
                    voice: { languageCode: 'pt-BR', name: 'pt-BR-Chirp3-HD-Despina' },
                    audioConfig: { audioEncoding: 'Linear16', sampleRateHertz: 24000 },
                    enableTimePointing: ["SSML_MARK"]
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
            const wavBase64 = wavBuffer.toString('base64');

            return res.json({
                audioContent: wavBase64,
                words: words,
                timepoints: data.timepoints || [],
                mimeType: 'audio/wav'
            });
        }

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({
            error: 'Failed to generate speech',
            details: error.message
        });
    }
});

// ============================================
// Gemini Live Audio Streaming Endpoint
// Aceita texto ou áudio -> Retorna áudio streaming
// ============================================
router.post('/live-audio', async (req, res) => {
    try {
        const { message, audio, history = [], userId = 'anonymous' } = req.body;

        console.log(`🎙️ [Live Audio] Request received - Message: ${message ? message.substring(0, 30) + '...' : 'AUDIO'}`);

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Convert base64 audio to buffer if provided
        let audioBuffer = null;
        if (audio) {
            audioBuffer = Buffer.from(audio, 'base64');
        }

        // Run the live audio stream
        const stream = runGeminiLiveAudioStream(userId, message, audioBuffer, history);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.end();
        console.log(`[Live Audio] Stream completed for user ${userId}`);

    } catch (error) {
        console.error('Live Audio Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to generate live audio',
                details: error.message
            });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
            res.end();
        }
    }
});

export default router;
