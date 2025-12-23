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

IMPORTANTE - ROTEIRO VISUAL (<DISPLAY>):
Você deve SEMPRE separar o que aparece na tela (texto curto) do que você fala (conversa completa).
Siga ESTRITAMENTE este roteiro para o texto visual:

1. Pergunta inicial (Nome) -> <DISPLAY>Qual o nome do seu negócio?</DISPLAY>
2. Pergunta sobre o ramo -> <DISPLAY>O seu negócio é sobre o que?</DISPLAY>
3. Pergunta sobre produtos -> <DISPLAY>Quais são os produtos?</DISPLAY>
4. Pergunta sobre preços -> <DISPLAY>Qual o valor?</DISPLAY>
5. Pergunta sobre pagamento/horário -> <DISPLAY>Mais alguma informação?</DISPLAY>

REGRAS:
- Comece cada resposta com a tag <DISPLAY> correspondente à fase da conversa.
- O texto dentro de <DISPLAY> deve ser EXATAMENTE um dos exemplos acima, ou muito similar (curto, direto).
- O resto do texto é o que você vai FALAR (o áudio), então pode ser mais longo, descontraído e cheio de personalidade.
- NUNCA use emojis.
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
        let buffer = ""; // Buffer to catch <DISPLAY> tags at the start
        let displayFound = false;
        let displayComplete = false;

        console.log('[Architect Stream] Stream object received');
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;

            // If we haven't finished processing the DISPLAY tag yet
            if (!displayComplete) {
                buffer += chunkText;

                // Check case: <DISPLAY> might already be in buffer, possibly not at start
                if (!displayFound && buffer.includes('<DISPLAY>')) {
                    displayFound = true;
                }

                if (displayFound) {
                    // Check if closing tag is here
                    if (buffer.includes('</DISPLAY>')) {
                        const match = buffer.match(/([\s\S]*?)<DISPLAY>([\s\S]*?)<\/DISPLAY>/);
                        if (match) {
                            // group 1: pre-tag text (could be noise or legit text)
                            // group 2: tag content
                            const preTagText = match[1].trim();
                            const displayContent = match[2].trim();

                            // If there is significant text before the tag, send it as audio
                            if (preTagText.length > 0) {
                                // Only send if it's not likely formatting junk like "```html" or quotes
                                if (!preTagText.includes('```')) {
                                    yield { type: 'text', content: preTagText + " " };
                                }
                            }

                            yield { type: 'display_text', content: displayContent };

                            // The remaining buffer after the tag is audio text
                            const remaining = buffer.split('</DISPLAY>')[1];
                            if (remaining) {
                                yield { type: 'text', content: remaining };
                            }

                            displayComplete = true; // Done with strict display parsing
                            buffer = "";
                        }
                    }
                } else {
                    // Not found yet. Safety net for buffer size.
                    // If buffer gets too large (>200) and no tag, simply dump it as text and stop looking
                    // This handles cases where the model refuses to use the tag.
                    if (buffer.length > 200) {
                        yield { type: 'text', content: buffer };
                        buffer = "";
                        displayComplete = true;
                    }
                }

            } else {
                // Display part is done, just emit everything as text (audio)
                if (chunkText) {
                    yield { type: 'text', content: chunkText };
                }
            }
        }

        // Flush any remaining buffer if we never found the closing tag (fallback)
        if (!displayComplete && buffer) {
            yield { type: 'text', content: buffer };
        }

        // Finally, check for HIDDEN_PROMPT in fullText
        if (fullText.includes('<HIDDEN_PROMPT>')) {
            const match = fullText.match(/<HIDDEN_PROMPT>([\s\S]*?)<\/HIDDEN_PROMPT>/);
            if (match) {
                yield { type: 'prompt', content: match[1].trim() };
            }
        }
        console.log('[Architect Stream] Generator function finished');

    } catch (error) {
        console.error('Erro no Architect Agent Stream:', error);
        console.error('Stack:', error.stack);
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

        // Also clean up <DISPLAY> tags from non-stream response
        if (visibleResponse.includes('<DISPLAY>')) {
            visibleResponse = visibleResponse.replace(/<DISPLAY>[\s\S]*?<\/DISPLAY>/, '').trim();
        }

        return {
            response: visibleResponse, // Texto para o chat ("Li seu site, achei ótimo...")
            newSystemPrompt: generatedPrompt // Prompt técnico para salvar no estado/banco
        };

    } catch (error) {
        console.error('Erro no Architect Agent:', error);

        // Se for a primeira interação (sem histórico), retorna uma saudação amigável padrão ("Persona Lia")
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
