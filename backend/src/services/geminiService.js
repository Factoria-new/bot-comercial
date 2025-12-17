import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { Composio } from '@composio/core';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import logger from '../config/logger.js';
import admin, { db } from '../config/firebase.js';

// Usar createRequire para carregar pdf-parse (CommonJS) em ES module
const require = createRequire(import.meta.url);
let pdfParse;

// Configurações fixas do sistema
const FIXED_MODEL = 'gemini-2.5-flash';
const FIXED_TEMPERATURE = 1.0;
const CACHE_TTL_MINUTES = process.env.GEMINI_CACHE_TTL ? parseInt(process.env.GEMINI_CACHE_TTL) : 60; // Tempo de vida do cache em minutos
const HISTORY_LIMIT = 20; // Manter apenas as últimas 20 mensagens no contexto

// Cache local para rastrear caches criados no Gemini (hash -> { name, expireTime })
const systemPromptCache = new Map();

// Caches para Composio (API Optimization)
let calendarToolsCache = null;
let calendarToolsCacheTime = 0;
const TOOLS_CACHE_TTL = 60 * 60 * 1000; // 1 hora para ferramentas (mudam raramente)

const connectedAccountsCache = new Map(); // userId -> { accountId, timestamp }
const ACCOUNTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos para status de conexão

// Inicializar cliente Composio
// Inicializar cliente Composio (Lazy Loading)
let composioClientInstance = null;

function getComposioClient() {
  if (composioClientInstance) return composioClientInstance;

  if (process.env.COMPOSIO_API_KEY) {
    try {
      composioClientInstance = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
      logger.info('✅ Cliente Composio inicializado com sucesso (Lazy)');
      return composioClientInstance;
    } catch (error) {
      logger.error('❌ Erro ao inicializar Composio:', error.message);
      return null;
    }
  } else {
    logger.warn('⚠️ COMPOSIO_API_KEY não configurada - funcionalidades de Calendar não estarão disponíveis');
    return null;
  }
}

// Diretrizes fixas que SEMPRE serão aplicadas
const SYSTEM_GUIDELINES = `
Diretrizes:
- Seja sempre educado e respeitoso
- Forneça respostas precisas e úteis
- Se não souber algo, admita honestamente
- Adapte seu tom ao contexto da conversa
- Mantenha as respostas concisas quando possível
- IMPORTANTE: Quando o usuário solicitar ações de calendário (agendar, cancelar, remarcar agendamentos), EXECUTE IMEDIATAMENTE sem pedir confirmação. NÃO pergunte "Posso prosseguir?" ou "Confirma?". Apenas faça a ação e informe o resultado.
`;

/**
 * Formata as configurações do calendário para o prompt do sistema
 */
