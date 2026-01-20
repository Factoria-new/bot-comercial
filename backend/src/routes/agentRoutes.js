import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { runArchitectAgent, runGeminiLiveAudioStream, chatWithAgent } from '../services/geminiService.js';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { PROMPTS } from '../prompts/agentPrompts.js';

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
import { generateAudio } from '../services/ttsService.js';

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

        let audioData = null;

        // --- OPTIMIZATION: GENERATE AUDIO ON SERVER SIDE ---
        // Only generate audio if there is a response message
        if (success && responseMessage) {
            try {
                // Remove tags like <OPEN_MODAL> before TTS
                const cleanText = responseMessage.replace(/<[^>]*>/g, '').trim();

                if (cleanText) {
                    console.log(`🎤 [Architect] Generating Server-Side Audio for: "${cleanText.substring(0, 30)}..."`);
                    const ttsResult = await generateAudio(cleanText, 'Kore', API_KEY);
                    audioData = {
                        content: ttsResult.audioContent,
                        mimeType: ttsResult.mimeType
                    };
                }
            } catch (ttsError) {
                console.error('⚠️ [Architect] Server-side TTS failed (non-blocking):', ttsError);
                // We don't fail the request, just return without audio
            }
        }

        res.json({
            success,
            response: responseMessage,
            newSystemPrompt: systemPrompt,
            audio: audioData // New field
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

// ============================================
// Generate Prompt Endpoint (Direct from Template)
// Generates prompt from agentPrompts.js template - NO LIA
// ============================================
router.post('/generate-prompt', async (req, res) => {
    try {
        const { data, niche } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Dados do wizard são obrigatórios (data)'
            });
        }

        const nicheKey = niche || 'general';
        const generator = PROMPTS[nicheKey] || PROMPTS['services'] || PROMPTS['general'];

        if (!generator) {
            return res.status(400).json({
                success: false,
                error: `Niche "${nicheKey}" não encontrado e nenhum fallback disponível`
            });
        }

        // Generate prompt from template
        const generatedPrompt = generator(data);

        console.log(`✅ [Generate Prompt] Prompt gerado para niche "${nicheKey}" (${generatedPrompt.length} chars)`);

        res.json({
            success: true,
            prompt: generatedPrompt,
            niche: nicheKey
        });

    } catch (error) {
        console.error('❌ Erro ao gerar prompt:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar prompt a partir do template'
        });
    }
});

// Test endpoint - Chat with the created agent
router.post('/chat', async (req, res) => {
    try {
        const { message, systemPrompt, history = [] } = req.body;

        if (!API_KEY) return res.status(500).json({ error: 'API key ausente' });

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt
        });

        // Convert history to Gemini format
        const geminiHistory = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        }));

        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 2048,
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

// Text-to-Speech Endpoint using Gemini 2.0 Native TTS with fallback
router.post('/speak', async (req, res) => {
    try {
        const { text, voice = 'Kore' } = req.body;

        if (!API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const ttsResult = await generateAudio(text, voice, API_KEY);

        return res.json({
            audioContent: ttsResult.audioContent,
            words: ttsResult.words,
            timepoints: [], // Not supported in this simplified service yet
            mimeType: ttsResult.mimeType
        });

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


// ============================================
// Upload Prompt Endpoint
// Extracts text from PDF, DOCX, TXT
// ============================================
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-prompt', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const buffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        let text = '';

        console.log(`📂 Processing file upload: ${req.file.originalname} (${mimeType})`);

        if (mimeType === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || req.file.originalname.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer: buffer });
            text = result.value;
        } else if (mimeType === 'text/plain' || req.file.originalname.endsWith('.txt')) {
            text = buffer.toString('utf-8');
        } else {
            // Try to read as text if unknown but not binary-like (simplified check)
            text = buffer.toString('utf-8');
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Could not extract text from file.' });
        }

        console.log(`✅ Text extracted, length: ${text.length}`);

        res.json({ success: true, text: text.trim() });

    } catch (error) {
        console.error('❌ File upload error:', error);
        res.status(500).json({ success: false, error: 'Failed to process file. Make sure it is a valid PDF, DOCX or TXT file.' });
    }
});

export default router;
