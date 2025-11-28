import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import logger from '../config/logger.js';

// Usar createRequire para carregar pdf-parse (CommonJS) em ES module
const require = createRequire(import.meta.url);
let pdfParse;

// Cache de histórico por número de telefone
const userConversations = new Map();

// Configurações fixas do sistema
const FIXED_MODEL = 'gemini-2.5-flash';
const FIXED_TEMPERATURE = 1.0;
const CACHE_TTL_MINUTES = process.env.GEMINI_CACHE_TTL ? parseInt(process.env.GEMINI_CACHE_TTL) : 60; // Tempo de vida do cache em minutos

// Cache local para rastrear caches criados no Gemini (hash -> { name, expireTime })
const systemPromptCache = new Map();

// Diretrizes fixas que SEMPRE serão aplicadas
const SYSTEM_GUIDELINES = `
Diretrizes:
- Seja sempre educado e respeitoso
- Forneça respostas precisas e úteis
- Se não souber algo, admita honestamente
- Adapte seu tom ao contexto da conversa
- Mantenha as respostas concisas quando possível
`;

/**
 * Combina o prompt personalizado do usuário com as diretrizes fixas do sistema
 */
function buildSystemPrompt(customPrompt = '') {
  if (customPrompt && customPrompt.trim()) {
    return `${customPrompt.trim()}\n\n${SYSTEM_GUIDELINES}`;
  }
  return `Você é um assistente virtual prestativo e profissional.\n${SYSTEM_GUIDELINES}`;
}

/**
 * Obtém ou cria um cache de contexto para o prompt do sistema
 */
async function getOrCreateCache(apiKey, systemPrompt) {
  try {
    // Se o prompt for muito curto, não vale a pena (ou a API rejeita) fazer cache
    // O limite oficial é ~32k tokens, mas vamos tentar para prompts maiores que 1000 chars por enquanto
    // ou deixar a API decidir e tratar o erro.
    // Para este caso, vamos tentar cachear se tiver mais de 100 caracteres para testar,
    // mas sabendo que a API pode rejeitar se for muito pequeno (depende do modelo).
    // O usuário pediu para implementar, então vamos tentar.

    const hash = crypto.createHash('md5').update(systemPrompt).digest('hex');
    const now = Date.now();
    const cacheDisplayName = `sys_prompt_${hash.substring(0, 8)}`;

    // 1. Verificar se já temos um cache válido localmente (Memória RAM)
    if (systemPromptCache.has(hash)) {
      const cached = systemPromptCache.get(hash);
      // Margem de segurança de 5 minutos antes de expirar
      if (cached.expireTime > now + 5 * 60 * 1000) {
        logger.info(`📦 Usando cache de contexto existente (Memória): ${cached.name}`);
        return { name: cached.name };
      } else {
        logger.info(`📦 Cache local expirado ou próximo de expirar: ${cached.name}`);
        systemPromptCache.delete(hash);
      }
    }

    const cacheManager = new GoogleAICacheManager(apiKey);

    // 2. Verificar se já existe um cache válido no Servidor do Google (Persistência entre restarts)
    try {
      logger.info('🔍 Verificando caches existentes no servidor Gemini...');
      const listResult = await cacheManager.list();

      if (listResult.cachedContents) {
        const existingCache = listResult.cachedContents.find(c =>
          c.displayName === cacheDisplayName &&
          new Date(c.expireTime).getTime() > now + 5 * 60 * 1000 // Verifica se ainda é válido
        );

        if (existingCache) {
          logger.info(`📦 Cache encontrado no servidor Gemini: ${existingCache.name}`);

          // Atualizar cache local
          systemPromptCache.set(hash, {
            name: existingCache.name,
            expireTime: new Date(existingCache.expireTime).getTime()
          });

          return { name: existingCache.name };
        }
      }
    } catch (listError) {
      logger.warn(`⚠️ Falha ao listar caches do servidor (prosseguindo para criação): ${listError.message}`);
      // Não retorna erro, apenas segue para tentar criar um novo
    }

    // 3. Criar novo cache se não encontrou
    logger.info('📦 Criando novo cache de contexto no Gemini...');

    const ttlSeconds = CACHE_TTL_MINUTES * 60;

    const cache = await cacheManager.create({
      model: FIXED_MODEL,
      displayName: cacheDisplayName,
      systemInstruction: systemPrompt,
      ttlSeconds: ttlSeconds,
    });

    const expireTime = now + (ttlSeconds * 1000);

    systemPromptCache.set(hash, {
      name: cache.name,
      expireTime: expireTime
    });

    logger.info(`✅ Cache criado com sucesso: ${cache.name} (expira em ${CACHE_TTL_MINUTES} min)`);
    return { name: cache.name };

  } catch (error) {
    // Se der erro (ex: prompt muito curto, erro de API), logar e retornar null
    // O código principal fará fallback para systemInstruction normal
    logger.warn(`⚠️ Não foi possível criar cache de contexto (usando prompt normal): ${error.message}`);
    return null;
  }
}

