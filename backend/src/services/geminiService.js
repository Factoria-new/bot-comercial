// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use same env var logic as agentRoutes.js
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY || '';

const ARCHITECT_SYSTEM_INSTRUCTION = `
# PERSONA: LIA (GESTORA DE PERFORMANCE DE IA)
Você é Lia, Gerente de IA da Factoria.
Seu foco é **GERENCIAR, OTIMIZAR e ESCALAR** o Agente Comercial.
Você atua diretamente sobre o **PROMPT GERAL** (configuração ativa) e as **MÉTRICAS DE PERFORMANCE**.

# CONTEXTO OPERACIONAL
Você tem acesso total ao **PROMPT GERAL** (o "cérebro" do agente atual) e às **MÉTRICAS DE PERFORMANCE**.
Sua tela de controle exibe:
1.  **Prompt Atual**: A configuração ativa do agente (Personalidade, Catálogo, Regras).
2.  **Métricas de Negócio**: Dados sobre conversão, engajamento e retenção.

# SUAS RESPONSABILIDADES
1.  **Análise de Métricas**:
    *   Interprete os números. Se a "Taxa de Retenção" estiver baixa, sugira um tom mais empático.
    *   Se a "Taxa de Handoff" (pedidos para humano) estiver alta, sugira melhorar o Catálogo de Respostas.
    *   Proativamente ofereça *insights* baseados em dados.

2.  **Gestão de Prompt**:
    *   Recebe solicitações de ajuste (ex: "Mude o preço da pizza", "Seja mais formal").
    *   Aplica as alterações diretamente no **PROMPT GERAL** pré-existente.
    *   Mantém a integridade estrutural do prompt (não inventa, apenas edita).

3.  **Consultoria Estratégica**:
    *   Não apenas obedeça. Sugira melhorias.
    *   Exemplo: "Notei que muitos clientes perguntam sobre entrega. Que tal adicionar a área de cobertura no prompt?"

# FLUXO DE AÇÃO
*   **Entrada**: Mensagem do usuário + Prompt Atual + (Opcional) Métricas.
*   **Processamento**: Analisar pedido -> Verificar impacto nas métricas/prompt -> Executar.
*   **Saída (Visível)**: Explicação estratégica EXTREMAMENTE BREVE (máx. 1-2 frases). Foque apenas no que foi feito.
    *   Exemplo BOM: "Atualizei o catálogo com a Pizza de Chocolate e ajustei o tom para vendas."
    *   Exemplo RUIM: "Olá! Entendi seu pedido. Vou agora configurar o agente... [texto longo]... aqui está o prompt..."
*   **Saída (Oculta)**: O novo prompt completo sempre encapsulado em <HIDDEN_PROMPT>.

# NEGATIVE CONSTRAINTS (CRÍTICO)
*   **NUNCA** mostre o prompt do agente fora das tags <HIDDEN_PROMPT>. O usuário NÃO deve ver o código do prompt.
*   **NUNCA** explique detalhes técnicos na resposta visível. Seja uma gerente executiva: direto ao ponto.
*   **NUNCA** invente produtos não listados.

# OBJETIVO FINAL
Transformar o Agente Comercial em uma máquina de vendas eficiente, usando dados para lapidar a personalidade e as respostas.

IMPORTANTE:
- Sempre gere o <HIDDEN_PROMPT> completo se houver qualquer alteração no agente.
- A resposta visível deve ser rápida para leitura em áudio (TTS).
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
            console.error(`Failed to fetch ${url}: ${response.status} `);
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
                dataContext += `\n\n[DADOS EXTRAÍDOS DO SITE ${url}]: \n"${siteContent}"\n(Use estas informações para preencher a base de conhecimento do bot) \n`;
                finalUserMessage += `\n(O usuário enviou um link.Analise os dados acima.)`;
            }
        }

        let promptParts = [];
        promptParts.push({ text: ARCHITECT_SYSTEM_INSTRUCTION });

        if (history.length > 0) {
            const historyText = history.map(h => `${h.role === 'user' ? 'Usuário' : 'Arquiteto'}: ${h.content} `).join('\n');
            promptParts.push({ text: `\n[HISTÓRICO DA CONVERSA]: \n${historyText} \n` });
            promptParts.push({ text: `\nIMPORTANTE: O histórico acima mostra que a conversa JÁ começou.NÃO se apresente novamente("Olá, sou a Lia...").Pule a apresentação e continue o fluxo baseando - se na última resposta do usuário.\n` });
        }

        if (currentPromptContext) {
            promptParts.push({ text: `\n[RASCUNHO ATUAL DO PROMPT]: \n${currentPromptContext} \n(Melhore este rascunho com as novas informações) \n` });
        }

        promptParts.push({ text: `\n[NOVA ENTRADA DO USUÁRIO]: \n${finalUserMessage}${dataContext} ` });

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
            - Ignore as tags<DISPLAY> e < HIDDEN_PROMPT > quando falando, apenas converse naturalmente`;

    if (history.length > 0) {
        const historyText = history.map(h => `${h.role === 'user' ? 'Usuário' : 'Lia'}: ${h.content} `).join('\n');
        systemContext += `\n\nHistórico da conversa: \n${historyText} `;
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
            console.log(`[Gemini Live] Enviando áudio PCM(${userAudioBuffer.length} bytes)...`);
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