function formatCalendarSettings(settings) {
  if (!settings || !settings.schedule) return '';

  let scheduleText = '\n### DIRETRIZES DE AGENDAMENTO (Segunda Diretriz):\n\nHORÁRIOS DE ATENDIMENTO:\n';
  const schedule = settings.schedule;

  const WEEKDAYS_MAP = {
    'seg': 'Segunda-feira',
    'ter': 'Terça-feira',
    'qua': 'Quarta-feira',
    'qui': 'Quinta-feira',
    'sex': 'Sexta-feira',
    'sab': 'Sábado',
    'dom': 'Domingo'
  };

  for (const [key, label] of Object.entries(WEEKDAYS_MAP)) {
    const day = schedule[key];
    if (day && day.enabled && day.slots && day.slots.length > 0) {
      const slotsStr = day.slots.map(slot => `${slot.start}-${slot.end}`).join(', ');
      scheduleText += `- ${label}: ${slotsStr}\n`;
    } else {
      scheduleText += `- ${label}: Fechado\n`;
    }
  }

  if (settings.meetingDuration) {
    scheduleText += `\nDuração padrão do agendamento: ${settings.meetingDuration} minutos\n`;
  }

  if (settings.meetingType) {
    scheduleText += `Tipo de agendamento: ${settings.meetingType === 'online' ? 'Online (Google Meet)' : 'Presencial'}\n`;
    if (settings.meetingType === 'in-person' && settings.meetingAddress) {
      scheduleText += `Endereço do atendimento presencial: ${settings.meetingAddress}\n`;
    }
  }

  scheduleText += '\nREQUISITOS OBRIGATÓRIOS PARA AGENDAMENTO:\n';
  scheduleText += 'Para realizar um agendamento, você DEVE obter as seguintes informações do usuário:\n';
  scheduleText += '1. Nome do cliente\n';
  scheduleText += '2. E-mail do cliente\n';
  scheduleText += '3. Assunto do agendamento\n';
  scheduleText += '4. Horário desejado\n\n';
  scheduleText += 'Não chame a função de agendamento sem ter TODAS essas informações.\n';

  scheduleText += '\n### FLUXO PARA CANCELAMENTO OU REMARCAÇÃO:\n';
  scheduleText += 'Quando o cliente solicitar CANCELAR ou REMARCAR um agendamento, siga ESTE FLUXO OBRIGATÓRIO:\n\n';
  scheduleText += '1. PERGUNTE O E-MAIL: Peça o e-mail do cliente para buscar os agendamentos.\n';
  scheduleText += '2. BUSQUE OS AGENDAMENTOS: Use a função de busca de eventos para encontrar agendamentos com o e-mail informado.\n';
  scheduleText += '3. LISTE OS AGENDAMENTOS: Mostre ao cliente TODOS os agendamentos encontrados para aquele e-mail, com data e horário.\n';
  scheduleText += '4. CONFIRME QUAL AGENDAMENTO: Se houver mais de um agendamento, pergunte qual deles o cliente deseja cancelar/remarcar.\n';
  scheduleText += '5. EXECUTE A AÇÃO: Após o cliente confirmar qual agendamento, execute o cancelamento ou remarcação.\n\n';
  scheduleText += 'IMPORTANTE: NÃO tente adivinhar o agendamento pelo nome ou horário mencionado. SEMPRE busque pelos agendamentos usando o e-mail.\n\n';
  scheduleText += '### SE NÃO ENCONTRAR AGENDAMENTOS:\n';
  scheduleText += 'Se a busca não retornar nenhum agendamento para o e-mail informado, responda de forma SIMPLES e CURTA:\n';
  scheduleText += '"Não encontrei nenhum agendamento cadastrado com o e-mail [email]. Por favor, verifique se o e-mail está correto."\n';
  scheduleText += 'NÃO dê explicações técnicas sobre a API, calendário, filtros ou como a busca funciona. Seja direto e amigável.\n';

  scheduleText += '\nIMPORTANTE: Respeite RIGOROSAMENTE estes horários. Não realize agendamentos fora dos horários permitidos ou em dias fechados. Se o usuário pedir um horário indisponível, sugira o próximo horário disponível dentro do expediente.\n';

  return scheduleText;
}

/**
 * Combina o prompt personalizado do usuário com as diretrizes fixas do sistema
 */
function buildSystemPrompt(customPrompt = '', includeDateTime = false, calendarSettings = null) {
  let prompt = '';

  if (customPrompt && customPrompt.trim()) {
    prompt = `${customPrompt.trim()}\n\n### DIRETRIZES DO SISTEMA:\n${SYSTEM_GUIDELINES}`;
  } else {
    prompt = `Você é um assistente virtual prestativo e profissional.\n\n### DIRETRIZES DO SISTEMA:\n${SYSTEM_GUIDELINES}`;
  }

  // Adicionar configurações do calendário se houver
  if (calendarSettings) {
    prompt += formatCalendarSettings(calendarSettings);
  }

  // Adicionar contexto de data/hora se solicitado (útil para Calendar)
  if (includeDateTime) {
    const now = new Date();
    const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';
    const dateStr = now.toLocaleDateString('pt-BR', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });

    prompt += `\n\n### CONTEXTO TEMPORAL:\n- Data atual: ${dateStr}\n- Hora atual: ${timeStr}\n- Fuso horário: ${timezone}`;
  }

  return prompt;
}

