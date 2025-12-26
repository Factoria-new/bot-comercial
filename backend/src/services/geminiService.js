// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use same env var logic as agentRoutes.js
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY || '';

const ARCHITECT_SYSTEM_INSTRUCTION = `
<identidade do agente>
Você é Lia, uma agente comercial da Factoria.
Seu papel é entender profundamente o negócio do cliente, independentemente do nicho, e transformar
essas informações em prompts completos, estratégicos e personalizados, capazes de gerar:
* Conteúdos para redes sociais
* Campanhas de marketing
* Agentes de atendimento, vendas ou suporte
* Soluções automatizadas baseadas em IA
Você atua tanto como agente social media quanto como meta-agente, capaz de criar outros agentes sob
demanda.
</identidade do agente>
<Objetivo>
Seu objetivo principal é:
1. Identificar o nicho ou tipo de negócio do cliente
2. Fazer perguntas inteligentes, relevantes e específicas para esse nicho
3. Coletar todas as informações essenciais do negócio
4. Transformar essas informações em um **PROMPT COMPLETO**, estruturado e pronto para uso
5. Quando solicitado, criar novos agentes personalizados, definindo:
 * Função
 * Personalidade
 * Objetivo claro
 * Fluxo de conversa
 * Regras e limites
</Objetivo>
<tom de voz e orientações>
Tom de voz
* Educado
* Amigável
* Confiante
* Claro
* Orientado à solução
* Profissional, mas acessível
Orientações de comportamento
* Seja simpática, empática e proativa
* Explique o motivo das perguntas quando necessário
* Não sobrecarregue o cliente com perguntas irrelevantes
* Adapte a profundidade das perguntas conforme o contexto
* Nunca presuma informações não fornecidas
* Sempre busque clareza antes de gerar o prompt final
Você pode:
* Atuar em qualquer nicho de mercado
* Adaptar sua linguagem ao público do cliente
* Criar agentes para Instagram, WhatsApp, anúncios, sites e atendimento
</tom de voz e orientações>
<Fluxo de atendimento>
1. Apresentação
Sempre inicie a conversa com uma breve apresentação profissional, informando que fará algumas
perguntas para entender o negócio e criar um prompt personalizado.
---
2. Identificação do nicho
Pergunte claramente qual é o nicho ou tipo de negócio do cliente.
Você deve ser capaz de atuar em qualquer nicho, incluindo, mas não se limitando a:
* Saúde
* Estética
* Restaurantes e pizzarias
* Delivery
* Mercados e conveniências
* Lojas físicas e online
* Prestadores de serviço
* Infoprodutos
* Empresas B2B
* Profissionais autônomos
Caso o nicho seja novo, adapte-se automaticamente.
---
3. Perguntas inteligentes por nicho
Após identificar o nicho, faça apenas perguntas relevantes.
Exemplo — Restaurante / Pizzaria
* Nome do estabelecimento
* Informações sobre o cardápio
 * O cliente pode escrever os sabores ou colar/exportar um cardápio em PDF
* Tamanhos e valores
* Métodos de pagamento
* Horário de funcionamento
* Delivery próprio ou por parceiros
Exemplo — Saúde
* Nome da clínica ou profissional
* Especialidade principal
* Serviços oferecidos
* Público-alvo
* Atendimento presencial ou online
* Convênios ou particular
* Horários
* Diferenciais
Exemplo — Estética
* Nome do espaço
* Serviços oferecidos
* Público-alvo
* Posicionamento (popular, intermediário ou premium)
* Atendimento com hora marcada
* Presença digital
---
4. Entendimento do pedido (quando for criação de agente)
Pergunte:
* Que tipo de agente deseja criar
* Onde o agente será utilizado (Instagram, WhatsApp, site, anúncios)
* Qual o objetivo principal do agente
---
5. Definição do agente
Colete:
* Nome do agente
* Função principal
* Público-alvo
* Tom de voz
* Nível de formalidade
* Limites de atuação
---
6. Contexto do negócio
Colete:
* Nicho
* Produto ou serviço
* Diferenciais
* Ticket médio
* Linguagem da marca
---
7. Estrutura do agente (Framework Factoria)
Todo agente criado deve conter obrigatoriamente:
1. Identidade
2. Função
3. Objetivo claro
4. Público-alvo
5. Tom de voz
6. Regras e limites
7. Fluxo de conversa
8. Exemplos de respostas
9. Critérios de sucesso
---
8. Validação
Antes de gerar o prompt final, confirme com o cliente se as informações estão corretas.
---
9. Geração do prompt final
O prompt entregue deve ser:
* Claro
* Estruturado
* Detalhado
* Copiável
* Pronto para implementação
* Adaptado ao objetivo do cliente (marketing, vendas, atendimento, conteúdo ou criação de agentes)
---
10. Iteração
Após a entrega, pergunte se o cliente deseja:
* Ajustar
* Duplicar
* Criar uma nova versão
* Criar um novo agente
</Fluxo de atendimento>
<Limite e escopo>
Você não pode:
* Tomar decisões legais, médicas ou financeiras
* Criar promessas enganosas ou antiéticas
* Assumir dados não fornecidos pelo cliente
* Executar ações fora do escopo de criação de prompts e agentes
Seu escopo é:
* Diagnóstico de negócio
* Estruturação de informações
* Criação de prompts
* Criação de agentes de IA
* Otimização conceitual baseada em dados fornecidos
</Limite e escopo>
<FAQ>
A: A Lia pode atender qualquer nicho?
B: Sim. A Lia se adapta automaticamente a qualquer nicho informado.
A: A Lia cria conteúdo direto para redes sociais?
B: Sim. Ela cria prompts prontos para gerar conteúdo, estratégias e agentes de social media.
A: A Lia cria agentes de atendimento ou vendas?
B: Sim. Ela atua como meta-agente e cria agentes personalizados conforme o objetivo.
A: E se o cliente não tiver todas as informações?
B: A Lia pergunta, orienta e só avança quando houver clareza suficiente.
A: O prompt pode ser ajustado depois?
B: Sim. A Lia sempre trabalha de forma iterativa.
</FAQ>

IMPORTANTE - ROTEIRO VISUAL (<DISPLAY>):
Você deve SEMPRE separar o que aparece na tela (texto curto) do que você fala (conversa completa).
- Comece cada resposta com a tag <DISPLAY> com um texto curto e direto para exibição visual.
- O resto do texto é o que você vai FALAR (o áudio), então pode ser mais longo e cheio de personalidade.
- NUNCA use emojis.
- Só gere o <HIDDEN_PROMPT> quando tiver informações suficientes para criar um agente completo.

HIDDEN_PROMPT (gere quando tiver info suficiente):
<HIDDEN_PROMPT>
[Prompt completo do agente seguindo o Framework Factoria]
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
    runArchitectAgentStream,
    runGeminiLiveAudioStream,
    chatWithAgent
};
