// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use same env var logic as agentRoutes.js
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY || '';

const ARCHITECT_SYSTEM_INSTRUCTION = `
Você é a Lia, uma garota jovem e descolada que trabalha na Factoria. Você conversa como amiga, não como robô.

PERSONALIDADE:
- Fale como se estivesse no WhatsApp com um amigo
- Varie suas respostas, nunca repita a mesma frase
- Reaja ao que o usuário disser ("Que legal!", "Hmm entendi", "Show!")  
- Faça conexões ("Ah massa, eu adoro pizza!")
- Pergunte de forma natural, não interrogatório

O QUE VOCÊ PRECISA DESCOBRIR (um de cada vez):
- Nome do negócio
- O que vende
- Produtos principais e preços
- Horário e formas de pagamento

COMO FALAR:
Bom: "E aí, qual o nome do seu negócio?"
Bom: "Show! Pizza sempre é bom. Quais sabores vocês mais vendem?"
Bom: "Hmm, e qual o preço? Tipo, uma grande sai quanto?"

Ruim: "Qual o nome da sua empresa?"
Ruim: "Quais são os produtos principais?"
Ruim: Fazer várias perguntas de uma vez

IMPORTANTE:
- NUNCA use emojis em suas respostas.
- Use frases curtas e diretas para manter a conversa ágil.
- Reaja ao contexto antes de perguntar
- Só gere o <HIDDEN_PROMPT> quando tiver nome + tipo de negócio + pelo menos 1 produto com preço

HIDDEN_PROMPT (gere quando tiver info suficiente):
<HIDDEN_PROMPT>
Você é o assistente da [nome].
[descrição curta]
Produtos: [lista]
</HIDDEN_PROMPT>
`;

/**
 * Scrape website content (simplified version)
 * In production, use a proper scraping service like Puppeteer or an API
 */
async function scrapeWebsite(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FactoriaBot/1.0)'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            return null;
        }

        const html = await response.text();

        // Basic HTML to text conversion (remove tags, scripts, styles)
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Limit to first 5000 characters to avoid context overflow
        return text.substring(0, 5000);
    } catch (error) {
        console.error('Scraping error:', error);
        return null;
    }
}

/**
 * Agente Arquiteto: Versão Stream
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userMessage - Mensagem do usuário
 * @param {Buffer|null} userAudioBuffer - Buffer de áudio (opcional)
 * @param {Array} history - Histórico da conversa
 * @param {string} currentPromptContext - Rascunho atual do prompt do bot
 * @returns {AsyncGenerator} - Stream de chunks de texto
 */
