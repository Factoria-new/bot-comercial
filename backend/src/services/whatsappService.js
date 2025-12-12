import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import logger, { baileysLogger } from '../config/logger.js';
import {
  processMessageWithAI,
  processAudioMessageWithAI,
  processImageMessageWithAI,
  processDocumentMessageWithAI
} from './openaiService.js';
import {
  processMessageWithGemini,
  processAudioMessageWithGemini,
  processImageMessageWithGemini,
  processDocumentMessageWithGemini,
  processMessageWithCalendar
} from './geminiService.js';
import {
  generateSpeech,
  shouldSendAsAudio,
  separateTextAndLinks,
  saveTempAudio,
  cleanupTempAudio
} from './ttsService.js';
import calendarService from './calendarService.js';

const sessions = new Map();
const sessionConfigs = new Map();
const pendingSends = new Map(); // sessionId -> [{ jid, payload, def, created }]
const SESSIONS_PATH = process.env.SESSIONS_PATH || './sessions';
// Novo: bloqueio para criações de sessão em andamento (evita remoção concorrente de arquivos)
const activeSessionCreations = new Set();
// Flag para indicar que estamos gerando Código e não queremos reconexão automática
const generatingQR = new Set();
// Contador de tentativas de reconexão para backoff exponencial
const reconnectionAttempts = new Map(); // sessionId -> { count, lastAttempt }

// Reconexão automática é gerenciada pelo próprio Baileys
// Não precisamos de keep-alive customizado!

// Buffer de mensagens por usuário (para agrupar mensagens antes de enviar ao Gemini)
const messageBuffers = new Map(); // { phoneNumber: { messages: [], timer: timeoutId } }
const BUFFER_TIMEOUT = 10000; // 10 segundos
// Garantir que o diretório de sessões existe
if (!fs.existsSync(SESSIONS_PATH)) {
  fs.mkdirSync(SESSIONS_PATH, { recursive: true });
}

class WhatsAppService {
  constructor(io) {
    this.io = io;
  }

