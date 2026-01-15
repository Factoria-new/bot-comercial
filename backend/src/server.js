import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import caktoRoutes from './routes/caktoRoutes.js';
import authRoutes from './routes/authRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import internalToolsRoutes from './routes/internalToolsRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import googleCalendarRoutes from './routes/googleCalendarRoutes.js';
import { initGoogleCalendarService } from './services/googleCalendarService.js';
import { initWhatsAppService, getSessionStatus, setAgentPrompt, cleanup as cleanupWhatsApp } from './services/whatsappService.js';
import { PROMPTS } from './prompts/agentPrompts.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'https://bot-bora.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`✅ Cliente conectado: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    logger.info(`❌ Cliente desconectado: ${socket.id} - Motivo: ${reason}`);
  });

  // Ping/Pong para manter conexão ativa
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Exportar io para uso em outros módulos
export { io };

// Initialize WhatsApp service with Socket.IO
initWhatsAppService(io);

// Initialize Google Calendar service with Socket.IO
initGoogleCalendarService(io);

// Import session config service (separated to avoid circular dependencies)
import { getSessionConfig, setSessionConfig } from './services/sessionConfigService.js';

// Função para verificar origem permitida
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Permitir requisições sem origin (ex: Postman)

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://bot-bora.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  // Verificar se está na lista ou é domínio Vercel
  return allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.includes('vercel.app');
};

// Middlewares CORS
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Origem bloqueada por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Configuração para Webhook do Stripe (precisa do raw body)
// Limite aumentado para 50mb para suportar áudios maiores
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/stripe/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging de requisições (skip high-frequency polling endpoints)
app.use((req, res, next) => {
  // Skip logging for status polling endpoints to reduce noise
  const skipPaths = ['/api/instagram/status', '/api/whatsapp/status'];
  const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
  if (!shouldSkip) {
    logger.info(`${req.method} ${req.path}`);
  }
  next();
});

// Rotas
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Factoria Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rotas de Pagamento (Cakto)
app.use('/api/cakto', caktoRoutes);

// Rotas de Autenticação
app.use('/api/auth', authRoutes);

// Rotas do Agente (Gemini)
app.use('/api/agent', agentRoutes);

// Rotas Internas (Ferramentas para AI Engine)
app.use('/api/internal', internalToolsRoutes);

// Rotas de Gerenciamento de Prompt do Usuário
app.use('/api/user', promptRoutes);

// Rotas do Google Calendar
app.use('/api/google-calendar', googleCalendarRoutes);

// Rotas de Status do WhatsApp
app.get('/api/whatsapp/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const status = getSessionStatus(sessionId);
  res.json(status);
});

// --- Session Configuration Endpoints ---
// GET - Retrieve session configuration
app.get('/api/whatsapp/config/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const config = await getSessionConfig(sessionId);
  res.json({ success: true, config });
});

// POST - Save session configuration
app.post('/api/whatsapp/config/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const config = req.body;

  try {
    await setSessionConfig(sessionId, config);

    // Also update the agent prompt if systemPrompt is provided
    if (config.systemPrompt) {
      setAgentPrompt(sessionId, config.systemPrompt);
    }

    const updatedConfig = await getSessionConfig(sessionId);
    res.json({
      success: true,
      message: 'Configuração salva com sucesso',
      config: updatedConfig
    });
  } catch (error) {
    logger.error('Error saving session config:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar configuração' });
  }
});

// Rota para configurar o prompt do agente para uma sessão WhatsApp
app.post('/api/whatsapp/configure-agent', (req, res) => {
  const { sessionId, prompt, data, niche } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId é obrigatório'
    });
  }

  // Determine final prompt: either raw string or generated from data
  let finalPrompt = prompt;

  if (!finalPrompt && data && niche) {
    // Generate prompt from data using backend template
    // Dynamically import or use the imported PROMPTS
    // We need to import PROMPTS at top level or here if dynamic.
    // Since we can't easily change top imports in this block, we assume PROMPTS is imported or we use a helper.
    // WAIT: I need to add the import to the top of the file first!
    // I will do this in a multi-edit. But for now, let's assume I fix the import in the next step or use require if possible (but this is ESM).
    // Let's assume I will add `import { PROMPTS } from './prompts/agentPrompts.js';` at the top.

    const generator = PROMPTS[niche] || PROMPTS['general'] || PROMPTS['services']; // Fallback
    if (generator) {
      finalPrompt = generator(data);
      logger.info(`📝 Prompt gerado dinamicamente para nicho: ${niche}`);
    }
  }

  if (!finalPrompt) {
    return res.status(400).json({
      success: false,
      error: 'É necessário fornecer "prompt" (string) OU "data" (objeto) e "niche" (string) para gerar o prompt.'
    });
  }

  const success = setAgentPrompt(sessionId, finalPrompt);

  res.json({
    success,
    message: success ? 'Prompt configurado com sucesso' : 'Erro ao configurar prompt',
    generatedPromptPreview: finalPrompt.substring(0, 100) + '...'
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3003;

httpServer.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('');
  console.log('   Factoria Backend Server');
  console.log('');
  console.log(`   Servidor rodando em: http://localhost:${PORT}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('');
  console.log('   Status: Online');
  console.log('');
  console.log('='.repeat(60));
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down server...');

  try {
    await cleanupWhatsApp();
    console.log('✅ Services cleaned up');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;