export async function* runArchitectAgentStream(userId, userMessage, userAudioBuffer = null, history = [], currentPromptContext = "") {
    try {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY não configurada');
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: { temperature: 0.7 }
        });

        let finalUserMessage = userMessage || "";
        let dataContext = "";

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = finalUserMessage.match(urlRegex);

        if (urls && urls.length > 0) {
            const url = urls[0];
            const siteContent = await scrapeWebsite(url);
            if (siteContent) {
                dataContext += `\n\n[DADOS EXTRAÍDOS DO SITE ${url}]:\n"${siteContent}"\n(Use estas informações para preencher a base de conhecimento do bot)\n`;
                finalUserMessage += `\n(O usuário enviou um link. Analise os dados acima.)`;
            }
        }

        let promptParts = [];
        promptParts.push({ text: ARCHITECT_SYSTEM_INSTRUCTION });

        if (history.length > 0) {
            const historyText = history.map(h => `${h.role === 'user' ? 'Usuário' : 'Arquiteto'}: ${h.content}`).join('\n');
            promptParts.push({ text: `\n[HISTÓRICO DA CONVERSA]:\n${historyText}\n` });
        }

        if (currentPromptContext) {
            promptParts.push({ text: `\n[RASCUNHO ATUAL DO PROMPT]:\n${currentPromptContext}\n(Melhore este rascunho com as novas informações)\n` });
        }

        promptParts.push({ text: `\n[NOVA ENTRADA DO USUÁRIO]:\n${finalUserMessage}${dataContext}` });

        if (userAudioBuffer) {
            promptParts.push({
                inlineData: {
                    data: userAudioBuffer.toString("base64"),
                    mimeType: "audio/ogg"
                }
            });
            promptParts.push({ text: "\n(Analise o áudio acima com atenção aos detalhes do negócio)" });
        }

        console.log('[Architect Stream] Starting stream...');
        const result = await model.generateContentStream(promptParts);

        let fullText = "";
        let buffer = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            buffer += chunkText;

            // Split into smaller blocks for faster audio turnaround
            // Matches ., !, ?, or , followed by space or newline
            const parts = buffer.split(/([.!?;,]\s+)/);

            // If we have at least one complete chunk
            if (parts.length > 2) {
                // Send all complete sentences/chunks
                for (let i = 0; i < parts.length - 1; i += 2) {
                    const chunkText = parts[i] + (parts[i + 1] || "");
                    if (chunkText.trim() && !chunkText.includes('<HIDDEN_PROMPT>')) {
                        yield { type: 'text', content: chunkText };
                    }
                }
                // Keep the remainder in buffer
                buffer = parts[parts.length - 1];
            }
        }

        // Send remaining buffer if it's not part of HIDDEN_PROMPT
        if (buffer.trim() && !buffer.includes('<HIDDEN_PROMPT>')) {
            yield { type: 'text', content: buffer };
        } else if (buffer.includes('<HIDDEN_PROMPT>')) {
            // If the buffer contains part of hidden prompt, we process fullText at the end
        }

        // Finally, check for HIDDEN_PROMPT in fullText
        if (fullText.includes('<HIDDEN_PROMPT>')) {
            const match = fullText.match(/<HIDDEN_PROMPT>([\s\S]*?)<\/HIDDEN_PROMPT>/);
            if (match) {
                yield { type: 'prompt', content: match[1].trim() };
            }
        }

    } catch (error) {
        console.error('Erro no Architect Agent Stream:', error);
        yield { type: 'error', content: "Desculpe, tive um probleminha aqui..." };
    }
}

/**
 * Agente Arquiteto: O cérebro que constrói outros bots
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userMessage - Mensagem do usuário
 * @param {Buffer|null} userAudioBuffer - Buffer de áudio (opcional)
 * @param {Array} history - Histórico da conversa
 * @param {string} currentPromptContext - Rascunho atual do prompt do bot
 * @returns {Object} { response, newSystemPrompt }
 */