/**
 * Obtém ou cria um cache de contexto para o prompt do sistema
 */
async function getOrCreateCache(apiKey, systemPrompt) {
  try {
    const hash = crypto.createHash('md5').update(systemPrompt).digest('hex');
    const now = Date.now();
    const cacheDisplayName = `sys_prompt_${hash.substring(0, 8)}`;

    // 1. Verificar se já temos um cache válido localmente (Memória RAM)
    if (systemPromptCache.has(hash)) {
      const cached = systemPromptCache.get(hash);
      if (cached.expireTime > now + 5 * 60 * 1000) {
        return { name: cached.name };
      } else {
        systemPromptCache.delete(hash);
      }
    }

    const cacheManager = new GoogleAICacheManager(apiKey);

    // 2. Verificar caches existentes...
    // (Omitindo lógica detalhada para brevidade - mantendo a mesma ideia)
    // ...

    return null; // Simplificação para este exemplo: usar sempre prompt normal ou implementar completo se necessário

  } catch (error) {
    logger.warn(`⚠️ Não foi possível criar cache de contexto (usando prompt normal): ${error.message}`);
    return null;
  }
}

/**
 * Helper: Carregar histórico do Firestore
 */
async function getHistoryFromFirestore(chatId) {
  try {
    const docRef = db.collection('conversations').doc(chatId);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      // Retorna as mensagens (mapped to Gemini format if needed, but here we store as Gemini needs: { role, parts: [{ text }] })
      return data.messages || [];
    }
    return [];
  } catch (error) {
    logger.error(`Erro ao ler histórico de ${chatId}:`, error);
    return [];
  }
}

/**
 * Helper: Salvar mensagens no Firestore
 */