  async createSession(sessionId, options = {}) {
    logger.info(`createSession: iniciando criação/restauração da sessão ${sessionId}`);

    // ⚠️ PROTEÇÃO: Se já existe uma sessão ativa E o socket está aberto, retornar
    if (sessions.has(sessionId)) {
      const existing = sessions.get(sessionId);
      try {
        if (this.isSocketOpen(existing.socket)) {
          logger.info(`Sessão ${sessionId} já existe e socket está ABERTO - retornando sessão existente`);
          return sessions.get(sessionId);
        } else {
          logger.warn(`Sessão ${sessionId} existe mas socket NÃO está aberto — fechando completamente antes de recriar`);
          // Fechar socket antigo completamente
          try {
            if (existing.socket.ws) {
              existing.socket.ws.close();
              existing.socket.ws.terminate?.();
            }
            existing.socket.end?.();
          } catch (e) {
            logger.warn(`Erro ao fechar socket antigo: ${e?.message || e}`);
          }
          sessions.delete(sessionId);
        }
      } catch (e) {
        logger.warn(`Erro ao verificar estado do socket existente para ${sessionId}: ${e?.message || e}`);
        sessions.delete(sessionId);
      }
    }

    // ⚠️ PROTEÇÃO: Verificar se já há uma criação em andamento
    if (activeSessionCreations.has(sessionId)) {
      logger.warn(`⏳ Criação já em andamento para ${sessionId} - aguardando conclusão...`);
      // Aguardar até 10 segundos para a criação anterior terminar
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!activeSessionCreations.has(sessionId)) {
          logger.info(`✅ Criação anterior completada para ${sessionId}`);
          // Se a sessão foi criada com sucesso, retornar
          if (sessions.has(sessionId) && this.isSocketOpen(sessions.get(sessionId).socket)) {
            return sessions.get(sessionId);
          }
          break;
        }
      }
      if (activeSessionCreations.has(sessionId)) {
        logger.error(`❌ Timeout aguardando criação anterior de ${sessionId}`);
        return null;
      }
    }

    // Marcar que estamos criando/recriando esta sessão
    activeSessionCreations.add(sessionId);

    try {
      const sessionPath = path.join(SESSIONS_PATH, sessionId);

      // Se forceNewAuth for solicitado, garante que a pasta da sessão seja removida para que
      // o Baileys inicie sem credenciais existentes e emita um Código.
      if (options.forceNewAuth) {
        try {
          if (fs.existsSync(sessionPath)) {
            logger.info(`createSession: forceNewAuth=true — removendo pasta existente ${sessionPath}`);
            fs.rmSync(sessionPath, { recursive: true, force: true });
          }
        } catch (err) {
          logger.error(`createSession: falha ao remover pasta de sessão para forceNewAuth: ${err?.message || err}`);
        }
      }

      // Criar diretório da sessão se não existir
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }
      try {
        const files = fs.existsSync(sessionPath) ? fs.readdirSync(sessionPath) : [];
        logger.info(`createSession: contents of ${sessionPath}: ${files.length} files -> ${files.join(', ')}`);
      } catch (listErr) {
        logger.warn(`createSession: falha ao listar conteúdo de ${sessionPath}: ${listErr?.message || listErr}`);
      }
      console.log(`createSession: auth state será carregado de ${sessionPath}`);
      let state, saveCreds;
      const MAX_AUTH_RETRIES = 5;
      for (let attempt = 0; attempt < MAX_AUTH_RETRIES; attempt++) {
        try {
          // Garantir que a pasta exista antes de pedir ao Baileys para usá-la
          if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
          }
          const auth = await useMultiFileAuthState(sessionPath);
          state = auth.state;
          saveCreds = auth.saveCreds;

          // Envolve saveCreds para ser resiliente a deleções/renomeações concorrentes da pasta da sessão.
          // Se a escrita falhar com ENOENT, recria a pasta e tenta novamente algumas vezes.
          const saveCredsSafe = async (data) => {
            const MAX_SAVE_RETRIES = 4;
            for (let attempt = 0; attempt < MAX_SAVE_RETRIES; attempt++) {
              try {
                // Garante que o diretório exista antes de delegar para o saveCreds do Baileys
                if (!fs.existsSync(sessionPath)) {
                  fs.mkdirSync(sessionPath, { recursive: true });
                }
                await saveCreds(data);
                return;
              } catch (err) {
                const isENOENT = err && (err.code === 'ENOENT' || (err.message && err.message.includes('ENOENT')));
                logger.warn(`saveCredsSafe: tentativa ${attempt + 1}/${MAX_SAVE_RETRIES} falhou para ${sessionPath}: ${err?.message || err}`);
                if (isENOENT) {
                  try {
                    fs.mkdirSync(sessionPath, { recursive: true });
                    logger.warn(`saveCredsSafe: diretório recriado ${sessionPath} após ENOENT`);
                  } catch (mkErr) {
                    logger.error(`saveCredsSafe: falha ao recriar diretório ${sessionPath}:`, mkErr);
                  }
                  // backoff
                  await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
                  continue;
                }

                // Non-ENOENT -> log and rethrow
                logger.error('saveCredsSafe: erro não recuperável ao salvar credenciais:', err);
                throw err;
              }
            }

            logger.error(`saveCredsSafe: não foi possível salvar credenciais em ${sessionPath} após múltiplas tentativas`);
          };
          logger.info(`createSession: auth state carregado (creds keys: ${Object.keys(state.creds || {}).length})`);
          try {
            const postFiles = fs.existsSync(sessionPath) ? fs.readdirSync(sessionPath) : [];
            logger.info(`createSession: após load auth, conteúdo de ${sessionPath}: ${postFiles.length} files -> ${postFiles.join(', ')}`);
          } catch (listErr2) {
            logger.warn(`createSession: falha ao listar conteúdo após auth load ${sessionPath}: ${listErr2?.message || listErr2}`);
          }
          break;
        } catch (err) {
          // Se for ENOENT, tentar recriar a pasta e re-tentar após pequeno delay
          const isENOENT = err && (err.code === 'ENOENT' || (err.message && err.message.includes('ENOENT')));
          logger.warn(`createSession: falha ao carregar auth state (attempt ${attempt + 1}/${MAX_AUTH_RETRIES}): ${err?.message || err}`);
          if (isENOENT) {
            try {
              fs.mkdirSync(sessionPath, { recursive: true });
              logger.warn(`createSession: diretório recriado ${sessionPath} após ENOENT`);
            } catch (mkErr) {
              logger.error(`createSession: falha ao recriar diretório ${sessionPath}:`, mkErr);
            }
            // aguardar um pouco antes da próxima tentativa
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }

          // Para outros erros, re-throw após log
          logger.error('createSession: erro fatal ao carregar auth state:', err);
          throw err;
        }
      }
      if (!state || !saveCreds) {
        throw new Error('Não foi possível carregar auth state após múltiplas tentativas');
      }

      const { version } = await fetchLatestBaileysVersion();
      logger.info(`createSession: versão do Baileys obtida: ${JSON.stringify(version)}`);

      logger.info(`createSession: Iniciando criação do socket Baileys para ${sessionId}`, {
        forceNewAuth: options.forceNewAuth,
        hasCredentials: !!state.creds,
        credentialsKeys: Object.keys(state.creds || {}),
        version: version
      });

      // Validação das credenciais antes da criação do socket
      if (!state.creds) {
        logger.error(`createSession: Credenciais não encontradas para ${sessionId}`);
        throw new Error('Credenciais não encontradas');
      }

      if (!state.keys) {
        logger.error(`createSession: Keys não encontradas para ${sessionId}`);
        throw new Error('Keys não encontradas');
      }

      // Validação básica da estrutura das credenciais
      const requiredCredFields = ['noiseKey', 'pairingEphemeralKeyPair', 'signedIdentityKey', 'signedPreKey', 'registrationId'];
      const missingFields = requiredCredFields.filter(field => !state.creds[field]);

      if (missingFields.length > 0) {
        logger.warn(`createSession: Campos de credenciais ausentes para ${sessionId}: ${missingFields.join(', ')}`);
        // Não vamos bloquear por campos ausentes, apenas logar
      }

      logger.info(`createSession: Validação de credenciais passou para ${sessionId}`, {
        credsValid: !!state.creds,
        keysValid: !!state.keys,
        missingFields: missingFields
      });

      // Inicializa caches da sessão
      const sessionContacts = {};
      const sessionChats = {};
      const sessionMessages = {};
      const sessionLidToPhone = {};

      // Helper para salvar cache
      const saveCache = () => {
        try {
          if (!sessionId) return;
          const cachePath = path.join(SESSIONS_PATH, sessionId, 'cache.json');
          const data = {
            contacts: sessionContacts,
            chats: sessionChats,
            messages: sessionMessages,
            lidToPhone: sessionLidToPhone
          };
          fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
        } catch (err) {
          logger.error(`Erro ao salvar cache da sessão ${sessionId}:`, err);
        }
      };

      let socket;
      try {
        // Configuração otimizada do socket para conexão 24/7
        logger.info(`createSession: Criando socket com configurações otimizadas para ${sessionId}`);

        // Tenta carregar cache existente
        try {
          const cachePath = path.join(SESSIONS_PATH, sessionId, 'cache.json');
          if (fs.existsSync(cachePath)) {
            const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
            Object.assign(sessionContacts, data.contacts || {});
            Object.assign(sessionChats, data.chats || {});
            Object.assign(sessionMessages, data.messages || {});
            Object.assign(sessionLidToPhone, data.lidToPhone || {});
            logger.info(`Cache carregado para sessão ${sessionId}: ${Object.keys(sessionContacts).length} contatos, ${Object.keys(sessionChats).length} chats`);
          }
        } catch (err) {
          logger.warn(`Não foi possível carregar cache para sessão ${sessionId}:`, err);
        }

        socket = makeWASocket({
          version,
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
          },
          printQRInTerminal: false,
          logger: baileysLogger,

          // ✨ CONFIGURAÇÕES PARA MANTER CONEXÃO 24/7
          markOnlineOnConnect: true,
          keepAliveIntervalMs: 20000,
          syncFullHistory: true, // Precisamos do histórico para montar a lista de chats
          generateHighQualityLinkPreview: true,
          browser: ['Ubuntu', 'Chrome', '20.0.04'], // Browser simulado conforme solicitado
          emitOwnEvents: true,
          connectTimeoutMs: 60000,
          retryRequestDelayMs: 250,
          maxMsgRetryCount: 5,

          // 9. Handler de mensagens (cache local)
          getMessage: async (key) => {
            // Tenta recuperar do nosso cache simples
            if (sessionMessages[key.remoteJid]) {
              const msg = sessionMessages[key.remoteJid].find(m => m.key.id === key.id);
              return msg?.message;
            }
            return undefined;
          }
        });

        logger.info(`createSession: Socket Baileys criado com sucesso para ${sessionId}`, {
          socketExists: !!socket,
          wsReadyState: socket?.ws?.readyState,
          socketType: typeof socket
        });

      } catch (socketError) {
        logger.error(`createSession: ERRO ao criar socket Baileys para ${sessionId}:`);
        logger.error(`Erro completo: ${socketError}`);
        logger.error(`Mensagem: ${socketError?.message}`);
        logger.error(`Nome: ${socketError?.name}`);
        logger.error(`Código: ${socketError?.code}`);
        logger.error(`Stack trace: ${socketError?.stack}`);
        logger.error(`Tipo do erro: ${typeof socketError}`);
        logger.error(`Constructor: ${socketError?.constructor?.name}`);
        logger.error(`Propriedades do erro: ${JSON.stringify(Object.getOwnPropertyNames(socketError))}`);

        // Tentar capturar propriedades específicas do Baileys
        if (socketError?.output) {
          logger.error(`Boom output: ${JSON.stringify(socketError.output)}`);
        }
        if (socketError?.data) {
          logger.error(`Dados do erro: ${JSON.stringify(socketError.data)}`);
        }

        throw socketError;
      }

      sessions.set(sessionId, {
        socket,
        contacts: sessionContacts,
        chats: sessionChats,
        messages: sessionMessages,
        lidToPhone: sessionLidToPhone,
        saveCache
      });
      logger.info(`createSession: socket instanciado e entry adicionada em memória para ${sessionId}. ws.readyState=${socket?.ws?.readyState}`);

      // Event handlers
      // Usa wrapper seguro para persistir credenciais no disco (lida com operações concorrentes de arquivo/diretório)
      try {
        if (typeof saveCredsSafe === 'function') {
          socket.ev.on('creds.update', saveCredsSafe);
          logger.info(`createSession: registrado saveCredsSafe para creds.update em ${sessionId}`);
        } else if (typeof saveCreds === 'function') {
          socket.ev.on('creds.update', saveCreds);
          logger.info(`createSession: registrado saveCreds (fallback) para creds.update em ${sessionId}`);
        } else {
          logger.warn(`createSession: nenhum handler de saveCreds disponível para ${sessionId}`);
        }
      } catch (evErr) {
        logger.error(`createSession: falha ao registrar handler de creds.update para ${sessionId}: ${evErr?.message || evErr}`);
      }

      try {
        socket.ev.on('connection.update', async (update) => {
          await this.handleConnectionUpdate(sessionId, update, options.phoneNumber);
        });

        // 1. Cache de Contatos
        socket.ev.on('contacts.upsert', (contacts) => {
          logger.info(`👥 Recebendo ${contacts.length} contatos para ${sessionId}...`);
          for (const contact of contacts) {
            if (contact.lid) {
              sessionLidToPhone[contact.lid] = contact.id;
            }
            const displayName = contact.name || contact.notify || contact.verifiedName || sessionContacts[contact.id]?.name;
            sessionContacts[contact.id] = {
              ...sessionContacts[contact.id],
              ...contact,
              name: displayName
            };
          }
          saveCache();
        });

        // Cache de updates de contatos
        socket.ev.on('contacts.update', (updates) => {
          for (const update of updates) {
            if (update.lid && update.id) {
              sessionLidToPhone[update.lid] = update.id;
            }
            if (sessionContacts[update.id]) {
              sessionContacts[update.id] = {
                ...sessionContacts[update.id],
                ...update
              };
            }
          }
          saveCache();
        });

        // 2. Cache de Chats (Conversas)
        socket.ev.on('chats.upsert', (chats) => {
          for (const chat of chats) {
            sessionChats[chat.id] = {
              ...sessionChats[chat.id],
              ...chat
            };
          }
          saveCache();
        });

        // 3. Cache de Mensagens
        socket.ev.on('messages.upsert', ({ messages, type }) => {
          console.log(`🔥 EVENTO UPSERT RECEBIDO: ${type}, ${messages.length} msg(s)`);
          if (type === 'notify') {
            logger.info(`📥 ${messages.length} nova(s) mensagem(ns) para ${sessionId}`);
          }

          // Processa mensagens para o cache
          if (type === 'notify' || type === 'append' || type === 'prepend') {
            for (const msg of messages) {
              const jid = msg.key.remoteJid;
              if (!jid) continue;

              // Captura o pushName
              if (msg.pushName && !msg.key.fromMe) {
                const senderJid = jid.includes('@g.us') ? msg.key.participant : jid;
                if (!sessionContacts[senderJid]) {
                  sessionContacts[senderJid] = {};
                }
                if (!sessionContacts[senderJid].name || !sessionContacts[senderJid].verifiedName) {
                  sessionContacts[senderJid].pushName = msg.pushName;
                  sessionContacts[senderJid].name = msg.pushName;
                }
              }

              if (!sessionMessages[jid]) sessionMessages[jid] = [];

              const exists = sessionMessages[jid].some(m => m.key.id === msg.key.id);
              if (!exists) {
                sessionMessages[jid].push(msg);

                if (!sessionChats[jid]) {
                  sessionChats[jid] = {
                    id: jid,
                    name: sessionContacts[jid]?.name || jid.split('@')[0]
                  };
                }
                sessionChats[jid].conversationTimestamp = msg.messageTimestamp;

                if (!msg.key.fromMe) {
                  sessionChats[jid].unreadCount = (sessionChats[jid].unreadCount || 0) + 1;
                }
              }
            }
          }

          // Chama o handler original de mensagens
          this.handleIncomingMessages(sessionId, messages);
        });

        // 4. Histórico Sincronizado
        socket.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {
          logger.info(`📚 Histórico sincronizado para ${sessionId}: ${chats.length} chats, ${contacts.length} contatos, ${messages.length} mensagens`);

          for (const contact of contacts) {
            if (contact.lid) sessionLidToPhone[contact.lid] = contact.id;
            sessionContacts[contact.id] = {
              ...sessionContacts[contact.id],
              ...contact,
              name: contact.name || contact.notify || contact.verifiedName || sessionContacts[contact.id]?.name
            };
          }

          for (const chat of chats) {
            sessionChats[chat.id] = {
              ...sessionChats[chat.id],
              ...chat
            };
          }

          for (const msg of messages) {
            const jid = msg.key.remoteJid;
            if (!jid) continue;
            if (!sessionMessages[jid]) sessionMessages[jid] = [];
            const exists = sessionMessages[jid].some(m => m.key.id === msg.key.id);
            if (!exists) {
              sessionMessages[jid].push(msg);
            }
          }
          saveCache();
        });

        logger.info(`createSession: handlers connection.update, messages.upsert e caches registrados para ${sessionId}`);
      } catch (evErr2) {
        logger.error(`createSession: falha ao registrar connection/messages handlers para ${sessionId}: ${evErr2?.message || evErr2}`);
      }

      // Aguarda até que o socket emita conexão 'open' e até que o usuário (credenciais) esteja disponível, com timeout
      try {
        logger.info(`createSession: aguardando evento connection.open para sessão ${sessionId} (timeout 20s)`);
        const waitForOpen = (ms = 20000) => new Promise((resolve) => {
          let settled = false;
          const onUpdate = (update) => {
            try {
              if (update?.connection === 'open') {
                if (!settled) {
                  settled = true;
                  resolve(true);
                }
              }
              // Se a conexão fechar com loggedOut, resolve como false
              if (update?.connection === 'close') {
                const shouldReconnect = update?.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (!shouldReconnect && !settled) {
                  settled = true;
                  resolve(false);
                }
              }
            } catch (e) {
              // ignore
            }
          };

          socket.ev.on('connection.update', onUpdate);

          // timeout
          setTimeout(() => {
            if (!settled) {
              settled = true;
              socket.ev.removeListener?.('connection.update', onUpdate);
              resolve(false);
            }
          }, ms);
        });

        const opened = await waitForOpen(20000);
        if (opened) {
          // aguardar até que socket.user esteja disponível (credenciais carregadas)
          const maxUserWait = 10000;
          const pollInterval = 200;
          let waited = 0;
          while (!socket.user && waited < maxUserWait) {
            await new Promise(r => setTimeout(r, pollInterval));
            waited += pollInterval;
          }

          if (socket.user) {
            logger.info(`createSession: socket.open e socket.user disponível para ${sessionId}`);
          } else {
            logger.warn(`createSession: socket.open mas socket.user NÃO disponível para ${sessionId} após ${maxUserWait}ms`);
          }
        } else {
          logger.warn(`createSession: Timeout aguardando abertura do socket para sessão ${sessionId} — retornando, socket pode não estar pronto`);
        }
      } catch (e) {
        logger.warn(`createSession: Erro ao aguardar conexão open para ${sessionId}: ${e?.message || e}`);
      }

      // Carregar configuração persistida (se houver)
      this.loadSessionConfig(sessionId);

      logger.info(`Sessao ${sessionId} criada com sucesso`);
      return { socket };
    } finally {
      // Garantir que o lock seja removido mesmo em erro (evita bloquear deleções futuras)
      activeSessionCreations.delete(sessionId);
    }
  }

  async handleConnectionUpdate(sessionId, update, pairingPhoneNumber) {
    // Log detalhado de todos os updates de conexão
    logger.info(`handleConnectionUpdate: evento recebido para ${sessionId}`, {
      connection: update.connection,
      hasQr: !!update.qr,
      hasLastDisconnect: !!update.lastDisconnect,
      updateKeys: Object.keys(update)
    });

    const { connection, lastDisconnect, qr } = update;
    const session = sessions.get(sessionId);

    // Lógica de Pairing Code
    if (pairingPhoneNumber) {
      logger.info(`handleConnectionUpdate: Verificando Pairing Code. Phone: ${pairingPhoneNumber}, Connection: ${connection}, QR: ${!!qr}, Requested: ${session?.pairingCodeRequested}`);
    }

    if ((connection === 'connecting' || !!qr) && pairingPhoneNumber && !session?.pairingCodeRequested) {
      logger.info(`🔄 Conectando... Solicitando Pairing Code para ${pairingPhoneNumber} na sessão ${sessionId}`);

      // Marca que já solicitamos para evitar loop
      if (session) session.pairingCodeRequested = true;

      try {
        // Pequeno delay para garantir que o socket esteja pronto
        await new Promise(r => setTimeout(r, 2000));

        if (!session?.socket) {
          throw new Error('Socket não inicializado para pairing code');
        }

        const code = await session.socket.requestPairingCode(pairingPhoneNumber);
        logger.info(`✅ Pairing Code Gerado para ${sessionId}: ${code}`);

        // Emite para o frontend
        this.io.emit('pairing-code', { sessionId, code });

      } catch (err) {
        logger.error(`❌ Falha ao solicitar Pairing Code para ${sessionId}:`, err.message);
        this.io.emit('pairing-error', { sessionId, error: err.message });
        if (session) session.pairingCodeRequested = false; // Permite tentar novamente
      }
    }

    // Se não estiver usando pairing code, mantém lógica de QR (opcional, mas o user pediu para remover QR visual, mas o evento ainda vem)
    // Se tiver pairingPhoneNumber, ignoramos o QR visual
    if (qr && !pairingPhoneNumber) {
      // Log detalhado do payload QR recebido
      logger.info(`handleConnectionUpdate: QR recebido para ${sessionId}`, {
        qrType: typeof qr,
        qrLength: qr?.length || 'N/A',
        qrIsBuffer: Buffer.isBuffer(qr),
        qrIsString: typeof qr === 'string',
        qrIsObject: typeof qr === 'object' && qr !== null,
        qrConstructor: qr?.constructor?.name || 'N/A',
        qrSample: typeof qr === 'string' ? qr.substring(0, 50) + '...' : 'N/A'
      });

      // Emite payload QR bruto para depuração (frontend/admin podem inspecionar)
      try {
        this.io.emit('qr-raw', { sessionId, qrPayload: qr });
      } catch (e) {
        logger.warn(`Falha ao emitir qr-raw para ${sessionId}: ${e?.message || e}`);
      }

      try {
        // Normaliza o payload do QR para uma string quando possível
        let qrString;
        if (typeof qr === 'string') {
          qrString = qr;
        } else if (Buffer.isBuffer(qr)) {
          qrString = qr.toString('utf8');
        } else if (qr && typeof qr === 'object' && typeof qr.code === 'string') {
          // Em alguns casos o payload pode ser um objeto com campo 'code' ou similar
          qrString = qr.code;
        } else if (qr && typeof qr === 'object' && typeof qr.qr === 'string') {
          qrString = qr.qr;
        } else {
          try {
            qrString = JSON.stringify(qr);
          } catch (e) {
            qrString = String(qr);
          }
        }

        // Validar se qrString é válido antes de tentar gerar QR
        if (!qrString || qrString.trim() === '' || qrString === 'null' || qrString === 'undefined') {
          logger.error(`handleConnectionUpdate: QR string inválido para ${sessionId}:`, {
            qrString,
            originalQr: qr,
            qrType: typeof qr
          });
          this.io.emit('qr-error', { sessionId, error: 'QR payload inválido ou vazio' });
          return;
        }

        logger.info(`handleConnectionUpdate: QR normalizado para ${sessionId} (length=${qrString.length}, sample=${qrString.substring(0, 50)}...)`);

        // Tentar gerar DataURL a partir da string normalizada
        let qrDataURL;
        try {
          qrDataURL = await QRCode.toDataURL(qrString);
        } catch (innerErr) {
          logger.warn(`QRCode.toDataURL falhou com normalized string — tentando fallback (session ${sessionId}):`, {
            error: innerErr?.message || innerErr,
            qrStringLength: qrString.length,
            qrStringSample: qrString.substring(0, 100)
          });
          // Fallback: tentar usar a string bruta (não JSONified)
          try {
            qrDataURL = await QRCode.toDataURL(String(qr));
          } catch (fallbackErr) {
            // Se tudo falhar, log completo e emitir erro
            logger.error(`Erro ao gerar Código (fallback falhou) para ${sessionId}:`, {
              message: fallbackErr?.message || String(fallbackErr),
              stack: fallbackErr?.stack,
              qrPayload: qr,
              qrString: qrString,
              qrType: typeof qr
            });
            this.io.emit('qr-error', { sessionId, error: fallbackErr?.message || String(fallbackErr) });
            return;
          }
        }

        // Se obtivemos um DataURL válido, emitir para frontend
        if (qrDataURL) {
          this.io.emit('qr', { sessionId, qr: qrDataURL });
          logger.info(`Código gerado para sessão ${sessionId}`);
        } else {
          logger.warn(`QRCode.toDataURL retornou vazio para ${sessionId}; emitindo qr-raw para diagnóstico`);
          this.io.emit('qr-error', { sessionId, error: 'QRCode.toDataURL retornou vazio', qrPayload: qr });
        }
      } catch (error) {
        // Log mais completo para depuração (inclui stack e payload do qr)
        logger.error(`Erro ao processar payload de QR para ${sessionId}:`, { message: error?.message || String(error), stack: error?.stack, qrPayload: qr });
        this.io.emit('qr-error', { sessionId, error: error?.message || String(error) });
      }
    }

    if (connection === 'close') {
      // Log completo do lastDisconnect para diagnóstico
      logger.warn(`connection.update close para ${sessionId} — lastDisconnect: ${JSON.stringify(lastDisconnect)}`);

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const payloadMessage = lastDisconnect?.error?.output?.payload?.message;

      // Verificar se é erro de conflito (device_removed)
      const errorData = lastDisconnect?.error?.data;
      const isDeviceRemoved = errorData?.content?.[0]?.attrs?.type === 'device_removed';

      // Tratar alguns códigos/erros como irreparáveis para evitar loop de reconexão
      // 428 (Precondition Required) removido para permitir tentativas de reconexão em instabilidades
      const unrecoverableStatusCodes = [440];
      const isUnrecoverableCode = unrecoverableStatusCodes.includes(Number(statusCode));
      const isLoggedOutFlag = statusCode === DisconnectReason.loggedOut || payloadMessage === 'loggedOut' || payloadMessage === 'Invalid session';

      // Se for erro 401 com device_removed, é logout definitivo
      const is401Conflict = statusCode === 401 && (isDeviceRemoved || payloadMessage?.includes('conflict'));

      const shouldReconnect = !(isUnrecoverableCode || isLoggedOutFlag || is401Conflict);

      logger.info(`Conexão fechada para ${sessionId}. statusCode=${statusCode} payloadMessage=${payloadMessage} isDeviceRemoved=${isDeviceRemoved} shouldReconnect=${shouldReconnect}`);

      if (shouldReconnect) {
        // ⚠️ DOCUMENTAÇÃO OFICIAL BAILEYS: https://baileys.wiki/docs/socket/connecting
        // "After scanning the code, WhatsApp will forcibly disconnect you"
        // "create a new socket, this socket is now useless"
        if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
          if (generatingQR.has(sessionId)) {
            logger.info(`✅ Código escaneado para ${sessionId} - criando NOVO socket conforme documentação`);
            generatingQR.delete(sessionId);
          }

          logger.info(`🔄 Erro 515 para ${sessionId} - socket atual INUTILIZÁVEL, criando novo (doc oficial Baileys)`);

          // ✅ EMITIR EVENTO PARA FRONTEND: Código foi escaneado
          this.io.emit('qr-scanned', {
            sessionId,
            message: 'Código escaneado! Aguarde a conexão...'
          });

          // ⚠️ CRÍTICO: Remover lock ANTES de deletar sessão
          // Se não fizer isso, o setTimeout não conseguirá criar novo socket
          activeSessionCreations.delete(sessionId);

          // Limpar sessão da memória (socket antigo está inutilizável)
          sessions.delete(sessionId);

          // ⚠️ CRÍTICO: Aguardar 3 segundos para garantir que:
          // 1. As credenciais sejam salvas no disco (evento creds.update)
          // 2. O socket antigo seja completamente destruído pelo WhatsApp
          // 3. O servidor WhatsApp processe a desconexão
          setTimeout(async () => {
            try {
              logger.info(`📡 Criando NOVO socket para ${sessionId} após QR escaneado (aguardou 3s para creds serem salvas)...`);
              await this.createSession(sessionId);
            } catch (error) {
              logger.error(`Erro ao criar novo socket ${sessionId}:`, error);
              // Em caso de erro, emitir evento de erro para o frontend
              this.io.emit('qr-error', {
                sessionId,
                error: `Falha ao reconectar após scan: ${error.message}`
              });
            }
          }, 3000);

          return;
        }

        // Para outros erros de conexão, tentar reconectar com backoff exponencial
        logger.info(`Conexão perdida para ${sessionId} (statusCode=${statusCode}) - tentando reconectar...`);

        // ✨ LIMPAR INTERVALS antes de reconectar
        const sessionToReconnect = sessions.get(sessionId);
        if (sessionToReconnect?.keepAliveInterval) {
          clearInterval(sessionToReconnect.keepAliveInterval);
          logger.info(`🧹 Keep-alive interval limpo para reconexão de ${sessionId}`);
        }
        if (sessionToReconnect?.healthCheckInterval) {
          clearInterval(sessionToReconnect.healthCheckInterval);
          logger.info(`🧹 Health check interval limpo para reconexão de ${sessionId}`);
        }

        // Limpar sessão da memória antes de reconectar
        sessions.delete(sessionId);

        // Backoff exponencial: aumentar delay a cada tentativa falhada
        const attemptData = reconnectionAttempts.get(sessionId) || { count: 0, lastAttempt: 0 };
        const now = Date.now();

        // Resetar contador se última tentativa foi há mais de 5 minutos (sucesso anterior)
        if (now - attemptData.lastAttempt > 5 * 60 * 1000) {
          attemptData.count = 0;
        }

        attemptData.count++;
        attemptData.lastAttempt = now;
        reconnectionAttempts.set(sessionId, attemptData);

        // Calcular delay: 2s, 4s, 8s, 16s, 32s, máximo 60s
        const delay = Math.min(2000 * Math.pow(2, attemptData.count - 1), 60000);

        logger.info(`🔄 Reconexão ${attemptData.count} para ${sessionId} agendada em ${delay}ms`);

        setTimeout(async () => {
          try {
            logger.info(`🔌 Tentando reconectar ${sessionId} (tentativa ${attemptData.count})...`);
            await this.createSession(sessionId);
            // Se sucesso, resetar contador
            reconnectionAttempts.delete(sessionId);
            logger.info(`✅ Reconexão bem-sucedida para ${sessionId}`);
          } catch (error) {
            logger.error(`❌ Erro ao reconectar ${sessionId} (tentativa ${attemptData.count}):`, error?.message || error);

            // Se falhou muitas vezes (>10), parar de tentar e notificar
            if (attemptData.count >= 10) {
              logger.error(`❌ Limite de tentativas de reconexão atingido para ${sessionId}`);
              reconnectionAttempts.delete(sessionId);
              this.io.emit('reconnection-failed', {
                sessionId,
                error: 'Limite de tentativas de reconexão atingido. Por favor, escaneie o Código novamente.'
              });
            }
          }
        }, delay);

      } else {
        // ✨ LIMPAR INTERVALS antes de remover sessão
        const session = sessions.get(sessionId);
        if (session?.keepAliveInterval) {
          clearInterval(session.keepAliveInterval);
          logger.info(`🧹 Keep-alive interval limpo para ${sessionId}`);
        }
        if (session?.healthCheckInterval) {
          clearInterval(session.healthCheckInterval);
          logger.info(`🧹 Health check interval limpo para ${sessionId}`);
        }

        // Limpar sessão da memória
        sessions.delete(sessionId);

        // Logout definitivo - REMOVER ARQUIVOS se for device_removed
        // 🛡️ ALTERAÇÃO DE SEGURANÇA: Não remover configurações automaticamente em caso de erro!
        // Isso evita que a instância "suma" da lista se houver um erro de conexão.
        // O usuário deve remover manualmente se desejar.

        /* CÓDIGO ANTIGO QUE REMOVIA AUTOMATICAMENTE:
        if (isLoggedOutFlag || is401Conflict || isDeviceRemoved) {
          sessionConfigs.delete(sessionId);
          logger.info(`Configuração removida para sessão ${sessionId} devido a logout/conflito`);
        } else {
          logger.info(`Configuração mantida para sessão ${sessionId} apesar da desconexão (statusCode=${statusCode})`);
        }

        if (is401Conflict || isDeviceRemoved) {
          logger.warn(`🗑️ Erro 401 com conflito/device_removed - removendo arquivos da sessão ${sessionId}`);
          const sessionPath = path.join(SESSIONS_PATH, sessionId);
          if (fs.existsSync(sessionPath)) {
            try {
              fs.rmSync(sessionPath, { recursive: true, force: true });
              logger.info(`✅ Arquivos da sessão ${sessionId} removidos com sucesso`);
            } catch (err) {
              logger.error(`Erro ao remover arquivos da sessão ${sessionId}:`, err);
            }
          }
        }
        */

        // Novo comportamento: Apenas logar e notificar. A config permanece.
        logger.warn(`Sessão ${sessionId} desconectada (Flag: LoggedOut=${isLoggedOutFlag}, Conflict=${is401Conflict}, DeviceRemoved=${isDeviceRemoved}). Configuração mantida.`);

        // NÃO emitir logged-out, pois isso faz o frontend remover o card.
        // this.io.emit('logged-out', { sessionId });

        this.io.emit('connection-update', {
          sessionId,
          status: 'disconnected',
          error: payloadMessage || 'Desconectado'
        });
      }
    } else if (connection === 'open') {
      logger.info(`Conexão estabelecida para ${sessionId}`);

      // Remover flag de geração de QR quando conexão for estabelecida com sucesso
      if (generatingQR.has(sessionId)) {
        logger.info(`Conexão estabelecida com sucesso para ${sessionId} - removendo flag de geração de QR`);
        generatingQR.delete(sessionId);
      }

      // Resetar contador de tentativas de reconexão ao conectar com sucesso
      if (reconnectionAttempts.has(sessionId)) {
        logger.info(`✅ Resetando contador de reconexão para ${sessionId} após conexão bem-sucedida`);
        reconnectionAttempts.delete(sessionId);
      }

      const session = sessions.get(sessionId);
      if (session?.socket) {
        const user = session.socket.user;
        logger.info(`connection.update open: session=${sessionId} user=${user ? user.id : 'null'} readyState=${session.socket?.ws?.readyState}`);
        if (user) {
          this.io.emit('connected', {
            sessionId,
            message: 'WhatsApp conectado com sucesso!',
            user: {
              id: user.id,
              name: user.name,
              phoneNumber: user.id.split(':')[0]
            }
          });

          logger.info(`✅ Sessão ${sessionId} conectada com sucesso! Baileys gerenciará a conexão automaticamente.`);

          // Sincronizar contatos após conexão (como no snippet de referência)
          setTimeout(async () => {
            await this.syncContacts(sessionId);
          }, 3000);

          // ✨ KEEP-ALIVE APRIMORADO: enviar presença a cada 15 segundos
          // Isso mantém o WhatsApp vendo atividade e evita desconexão por idle
          const keepAliveInterval = setInterval(async () => {
            try {
              const currentSession = sessions.get(sessionId);
              if (currentSession?.socket && this.isSocketOpen(currentSession.socket)) {
                await currentSession.socket.sendPresenceUpdate('available');
                logger.info(`💓 Keep-alive enviado para ${sessionId}`);
              } else {
                logger.warn(`Keep-alive: sessão ${sessionId} não encontrada ou socket fechado - limpando interval`);
                clearInterval(keepAliveInterval);
              }
            } catch (err) {
              logger.error(`Erro no keep-alive para ${sessionId}:`, err?.message || err);
              // Se falhar 3 vezes consecutivas, tentar reconectar
              if (!currentSession.keepAliveFailCount) currentSession.keepAliveFailCount = 0;
              currentSession.keepAliveFailCount++;

              if (currentSession.keepAliveFailCount >= 3) {
                logger.warn(`⚠️ Keep-alive falhou 3 vezes para ${sessionId} - forçando reconexão`);
                clearInterval(keepAliveInterval);
                setTimeout(() => this.forceReconnect(sessionId).catch(e => logger.error('Erro ao reconectar:', e)), 1000);
              }
            }
          }, 15000); // 15 segundos (mais agressivo para evitar desconexões)

          // Salvar o interval na sessão para limpar depois
          const currentSession = sessions.get(sessionId);
          if (currentSession) {
            currentSession.keepAliveInterval = keepAliveInterval;
            currentSession.keepAliveFailCount = 0; // Resetar contador de falhas
            logger.info(`✅ Keep-alive aprimorado ativado para ${sessionId} (intervalo: 15s)`);
          }

          // 🏥 HEALTH CHECK: Verificar estado da conexão a cada 2 minutos
          const healthCheckInterval = setInterval(async () => {
            try {
              const currentSession = sessions.get(sessionId);
              if (!currentSession?.socket) {
                logger.warn(`⚠️ Health check: sessão ${sessionId} não encontrada - limpando interval`);
                clearInterval(healthCheckInterval);
                return;
              }

              const isOpen = this.isSocketOpen(currentSession.socket);
              const hasUser = !!currentSession.socket.user;

              if (!isOpen || !hasUser) {
                logger.error(`❌ Health check FALHOU para ${sessionId}: isOpen=${isOpen}, hasUser=${hasUser}`);
                logger.warn(`🔄 Iniciando reconexão automática para ${sessionId}...`);

                // Limpar intervals
                clearInterval(healthCheckInterval);
                if (currentSession.keepAliveInterval) {
                  clearInterval(currentSession.keepAliveInterval);
                }

                // Forçar reconexão
                sessions.delete(sessionId);
                setTimeout(() => this.forceReconnect(sessionId).catch(e => logger.error('Erro ao reconectar no health check:', e)), 1000);
              } else {
                logger.info(`✅ Health check OK para ${sessionId} - conexão saudável`);
              }
            } catch (err) {
              logger.error(`Erro no health check para ${sessionId}:`, err?.message || err);
            }
          }, 2 * 60 * 1000); // 2 minutos

          // Salvar health check interval na sessão
          if (currentSession) {
            currentSession.healthCheckInterval = healthCheckInterval;
            logger.info(`🏥 Health check ativado para ${sessionId} (intervalo: 2min)`);
          }

          // Envia quaisquer envios pendentes enfileirados enquanto o socket estava abrindo
          try {
            await this.flushPendingSends(sessionId);
          } catch (err) {
            logger.warn(`Erro ao enviar mensagens pendentes para ${sessionId}: ${err?.message || err}`);
          }
        }
      }
    } else if (connection === 'connecting') {
      // Quando começar a conectar após escanear QR, remover a flag
      if (generatingQR.has(sessionId)) {
        logger.info(`Iniciando conexão para ${sessionId} - removendo flag de geração de QR`);
        generatingQR.delete(sessionId);
      }
      if (!session?.pairingCodeRequested) {
        this.io.emit('connecting', {
          sessionId,
          message: 'Conectando ao WhatsApp...'
        });
      }
    }
  }

  // Baileys gerencia keep-alive e reconexão automaticamente
  // Não precisamos de funções customizadas!

  async getProfilePicture(session, jid) {
    try {
      const ppUrl = await session.socket.profilePictureUrl(jid, 'image');
      return ppUrl;
    } catch (e) {
      return null;
    }
  }

  async syncContacts(sessionId) {
    const session = sessions.get(sessionId);
    if (!session?.socket) return;

    logger.info(`🔄 Sincronizando contatos para ${sessionId}...`);
    const chatJids = Object.keys(session.chats);

    for (const jid of chatJids) {
      if (!jid.includes('@s.whatsapp.net')) continue;
      try {
        const [result] = await session.socket.onWhatsApp(jid);
        if (result?.exists) {
          if (!session.contacts[jid]) session.contacts[jid] = {};
          if (result.verifiedName) {
            session.contacts[jid].verifiedName = result.verifiedName;
            session.contacts[jid].name = result.verifiedName;
          }
          const ppUrl = await this.getProfilePicture(session, jid);
          if (ppUrl) session.contacts[jid].imgUrl = ppUrl;
        }
      } catch (e) {
        // ignore
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (session.saveCache) session.saveCache();
    logger.info(`✅ Sincronização de contatos concluída para ${sessionId}`);
  }

  async handleIncomingMessages(sessionId, messages) {
    const config = sessionConfigs.get(sessionId);
    // Usar API key da configuração da instância ou a padrão do sistema
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
    console.log('API Key configurada:', apiKey ? 'Sim' : 'Não');


    for (const message of messages) {
      // Ignorar mensagens próprias e de status
      if (!message.message || message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
        continue;
      }

      // 🚫 IGNORAR MENSAGENS DE GRUPOS - Só responder mensagens privadas
      if (message.key.remoteJid.endsWith('@g.us')) {
        logger.info(`⛔ Mensagem de grupo ignorada: ${message.key.remoteJid}`);
        continue;
      }

      // 📦 IGNORAR MENSAGENS DE CHATS ARQUIVADOS
      const session = sessions.get(sessionId);
      const chatInfo = session?.chats?.[message.key.remoteJid];
      if (chatInfo?.archive || chatInfo?.archived) {
        logger.info(`📦 Mensagem de chat arquivado ignorada: ${message.key.remoteJid}`);
        continue;
      }

      if (!session?.socket) continue;

      try {
        // Verificar tipos de mensagem
        const audioMessage = message.message?.audioMessage;
        const imageMessage = message.message?.imageMessage;
        const documentMessage = message.message?.documentMessage;
        const messageText = this.extractMessageText(message);
        console.log(messageText);
        if (!audioMessage && !imageMessage && !documentMessage && !messageText) continue;

        // Se tem configuração de IA, processar com buffer para agrupar mensagens
        if (apiKey) {
          const phoneNumber = message.key.remoteJid;

          // Se for mensagem de texto, usar buffer de 10 segundos
          if (messageText && !audioMessage && !imageMessage && !documentMessage) {
            await this.bufferTextMessage(sessionId, phoneNumber, messageText, config, session);
            continue; // Não processar imediatamente
          }

          // Para áudio, imagem e documentos, processar imediatamente (sem buffer)
          // Mas antes, enviar qualquer mensagem em buffer
          await this.flushMessageBuffer(sessionId, phoneNumber, config, session);
          console.log("flushMessageBuffer acabou");
          // Agora processar mídia
          let aiResponse;
          let transcription = null;
          let imageAnalysis = null;
          let documentContent = null;

          const useGemini = true;


          if (audioMessage) {
            // Processar mensagem de áudio
            logger.info(`Mensagem de áudio recebida em ${sessionId}`, {
              from: message.key.remoteJid,
              messageId: message.key.id,
              audioInfo: {
                mimetype: audioMessage.mimetype,
                fileLength: audioMessage.fileLength,
                seconds: audioMessage.seconds,
                ptt: audioMessage.ptt
              }
            });

            try {
              // Verificar se a mensagem tem conteúdo de áudio válido
              if (!audioMessage.url && !audioMessage.directPath) {
                throw new Error('Mensagem de áudio não possui URL ou directPath');
              }

              // Baixar o áudio
              logger.info('Tentando baixar áudio...');
              const audioBuffer = await this.downloadAudio(session.socket, message);

              if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Buffer de áudio vazio ou inválido');
              }

              logger.info(`Buffer de áudio válido recebido: ${audioBuffer.length} bytes`);

              logger.info(`Iniciando processamento com ${useGemini ? 'Gemini' : 'OpenAI'}...`);

              let result;
              if (useGemini) {
                result = await processAudioMessageWithGemini(
                  audioBuffer,
                  message.key.remoteJid,
                  apiKey,
                  'gemini-2.5-flash', // Modelo fixo
                  config.systemPrompt || '', // Prompt personalizado
                  1.0 // Temperatura fixa
                );
              }

              if (result) {
                console.log(result);
                aiResponse = result.aiResponse;
                transcription = result.transcription;
                logger.info(`Áudio processado com sucesso: "${transcription?.substring(0, 50)}..."`);
              }
            } catch (audioError) {
              logger.error('Erro detalhado ao processar áudio:', {
                error: audioError.message,
                stack: audioError.stack,
                sessionId,
                from: message.key.remoteJid,
                audioMessage: {
                  mimetype: audioMessage.mimetype,
                  fileLength: audioMessage.fileLength,
                  hasUrl: !!audioMessage.url,
                  hasDirectPath: !!audioMessage.directPath
                }
              });
              aiResponse = 'Desculpe, não consegui processar seu áudio. Pode enviar como texto?';
            }
          } else if (imageMessage) {
            // Processar mensagem com imagem
            logger.info(`Mensagem com imagem recebida em ${sessionId}`, {
              from: message.key.remoteJid,
              messageId: message.key.id,
              imageInfo: {
                mimetype: imageMessage.mimetype,
                fileLength: imageMessage.fileLength,
                caption: imageMessage.caption || 'Sem legenda'
              }
            });

            try {
              // Verificar se a mensagem tem conteúdo de imagem válido
              if (!imageMessage.url && !imageMessage.directPath) {
                throw new Error('Mensagem de imagem não possui URL ou directPath');
              }

              // Baixar a imagem
              logger.info('Tentando baixar imagem...');
              const imageBuffer = await this.downloadImage(session.socket, message);

              if (!imageBuffer || imageBuffer.length === 0) {
                throw new Error('Buffer de imagem vazio ou inválido');
              }

              logger.info(`Buffer de imagem válido recebido: ${imageBuffer.length} bytes`);

              // Processar imagem com IA
              logger.info(`Iniciando processamento de imagem com ${useGemini ? 'Gemini Vision' : 'OpenAI Vision'}...`);

              let result;
              if (useGemini) {
                result = await processImageMessageWithGemini(
                  imageBuffer,
                  message.key.remoteJid,
                  apiKey,
                  'gemini-2.5-flash', // Modelo fixo
                  config.systemPrompt || '', // Prompt personalizado
                  1.0, // Temperatura fixa
                  imageMessage.caption || ''
                );
              }

              if (result) {
                aiResponse = result.aiResponse;
                imageAnalysis = result.imageAnalysis;
                logger.info(`Imagem processada com ${useGemini ? 'Gemini' : 'OpenAI'}`);
                logger.info(`Análise enviada (${aiResponse?.length} caracteres)`);
              }
            } catch (imageError) {
              logger.error('Erro detalhado ao processar imagem:', {
                error: imageError.message,
                stack: imageError.stack,
                sessionId,
                from: message.key.remoteJid,
                imageMessage: {
                  mimetype: imageMessage.mimetype,
                  fileLength: imageMessage.fileLength,
                  hasUrl: !!imageMessage.url,
                  hasDirectPath: !!imageMessage.directPath
                }
              });
              aiResponse = 'Desculpe, não consegui processar sua imagem. Pode tentar enviar novamente?';
            }
          } else if (documentMessage) {
            // Processar mensagem com documento
            logger.info(`Mensagem com documento recebida em ${sessionId}`, {
              from: message.key.remoteJid,
              messageId: message.key.id,
              documentInfo: {
                mimetype: documentMessage.mimetype,
                fileLength: documentMessage.fileLength,
                fileName: documentMessage.fileName || 'documento',
                caption: documentMessage.caption || 'Sem legenda'
              }
            });

            try {
              // Verificar se a mensagem tem conteúdo de documento válido
              if (!documentMessage.url && !documentMessage.directPath) {
                throw new Error('Mensagem de documento não possui URL ou directPath');
              }

              // Baixar o documento
              logger.info('Tentando baixar documento...');
              const documentBuffer = await this.downloadDocument(session.socket, message);
              if (!documentBuffer || documentBuffer.length === 0) {
                throw new Error('Buffer de documento vazio ou inválido');
              }
              logger.info(`Buffer de documento válido recebido: ${documentBuffer.length} bytes`);
              // Processar documento com IA
              logger.info(`Iniciando processamento de documento com ${useGemini ? 'Gemini' : 'OpenAI'}...`);

              let result;
              if (useGemini) {
                result = await processDocumentMessageWithGemini(
                  documentBuffer,
                  documentMessage.fileName || 'documento',
                  message.key.remoteJid,
                  apiKey,
                  'gemini-2.5-flash', // Modelo fixo
                  config.systemPrompt || '', // Prompt personalizado
                  1.0, // Temperatura fixa
                  documentMessage.caption || ''
                );
              }

              if (result) {
                aiResponse = result.aiResponse;
                documentContent = result.documentContent;
                logger.info(`Documento processado com ${useGemini ? 'Gemini' : 'OpenAI'}`);
                logger.info(`Análise enviada (${aiResponse?.length} caracteres)`);
              }
            } catch (documentError) {
              logger.error('Erro detalhado ao processar documento:', {
                error: documentError.message,
                stack: documentError.stack,
                sessionId,
                from: message.key.remoteJid,
                documentMessage: {
                  mimetype: documentMessage.mimetype,
                  fileLength: documentMessage.fileLength,
                  fileName: documentMessage.fileName,
                  hasUrl: !!documentMessage.url,
                  hasDirectPath: !!documentMessage.directPath
                }
              });
              aiResponse = 'Desculpe, não consegui processar seu documento. Pode tentar converter para PDF ou imagem?';
            }
          }

          if (aiResponse) {
            // Verificar se deve enviar como áudio (TTS)
            const receivedAudio = !!audioMessage;
            const sendAsAudio = config?.ttsEnabled &&
              receivedAudio &&
              shouldSendAsAudio(aiResponse, '', config.ttsEnabled, receivedAudio);

            // Separar texto de links
            const { textWithoutLinks, links, hasLinks } = separateTextAndLinks(aiResponse);

            if (sendAsAudio) {
              try {
                const geminiApiKey = config?.apiKey || process.env.GEMINI_API_KEY;

                // Se tem links, enviar texto como áudio e links como texto separado
                if (hasLinks && textWithoutLinks.length > 0) {
                  logger.info(`🎤📝 Resposta tem texto + links - enviando áudio e texto separados`);

                  // 1. Enviar texto como áudio
                  logger.info(`🎤 Gerando áudio para texto (sem links)...`);

                  // Mostrar "gravando áudio..."
                  await this.sendPresence(sessionId, message.key.remoteJid, 'recording');

                  const audioBuffer = await generateSpeech(
                    textWithoutLinks,
                    geminiApiKey,
                    config.ttsVoice || 'Aoede',
                    'pt-BR'
                  );

                  const audioPath = saveTempAudio(audioBuffer);

                  await this.sendMessageSafe(sessionId, message.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                  });

                  // Parar indicador
                  await this.sendPresence(sessionId, message.key.remoteJid, 'paused');

                  cleanupTempAudio(audioPath);
                  logger.info(`✅ Áudio (texto) enviado`);

                  // 2. Enviar links como texto (após pequeno delay)
                  await new Promise(resolve => setTimeout(resolve, 500));

                  // Mostrar "digitando..."
                  await this.sendPresence(sessionId, message.key.remoteJid, 'composing');

                  const linksText = links.length === 1
                    ? `🔗 Link: ${links[0]}`
                    : `🔗 Links:\n${links.map((link, i) => `${i + 1}. ${link}`).join('\n')}`;

                  await this.sendMessageSafe(sessionId, message.key.remoteJid, { text: linksText });

                  // Parar indicador
                  await this.sendPresence(sessionId, message.key.remoteJid, 'paused');

                  logger.info(`✅ Links enviados como texto separado`);

                } else if (hasLinks && textWithoutLinks.length === 0) {
                  // Se só tem links, enviar como texto
                  logger.info(`🔗 Resposta contém apenas links - enviando como texto`);

                  // Mostrar "digitando..."
                  await this.sendPresence(sessionId, message.key.remoteJid, 'composing');

                  await this.sendMessageSafe(sessionId, message.key.remoteJid, { text: aiResponse });

                  // Parar indicador
                  await this.sendPresence(sessionId, message.key.remoteJid, 'paused');

                } else {
                  // Se não tem links, enviar tudo como áudio
                  logger.info(`🎤 Gerando resposta em áudio (sem links)...`);

                  // Mostrar "gravando áudio..."
                  await this.sendPresence(sessionId, message.key.remoteJid, 'recording');

                  const audioBuffer = await generateSpeech(
                    aiResponse,
                    geminiApiKey,
                    config.ttsVoice || 'Aoede',
                    'pt-BR'
                  );

                  const audioPath = saveTempAudio(audioBuffer);

                  await this.sendMessageSafe(sessionId, message.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                  });

                  // Parar indicador
                  await this.sendPresence(sessionId, message.key.remoteJid, 'paused');

                  cleanupTempAudio(audioPath);
                  logger.info(`✅ Resposta em áudio enviada`);
                }

              } catch (ttsError) {
                logger.error('Erro ao gerar/enviar áudio, enviando texto:', ttsError);
                // Fallback para texto se falhar
                // Mostrar "digitando..."
                await this.sendPresence(sessionId, message.key.remoteJid, 'composing');
                await this.sendMessageSafe(sessionId, message.key.remoteJid, { text: aiResponse });
                await this.sendPresence(sessionId, message.key.remoteJid, 'paused');
              }
            } else {
              // Enviar como texto
              // Mostrar "digitando..."
              await this.sendPresence(sessionId, message.key.remoteJid, 'composing');
              await this.sendMessageSafe(sessionId, message.key.remoteJid, { text: aiResponse });
              await this.sendPresence(sessionId, message.key.remoteJid, 'paused');
            }

            logger.info(`Resposta AI enviada para ${message.key.remoteJid}`);

            this.io.emit('message-processed', {
              sessionId,
              from: message.key.remoteJid,
              userMessage: transcription || imageAnalysis || documentContent || messageText,
              aiResponse,
              isAudio: !!audioMessage,
              isImage: !!imageMessage,
              isDocument: !!documentMessage,
              sentAsAudio: sendAsAudio,
              transcription,
              imageAnalysis,
              documentContent,
              fileName: documentMessage?.fileName
            });
          }
        }
      } catch (error) {
        logger.error(`Erro ao processar mensagem em ${sessionId}:`, error);
        this.io.emit('message-error', {
          sessionId,
          error: error.message
        });
      }
    }
  }

  extractMessageText(message) {
    const {
      conversation,
      extendedTextMessage,
      imageMessage,
      videoMessage,
      audioMessage,
      documentMessage
    } = message.message;

    if (conversation) return conversation;
    if (extendedTextMessage) return extendedTextMessage.text;
    if (imageMessage) return imageMessage.caption || '[Imagem]';
    if (videoMessage) return videoMessage.caption || '[Vídeo]';
    if (audioMessage) return '[Áudio]';
    if (documentMessage) return documentMessage.caption || '[Documento]';

    return null;
  }

  async downloadMedia(socket, message, mediaType) {
    try {
      logger.info(`Iniciando download de ${mediaType}...`);

      const mediaMessage = message.message[`${mediaType}Message`];

      if (!mediaMessage) {
        logger.error(`Mensagem não contém ${mediaType}Message`);
        throw new Error(`Mensagem não contém ${mediaType}`);
      }

      logger.info(`${mediaType}Message encontrado:`, {
        mimetype: mediaMessage.mimetype,
        fileLength: mediaMessage.fileLength,
        fileName: mediaMessage.fileName || 'N/A',
        caption: mediaMessage.caption || 'N/A'
      });

      logger.info('Iniciando download usando função do Baileys...');

      // Usar a função downloadMediaMessage importada do Baileys
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        {
          logger: baileysLogger,
          reuploadRequest: socket.updateMediaMessage
        }
      );

      logger.info('Download concluído, verificando buffer...');

      if (!buffer) {
        logger.error('Buffer retornado é null/undefined');
        throw new Error(`Não foi possível baixar o ${mediaType} - buffer vazio`);
      }

      if (!Buffer.isBuffer(buffer)) {
        logger.error('Retorno não é um Buffer válido:', typeof buffer);
        throw new Error('Retorno não é um Buffer válido');
      }

      logger.info(`${mediaType} baixado com sucesso: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      logger.error(`Erro detalhado ao baixar ${mediaType}:`, {
        message: error.message,
        stack: error.stack,
        messageKeys: Object.keys(message),
        messageType: message.messageType,
        hasMediaMessage: !!message.message?.[`${mediaType}Message`]
      });
      throw error;
    }
  }

  async downloadAudio(socket, message) {
    return this.downloadMedia(socket, message, 'audio');
  }

  async downloadImage(socket, message) {
    return this.downloadMedia(socket, message, 'image');
  }

  async downloadDocument(socket, message) {
    return this.downloadMedia(socket, message, 'document');
  }

  // Verifica se o socket do Baileys está aberto
  isSocketOpen(socket) {
    try {
      // WebSocket readyState === 1 significa OPEN
      const wsState = socket?.ws?.readyState;
      // Considere socket pronto se o websocket estiver OPEN ou se socket.user já estiver preenchido
      return (wsState === 1) || !!socket?.user;
    } catch (e) {
      return false;
    }
  }

  // Envia mensagem com tentativas e reconexão automática se necessário
  async sendPresence(sessionId, jid, presenceType = 'composing') {
    try {
      const session = sessions.get(sessionId);
      if (!session?.socket || !this.isSocketOpen(session.socket)) {
        return;
      }
      await session.socket.sendPresenceUpdate(presenceType, jid);
    } catch (error) {
      logger.error(`Erro ao enviar presence ${presenceType}:`, error);
    }
  }

  async sendMessageSafe(sessionId, jid, messagePayload, opts = {}) {
    const attempts = opts.attempts || 3;
    const delayMs = opts.delayMs || 1000;
    const tryReconnect = opts.tryReconnect !== false; // default true

    const session = sessions.get(sessionId);
    if (!session) throw new Error(`Sessão ${sessionId} não encontrada ao enviar mensagem`);

    logger.info(`sendMessageSafe: iniciado para ${jid} na sessão ${sessionId} (attempts=${attempts}, delayMs=${delayMs})`);

    // Se o socket não estiver aberto agora, enfileira o envio e aguarda o flush (evita condição de corrida)
    const socketNow = session.socket;
    if (!this.isSocketOpen(socketNow)) {
      logger.info(`sendMessageSafe: socket não aberto agora para ${sessionId}, enfileirando mensagem para envio quando abrir`);
      const def = {};
      def.promise = new Promise((resolve, reject) => { def.resolve = resolve; def.reject = reject; });
      // Anexa um handler catch noop imediatamente para evitar unhandledRejection se ocorrer timeout
      def.promise.catch(() => { });
      const entry = { jid, messagePayload, def, created: Date.now() };
      const queue = pendingSends.get(sessionId) || [];
      queue.push(entry);
      pendingSends.set(sessionId, queue);

      // Timeout para mensagem enfileirada
      const queueTimeout = (opts.queueTimeoutMs) || 60000;
      const timer = setTimeout(() => {
        // Remove da fila se ainda estiver lá e rejeita
        const q = pendingSends.get(sessionId) || [];
        const idx = q.indexOf(entry);
        if (idx !== -1) {
          q.splice(idx, 1);
          pendingSends.set(sessionId, q);
          try {
            def.reject(new Error('Timeout aguardando socket abrir para envio'));
          } catch (e) {
            logger.warn('flushPendingSends: falha ao rejeitar promise de fila:', e?.message || e);
          }
        }
      }, queueTimeout);

      // Quando resolvido ou rejeitado, limpa o timer
      def.promise.finally(() => clearTimeout(timer));

      return def.promise;
    }

    for (let i = 0; i < attempts; i++) {
      const socket = session.socket;
      logger.debug(`sendMessageSafe: tentativa ${i + 1}/${attempts} — socket.readyState=${socket?.ws?.readyState} ; socket.user=${!!socket?.user}`);
      if (this.isSocketOpen(socket)) {
        try {
          return await socket.sendMessage(jid, messagePayload);
        } catch (err) {
          // Se falha por conexão, tentar outra vez
          logger.warn(`Falha ao enviar mensagem (tentativa ${i + 1}/${attempts}) para ${jid}: ${err?.message || err}`);
          logger.debug('sendMessageSafe: erro detalhado ao enviar:', { error: err, output: err?.output });
          // Se for erro crítico de conexão, tentar reconectar
          const isConnectionClosed = err && err.output && err.output.payload && err.output.payload.message === 'Connection Closed';
          if (isConnectionClosed && tryReconnect) {
            try {
              logger.info(`sendMessageSafe: erro de conexão detectado ao enviar para ${sessionId}, tentando forceReconnect...`);
              const fr = await this.forceReconnect(sessionId);
              logger.info(`sendMessageSafe: forceReconnect resultado: ${JSON.stringify(fr)}`);
              // aguardar um pouco para o socket abrir
              await new Promise(r => setTimeout(r, delayMs));
            } catch (reErr) {
              logger.error(`Erro ao forçar reconexão para ${sessionId}:`, reErr?.message || reErr);
            }
          }
        }
      }

      // Se socket não aberto, aguardar e tentar novamente
      logger.debug(`sendMessageSafe: socket não aberto ou envio falhou, aguardando ${delayMs}ms antes da próxima tentativa`);
      await new Promise(r => setTimeout(r, delayMs));
    }

    // Após tentativas, se ainda não enviou, tentar recriar sessão e enviar uma última vez
    if (tryReconnect) {
      try {
        logger.info(`Tentativa final: recriar sessão ${sessionId} antes de enviar mensagem para ${jid}`);
        await this.createSession(sessionId);
        const session2 = sessions.get(sessionId);
        logger.info(`sendMessageSafe: createSession retornou, socket.readyState=${session2?.socket?.ws?.readyState}, socket.user=${!!session2?.socket?.user}`);
        // Aguarda até o socket estar aberto (timeout 20s)
        const maxWait = 20000;
        const interval = 200;
        let waited = 0;
        while (!this.isSocketOpen(session2?.socket) && waited < maxWait) {
          await new Promise(r => setTimeout(r, interval));
          waited += interval;
        }
        logger.info(`sendMessageSafe: após espera final, socket.readyState=${session2?.socket?.readyState}, socket.user=${!!session2?.socket?.user}, waited=${waited}ms`);
        if (this.isSocketOpen(session2?.socket)) {
          return await session2.socket.sendMessage(jid, messagePayload);
        } else {
          logger.warn(`Socket ainda não aberto para ${sessionId} após recriar sessão (esperou ${waited}ms)`);
        }
      } catch (finalErr) {
        logger.error(`Falha final ao enviar mensagem para ${jid}:`, finalErr?.message || finalErr);
      }
    }

    throw new Error(`Não foi possível enviar mensagem para ${jid} na sessão ${sessionId}`);
  }

  async generateQR(sessionId, phoneNumber = null) {
    try {
      logger.info(`generateQR: Iniciando geração de QR/Pairing Code para sessão ${sessionId} (Phone: ${phoneNumber})`);

      // Marcar que estamos gerando Código (evitar reconexão automática)
      generatingQR.add(sessionId);

      // 🧹 Limpar APENAS a sessão atual (não todas!)
      logger.info(`🧹 Limpando sessão ${sessionId} para gerar novo QR...`);

      // Fechar socket atual se existir
      const existingSession = sessions.get(sessionId);
      if (existingSession?.socket) {
        try {
          existingSession.socket.ws?.close();
          existingSession.socket.end?.();
          logger.info(`🗑️ Socket da sessão ${sessionId} fechado`);
        } catch (e) {
          logger.warn(`Erro ao fechar socket ${sessionId}:`, e?.message || e);
        }
      }

      // Remover da memória
      sessions.delete(sessionId);

      // Limpar arquivos da sessão específica do disco
      const sessionPath = path.join(SESSIONS_PATH, sessionId);
      if (fs.existsSync(sessionPath)) {
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          logger.info(`✅ Arquivos da sessão ${sessionId} removidos do disco`);
        } catch (e) {
          logger.warn(`Erro ao remover pasta ${sessionId}:`, e?.message || e);
        }
      }

      // Aguardar 1 segundo antes de criar nova sessão
      logger.info(`⏳ Aguardando 1 segundo antes de criar nova sessão ${sessionId}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Criar nova sessão forçando um auth limpo para obrigar geração de QR
      logger.info(`generateQR: Chamando createSession para ${sessionId} com forceNewAuth: true`);
      await this.createSession(sessionId, { forceNewAuth: true, phoneNumber });

      // Remover flag após 30 segundos (tempo suficiente para escanear QR)
      setTimeout(() => {
        generatingQR.delete(sessionId);
        logger.info(`generateQR: Flag de geração de QR removida para ${sessionId}`);
      }, 30000);

      logger.info(`generateQR: createSession completado com sucesso para ${sessionId}`);
      return { success: true, message: 'Código sendo gerado...' };
    } catch (error) {
      // Remover flag em caso de erro
      generatingQR.delete(sessionId);

      // Log completo para facilitar diagnóstico
      logger.error(`generateQR: ERRO ao gerar QR para ${sessionId}:`, error?.message || String(error));

      return { success: false, error: error?.message || String(error) };
    }
  }

  // Envia envios pendentes enfileirados enquanto o socket estava abrindo
  async flushPendingSends(sessionId) {
    const queue = pendingSends.get(sessionId) || [];
    if (!queue || queue.length === 0) return;

    logger.info(`flushPendingSends: enviando ${queue.length} mensagens pendentes para ${sessionId}`);

    const session = sessions.get(sessionId);
    if (!session?.socket || !this.isSocketOpen(session.socket)) {
      logger.warn(`flushPendingSends: socket não está pronto para ${sessionId}, adiando flush`);
      return;
    }

    // Envia todas as mensagens enfileiradas sequencialmente
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        logger.info(`flushPendingSends: enviando para ${item.jid} (session ${sessionId})`);
        const res = await session.socket.sendMessage(item.jid, item.messagePayload);
        item.def.resolve(res);
      } catch (err) {
        logger.error(`flushPendingSends: erro ao enviar para ${item.jid}: ${err?.message || err}`);
        item.def.reject(err);
      }
    }

    pendingSends.delete(sessionId);
  }

  async logout(sessionId, options = { removeFiles: true }) {
    try {
      const session = sessions.get(sessionId);

      if (!session) {
        // Se a sessão não está em memória, mas existe no disco e estamos pedindo para remover...
        if (options.removeFiles !== false) {
          // Verifica se existe pasta no disco
          const sessionPath = path.join(SESSIONS_PATH, sessionId);
          if (fs.existsSync(sessionPath)) {
            // ... removê-la? Talvez não devêssemos ser tão agressivos se não temos certeza.
            // Mas se o usuário pediu logout, provavelmente quer desconectar.
            // Vamos manter por enquanto.
          }
        }
        // throw new Error('Sessão não encontrada'); // Não lançar erro se não encontrar, apenas retornar sucesso (idempotente)
        return { success: true, message: 'Sessão já desconectada' };
      }

      // Limpar todos os intervals antes de fazer logout
      if (session.keepAliveInterval) {
        clearInterval(session.keepAliveInterval);
        logger.info(`🧹 Keep-alive interval limpo para logout de ${sessionId}`);
      }
      if (session.healthCheckInterval) {
        clearInterval(session.healthCheckInterval);
        logger.info(`🧹 Health check interval limpo para logout de ${sessionId}`);
      }

      // Se for uma remoção completa (usuário) -> chamar logout do Baileys e remover arquivos
      if (options.removeFiles !== false) {
        // Tenta efetuar logout remoto (invalidate credentials)
        try {
          await session.socket.logout();
        } catch (err) {
          // Se logout falhar, tentamos apenas fechar a conexão
          logger.warn(`Falha ao executar socket.logout() para ${sessionId}, fechando socket: ${err.message || err}`);
          try { session.socket.ws?.close(); session.socket.end?.(); } catch (e) { }
        }

        // Remover arquivos da sessão do disco
        const sessionPath = path.join(SESSIONS_PATH, sessionId);
        if (fs.existsSync(sessionPath)) {
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } catch (err) {
            logger.error(`Erro ao remover arquivos da sessão ${sessionId}:`, err);
          }
        }
        sessions.delete(sessionId);
        sessionConfigs.delete(sessionId);
        reconnectionAttempts.delete(sessionId); // Limpar contador de reconexão

        logger.info(`Sessão ${sessionId} desconectada e removida`);
        this.io.emit('logged-out', { sessionId });

        return { success: true, message: 'Desconectado com sucesso' };
      }

      // Se removeFiles === false -> apenas fechar socket/localmente sem apagar credenciais
      try {
        session.socket.ws?.close();
        session.socket.end?.();
      } catch (err) {
        logger.warn(`Erro ao fechar socket para ${sessionId}: ${err.message || err}`);
      }

      sessions.delete(sessionId);

      logger.info(`Sessão ${sessionId} desconectada (arquivos preservados)`);
      this.io.emit('disconnected', { sessionId, reason: 'shutdown' });

      return { success: true, message: 'Sessão fechada (arquivos preservadas)' };
    } catch (error) {
      logger.error(`Erro ao fazer logout de ${sessionId}:`, error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      logger.info(`Solicitação de exclusão da sessão ${sessionId}`);

      // NOVO: Desconectar Calendar associado antes de tudo
      try {
        await calendarService.disconnectCalendar(sessionId);
      } catch (calError) {
        logger.warn(`Erro não fatal ao desconectar Calendar para ${sessionId}:`, calError);
        // Continua exclusão mesmo se falhar o calendar
      }

      // 1. Se a sessão estiver ativa na memória, fazer logout completo
      if (sessions.has(sessionId)) {
        logger.info(`Sessão ${sessionId} encontrada em memória, realizando logout...`);
        await this.logout(sessionId, { removeFiles: true });
      } else {
        // 2. Se não estiver em memória, forçar limpeza dos arquivos e configs
        logger.info(`Sessão ${sessionId} não encontrada em memória, forçando limpeza de arquivos...`);

        const sessionPath = path.join(SESSIONS_PATH, sessionId);
        if (fs.existsSync(sessionPath)) {
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            logger.info(`✅ Arquivos da sessão ${sessionId} removidos do disco`);
          } catch (err) {
            logger.error(`Erro ao remover arquivos da sessão ${sessionId}:`, err);
          }
        }

        // Limpar configs
        sessionConfigs.delete(sessionId);
        reconnectionAttempts.delete(sessionId);

        // Notificar frontend
        this.io.emit('logged-out', { sessionId });
      }

      return { success: true, message: 'Sessão excluída com sucesso' };
    } catch (error) {
      logger.error(`Erro ao excluir sessão ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionStatus(sessionId) {
    const session = sessions.get(sessionId);

    if (!session) {
      return {
        connected: false,
        status: 'disconnected'
      };
    }

    const isConnected = session.socket.user ? true : false;

    return {
      connected: isConnected,
      status: isConnected ? 'connected' : 'connecting',
      user: session.socket.user ? {
        id: session.socket.user.id,
        name: session.socket.user.name,
        phoneNumber: session.socket.user.id.split(':')[0]
      } : null
    };
  }

  async saveConfig(sessionId, config) {
    return this.setSessionConfig(sessionId, config);
  }

  getConfig(sessionId) {
    return sessionConfigs.get(sessionId) || null;
  }

  getAllSessions(userId) {
    const sessionsList = [];
    const allIds = new Set([...sessions.keys(), ...sessionConfigs.keys()]);

    allIds.forEach((sessionId) => {
      const config = sessionConfigs.get(sessionId);

      // Filtrar por usuário (Multi-Tenancy)
      // Se userId for fornecido, só mostramos sessões desse usuário
      // Sessões sem userId (legado) não serão mostradas para usuários novos por segurança
      if (userId && config?.userId !== userId) {
        return;
      }

      const session = sessions.get(sessionId);

      sessionsList.push({
        sessionId,
        connected: session?.socket?.user ? true : false,
        user: session?.socket?.user ? {
          id: session.socket.user.id,
          name: session.socket.user.name,
          phoneNumber: session.socket.user.id.split(':')[0]
        } : null,
        config: config || null
      });
    });

    return sessionsList;
  }

  async forceReconnect(sessionId) {
    try {
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        session.socket.end();
        sessions.delete(sessionId);
      }

      await this.createSession(sessionId);

      return { success: true, message: 'Reconexão iniciada' };
    } catch (error) {
      logger.error(`Erro ao reconectar ${sessionId}:`, error);
      throw error;
    }
  }

  // Helpers para persistência de configuração
  getSessionConfigPath(sessionId) {
    return path.join(SESSIONS_PATH, sessionId, 'config.json');
  }

  loadSessionConfig(sessionId) {
    try {
      const configPath = this.getSessionConfigPath(sessionId);
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        sessionConfigs.set(sessionId, config);
        logger.info(`Configuração carregada do disco para sessão ${sessionId}`);
        return config;
      }
    } catch (error) {
      logger.error(`Erro ao carregar configuração do disco para ${sessionId}:`, error);
    }
    return null;
  }

  saveSessionConfigToDisk(sessionId, config) {
    try {
      const configPath = this.getSessionConfigPath(sessionId);
      // O diretório da sessão já deve existir se a sessão foi criada, mas por segurança:
      const sessionDir = path.dirname(configPath);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      logger.info(`Configuração salva no disco para sessão ${sessionId}`);
    } catch (error) {
      logger.error(`Erro ao salvar configuração no disco para ${sessionId}:`, error);
    }
  }

  // Configurar assistente (Gemini ou OpenAI) para uma sessão
  setSessionConfig(sessionId, config) {
    try {
      // Obter configuração existente para preservar dados como userId
      const existingConfig = sessionConfigs.get(sessionId) || {};

      const newConfig = {
        userId: config.userId || existingConfig.userId, // Salvar ID do usuário dono da sessão (preserva existente se não vier no update)
        name: config.name || existingConfig.name || `Instância ${sessionId}`,
        aiProvider: config.aiProvider || existingConfig.aiProvider || 'gemini', // 'gemini' ou 'openai'
        apiKey: config.apiKey || existingConfig.apiKey || process.env.GEMINI_API_KEY, // API key da instância ou padrão do sistema
        assistantId: config.assistantId || existingConfig.assistantId, // Apenas para OpenAI
        model: config.model || existingConfig.model || 'gemini-2.0-flash-exp', // Modelo Gemini
        systemPrompt: (config.systemPrompt !== undefined) ? config.systemPrompt : (existingConfig.systemPrompt || ''), // Prompt do sistema
        temperature: (config.temperature !== undefined) ? config.temperature : (existingConfig.temperature || 1.0), // Temperatura (0-2)
        ttsEnabled: (config.ttsEnabled !== undefined) ? config.ttsEnabled : (existingConfig.ttsEnabled || false), // TTS habilitado
        ttsVoice: config.ttsVoice || existingConfig.ttsVoice || 'Aoede', // Voz do TTS
        enabled: (config.enabled !== undefined) ? config.enabled : (existingConfig.enabled !== false), // default true
        calendarID: config.calendarID || existingConfig.calendarID || null, // ID (email) do Google Calendar
        calendarSettings: config.calendarSettings || existingConfig.calendarSettings // Persistir settings do calendario
      };

      sessionConfigs.set(sessionId, newConfig);

      // Salvar no disco para persistência
      this.saveSessionConfigToDisk(sessionId, newConfig);

      logger.info(`Configuração do assistente ${config.aiProvider || 'gemini'} atualizada para sessão ${sessionId}`);
      return { success: true, message: 'Assistente configurado com sucesso!' };
    } catch (error) {
      logger.error(`Erro ao configurar assistente para ${sessionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Remover configuração de uma sessão
  removeSessionConfig(sessionId) {
    sessionConfigs.delete(sessionId);
    logger.info(`Configuração removida para sessão ${sessionId}`);
    return { success: true, message: 'Configuração removida com sucesso!' };
  }

  // Adicionar mensagem ao buffer e reiniciar timer
  async bufferTextMessage(sessionId, phoneNumber, messageText, config, session) {
    const bufferKey = `${sessionId}_${phoneNumber}`;

    // Obter ou criar buffer para este usuário
    let buffer = messageBuffers.get(bufferKey);

    if (!buffer) {
      buffer = {
        messages: [],
        timer: null,
        sessionId,
        phoneNumber,
        config,
        session
      };
      messageBuffers.set(bufferKey, buffer);
    }

    // Adicionar mensagem ao buffer
    buffer.messages.push(messageText);
    logger.info(`📨 Mensagem adicionada ao buffer [${phoneNumber}]: "${messageText.substring(0, 50)}..." (Total: ${buffer.messages.length})`);

    // Cancelar timer anterior se existir
    if (buffer.timer) {
      clearTimeout(buffer.timer);
      logger.info(`⏱️  Timer resetado para [${phoneNumber}] - aguardando mais ${BUFFER_TIMEOUT / 1000}s`);
    }

    // Criar novo timer de 10 segundos
    buffer.timer = setTimeout(async () => {
      await this.flushMessageBuffer(sessionId, phoneNumber, config, session);
    }, BUFFER_TIMEOUT);
  }

  // Enviar todas as mensagens do buffer para o Gemini
  async flushMessageBuffer(sessionId, phoneNumber, config, session) {
    const bufferKey = `${sessionId}_${phoneNumber}`;
    const buffer = messageBuffers.get(bufferKey);

    if (!buffer || buffer.messages.length === 0) {
      return; // Nada para enviar
    }

    // Cancelar timer se ainda estiver ativo
    if (buffer.timer) {
      clearTimeout(buffer.timer);
      buffer.timer = null;
    }

    // Concatenar todas as mensagens
    const combinedMessage = buffer.messages.join('\n\n');
    const messageCount = buffer.messages.length;
    console.log("messageCount", messageCount);
    console.log("combinedMessage", combinedMessage);
    console.log("ai entrar no try agr")
    logger.info(`🚀 Enviando ${messageCount} mensagem(ns) agrupada(s) para [${phoneNumber}]`);
    logger.info(`📝 Mensagem combinada (${combinedMessage.length} caracteres): "${combinedMessage.substring(0, 100)}..."`);


    try {
      console.log("try");
      // Detectar se está usando Gemini 
      const useGemini = true;

      let aiResponse;


      if (useGemini) {
        console.log("useGemini true, enviando para gemini");
        console.log("combinedMessage", combinedMessage);
        console.log("phoneNumber", phoneNumber);
        console.log("apiKey configurada:", config?.apiKey ? 'Sim' : 'Não');

        const geminiApiKey = config?.apiKey || process.env.GEMINI_API_KEY;

        // Usar processMessageWithCalendar (que faz fallback automático para processMessageWithGemini se Composio não estiver configurado)
        aiResponse = await processMessageWithCalendar(
          combinedMessage,
          phoneNumber,
          geminiApiKey,
          config?.systemPrompt || '', // Prompt personalizado do frontend
          config?.calendarID || sessionId, // Passar calendarID (email) ou sessionId como userId do Calendar
          config?.calendarSettings // Passar configurações do calendário
        );
      }
      console.log("aiResponse", aiResponse);
      console.log("retornou do gemini");

      if (aiResponse) {
        // Se a resposta for um fallback indicando falha no Gemini, logar de forma clara
        const isFallback = typeof aiResponse === 'string' && aiResponse.startsWith('Desculpe');
        if (isFallback) {
          logger.warn(`Resposta do Gemini parece ser um fallback para ${phoneNumber}; enviando fallback ao usuário. Snippet: ${aiResponse.substring(0, 120)}`);
        }

        // Verificar se deve enviar como áudio (TTS)
        /* const sendAsAudio = config.ttsEnabled && 
                            config.ttsVoice && 
                            shouldSendAsAudio(aiResponse, combinedMessage, config.ttsEnabled);*/
        const sendAsAudio = false;

        if (sendAsAudio) {
          try {
            logger.info(`🎤 Gerando resposta em áudio para ${phoneNumber}...`);

            // Gerar áudio
            const audioBuffer = await generateSpeech(
              aiResponse,
              geminiApiKey,
              config.ttsVoice || 'Aoede',
              'pt-BR'
            );

            // Salvar temporariamente
            const audioPath = saveTempAudio(audioBuffer);

            logger.info(`📤 Enviando áudio TTS para WhatsApp...`, {
              phoneNumber,
              audioSize: audioBuffer.length,
              voice: config.ttsVoice,
              format: 'Gemini TTS PCM -> OGG'
            });

            // Enviar áudio pelo WhatsApp
            // Nota: Gemini TTS retorna PCM wave, mas o WhatsApp aceita e converte automaticamente
            await this.sendMessageSafe(sessionId, phoneNumber, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true });

            // Limpar arquivo temporário
            cleanupTempAudio(audioPath);

            logger.info(`🔊 Áudio Gemini TTS enviado com sucesso para ${phoneNumber}`);

            this.io.emit('message-processed', {
              sessionId,
              from: phoneNumber,
              userMessage: combinedMessage,
              aiResponse,
              messageCount,
              isGrouped: messageCount > 1,
              sentAsAudio: true,
              voice: config.ttsVoice
            });
          } catch (ttsError) {
            logger.error(`❌ Erro ao enviar áudio TTS, enviando texto:`, ttsError);

            // Fallback: enviar como texto
            // Mostrar "digitando..."
            await this.sendPresence(sessionId, phoneNumber, 'composing');
            await this.sendMessageSafe(sessionId, phoneNumber, { text: aiResponse });
            await this.sendPresence(sessionId, phoneNumber, 'paused');

            this.io.emit('message-processed', {
              sessionId,
              from: phoneNumber,
              userMessage: combinedMessage,
              aiResponse,
              messageCount,
              isGrouped: messageCount > 1,
              sentAsAudio: false
            });
          }
        } else {
          // Enviar como texto normalmente
          // Mostrar "digitando..."
          await this.sendPresence(sessionId, phoneNumber, 'composing');
          await this.sendMessageSafe(sessionId, phoneNumber, { text: aiResponse });
          await this.sendPresence(sessionId, phoneNumber, 'paused');

          logger.info(`✅ Resposta AI enviada para ${phoneNumber} (${messageCount} mensagens processadas)`);

          this.io.emit('message-processed', {
            sessionId,
            from: phoneNumber,
            userMessage: combinedMessage,
            aiResponse,
            messageCount,
            isGrouped: messageCount > 1,
            sentAsAudio: false
          });
        }
      }
    } catch (error) {
      logger.error(`❌ Erro ao processar mensagens agrupadas para ${phoneNumber}:`, error);
      await this.sendMessageSafe(sessionId, phoneNumber, { text: 'Tivemos um problema ao processar sua mensagem. Por favor, tente novamente.' }).catch(() => { });
      this.io.emit('message-error', {
        sessionId,
        error: error.message
      });
    } finally {
      // SEMPRE limpar o buffer após processar (sucesso ou erro)
      const bufferKey = `${sessionId}_${phoneNumber}`;
      messageBuffers.delete(bufferKey);
      logger.info(`🧹 Buffer limpo para ${phoneNumber}`);
    }
  }

  // Restaurar sessões existentes no disco (reconectar após restart)
  async restoreSessions() {
    try {
      logger.info('Iniciando restauração de sessões a partir do disco...');

      if (!fs.existsSync(SESSIONS_PATH)) {
        logger.info('Pasta de sessões não existe, nada para restaurar.');
        return { success: true, restored: 0 };
      }

      const entries = fs.readdirSync(SESSIONS_PATH, { withFileTypes: true });
      // Filtrar apenas diretórios válidos de sessão, ignorando backups/desabled gerados pelo sistema
      const sessionDirs = entries
        .filter(e => e.isDirectory())
        .map(d => d.name)
        .filter(name => {
          // Ignorar pastas marcadas como disabled/backup (ex: session.disabled.123456 / session.backup.123)
          const lower = name.toLowerCase();
          if (lower.includes('.disabled') || lower.includes('.backup')) {
            logger.info(`restoreSessions: pulando pasta de sessão marcada como disabled/backup: ${name}`);
            return false;
          }
          // Ignorar nomes que comecem com '.' ou arquivos temporários
          if (name.startsWith('.')) return false;
          return true;
        });

      let restored = 0;

      for (const sessionId of sessionDirs) {
        // Verificar se existem arquivos de credenciais básicos antes de tentar reconectar
        const sessionPath = path.join(SESSIONS_PATH, sessionId);
        const hasFiles = fs.readdirSync(sessionPath).length > 0;
        if (!hasFiles) {
          logger.info(`Sessão ${sessionId} ignorada (sem arquivos de credenciais)`);
          continue;
        }

        try {
          logger.info(`Tentando restaurar sessão ${sessionId}...`);
          await this.createSession(sessionId);
          restored += 1;
          // Pequena espera para evitar spikes de conexão
          await new Promise(r => setTimeout(r, 1000));
        } catch (error) {
          logger.error(`Falha ao restaurar sessão ${sessionId}:`, error.message || error);
          this.io.emit('connection-error', { sessionId, error: error.message || String(error) });
        }
      }

      logger.info(`Restauração completa. Sessões restauradas: ${restored}`);
      this.io.emit('sessions-restored', { count: restored });
      return { success: true, restored };
    } catch (error) {
      logger.error('Erro ao tentar restaurar sessões:', error);
      return { success: false, error: error.message };
    }
  }

}

export default WhatsAppService;

