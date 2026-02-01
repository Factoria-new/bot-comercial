import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { runArchitectAgent, runGeminiLiveAudioStream, chatWithAgent } from '../services/geminiService.js';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { PROMPTS } from '../prompts/agentPrompts.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';
import { decrypt } from '../utils/encryption.js';

const router = express.Router();

/**
 * Helper to get decrypted API key for a user
 */
async function getUserApiKeyFromDB(userId) {
    if (!userId) return null;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { geminiApiKey: true }
        });
        if (user && user.geminiApiKey) {
            return decrypt(user.geminiApiKey);
        }
    } catch (error) {
        console.error('Error fetching user API Key:', error);
    }
    return null;
}

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
// ============================================
// Architect Agent Endpoint
// O cérebro que constrói outros bots - usa o prompt da Lia
// ============================================
router.post('/architect', authenticateToken, async (req, res) => {
    try {
        const { message, history, currentSystemPrompt } = req.body;
        let apiKey = req.headers['x-gemini-key'] || '';

        // Get userId from authenticated JWT token
        const userId = req.user?.uid || req.user?.id || null;

        // If no API key in header, fetch from database using authenticated user
        if (!apiKey && userId) {
            console.log(`🔍 [Architect] Buscando API key do banco para usuário: ${userId}`);
            apiKey = await getUserApiKeyFromDB(userId);
            if (apiKey) {
                console.log(`✅ [Architect] API key encontrada no banco (termina com ...${apiKey.slice(-4)})`);
            } else {
                console.warn(`⚠️ [Architect] Nenhuma API key encontrada para usuário ${userId}`);
            }
        }

        const userMessage = message || '[INÍCIO] O usuário acabou de abrir a página. Inicie a conversa se apresentando e perguntando sobre o negócio dele.';

        console.log(`🏗️ [Architect] Processando mensagem para usuário: ${userId}`);
        if (apiKey) console.log(`🔑 [BYOK] Usando chave de API (termina com ...${apiKey.slice(-4)})`);

        // Get non-streaming response
        const { success, message: responseMessage, systemPrompt } = await runArchitectAgent(
            userId || 'anonymous',
            userMessage,
            null,
            history || [],
            currentSystemPrompt || '',
            apiKey
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
                    // Use custom key for TTS if available, logic inside generateAudio receives apiKey? 
                    // Actually generateAudio currently uses global API_KEY in ttsService.
                    // We might need to update ttsService too if we want TTS to use BYOK. 
                    // For now let's use the provided key or fallback.
                    const ttsResult = await generateAudio(cleanText, 'Kore', apiKey || API_KEY);
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
    // This endpoint doesn't use AI, it uses a template function.
    // So no change needed for API Key here.
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
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { message, systemPrompt, history = [] } = req.body;
        let apiKey = req.headers['x-gemini-key'] || '';

        // Get userId from authenticated JWT token
        const userId = req.user?.uid || req.user?.id || null;

        // If no API key in header, fetch from database
        if (!apiKey && userId) {
            apiKey = await getUserApiKeyFromDB(userId);
        }

        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API key não configurada' });
        }

        const result = await chatWithAgent(message, systemPrompt, history, apiKey);

        if (!result.success) {
            return res.status(500).json({ success: false, error: result.message });
        }

        res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('❌ Erro no chat de teste:', error);
        res.status(500).json({ success: false, error: 'Erro no chat' });
    }
});// Text-to-Speech Endpoint using Gemini 2.0 Native TTS with fallback
router.post('/speak', authenticateToken, async (req, res) => {
    try {
        const { text, voice = 'Kore' } = req.body;
        let apiKey = req.headers['x-gemini-key'] || '';

        // Get userId from authenticated JWT token
        const userId = req.user?.uid || req.user?.id || null;

        // If no API key in header, fetch from database
        if (!apiKey && userId) {
            apiKey = await getUserApiKeyFromDB(userId);
        }

        // Use custom key or fallback to env
        const keyToUse = apiKey || API_KEY;

        if (!keyToUse) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const ttsResult = await generateAudio(text, voice, keyToUse);

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
router.post('/live-audio', authenticateToken, async (req, res) => {
    try {
        const { message, audio, history = [] } = req.body;
        let apiKey = req.headers['x-gemini-key'] || '';

        // Get userId from authenticated JWT token
        const userId = req.user?.uid || req.user?.id || 'anonymous';

        // If no API key in header, fetch from database
        if (!apiKey && userId && userId !== 'anonymous') {
            apiKey = await getUserApiKeyFromDB(userId);
        }

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

        // Run the live audio stream with custom key
        const stream = runGeminiLiveAudioStream(userId, message, audioBuffer, history, apiKey);

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
