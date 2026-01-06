// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use same env var logic as agentRoutes.js
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY || '';

const ARCHITECT_SYSTEM_INSTRUCTION = `
# PERSONA: LIA (ARQUITETA DE IA)
Você é Lia, a assistente comercial estratégica da Factoria. Sua especialidade é a meta-programação de personas digitais: você converte dados brutos de negócios em instruções de sistema de alta performance.

# MISSÃO
Transformar dados estruturados (recebidos via SYSTEM_DATA_INJECTION ou formulário) em um **PROMPT DE SISTEMA** final.
* **Ação Direta**: Receber Dados -> Processar -> Gerar Prompt.
* **Sem Diálogo Prévio**: Não realize entrevistas, diagnósticos ou perguntas de acompanhamento.

# DIRETRIZES OPERACIONAIS
1. **Tom de Voz**: Profissional, técnico e extremamente objetivo.
2. **Saída Visível**: Respostas curtas e sucintas (ex: "Configuração concluída. Prompt atualizado.").
3. **Saída Estruturada**: O prompt final deve residir obrigatoriamente dentro da tag <HIDDEN_PROMPT>.

# REGRAS DE INTEGRIDADE (CRÍTICO)
* **Fidelidade Absoluta**: Utilize apenas as informações fornecidas (Nicho, Nome, Produtos, Tom de voz).
* **Vedação a Alucinações**: É terminantemente proibido inventar, sugerir ou deduzir produtos, serviços, preços ou itens de cardápio que não constem nos dados originais.
* **Escopo Fechado**: Se o input cita apenas um item, o agente gerado deve ignorar qualquer item não mencionado.

# FLUXO DE TRABALHO
1. **Geração Inicial**: Ao receber os dados, gere imediatamente o <HIDDEN_PROMPT>.
2. **Iteração e Ajuste**: Ao receber solicitações de alteração, reescreva o <HIDDEN_PROMPT> incorporando as novas instruções e mantenha a estrutura anterior.

# FRAMEWORK DE ESTRUTURAÇÃO (FACTORIA)
O conteúdo dentro de <HIDDEN_PROMPT> deve seguir obrigatoriamente esta ordem:
1.  **Identidade e Função**: Quem o agente é e o que ele faz.
2.  **Objetivo Principal**: O que ele deve realizar na interação.
3.  **Público-alvo e Tom de Voz**: Como ele deve falar e com quem.
4.  **Contexto e Diferenciais**: Informações sobre a empresa.
5.  **Catálogo/Serviços**: Cópia exata dos itens fornecidos (sem adições).
6.  **Regras e Limites**: O que o agente não pode fazer ou dizer.
7.  **Script/Exemplos**: Exemplos de diálogos curtos para guiar o comportamento.

# RESTRIÇÕES FINAIS
- Proibido o uso de emojis.
- Proibido o uso de tags de interface obsoletas (ex: <OPEN_MODAL>).
- O <HIDDEN_PROMPT> é obrigatório em todas as respostas de criação ou edição.
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
 * Agente Arquiteto: Versão Non-Streaming (Texto Estático)
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userMessage - Mensagem do usuário
 * @param {Buffer|null} userAudioBuffer - Buffer de áudio (opcional)
 * @param {Array} history - Histórico da conversa
 * @param {string} currentPromptContext - Rascunho atual do prompt do bot
 * @returns {Object} - { success: boolean, message: string, systemPrompt?: string }
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
            promptParts.push({ text: `\nIMPORTANTE: O histórico acima mostra que a conversa JÁ começou. NÃO se apresente novamente ("Olá, sou a Lia..."). Pule a apresentação e continue o fluxo baseando-se na última resposta do usuário.\n` });
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

        console.log('[Architect] Generating content...');
        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();

        console.log('[Architect] Response received. Length:', responseText.length);

        let finalResponse = responseText;
        let foundSystemPrompt = null;

        // Robust HIDDEN_PROMPT Extraction
        if (responseText.includes('<HIDDEN_PROMPT>')) {
            console.log('[Architect] Found HIDDEN_PROMPT');

            // Try standard regex first (greedy match for content between tags)
            const match = responseText.match(/<HIDDEN_PROMPT>([\s\S]*?)<\/HIDDEN_PROMPT>/);

            if (match) {
                foundSystemPrompt = match[1].trim();
                // Remove prompt from final message shown to user
                finalResponse = finalResponse.replace(/<HIDDEN_PROMPT>[\s\S]*?<\/HIDDEN_PROMPT>/, '').trim();
            } else {
                // Fallback: If closing tag is missing (truncation), take everything after opening tag
                console.warn('[Architect] Valid HIDDEN_PROMPT closing tag not found. Using fallback extraction.');
                const parts = responseText.split('<HIDDEN_PROMPT>');
                if (parts.length > 1) {
                    foundSystemPrompt = parts[1].trim();
                    // Remove prompt from final message shown to user
                    finalResponse = parts[0].trim();
                }
            }
        }

        return {
            success: true,
            message: finalResponse,
            systemPrompt: foundSystemPrompt
        };

    } catch (error) {
        console.error('Erro no Architect Agent:', error);
        return {
            success: false,
            message: "Desculpe, tive um probleminha aqui...",
        };
    }
}

/**
 * Chat simples com um assistente já criado
 * 
 * @param {string} message - Mensagem do usuário
 * @param {string} systemPrompt - System prompt do assistente criado
 * @param {Array} history - Histórico de conversa (opcional)
 * @returns {Object} { success, message }
 */
export async function chatWithAgent(message, systemPrompt, history = []) {
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

        // Build conversation history for context
        const chatHistory = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        }));

        // Start chat with history
        const chat = model.startChat({
            history: chatHistory
        });

        // Send new message
        const result = await chat.sendMessage(message);
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

/**
 * Gemini Live API - Streaming de áudio em tempo real via WebSocket
 * Usa ai.live.connect() para comunicação bidirecional instantânea
 * 
 * @param {string} userId - ID do usuário
 * @param {string} userMessage - Mensagem de texto do usuário
 * @param {Buffer|null} userAudioBuffer - Buffer de áudio do usuário (opcional)
 * @param {Array} history - Histórico da conversa
 * @returns {AsyncGenerator} - Stream de chunks de áudio em tempo real
 */
export async function* runGeminiLiveAudioStream(userId, userMessage, userAudioBuffer = null, history = []) {
    const { GoogleGenAI, Modality } = await import('@google/genai');

    if (!API_KEY) throw new Error('GEMINI_API_KEY não configurada');

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Fila de mensagens recebidas do servidor
    const responseQueue = [];
    let sessionClosed = false;
    let sessionError = null;

    // Usar exatamente o mesmo prompt da Lia para áudio
    // Apenas adicionar instruções específicas para comunicação por voz
    let systemContext = ARCHITECT_SYSTEM_INSTRUCTION + `

