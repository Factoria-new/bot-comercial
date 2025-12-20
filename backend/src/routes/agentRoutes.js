import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Business categories templates
const BUSINESS_TEMPLATES = {
    restaurante: 'Crie um agente para um restaurante que apresente o cardápio, faça pedidos e aceite pagamentos',
    pizzaria: 'Crie um agente para uma pizzaria com tamanhos P, M, G, que colete endereço e aceite pagamento',
    barbearia: 'Crie um agente para uma barbearia que agende horários e mostre serviços disponíveis',
    loja: 'Crie um agente para uma loja que apresente produtos, preços e faça vendas',
    ecommerce: 'Crie um agente para e-commerce que tire dúvidas sobre produtos e direcione para compra',
    imobiliaria: 'Crie um agente imobiliário que apresente imóveis, agende visitas e capture leads',
    consultorio: 'Crie um agente para consultório que agende consultas e tire dúvidas sobre procedimentos',
    escola: 'Crie um agente para escola que informe sobre cursos, valores e faça matrículas',
    advocacia: 'Crie um agente para escritório de advocacia que tire dúvidas e agende consultas',
    cafeteria: 'Crie um agente para cafeteria que apresente o menu e faça pedidos',
    academia: 'Crie um agente para academia que informe planos, valores e agende aulas experimentais',
    design: 'Crie um agente para estúdio de design que apresente portfólio e faça orçamentos',
};

// Extract information from user prompt using Gemini
router.post('/extract', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt é obrigatório' });
        }

        if (!API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'API key do Gemini não configurada. Adicione API_GEMINI ou GEMINI_API_KEY no .env'
            });
        }

        console.log('📝 Extraindo informações do prompt:', prompt);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const extractionPrompt = `Analise o seguinte texto e extraia as informações para criar um agente de vendas.
Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com a seguinte estrutura:

{
    "business_type": "tipo do negócio (ex: pizzaria, loja, barbearia)",
    "business_name": "nome do negócio se mencionado, ou null",
    "products": [
        { "name": "nome do produto", "price": "preço se mencionado" }
    ],
    "payment_methods": ["métodos de pagamento mencionados"],
    "integrations": ["integrações mencionadas (agenda, endereço, whatsapp, etc)"],
    "tone": "tom de comunicação sugerido",
    "detected_tags": [
        { "text": "texto detectado", "type": "price|payment|integration|product" }
    ]
}

Texto para analisar:
"${prompt}"`;

        const result = await model.generateContent(extractionPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('🤖 Resposta do Gemini:', text);

        // Parse JSON response
        let extractedInfo;
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            extractedInfo = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('Erro ao parsear JSON:', parseError);
            extractedInfo = {
                business_type: 'negócio',
                products: [],
                payment_methods: [],
                integrations: [],
                detected_tags: []
            };
        }

        console.log('✅ Informações extraídas:', extractedInfo);

        res.json({
            success: true,
            data: extractedInfo
        });

    } catch (error) {
        console.error('❌ Erro na extração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar com Gemini',
            details: error.message
        });
    }
});

// Generate final sales agent prompt
router.post('/generate', async (req, res) => {
    try {
        const { extractedInfo, originalPrompt } = req.body;

        if (!extractedInfo) {
            return res.status(400).json({ success: false, error: 'Informações extraídas são obrigatórias' });
        }

        console.log('🎯 Gerando prompt de vendas...');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const generationPrompt = `Crie um prompt de sistema para um agente de vendas de WhatsApp baseado nas seguintes informações:

Tipo de negócio: ${extractedInfo.business_type}
Nome do negócio: ${extractedInfo.business_name || 'não especificado'}
Produtos: ${JSON.stringify(extractedInfo.products)}
Métodos de pagamento: ${extractedInfo.payment_methods?.join(', ') || 'não especificado'}
Integrações: ${extractedInfo.integrations?.join(', ') || 'nenhuma'}
Tom: ${extractedInfo.tone || 'amigável e profissional'}

Descrição original do usuário: "${originalPrompt}"

O prompt deve:
1. Ser em português brasileiro
2. Ser focado em VENDAS e conversão
3. Incluir os preços dos produtos
4. Instruir sobre métodos de pagamento
5. Ser persuasivo mas não invasivo
6. Ter no máximo 500 palavras

Retorne APENAS o prompt, sem explicações adicionais.`;

        const result = await model.generateContent(generationPrompt);
        const response = await result.response;
        const agentPrompt = response.text();

        console.log('✅ Prompt de vendas gerado!');
        console.log('='.repeat(50));
        console.log(agentPrompt);
        console.log('='.repeat(50));

        res.json({
            success: true,
            prompt: agentPrompt,
            extractedInfo
        });

    } catch (error) {
        console.error('❌ Erro na geração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar prompt',
            details: error.message
        });
    }
});

// Get business templates
router.get('/templates', (req, res) => {
    res.json({
        success: true,
        templates: BUSINESS_TEMPLATES
    });
});

export default router;