export async function runArchitectAgent(userId, userMessage, userAudioBuffer = null, history = [], currentPromptContext = "") {
    try {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY não configurada');
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: { temperature: 0.7 }
        });

        let finalUserMessage = userMessage || "";
        let dataContext = "";

        // --- 1. Lógica de Scraping (Se houver URL na mensagem) ---
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = finalUserMessage.match(urlRegex);

        if (urls && urls.length > 0) {
            const url = urls[0];
            console.log(`[Architect] Scraping URL: ${url}`);

            const siteContent = await scrapeWebsite(url);

            if (siteContent) {
                dataContext += `\n\n[DADOS EXTRAÍDOS DO SITE ${url}]:\n"${siteContent}"\n(Use estas informações para preencher a base de conhecimento do bot)\n`;
                finalUserMessage += `\n(O usuário enviou um link. Analise os dados acima.)`;
            }
        }

        // --- 2. Construir o Prompt Multimodal ---
        let promptParts = [];

        // Injeta o System Prompt do Arquiteto
        promptParts.push({ text: ARCHITECT_SYSTEM_INSTRUCTION });

        // Injeta o histórico da conversa (para manter o fio da meada)
        if (history.length > 0) {
            const historyText = history.map(h => `${h.role === 'user' ? 'Usuário' : 'Arquiteto'}: ${h.content}`).join('\n');
            promptParts.push({ text: `\n[HISTÓRICO DA CONVERSA]:\n${historyText}\n` });
        }

        // Injeta o Prompt Atual (Rascunho) para ele saber o que já construiu
        if (currentPromptContext) {
            promptParts.push({ text: `\n[RASCUNHO ATUAL DO PROMPT]:\n${currentPromptContext}\n(Melhore este rascunho com as novas informações)\n` });
        }

        // Injeta a mensagem atual + dados do site
        promptParts.push({ text: `\n[NOVA ENTRADA DO USUÁRIO]:\n${finalUserMessage}${dataContext}` });

        // Se houver áudio, anexa o blob (Gemini processa nativamente)
        if (userAudioBuffer) {
            promptParts.push({
                inlineData: {
                    data: userAudioBuffer.toString("base64"),
                    mimeType: "audio/ogg"
                }
            });
            promptParts.push({ text: "\n(Analise o áudio acima com atenção aos detalhes do negócio)" });
        }

        // --- 3. Execução ---
        console.log('[Architect] Generating response...');
        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();
        console.log('[Architect] Response received');

        // --- 4. Processamento da Saída (Extrair o <HIDDEN_PROMPT>) ---
        let visibleResponse = responseText;
        let generatedPrompt = null;

        if (responseText.includes('<HIDDEN_PROMPT>')) {
            const match = responseText.match(/<HIDDEN_PROMPT>([\s\S]*?)<\/HIDDEN_PROMPT>/);
            if (match) {
                generatedPrompt = match[1].trim();
                // Remove a tag técnica para o usuário ver apenas a resposta amigável
                visibleResponse = responseText.replace(/<HIDDEN_PROMPT>[\s\S]*?<\/HIDDEN_PROMPT>/, '').trim();
            }
        }

        return {
            response: visibleResponse, // Texto para o chat ("Li seu site, achei ótimo...")
            newSystemPrompt: generatedPrompt // Prompt técnico para salvar no estado/banco
        };

    } catch (error) {
        console.error('Erro no Architect Agent:', error);

        // Se for a primeira interação (sem histórico), retorna uma saudação amigável padrão ("Persona Lia")
        // Isso evita erros feios logo no início se a API falhar ou demorar
        // Se for a primeira interação (sem histórico), retorna uma saudação amigável padrão ("Persona Lia")
        // Isso evita erros feios logo no início se a API falhar ou demorar
        if (!history || history.length === 0) {
            return {
                response: "Oiii! Tudo bem? Sou a Lia, sua parceira aqui na Factoria! Vamos criar um agente de vendas incrível pro seu negócio? Pra começar, me conta: qual é o nome da sua empresa?",
                newSystemPrompt: null
            };
        }

        // Fallback amigável para outros erros no meio da conversa
        return {
            response: "Ops, deu um pequeno problema aqui nos meus circuitos... Pode repetir, por favor?", // Mais descontraído que o anterior
            newSystemPrompt: null
        };
    }
}

/**
 * Chat simples com um agente já criado
 * 
 * @param {string} message - Mensagem do usuário
 * @param {string} systemPrompt - System prompt do agente criado
 * @returns {Object} { success, message }
 */
export async function chatWithAgent(message, systemPrompt) {
    try {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY não configurada');
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: systemPrompt,
            generationConfig: { temperature: 0.7 }
        });

        const result = await model.generateContent(message);
        const responseText = result.response.text();

        return {
            success: true,
            message: responseText
        };

    } catch (error) {
        console.error('Erro no chat com agente:', error);
        return {
            success: false,
            message: "Desculpe, tive um problema. Tente novamente."
        };
    }
}

export default {
    runArchitectAgent,
    runArchitectAgentStream,
    chatWithAgent
};