INSTRUÇÕES ESPECÍFICAS PARA ÁUDIO:
- Fale de forma breve e natural, como numa conversa de telefone
- NUNCA use formatação markdown pois você está falando
- Responda em português do Brasil
- Ignore as tags <DISPLAY> e <HIDDEN_PROMPT> quando falando, apenas converse naturalmente`;

    if (history.length > 0) {
        const historyText = history.map(h => `${h.role === 'user' ? 'Usuário' : 'Lia'}: ${h.content}`).join('\n');
        systemContext += `\n\nHistórico da conversa:\n${historyText}`;
    }

    console.log('[Gemini Live] Conectando ao Live API...');

    let session = null;

    try {
        // Conectar ao Gemini Live API via WebSocket
        session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: systemContext,
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Kore',
                        },
                    },
                },
            },
            callbacks: {
                onopen: () => {
                    console.log('[Gemini Live] ✅ Conectado ao Live API');
                },
                onmessage: (message) => {
                    try {
                        responseQueue.push(message);
                    } catch (e) {
                        console.error('[Gemini Live] Erro ao processar mensagem:', e);
                    }
                },
                onerror: (e) => {
                    console.error('[Gemini Live] ❌ Erro:', e?.message || e);
                    sessionError = e;
                    sessionClosed = true;
                },
                onclose: (e) => {
                    console.log('[Gemini Live] 🔌 Conexão fechada:', e?.reason || 'normal');
                    sessionClosed = true;
                },
            },
        });

        console.log('[Gemini Live] Enviando mensagem...');

        // Enviar a mensagem de texto
        if (userMessage) {
            await session.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: userMessage }] }],
                turnComplete: true,
            });
        } else if (userAudioBuffer) {
            // Enviar áudio PCM do usuário para o Live API
            console.log(`[Gemini Live] Enviando áudio PCM (${userAudioBuffer.length} bytes)...`);
            await session.sendRealtimeInput({
                audio: {
                    data: userAudioBuffer.toString('base64'),
                    mimeType: 'audio/pcm;rate=16000'
                }
            });
            // Indicar fim do turno após enviar todo o áudio
            await session.sendRealtimeInput({ audioStreamEnd: true });
        }

        console.log('[Gemini Live] Aguardando resposta em áudio...');

        // Processar respostas em tempo real
        const maxWaitTime = 30000; // 30 segundos máximo
        const startTime = Date.now();

        while (!sessionClosed && Date.now() - startTime < maxWaitTime) {
            // Verificar erros
            if (sessionError) {
                yield { type: 'error', content: sessionError.message };
                break;
            }

            // Processar mensagens da fila
            while (responseQueue.length > 0) {
                const message = responseQueue.shift();

                // Verificar interrupção
                if (message.serverContent?.interrupted) {
                    console.log('[Gemini Live] ⚠️ Interrompido');
                    continue;
                }

                // Processar partes do turno do modelo
                if (message.serverContent?.modelTurn?.parts) {
                    for (const part of message.serverContent.modelTurn.parts) {
                        // Áudio recebido
                        if (part.inlineData?.data) {
                            console.log(`[Gemini Live] 🔊 Audio chunk recebido`);
                            yield {
                                type: 'audio_chunk',
                                data: part.inlineData.data,
                                mimeType: part.inlineData.mimeType || 'audio/pcm'
                            };
                        }
                        // Texto recebido (transcrição)
                        if (part.text) {
                            yield {
                                type: 'text',
                                content: part.text
                            };
                        }
                    }
                }

                // Verificar se o turno terminou
                if (message.serverContent?.turnComplete) {
                    console.log('[Gemini Live] ✅ Turno completo');
                    sessionClosed = true;
                    break;
                }
            }

            // Pequena pausa para não sobrecarregar o CPU
            if (!sessionClosed) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        yield { type: 'complete' };

    } catch (error) {
        console.error('[Gemini Live] Erro:', error);
        yield { type: 'error', content: error.message || "Erro na conexão Live API" };
    } finally {
        // Garantir que a sessão seja fechada
        if (session) {
            try {
                await session.close();
                console.log('[Gemini Live] Sessão fechada com sucesso');
            } catch (e) {
                // Ignorar erros ao fechar (pode já estar fechada)
            }
        }
    }
}

export default {
    runArchitectAgent,
    runGeminiLiveAudioStream,
    chatWithAgent
};
