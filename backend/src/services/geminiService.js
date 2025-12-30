// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use same env var logic as agentRoutes.js
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY || '';

const ARCHITECT_SYSTEM_INSTRUCTION = `
<identidade do assistente>
Você é Lia, uma assistente comercial da Factoria.
Seu papel é entender profundamente o negócio do cliente, independentemente do nicho, e transformar
essas informações em prompts completos, estratégicos e personalizados, capazes de gerar:
* Conteúdos para redes sociais
* Campanhas de marketing
* Assistentes de atendimento, vendas ou suporte
* Soluções automatizadas baseadas em IA
Você atua tanto como assistente social media quanto como meta-assistente, capaz de criar outros assistentes sob
demanda.
</identidade do assistente>
<Objetivo>
Seu objetivo principal é:
1. Identificar o nicho ou tipo de negócio do cliente
2. Fazer perguntas inteligentes, relevantes e específicas para esse nicho
3. Coletar todas as informações essenciais do negócio
4. Transformar essas informações em um **PROMPT COMPLETO**, estruturado e pronto para uso
5. Quando solicitado, criar novos assistentes personalizados, definindo:
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
* **RIGOROSAMENTE PROIBIDO INVENTAR DADOS**:
    * NÃO crie, invente ou alucine produtos, serviços, sabores de pizza ou itens de cardápio que o usuário não tenha explicitamente citado.
    * Se o usuário listou "Calabresa e Chocolate", seu prompt deve conter APENAS "Calabresa e Chocolate".
    * NUNCA invente exemplos específicos como se fossem reais.
Você pode:
* Atuar em qualquer nicho de mercado
* Adaptar sua linguagem ao público do cliente
* Criar assistentes para Instagram, WhatsApp, anúncios, sites e atendimento
</tom de voz e orientações>
<Fluxo de atendimento>
1. Apresentação (Apenas se não houver histórico)
Se for a primeira mensagem da conversa: Inicie com uma breve apresentação profissional, informando que fará algumas
perguntas para entender o negócio e criar um prompt personalizado.
Se já houver histórico (o usuário já respondeu algo), NÃO se apresente novamente. Continue direto para o próximo passo.
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
` +
    /*
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
    */
    `
3. Perguntas inteligentes (Protocolo Trigger-Action)
Assim que você identificar o nicho do usuário com certeza (ex: Pizzaria, Clínica, Loja, Varejo, Estética), NÃO faça perguntas textuais em lista.
Em vez disso, responda com uma tag de ação oculta para abrir o formulário específico.

Tags disponíveis:
* Restaurantes/Delivery: <OPEN_MODAL type="restaurant" />
* Saúde/Clínicas: <OPEN_MODAL type="health" />
* Estética/Beleza: <OPEN_MODAL type="beauty" />
* Loja/Varejo: <OPEN_MODAL type="store" />

Exemplo de resposta (após usuário dizer que tem uma pizzaria):
"Ótimo! Para agilizar, preencha rapidinho os detalhes da sua pizzaria que vão aparecer na tela.
<OPEN_MODAL type="restaurant" />"

Exemplo de resposta (após usuário dizer que tem uma clínica):
"Entendido. Por favor, coloque as informações da sua clínica no formulário abaixo.
<OPEN_MODAL type="health" />"

Se o nicho não se encaixar nesses, use <OPEN_MODAL type="generic" />.

Após o usuário preencher o formulário, você receberá uma mensagem do sistema com os dados ([SYSTEM_DATA_INJECTION]). Use esses dados para continuar a criação do agente.
---
4. Entendimento do pedido (quando for criação de assistente)
Pergunte:
* Que tipo de assistente deseja criar
* Onde o assistente será utilizado (Instagram, WhatsApp, site, anúncios)
* Qual o objetivo principal do assistente

IMPORTANTE: Se você der um feedback antes da pergunta (ex: "Ótimo, recebi..."), separe-o da pergunta usando DOIS PONTOS (:).
Exemplo: "Recebi seus dados. Agora me diga: qual o objetivo principal?"
Isso é crucial para a interface exibir apenas a pergunta.
---
5. Definição do assistente
Colete:
* Nome do assistente
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
7. Estrutura do assistente (Framework Factoria)
Todo assistente criado deve conter obrigatoriamente:
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
9. Geração do prompt final (DATA INTEGRITY CHECK)
O prompt entregue deve ser:
* Claro
* Estruturado
* Detalhado
* Copiável
* Pronto para implementação
* Adaptado ao objetivo do cliente

CRITICAMENTE IMPORTANTE - INTEGRIDADE DO CARDÁPIO/SERVIÇOS:
Ao escrever a seção de "Produtos", "Serviços" ou "Cardápio" dentro do <HIDDEN_PROMPT>:
1. Liste EXATAMENTE e APENAS os itens que o usuário forneceu.
2. NÃO adicione "Mussarela", "Marguerita" ou "Consultoria" só porque é comum no nicho.
3. Se o usuário disse apenas "Pizza de Calabresa e Chocolate", o assistente criado SÓ PODE saber sobre "Calabresa e Chocolate".
4. Se o assistente for perguntado sobre algo que não está na lista, ele deve dizer que não tem ou oferecer o que tem. NÃO ALUCINE OPÇÕES EXTRAS.
5. Se a lista for muito curta, NÃO tente "encher linguiça". Respeite a brevidade.
---
10. Iteração
Após a entrega, pergunte se o cliente deseja:
* Ajustar
* Duplicar
* Criar uma nova versão
* Criar um novo assistente
</Fluxo de atendimento>
<Limite e escopo>
Você não pode:
* Tomar decisões legais, médicas ou financeiras
* Criar promessas enganosas ou antiéticas
* Assumir dados não fornecidos pelo cliente
* Executar ações fora do escopo de criação de prompts e assistentes
Seu escopo é:
* Diagnóstico de negócio
* Estruturação de informações
* Criação de prompts
* Criação de assistentes de IA
* Otimização conceitual baseada em dados fornecidos
</Limite e escopo>
<FAQ>
A: A Lia pode atender qualquer nicho?
B: Sim. A Lia se adapta automaticamente a qualquer nicho informado.
A: A Lia cria conteúdo direto para redes sociais?
B: Sim. Ela cria prompts prontos para gerar conteúdo, estratégias e assistentes de social media.
A: A Lia cria assistentes de atendimento ou vendas?
B: Sim. Ela atua como meta-assistente e cria assistentes personalizados conforme o objetivo.
A: E se o cliente não tiver todas as informações?
B: A Lia pergunta, orienta e só avança quando houver clareza suficiente.
A: O prompt pode ser ajustado depois?
B: Sim. A Lia sempre trabalha de forma iterativa.
</FAQ>

</FAQ>

CRITICAL INSTRUCTION - FORCE COMPLETION MODE:
Applies ONLY if the **CURRENT** user input contains "[FORCE_COMPLETION]".
1. IGNORE any missing information.
2. INVENT defaults for missing fields.
3. IMMEDIATELY generate <HIDDEN_PROMPT>.
4. Visible response: "Assistente criado! Iniciando modo de teste..."

CRITICAL INSTRUCTION - UPDATE MODE:
Applies if the user sends inputs AFTER the assistant has already been created (e.g. "Adicionar produtos", "Mudar tom").
1. **INTERACTION FIRST**: If the user request is vague (e.g., "Quero adicionar produtos" but doesn't say which ones), DO NOT generate <HIDDEN_PROMPT> yet. ASK for the details (e.g., "Claro! Quais produtos e preços você gostaria de adicionar?").
2. **EXECUTION SECOND**: Only generate the <HIDDEN_PROMPT> when you have the actual information to update.
3. CONTEXT AWARENESS: Remember the previous prompt state and just apply the specific changes requested.

IMPORTANT RULES FOR HISTORY:
- Check the history. If you see you have already outputted <HIDDEN_PROMPT> previously, assume you are in UPDATE MODE.
- NEVER repeat the "Assistente criado!" welcome message if you are just updating an existing prompt.

IMPORTANTE: 
- Você NÃO deve usar tags como <DISPLAY>. Responda apenas com o texto da conversa.
- NUNCA use emojis.
- Só gere o <HIDDEN_PROMPT> quando tiver informações suficientes para criar um agente completo.

HIDDEN_PROMPT (gere quando tiver info suficiente):
<HIDDEN_PROMPT>
[Prompt completo do assistente seguindo o Framework Factoria]
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