/**
 * Processa uma mensagem usando Google Gemini
 */
export async function processMessageWithGemini(messageText, phoneNumber, apiKey, modelName = FIXED_MODEL, systemPrompt = '', temperature = FIXED_TEMPERATURE) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("enviando para gemini", messageText);

    // Sempre usar configurações fixas + prompt personalizado
    const finalSystemPrompt = buildSystemPrompt(systemPrompt);

    // Criar chave única APENAS com phoneNumber para manter histórico contínuo
    const conversationKey = phoneNumber;

    // Obter ou criar histórico de conversa para este usuário
    let conversationData = userConversations.get(conversationKey);

    // VERIFICAR SE O PROMPT MUDOU - se mudou, recriar conversa
    const promptChanged = conversationData && conversationData.systemPrompt !== finalSystemPrompt;

    if (!conversationData || promptChanged) {
      if (promptChanged) {
        logger.info(`🔄 Prompt alterado para ${phoneNumber} - recriando conversa`);
      }

      // Criar nova conversa
      // Tentar obter cache para o system prompt
      let cachedContent = null;
      // Apenas tentar cache se o prompt tiver um tamanho razoável para evitar overhead em prompts minúsculos
      // Mas como o usuário pediu explicitamente, vamos tentar.
      cachedContent = await getOrCreateCache(apiKey, finalSystemPrompt);

      const modelConfig = {
        model: FIXED_MODEL,
        generationConfig: {
          temperature: FIXED_TEMPERATURE,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      };

      // Se conseguiu cache, usa cachedContent. Se não, usa systemInstruction normal.
      if (cachedContent) {
        modelConfig.cachedContent = cachedContent;
      } else {
        modelConfig.systemInstruction = finalSystemPrompt;
      }

      const model = genAI.getGenerativeModel(modelConfig);

      const chat = model.startChat({
        history: [],
      });

      conversationData = {
        chat,
        model,
        systemPrompt: finalSystemPrompt
      };

      userConversations.set(conversationKey, conversationData);
      logger.info(`🆕 Nova conversa iniciada para ${phoneNumber}`);
    } else {
      logger.info(`♻️ Usando conversa existente para ${phoneNumber} (${userConversations.get(conversationKey).chat.history?.length || 0} mensagens no histórico)`);
    }

    const { chat } = conversationData;

    logger.info('===== ENVIANDO MENSAGEM PARA GEMINI =====');
    logger.info(`Telefone: ${phoneNumber}`);
    logger.info(`Modelo: ${FIXED_MODEL} (fixo)`);
    logger.info(`Temperatura: ${FIXED_TEMPERATURE} (fixa)`);

    // Logar se está usando cache ou prompt completo
    if (conversationData.model?.cachedContent) {
      logger.info(`📦 MODO: Usando Cache de Contexto (${conversationData.model.cachedContent.name})`);
      logger.info(`Prompt Final: (Referência ao cache - não enviado)`);
    } else {
      logger.info(`📝 MODO: Enviando System Prompt Completo`);
      logger.info(`Prompt Final (com diretrizes): ${finalSystemPrompt.substring(0, 100)}...`);
    }

    logger.info(`Prompt Personalizado: ${systemPrompt ? (systemPrompt.substring(0, 10) + '...') : 'Nenhum'}`);
    logger.info(`Mensagem (${messageText.length} caracteres):`, messageText);
    logger.info('==========================================');

    // TENTATIVA DE ENVIO COM RETRY AUTOMÁTICO
    // Se falhar na primeira vez (provavelmente por histórico corrompido ou muito longo),
    // limpa o histórico e tenta novamente.
    let responseText = null;
    let retryCount = 0;
    const MAX_RETRIES = 1;

    try {
      while (retryCount <= MAX_RETRIES) {
        try {
          // Se for retry, recarregar a conversa (que pode ter sido recriada)
          if (retryCount > 0) {
            conversationData = userConversations.get(conversationKey);
            if (!conversationData) {
              // Se por algum motivo não existir, recria
              // Se por algum motivo não existir, recria
              // Tentar obter cache novamente (ou usar o mesmo se já tivermos a lógica, mas aqui é retry)
              const cachedContentRetry = await getOrCreateCache(apiKey, finalSystemPrompt);

              const modelConfigRetry = {
                model: FIXED_MODEL,
                generationConfig: {
                  temperature: FIXED_TEMPERATURE,
                  topP: 0.95,
                  topK: 40,
                  maxOutputTokens: 8192,
                }
              };

              if (cachedContentRetry) {
                modelConfigRetry.cachedContent = cachedContentRetry;
              } else {
                modelConfigRetry.systemInstruction = finalSystemPrompt;
              }

              const model = genAI.getGenerativeModel(modelConfigRetry);
              const chat = model.startChat({ history: [] });
              conversationData = { chat, model, systemPrompt: finalSystemPrompt };
              userConversations.set(conversationKey, conversationData);
            }
          }

          const currentChat = conversationData.chat;
          const result = await currentChat.sendMessage(messageText);
          const response = result.response;

          // VERIFICAÇÃO DE SEGURANÇA: Checa se a resposta tem conteúdo válido
          if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
            responseText = response.text(); // Agora é seguro chamar .text()

            logger.info('===== RESPOSTA VÁLIDA RECEBIDA DO GEMINI =====');
            logger.info(`Telefone: ${phoneNumber}`);
            logger.info(`Resposta (${responseText.length} caracteres): ${responseText}`);
            logger.info('========================================');

            return responseText; // Sucesso. Sai da função.

          } else {
            // A API respondeu, mas bloqueou a resposta ou não gerou conteúdo.
            const finishReason = response.candidates?.[0]?.finishReason || 'Desconhecido';
            logger.warn('===== RESPOSTA DO GEMINI SEM CONTEÚDO =====');
            logger.warn(`Telefone: ${phoneNumber}`);
            logger.warn(`Motivo do término: ${finishReason}`);

            // Se for bloqueio de segurança, não adianta tentar de novo
            if (finishReason === 'SAFETY') {
              return "Desculpe, não posso responder a essa mensagem por motivos de segurança.";
            }

            throw new Error(`Resposta sem conteúdo. Motivo: ${finishReason}`);
          }

        } catch (error) {
          logger.warn(`⚠️ Erro na tentativa ${retryCount + 1}/${MAX_RETRIES + 1} para ${phoneNumber}:`);
          logger.warn(`Mensagem de erro: ${error.message}`);
          logger.warn(`Stack trace: ${error.stack}`);
          if (error.response) {
            logger.warn(`Detalhes da resposta de erro: ${JSON.stringify(error.response, null, 2)}`);
          }
          logger.warn(`Erro completo (JSON): ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);

          if (retryCount < MAX_RETRIES) {
            logger.info(`♻️ Limpando histórico de ${phoneNumber} e tentando novamente...`);

            // 1. Remover conversa atual da memória
            userConversations.delete(conversationKey);

            // 2. Recriar conversa do zero (sem histórico)
            // 2. Recriar conversa do zero (sem histórico)
            const cachedContentRetry2 = await getOrCreateCache(apiKey, finalSystemPrompt);

            const modelConfigRetry2 = {
              model: FIXED_MODEL,
              generationConfig: {
                temperature: FIXED_TEMPERATURE,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
              }
            };

            if (cachedContentRetry2) {
              modelConfigRetry2.cachedContent = cachedContentRetry2;
            } else {
              modelConfigRetry2.systemInstruction = finalSystemPrompt;
            }

            const model = genAI.getGenerativeModel(modelConfigRetry2);

            const chat = model.startChat({
              history: [], // Histórico limpo
            });

            conversationData = {
              chat,
              model,
              systemPrompt: finalSystemPrompt
            };

            userConversations.set(conversationKey, conversationData);

            retryCount++;
            // Loop continua para a próxima tentativa
          } else {
            // Se falhou todas as tentativas, lança o erro para ser tratado pelo catch externo
            throw error;
          }
        }
      }
    } catch (error) {
      // Se falhar após todas as tentativas, relançar o erro para o handler global
      // O handler global tem a lógica para identificar erros de API Key, Quota, etc.
      throw error;
    }
  } catch (error) {
    logger.error('❌ ERRO COMPLETO AO PROCESSAR COM GEMINI:');
    logger.error('==============================================');

    // Log do erro bruto primeiro
    logger.error('ERRO BRUTO:', error);
    logger.error('Tipo do erro:', typeof error);
    logger.error('Construtor:', error?.constructor?.name);

    // Propriedades básicas
    if (error?.message) logger.error('Mensagem:', error.message);
    if (error?.name) logger.error('Nome:', error.name);
    if (error?.stack) logger.error('Stack:', error.stack);
    if (error?.code) logger.error('Code:', error.code);
    if (error?.status) logger.error('Status:', error.status);
    if (error?.statusText) logger.error('Status Text:', error.statusText);

    // Propriedades do Gemini SDK
    if (error?.response) {
      logger.error('Response existe:', true);
      logger.error('Response:', JSON.stringify(error.response, null, 2));
    }

    if (error?.data) {
      logger.error('Data existe:', true);
      logger.error('Data:', JSON.stringify(error.data, null, 2));
    }

    if (error?.error) {
      logger.error('Error object existe:', true);
      logger.error('Error object:', JSON.stringify(error.error, null, 2));
    }

    // Todas as chaves do objeto de erro
    logger.error('Chaves do erro:', Object.keys(error || {}));
    logger.error('Propriedades próprias:', Object.getOwnPropertyNames(error || {}));

    // Tentar serializar o erro completo
    try {
      logger.error('JSON completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      logger.error('Não foi possível serializar o erro:', e.message);
    }

    // Inspeção completa
    try {
      logger.error('Inspeção do erro:', require('util').inspect(error, { depth: 5, colors: false }));
    } catch (e) {
      logger.error('Não foi possível inspecionar o erro');
    }

    logger.error('==============================================');

    // Tratamento específico de erros
    const errorMsg = error?.message || error?.toString() || 'Erro desconhecido';
    const errorStatus = error?.status || error?.response?.status;

    // 1. Erros de API Key (Bloqueada, Inválida, Vazada)
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key') || errorMsg.includes('API_KEY') || errorMsg.includes('invalid') || errorMsg.includes('leaked')) {
      logger.error('❌ API Key inválida, bloqueada ou vazada');
      return 'Desculpe, a API Key do Gemini está inválida ou foi bloqueada por segurança. Verifique sua configuração.';
    }

    // 2. Limites de Cota (Quota Exceeded)
    if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorStatus === 429) {
      logger.error('❌ Limite de uso excedido (Quota/Rate Limit)');
      return 'Desculpe, o limite de uso da API foi excedido. Aguarde alguns minutos.';
    }

    // 3. Erros de Rede / Conexão
    if (errorMsg.includes('ECONNRESET') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('fetch failed') || errorMsg.includes('network')) {
      logger.error('❌ Erro de Conexão / Rede (Timeout ou DNS)');
      return 'Desculpe, estou com problemas de conexão com o servidor de IA. Tente novamente em instantes.';
    }

    // 4. Erros do Servidor Google (5xx)
    if (errorStatus >= 500 && errorStatus < 600) {
      logger.error(`❌ Erro Interno do Servidor Google (Status: ${errorStatus})`);
      if (errorStatus === 503) {
        return 'Desculpe, o serviço de IA está temporariamente indisponível (Sobrecarga). Tente novamente em 1 minuto.';
      }
      return 'Desculpe, houve um erro interno no servidor de IA. Tente novamente mais tarde.';
    }

    // 5. Localização não suportada
    if (errorMsg.includes('location') || errorMsg.includes('region') || errorMsg.includes('not supported')) {
      logger.error('❌ Erro de Localização/Região não suportada');
      return 'Desculpe, o serviço de IA não está disponível para a região configurada (VPN/IP).';
    }

    // 6. Modelo Sobrecarregado
    if (errorMsg.includes('overloaded') || errorMsg.includes('busy')) {
      logger.error('❌ Modelo Gemini Sobrecarregado');
      return 'Desculpe, o modelo de IA está sobrecarregado no momento. Tente novamente em alguns segundos.';
    }

    // 7. Filtros de Segurança (Safety)
    if (errorMsg.includes('SAFETY') || errorMsg.includes('blocked') || errorMsg.includes('safety')) {
      logger.error('❌ Bloqueio por Filtro de Segurança (Safety)');
      return 'Desculpe, não posso processar essa mensagem devido às diretrizes de segurança.';
    }

    // Fallback genérico para outros erros
    logger.error('❌ Erro não classificado (Fallback)');
    return 'Desculpe, estou com dificuldades para processar sua mensagem no momento. Tente novamente em instantes.';
  }
}

/**
 * Transcreve áudio usando Google Gemini (ainda não suportado - usar Whisper API)
 */
export async function transcribeAudio(audioBuffer, apiKey, prompt = '') {
  try {
    logger.info('Iniciando transcrição de áudio...', {
      bufferSize: audioBuffer.length,
      bufferType: typeof audioBuffer,
      isBuffer: Buffer.isBuffer(audioBuffer)
    });

    if (!Buffer.isBuffer(audioBuffer)) {
      throw new Error('audioBuffer deve ser um Buffer válido');
    }

    if (audioBuffer.length === 0) {
      throw new Error('Buffer de áudio está vazio');
    }

    // Nota: Gemini ainda não suporta transcrição de áudio nativamente
    // Alternativa: usar Google Speech-to-Text ou Whisper API
    logger.warn('Transcrição de áudio com Gemini ainda não implementada');
    return 'Desculpe, ainda não consigo processar áudios. Por favor, envie sua mensagem como texto.';
  } catch (error) {
    logger.error('❌ ERRO ao transcrever áudio:');
    logger.error('Mensagem:', error.message);
    logger.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Analisa imagem usando Google Gemini Vision
 */
export async function analyzeImage(imageBuffer, apiKey, modelName = FIXED_MODEL, prompt = '', systemPrompt = '') {
  try {
    logger.info('Iniciando análise de imagem com Gemini...', {
      bufferSize: imageBuffer.length,
      bufferType: typeof imageBuffer,
      isBuffer: Buffer.isBuffer(imageBuffer)
    });

    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error('imageBuffer deve ser um Buffer válido');
    }

    if (imageBuffer.length === 0) {
      throw new Error('Buffer de imagem está vazio');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const finalSystemPrompt = buildSystemPrompt(systemPrompt || 'Você é um assistente especializado em análise de imagens.');

    const model = genAI.getGenerativeModel({
      model: FIXED_MODEL,
      systemInstruction: finalSystemPrompt
    });

    // Converter buffer para base64
    const base64Image = imageBuffer.toString('base64');

    logger.info('Enviando imagem para Gemini Vision...');

    // Criar partes da mensagem: texto + imagem
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };

    const textPart = prompt || "Analise esta imagem em detalhes. Descreva exatamente o que você vê, incluindo:\n- Se for uma imagem médica (raio-X, ressonância, etc.), descreva as estruturas anatômicas visíveis\n- Qualquer texto presente na imagem\n- Objetos, pessoas, cores e elementos visuais\n- Qualquer informação relevante ou anormalidade observada\n- Se houver texto na imagem, transcreva-o completamente\n\nSeja específico e detalhado na sua análise.";

    const result = await model.generateContent([textPart, imagePart]);
    const analysis = result.response.text();

    logger.info('Imagem analisada com sucesso:', {
      analysisLength: analysis.length,
      preview: analysis.substring(0, 100)
    });

    return analysis;
  } catch (error) {
    logger.error('Erro detalhado ao analisar imagem:', error);
    throw error;
  }
}

/**
 * Processa documento (PDF, DOC, etc.) convertendo para texto
 */
export async function processDocument(documentBuffer, filename) {
  try {
    logger.info('Iniciando processamento de documento...', {
      filename,
      bufferSize: documentBuffer.length,
      fileExtension: path.extname(filename).toLowerCase()
    });

    const fileExtension = path.extname(filename).toLowerCase();

    // Para PDFs, usar uma biblioteca de extração de texto
    if (fileExtension === '.pdf') {
      return await extractTextFromPDF(documentBuffer);
    }

    // Para outros documentos, tentar converter para texto
    if (['.doc', '.docx', '.txt', '.rtf'].includes(fileExtension)) {
      // Se for texto simples, tentar ler diretamente
      if (fileExtension === '.txt') {
        const text = documentBuffer.toString('utf-8');
        logger.info('Texto extraído do arquivo .txt');
        return text;
      }

      // Para outros formatos, retornar informação básica
      return `Documento ${filename} recebido. Formato: ${fileExtension}. Tamanho: ${documentBuffer.length} bytes. Para melhor análise, converta para PDF ou imagem.`;
    }

    throw new Error(`Formato de arquivo não suportado: ${fileExtension}`);
  } catch (error) {
    logger.error('Erro ao processar documento:', error);
    throw error;
  }
}

/**
 * Extrai texto de PDF usando pdf-parse
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    logger.info('Iniciando extração de texto do PDF...');

    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('pdfBuffer deve ser um Buffer válido');
    }

    if (pdfBuffer.length === 0) {
      throw new Error('Buffer de PDF está vazio');
    }

    // Carregar pdf-parse
    if (!pdfParse) {
      try {
        pdfParse = require('pdf-parse/lib/pdf-parse.js');
        logger.info('pdf-parse carregado com sucesso');
      } catch (error) {
        logger.error('Erro ao carregar pdf-parse:', error.message);
        throw new Error('Biblioteca de processamento de PDF não disponível');
      }
    }

    // Extrair texto do PDF
    const data = await pdfParse(pdfBuffer);

    const extractedText = data.text.trim();
    const numPages = data.numpages;
    const info = data.info;

    logger.info('PDF processado com sucesso:', {
      numPages,
      textLength: extractedText.length,
      title: info?.Title || 'Sem título',
    });

    if (!extractedText || extractedText.length === 0) {
      return `Este PDF contém ${numPages} página(s), mas não foi possível extrair texto diretamente. O documento pode conter apenas imagens ou ser um PDF escaneado.`;
    }

    // Formatar informações do PDF
    let result = '';

    if (info?.Title && info.Title !== 'Untitled') {
      result += `TÍTULO: ${info.Title}\n`;
    }

    if (numPages) {
      result += `PÁGINAS: ${numPages}\n`;
    }

    result += `\n${'='.repeat(60)}\n`;
    result += `CONTEÚDO DO DOCUMENTO:\n`;
    result += `${'='.repeat(60)}\n\n`;
    result += extractedText;

    return result;
  } catch (error) {
    logger.error('Erro ao extrair texto do PDF:', error);
    return `Não foi possível extrair o texto deste PDF. O documento pode estar protegido, corrompido, ou conter apenas imagens.`;
  }
}

/**
 * Processa mensagem com imagem usando Gemini Vision
 */
export async function processImageMessageWithGemini(imageBuffer, phoneNumber, apiKey, modelName = FIXED_MODEL, systemPrompt = '', temperature = FIXED_TEMPERATURE, caption = '') {
  try {
    logger.info(`Processando mensagem com imagem para ${phoneNumber} - Modelo: ${FIXED_MODEL}`);

    // Criar prompt combinado
    let fullPrompt = '';

    if (caption && caption.trim()) {
      fullPrompt = `O usuário enviou uma imagem com o seguinte comentário/pergunta:\n"${caption}"\n\nPor favor, analise a imagem e responda considerando o comentário do usuário.`;
    } else {
      fullPrompt = 'Analise esta imagem e forneça uma resposta detalhada e útil.';
    }

    // Analisar a imagem diretamente com o Gemini (sempre usa configurações fixas)
    const analysis = await analyzeImage(imageBuffer, apiKey, FIXED_MODEL, fullPrompt, systemPrompt);

    logger.info('Imagem processada com Gemini Vision');

    return {
      imageAnalysis: analysis,
      aiResponse: analysis,
      caption
    };
  } catch (error) {
    logger.error('Erro ao processar mensagem com imagem:', error);
    throw error;
  }
}

/**
 * Processa mensagem com documento usando Gemini
 */
export async function processDocumentMessageWithGemini(documentBuffer, filename, phoneNumber, apiKey, modelName = FIXED_MODEL, systemPrompt = '', temperature = FIXED_TEMPERATURE, caption = '') {
  try {
    logger.info(`Processando documento para ${phoneNumber}: ${filename} - Modelo: ${FIXED_MODEL}`);

    // 1. Processar o documento
    const documentContent = await processDocument(documentBuffer, filename);
    logger.info(`Documento processado: "${documentContent.substring(0, 100)}..."`);

    // 2. Criar prompt para análise do documento
    let fullMessage = `CONTEXTO: Um usuário enviou um documento (${filename}).\n\nCONTEÚDO EXTRAÍDO DO DOCUMENTO:\n${documentContent}`;

    if (caption && caption.trim()) {
      fullMessage += `\n\nCOMENTÁRIO/PERGUNTA DO USUÁRIO:\n"${caption}"`;
    }

    fullMessage += `\n\nPor favor, analise o conteúdo do documento e forneça uma resposta útil e clara.`;

    // 3. Processar com o Gemini (sempre usa configurações fixas)
    const aiResponse = await processMessageWithGemini(fullMessage, phoneNumber, apiKey, FIXED_MODEL, systemPrompt, FIXED_TEMPERATURE);

    return {
      documentContent,
      aiResponse,
      caption,
      filename
    };
  } catch (error) {
    logger.error('Erro ao processar mensagem com documento:', error);
    throw error;
  }
}

/**
 * Processa mensagem de áudio usando Gemini
 */
export async function processAudioMessageWithGemini(audioBuffer, phoneNumber, apiKey, modelName = FIXED_MODEL, systemPrompt = '', temperature = FIXED_TEMPERATURE) {
  try {
    logger.info(`🎤 Processando mensagem de áudio para ${phoneNumber}`, {
      audioSize: audioBuffer.length,
      model: FIXED_MODEL
    });

    const genAI = new GoogleGenerativeAI(apiKey);

    // Converter buffer para base64
    const base64Audio = audioBuffer.toString('base64');

    // Sempre usar configurações fixas + prompt personalizado
    const finalSystemPrompt = buildSystemPrompt(systemPrompt);

    // Criar chave única APENAS com phoneNumber para manter histórico contínuo (mesma chave que texto!)
    const conversationKey = phoneNumber;

    // Obter ou criar histórico de conversa para este usuário
    let conversationData = userConversations.get(conversationKey);

    if (!conversationData) {
      // Criar nova conversa APENAS se não existir
      // Configuração do modelo
      // Configuração do modelo
      const cachedContentAudio = await getOrCreateCache(apiKey, finalSystemPrompt);

      const modelConfigAudio = {
        model: FIXED_MODEL,
        generationConfig: {
          temperature: FIXED_TEMPERATURE,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      };

      if (cachedContentAudio) {
        modelConfigAudio.cachedContent = cachedContentAudio;
      } else {
        modelConfigAudio.systemInstruction = finalSystemPrompt;
      }

      const model = genAI.getGenerativeModel(modelConfigAudio);

      const chat = model.startChat({
        history: [],
      });

      conversationData = {
        chat,
        model,
        systemPrompt: finalSystemPrompt
      };

      userConversations.set(conversationKey, conversationData);
      logger.info(`🆕 Nova conversa iniciada para áudio de ${phoneNumber}`);
    } else {
      logger.info(`♻️ Usando conversa existente para áudio de ${phoneNumber} (${userConversations.get(conversationKey).chat.history?.length || 0} mensagens no histórico)`);
    }

    const { model, chat } = conversationData;

    logger.info(`🎤 Enviando áudio para transcrição e análise...`);

    // Primeiro, obter a transcrição (usa o mesmo modelo do chat!)
    const transcriptionResult = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/ogg",
          data: base64Audio
        }
      },
      "Transcreva este áudio em português, mantendo toda a pontuação e emoção da mensagem original."
    ]);

    const transcription = transcriptionResult.response.text();
    logger.info(`✅ Transcrição obtida: "${transcription.substring(0, 100)}..."`);

    // Agora, gerar resposta baseada na transcrição usando o MESMO chat
    logger.info(`🤖 Iniciando geração de resposta para áudio...`);
    logger.info(`📤 Enviando transcrição para gerar resposta...`);

    const result = await chat.sendMessage(`[Mensagem de Áudio]: ${transcription}`);
    const aiResponse = result.response.text();

    logger.info(`✅ Resposta gerada para áudio: "${aiResponse.substring(0, 100)}..."`);

    // Não precisa atualizar histórico manualmente - o chat.sendMessage já faz isso

    return {
      transcription,
      aiResponse
    };

  } catch (error) {
    logger.error('❌ Erro ao processar mensagem de áudio:', {
      error: error.message,
      stack: error.stack,
      phoneNumber,
      errorType: error.constructor.name,
      errorCode: error.code,
      errorStatus: error.status
    });

    // Log do erro completo para debug
    logger.error('Detalhes completos do erro:', error);

    // Fallback em caso de erro
    return {
      transcription: '[Erro ao transcrever]',
      aiResponse: 'Desculpe, tive dificuldade em processar seu áudio. Pode enviar como texto ou tentar novamente?'
    };
  }
}

/**
 * Limpa o histórico de conversa de um usuário
 */
export function clearUserConversation(phoneNumber) {
  // Limpar todas as conversas deste número (pode ter múltiplos system prompts)
  const keysToDelete = [];
  for (const key of userConversations.keys()) {
    if (key.startsWith(phoneNumber)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => userConversations.delete(key));
  logger.info(`Conversa(s) removida(s) para ${phoneNumber}`);
}

/**
 * Limpa todas as conversas
 */
export function clearAllConversations() {
  userConversations.clear();
  logger.info('Todas as conversas foram limpas');
}

/**
 * Obtém estatísticas das conversas ativas
 */
export function getConversationsStats() {
  return {
    activeConversations: userConversations.size,
    conversations: Array.from(userConversations.keys()).map(phone => ({
      phoneNumber: phone
    }))
  };
}

