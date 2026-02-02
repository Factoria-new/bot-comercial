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

// ============================================
// DEMO ROUTES (Public - No Auth Required)
// ============================================

// Generate Prompt for Demo (Public)
router.post('/demo-generate-prompt', async (req, res) => {
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

        console.log(`✅ [Demo Generate] Prompt gerado para niche "${nicheKey}"`);

        res.json({
            success: true,
            prompt: generatedPrompt,
            niche: nicheKey
        });

    } catch (error) {
        console.error('❌ Erro ao gerar prompt (demo):', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar prompt demo'
        });
    }
});

// Demo Chat (Scripted - No API Key)
// Demo Chat (Scripted - No API Key)
router.post('/demo-chat', async (req, res) => {
    try {
        const { message, data = {} } = req.body;

        if (!message) {
            return res.json({ success: true, message: "Olá! Como posso ajudar?" });
        }

        // Normalização robusta (remove acentos e converte para minúsculas)
        const normalizedMsg = message.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        console.log(`💬 Demo Chat: "${message}" -> Normalizado: "${normalizedMsg}"`);

        // Resposta padrão (Fallback)
        let response = "Entendo. Como sou uma versão de demonstração, sugiro finalizar a criação para testar todas as minhas funcionalidades personalizadas!";

        // Helper para checar palavras-chave (tokens exatos ou parciais)
        const contains = (keywords) => keywords.some(k => {
            const keyNorm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalizedMsg.includes(keyNorm);
        });

        // Dados dinâmicos básicos
        const businessName = data.businessName || "nossa empresa";
        const phone = data.phone || "(XX) 99999-9999";
        const assistName = data.assistantName || "Assistente Virtual";

        // --- SISTEMA DE RESPOSTAS SCRIPTADAS ---

        // =================================================================
        // 0. BOAS-VINDAS & IDENTIDADE
        // =================================================================
        if (contains(['ola', 'oi', 'eai', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'hey', 'tudobem'])) {
            response = `Olá! 👋 Bem-vindo(a) à ${businessName}. Sou ${assistName}, sua assistente virtual. Como posso facilitar sua vida hoje?`;
        }
        else if (contains(['quem e', 'quem é', 'seu nome', 'voce e', 'você é', 'robo', 'bot'])) {
            response = `Sou ${assistName}, a inteligência artificial da ${businessName}. Estou aqui para agilizar seu atendimento enquanto nossa equipe foca no seu pedido/serviço! Em que posso ajudar?`;
        }

        // =================================================================
        // 1. VITRINE (PRODUTOS/SERVIÇOS)
        // =================================================================
        else if (contains(['que voces tem', 'o que vendem', 'catalogo', 'cardapio', 'menu', 'produtos', 'servicos', 'lista', 'trabalham com', 'quais', 'sabores', 'tipos', 'opcoes', 'opções', 'variedade', 'pedir', 'peço', 'comprar', 'compra'])) {
            if (data.menuItems?.length > 0) {
                const items = data.menuItems.slice(0, 3).map(i => i.name).join(', ');
                response = `Temos opções incríveis como ${items} e muito mais! Gostaria de ver o cardápio completo ou busca algo específico?`;
            } else if (data.servicesList?.length > 0) {
                const servs = data.servicesList.slice(0, 3).map(s => s.name).join(', ');
                response = `Somos especialistas em ${servs}. Posso te explicar como funciona algum deles?`;
            } else if (data.products?.length > 0) {
                const prods = data.products.slice(0, 3).map(p => p.name).join(', ');
                response = `Trabalhamos com ${prods}. Tem interesse em algum modelo específico?`;
            } else {
                response = "Temos uma variedade de soluções para você. Você busca um produto físico ou prestação de serviço?";
            }
        }
        // PRODUCT SPECIFIC
        else if (data.type !== 'service' && contains(['estoque', 'tem', 'têm', 'disponivel', 'disponível', 'tem esse', 'ainda tem'])) {
            response = "É um dos nossos itens mais procurados! Para qual data ou finalidade você precisa dele? Assim confirmo a disponibilidade exata.";
        }
        else if (data.type !== 'service' && contains(['original', 'novo', 'lacrado', 'usado', 'estado'])) {
            response = "Trabalhamos com garantia de procedência. Você prefere ver fotos reais do item agora ou prefere saber sobre a garantia primeiro?";
        }

        // =================================================================
        // 2. PREÇOS, PAGAMENTOS E PROMOÇÕES
        // =================================================================
        else if (contains(['quanto custa', 'preco', 'preço', 'valor', 'orcamento', 'orçamento'])) {
            response = "Para te passar o melhor valor possível, preciso entender: você busca algo básico ou a solução completa?";
        }
        else if (contains(['pagamento', 'pagar', 'cartao', 'cartão', 'pix', 'parcela', 'dinheiro'])) {
            response = "Aceitamos as principais bandeiras e Pix. Você prefere parcelar no cartão ou aproveitar nosso desconto à vista?";
        }
        else if (contains(['desconto', 'promoção', 'promocao', 'cupom', 'oferta', 'menos'])) {
            response = "Eventualmente temos condições especiais! Qual seria a forma de pagamento? (Pix costuma ter as melhores vantagens).";
        }
        else if (contains(['atacado', 'quantidade', 'lote', 'revenda', 'corporativo'])) {
            response = "Temos uma tabela especial para volume. Qual seria a quantidade aproximada que você pretende comprar?";
        }

        // =================================================================
        // 3. LOGÍSTICA (FRETE/LOCALIZAÇÃO)
        // =================================================================
        // PRODUCT SPECIFIC - FREIGHT
        else if (data.type !== 'service' && contains(['frete', 'entrega', 'cep', 'envio', 'chega quando', 'urgencia', 'urgência', 'rapido', 'rápido', 'pressa'])) {
            response = "Isso depende da sua região. Você tem urgência para receber (Sedex/Expresso) ou prefere a opção mais econômica?";
        }
        else if (contains(['rastreio', 'rastrear', 'pedido', 'onde ta', 'onde tá', 'status'])) {
            response = "Consigo verificar isso. Você prefere receber as atualizações automáticas aqui no WhatsApp ou por e-mail?";
        }
        else if (contains(['onde', 'local', 'endereco', 'endereço', 'fica', 'localização', 'mapa'])) {
            const address = data.address || "nosso endereço";
            response = `Estamos localizados em ${address}. Você virá de carro? Posso enviar instruções de estacionamento.`;
        }
        else if (contains(['estacionamento', 'parar', 'vaga', 'carro'])) {
            response = "Temos local para parar próximo. Você precisa de vaga reservada ou acessibilidade especial?";
        }
        else if (contains(['domicilio', 'domicílio', 'casa', 'vem ate mim', 'vem até mim', 'delivery'])) {
            // Service might go home too, but context differs. Keeping general.
            response = "Atendemos sim! Em qual bairro você está para eu calcular a taxa de deslocamento/entrega?";
        }

        // =================================================================
        // 4. AGENDAMENTO E SERVIÇOS TÉCNICOS
        // =================================================================
        // SERVICE SPECIFIC
        else if (data.type !== 'product' && contains(['horario', 'horário', 'agenda', 'marcar', 'reservar'])) {
            response = "Ótimo! Você funciona melhor no período da manhã ou da tarde? Assim filtro as vagas para você.";
        }
        else if (data.type !== 'product' && contains(['demora', 'tempo', 'duracao', 'duração', 'quantos dias'])) {
            response = "Depende da complexidade, mas somos ágeis. Você tem algum prazo fatal ou compromisso logo após?";
        }
        else if (data.type !== 'product' && contains(['documento', 'levar', 'preciso', 'preparacao', 'preparação', 'requisito'])) {
            response = "Para facilitar, você prefere que eu envie um checklist em PDF ou te explico os itens por aqui agora?";
        }
        else if (data.type !== 'product' && contains(['doi', 'dói', 'dor', 'machuca', 'anestesia'])) {
            response = "Nossa técnica foca no máximo conforto. Você costuma ter sensibilidade alta a esse tipo de procedimento?";
        }

        // =================================================================
        // 4.5. RESPOSTAS DE FOLLOW-UP (DATAS/SIM/NÃO)
        // =================================================================
        else if (contains(['amanha', 'hoje', 'tarde', 'noite', 'manha', 'semana', 'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo', 'agora'])) {
            response = "Perfeito! Verifiquei aqui e temos disponibilidade para este período. Posso confirmar sua reserva/pedido?";
        }
        else if (contains(['sim', 'pode', 'quero', 'claro', 'com certeza', 'isso'])) {
            response = "Maravilha! 🎉 Para finalizarmos, você poderia me informar seu nome completo para o cadastro?";
        }
        else if (contains(['nao', 'não', 'pensar', 'depois', 'obrigado', 'obrigada'])) {
            response = "Sem problemas! Fico à disposição. Se mudar de ideia ou tiver qualquer dúvida, é só me chamar. Tenha um ótimo dia! 😊";
        }

        // =================================================================
        // 5. BUROCRACIA E PÓS-VENDA
        // =================================================================
        else if (contains(['nota fiscal', 'nf', 'nota', 'fatura'])) {
            response = "Emitimos sim. Para adiantar, a nota seria no seu CPF pessoal ou CNPJ de empresa?";
        }
        else if (contains(['garantia', 'defeito', 'quebrar', 'estragou', 'conserto'])) {
            response = "Entendo sua preocupação. O problema ocorreu recentemente ou já faz algum tempo?";
        }
        else if (contains(['problema', 'erro', 'errado', 'não funciona', 'nao funciona', 'deu ruim'])) {
            response = "Sinto muito por isso. Para agilizar a resolução, você consegue me descrever o que houve ou mandar uma foto?";
        }
        else if (contains(['cancelar', 'trocar', 'devolver', 'desistir', 'reembolso'])) {
            response = "Poxa, que pena. O motivo seria o produto/serviço em si ou alguma expectativa não atendida? Talvez eu tenha uma alternativa.";
        }

        // =================================================================
        // 6. CONTATO HUMANO E INFOS GERAIS
        // =================================================================
        else if (contains(['falei com', 'ninguem', 'ninguém', 'resposta', 'atendente', 'humano', 'pessoa', 'gerente'])) {
            response = "Compreendo que queira falar com alguém. Enquanto conecto nossa equipe, pode me adiantar o assunto para eu direcionar ao setor certo?";
        }
        else if (contains(['telefone', 'celular', 'zap', 'whatsapp', 'ligar', 'contato'])) {
            response = `Nosso contato principal é este, mas também atendemos no ${phone}. Você prefere que a gente te ligue?`;
        }
        else if (contains(['funcionamento', 'aberto', 'abre', 'fecha', 'hora'])) {
            const closingTime = data?.hours?.["seg"]?.slots?.[0]?.end || "18:00";
            response = `Hoje funcionamos até às ${closingTime}. Você pretende vir agora ou prefere agendar para outro dia?`;
        }
        else if (contains(['confiavel', 'seguro', 'verdade', 'golpe', 'referencia'])) {
            response = "Totalmente! Estamos no mercado há anos. Gostaria de ver alguns depoimentos de clientes que atendemos essa semana?";
        }

        // Emulate delay for "typing" effect
        await new Promise(resolve => setTimeout(resolve, 800));

        res.json({
            success: true,
            message: response
        });

    } catch (error) {
        console.error('❌ Erro no demo chat:', error);
        res.status(500).json({ success: false, error: 'Erro no chat de demonstração' });
    }
});


export default router;