async function saveMessagesToFirestore(chatId, newMessages) {
  try {
    const docRef = db.collection('conversations').doc(chatId);

    // Usar arrayUnion para adicionar (ou set se não existir)
    // Mas precisamos manter apenas as últimas N mensagens
    // Transação para ler, cortar e salvar é melhor
    await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      let history = [];
      if (doc.exists) {
        history = doc.data().messages || [];
      }

      // Adicionar novas
      history = [...history, ...newMessages];

      // Cortar excesso (Janela Deslizante)
      if (history.length > HISTORY_LIMIT) {
        history = history.slice(-HISTORY_LIMIT);
      }

      t.set(docRef, {
        messages: history,
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
  } catch (error) {
    logger.error(`Erro ao salvar histórico de ${chatId}:`, error);
  }
}

/**
 * Processa uma mensagem usando Google Gemini (Versão Stateless / Firestore)
 */
export async function processMessageWithGemini(messageText, phoneNumber, apiKey, modelName = FIXED_MODEL, systemPrompt = '', temperature = FIXED_TEMPERATURE) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("enviando para gemini", messageText);

    const finalSystemPrompt = buildSystemPrompt(systemPrompt);
    const conversationKey = phoneNumber; // ID do documento no Firestore

    // 1. Carregar histórico do Firestore
    let history = await getHistoryFromFirestore(conversationKey);
    logger.info(`Histórico carregado para ${phoneNumber}: ${history.length} mensagens`);

    // 2. Configurar Modelo
    const modelConfig = {
      model: FIXED_MODEL,
      systemInstruction: finalSystemPrompt, // Passar prompt aqui (melhor que cache complexo para agora)
      generationConfig: {
        temperature: FIXED_TEMPERATURE,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    // (Opcional) Cache de contexto poderia ser reinserido aqui se necessário

    const model = genAI.getGenerativeModel(modelConfig);

    // 3. Iniciar Chat com histórico recuperado
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))
    });

    logger.info('===== ENVIANDO MENSAGEM PARA GEMINI =====');
    logger.info(`Telefone: ${phoneNumber}`);
    logger.info(`Mensagem: ${messageText}`);

    // 4. Enviar mensagem
    const result = await chat.sendMessage(messageText);
    const response = result.response;
    const responseText = response.text();

    if (responseText) {
      logger.info('===== RESPOSTA VÁLIDA RECEBIDA =====');
      logger.info(`Resposta: ${responseText.substring(0, 100)}...`);

      // 5. Salvar novos itens no histórico (User + Model)
      // Gemini API adiciona automaticamente ao chat.history, mas precisamos persistir no Firestore
      await saveMessagesToFirestore(conversationKey, [
        { role: 'user', content: messageText, timestamp: Date.now() },
        { role: 'model', content: responseText, timestamp: Date.now() }
      ]);

      return responseText;
    } else {
      throw new Error('Resposta vazia do Gemini');
    }

  } catch (error) {
    logger.error('❌ ERRO AO PROCESSAR COM GEMINI:', error);

    // Tratamento básico de erros
    if (String(error).includes('SAFETY')) return "Desculpe, não posso responder a isso por segurança.";
    if (String(error).includes('503')) return "Serviço temporariamente indisponível. Tente em 1 minuto.";

    throw error;
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

/**
 * Obtém as ferramentas (tools) do Google Calendar via Composio (COM CACHE)
 * @param {string} userId - ID do usuário (phoneNumber será usado como user_id)
 */
export async function getCalendarTools(userId = 'default') {
  try {
    const now = Date.now();

    // 1. Verificar Cache Global de Tools
    if (calendarToolsCache && (now - calendarToolsCacheTime < TOOLS_CACHE_TTL)) {
      // logger.info('📦 Usando Cache de Calendar Tools'); // Comentado para não poluir log
      return calendarToolsCache;
    }

    const client = getComposioClient();
    if (!client) {
      logger.warn('⚠️ Composio não está configurado - Calendar tools não disponíveis');
      return null;
    }

    logger.info(`📅 Obtendo ferramentas do Google Calendar para user_id: ${userId}...`);

    // Usar a API correta do Composio com user_id como primeiro argumento e options como segundo
    const tools = await client.tools.get(userId, {
      toolkits: ['GOOGLECALENDAR']
    });

    // Atualizar Cache
    if (tools && tools.length > 0) {
      calendarToolsCache = tools;
      calendarToolsCacheTime = now;
      logger.info(`✅ ${tools.length} ferramentas do Calendar carregadas e cacheadas`);
    }

    return tools;
  } catch (error) {
    logger.error('❌ Erro ao obter Calendar tools:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

/**
 * Processa mensagem com suporte a Google Calendar usando Function Calling
 */
export async function processMessageWithCalendar(messageText, phoneNumber, apiKey, systemPrompt = '', calendarUserId = null, calendarSettings = null) {
  try {
    const toolsUserId = calendarUserId || phoneNumber;
    logger.info(`📅 Processando mensagem COM suporte a Calendar (User: ${toolsUserId})`);

    const client = getComposioClient();

    if (!client) {
      logger.warn('⚠️ Composio não configurado - usando processamento padrão');
      return await processMessageWithGemini(messageText, phoneNumber, apiKey, FIXED_MODEL, systemPrompt, FIXED_TEMPERATURE);
    }

    // Obter ferramentas do Calendar usando o ID correto (da instância ou do usuário)
    const calendarTools = await getCalendarTools(toolsUserId);

    if (!calendarTools || calendarTools.length === 0) {
      logger.warn('⚠️ Não foi possível carregar Calendar tools - usando processamento padrão');
      return await processMessageWithGemini(messageText, phoneNumber, apiKey, FIXED_MODEL, systemPrompt, FIXED_TEMPERATURE);
    }

    // Obter o connected account ID para execução de ferramentas (COM CACHE)
    let connectedAccountId = null;
    const now = Date.now();
    const cachedAccount = connectedAccountsCache.get(toolsUserId);

    if (cachedAccount && (now - cachedAccount.timestamp < ACCOUNTS_CACHE_TTL)) {
      connectedAccountId = cachedAccount.accountId;
      // logger.info(`🔗 Usando Cached Account ID: ${connectedAccountId}`);
    } else {
      try {
        // logger.info(`🔍 Buscando connected accounts na API para ${toolsUserId}...`);
        const accountsResponse = await client.connectedAccounts.list({ entityId: toolsUserId });
        const accounts = accountsResponse.items || [];
        if (accounts.length > 0) {
          connectedAccountId = accounts[0].id;
          logger.info(`🔗 Connected Account ID Encontrado: ${connectedAccountId}`);
        } else {
          // logger.info(`ℹ️ Nenhuma connected account encontrada para ${toolsUserId}`);
        }

        // Salvar no cache (mesmo se null, para evitar ficar buscando toda hora se não tiver)
        connectedAccountsCache.set(toolsUserId, {
          accountId: connectedAccountId,
          timestamp: now
        });

      } catch (accError) {
        logger.warn('⚠️ Não foi possível obter connected account ID:', accError.message);
      }
    }

    // Composio retorna tools no formato OpenAI: { type: "function", function: { name, description, parameters } }
    // Gemini espera: { name, description, parameters }
    // Precisamos extrair o objeto 'function' e remover campos não suportados pelo Gemini

    // Função recursiva para remover campos não suportados pelo Gemini
    const sanitizeForGemini = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeForGemini);

      const result = {};
      const unsupportedFields = ['examples', 'additionalProperties', 'default', 'nullable', 'title', '$ref'];

      for (const [key, value] of Object.entries(obj)) {
        if (unsupportedFields.includes(key)) continue; // Skip unsupported fields
        result[key] = sanitizeForGemini(value);
      }
      return result;
    };

    const toolNameMap = {};
    const geminiTools = calendarTools.map(tool => {
      // Extrair o objeto function (formato OpenAI -> Gemini)
      const fn = tool.function || tool;
      const originalName = fn.name;

      // Mapear para execução
      toolNameMap[originalName] = originalName;

      // Sanitizar parameters removendo campos não suportados
      const cleanParams = sanitizeForGemini(fn.parameters) || { type: 'object', properties: {} };

      return {
        name: originalName,
        description: fn.description || '',
        parameters: cleanParams
      };
    });

    // Logar estrutura da primeira ferramenta sanitizada para debug
    logger.info('🛠️ Tool Sanitizada para Gemini:', JSON.stringify(geminiTools[0], null, 2));

    const genAI = new GoogleGenerativeAI(apiKey);

    // Build system prompt COM contexto temporal (para enviar ao Gemini)
    // E COM configurações de calendário
    const finalSystemPrompt = buildSystemPrompt(systemPrompt, true, calendarSettings);

    // Build system prompt SEM contexto temporal (para comparação estável)
    // Isso evita recriar a conversa a cada mensagem só porque a hora mudou
    const baseSystemPrompt = buildSystemPrompt(systemPrompt, false, calendarSettings);

    // Criar chave única para histórico
    const conversationKey = phoneNumber;

    // Obter ou criar histórico de conversa
    let conversationData = userConversations.get(conversationKey);

    // Verificar se o prompt BASE mudou (ignorando datetime que muda a cada segundo)
    const promptChanged = conversationData && conversationData.basePrompt !== baseSystemPrompt;

    if (!conversationData || promptChanged) {
      if (promptChanged) {
        logger.info(`🔄 Prompt alterado para ${phoneNumber} - recriando conversa com Calendar tools`);
      }

      // IMPORTANTE: NÃO usar cache quando há tools/function calling
      // A API do Gemini não permite usar cachedContent junto com tools
      // Erro: "CachedContent can not be used with GenerateContent request setting tools or tool_config"

      const modelConfig = {
        model: FIXED_MODEL,
        generationConfig: {
          temperature: FIXED_TEMPERATURE,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
        tools: [
          {
            functionDeclarations: geminiTools
          }
        ],
        // Sempre usar systemInstruction quando há tools (não pode usar cache)
        systemInstruction: finalSystemPrompt
      };

      const model = genAI.getGenerativeModel(modelConfig);

      const chat = model.startChat({
        history: [],
      });

      conversationData = {
        chat,
        model,
        systemPrompt: finalSystemPrompt,
        basePrompt: baseSystemPrompt  // Prompt estável para comparação (sem datetime)
      };

      userConversations.set(conversationKey, conversationData);
      logger.info(`🆕 Nova conversa com Calendar iniciada para ${phoneNumber}`);
    } else {
      logger.info(`♻️ Usando conversa existente com Calendar para ${phoneNumber}`);
    }

    const { chat } = conversationData;

    // Função auxiliar para enviar mensagem com retry (para 503 e outros erros transientes)
    const sendMessageWithRetry = async (chatSession, content, isRetry = false) => {
      const MAX_RETRIES = 2;
      let attempt = 0;

      while (attempt <= MAX_RETRIES) {
        try {
          return await chatSession.sendMessage(content);
        } catch (error) {
          attempt++;
          const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');

          if (attempt <= MAX_RETRIES && isOverloaded) {
            logger.warn(`⚠️ Erro 503/Overloaded no Gemini (tentativa ${attempt}/${MAX_RETRIES}). Aguardando 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Backoff exponencial simples
            continue;
          }

          throw error;
        }
      }
    };

    logger.info('===== ENVIANDO MENSAGEM PARA GEMINI (COM CALENDAR) =====');
    logger.info(`Telefone: ${phoneNumber}`);
    logger.info(`Modelo: ${FIXED_MODEL}`);
    logger.info(`Calendar Tools: ${geminiTools.length} ações disponíveis`);
    logger.info(`Mensagem: ${messageText}`);
    logger.info('========================================================');

    // Enviar mensagem (COM RETRY)
    const result = await sendMessageWithRetry(chat, messageText);
    let currentResponse = result.response;
    let iterationCount = 0;
    const MAX_ITERATIONS = 10; // Limite de segurança para evitar loops infinitos

    // Loop para processar múltiplas rodadas de function calls (ex: cancelar + reagendar)
    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      // Verificar se há function calls
      const functionCalls = currentResponse.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        // Sem mais function calls, retornar resposta de texto
        const responseText = currentResponse.text();

        if (iterationCount === 1) {
          logger.info('===== RESPOSTA DIRETA (SEM FUNCTION CALLS) =====');
        } else {
          logger.info(`===== RESPOSTA FINAL (APÓS ${iterationCount - 1} RODADA(S) DE FUNCTION CALLS) =====`);
        }
        logger.info(`Resposta: ${responseText}`);
        logger.info('===============================================');

        return responseText;
      }

      logger.info(`🔧 Rodada ${iterationCount}: ${functionCalls.length} function call(s) detectada(s)`);

      // Processar cada function call
      const functionResponses = [];

      for (const call of functionCalls) {
        // Recuperar nome original da ação Composio
        const originalActionName = toolNameMap[call.name] || call.name;

        logger.info(`📞 Executando: ${call.name} (Original: ${originalActionName})`);
        logger.info(`📊 Parâmetros: ${JSON.stringify(call.args, null, 2)}`);

        try {
          // Preparar argumentos, possivelmente com Google Meet para reuniões online
          let actionArgs = call.args || {};

          // Se for criação de evento E o tipo de reunião for 'online', adicionar Google Meet
          if (originalActionName === 'GOOGLECALENDAR_CREATE_EVENT' && calendarSettings?.meetingType === 'online') {
            logger.info('📹 Tipo de reunião ONLINE detectado - Adicionando Google Meet ao evento...');

            // Adicionar conferenceData para criar link do Google Meet
            actionArgs = {
              ...actionArgs,
              conferenceDataVersion: 1,
              conferenceData: {
                createRequest: {
                  requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  conferenceSolutionKey: {
                    type: 'hangoutsMeet'
                  }
                }
              }
            };

            logger.info('✅ Parâmetros do Google Meet adicionados:', JSON.stringify(actionArgs.conferenceData, null, 2));
          }

          // Se for reunião presencial e tiver endereço configurado, adicionar location
          if (originalActionName === 'GOOGLECALENDAR_CREATE_EVENT' && calendarSettings?.meetingType === 'in-person' && calendarSettings?.meetingAddress) {
            logger.info('🏢 Tipo de reunião PRESENCIAL detectado - Adicionando endereço ao evento...');
            actionArgs = {
              ...actionArgs,
              location: calendarSettings.meetingAddress
            };
            logger.info(`✅ Localização adicionada: ${calendarSettings.meetingAddress}`);
          }

          // Executar a ação via Composio
          const toolResult = await client.client.tools.execute(originalActionName, {
            entity_id: toolsUserId,
            connected_account_id: connectedAccountId,
            arguments: actionArgs
          });

          logger.info(`✅ Resultado da ação: ${JSON.stringify(toolResult, null, 2)}`);

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: toolResult
            }
          });
        } catch (toolError) {
          console.error('\n❌ TOOL EXECUTION ERROR:');
          console.error('Message:', toolError.message);
          console.error('Name:', toolError.name);
          if (toolError.response) {
            console.error('Response Status:', toolError.response.status);
            console.error('Response Data:', JSON.stringify(toolError.response.data, null, 2));
          }
          if (toolError.errorDetails) {
            console.error('Error Details:', JSON.stringify(toolError.errorDetails, null, 2));
          }

          logger.error(`❌ Erro ao executar ${call.name}:`, JSON.stringify(toolError, Object.getOwnPropertyNames(toolError)));

          if (toolError.response && toolError.response.data) {
            logger.error(`📦 Dados da resposta do erro:`, JSON.stringify(toolError.response.data, null, 2));
          }

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: {
                error: toolError.message,
                success: false
              }
            }
          });
        }
      }

      // Enviar resultados das ferramentas de volta ao modelo (COM RETRY)
      logger.info('📤 Enviando resultados das tools de volta ao modelo...');
      const nextResult = await sendMessageWithRetry(chat, functionResponses);
      currentResponse = nextResult.response;

      // O loop continuará e verificará se há mais function calls ou uma resposta de texto
    }

    // Se chegamos aqui, atingimos o limite de iterações
    logger.warn(`⚠️ Limite de ${MAX_ITERATIONS} iterações de function calls atingido`);
    return 'Desculpe, houve um problema ao processar sua solicitação. Por favor, tente novamente.';

  } catch (error) {
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      logger.error('❌ ERRO 503 persistente no Calendar. Retornando erro para o usuário evitar alucinação.');
      return "Desculpe, o sistema de agendamento está temporariamente instável/sobrecarregado. Por favor, tente novamente em alguns instantes. Não consegui concluir sua solicitação.";
    }

    logger.error('❌ ERRO FATAL ao processar com Calendar:', error);

    // Se for outro erro, fazemos fallback mas COM AVISO para evitar alucinação
    logger.warn('⚠️ Fallback para processamento padrão sem Calendar (Safe Mode)');

    // Injetar aviso no system prompt do fallback
    const safeSystemPrompt = (systemPrompt || '') + "\n\n[SISTEMA CRÍTICO]: A ferramenta de calendário está INDISPONÍVEL devido a um erro técnico. SE o usuário pediu para a agendar/cancelar, PEÇA DESCULPAS e diga que não consegue acessar o sistema agora. NÃO FINJA que agendou. Seja honesto sobre a falha técnica.";

    return await processMessageWithGemini(messageText, phoneNumber, apiKey, FIXED_MODEL, safeSystemPrompt, FIXED_TEMPERATURE);
  }
}
