import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/authMiddleware.js';

// Configurar multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB (limite da OpenAI)
  }
});

const createWhatsAppRoutes = (whatsappController) => {
  const router = express.Router();

  // Gerar Código para nova sessão - Protegido
  router.post('/qr/:sessionId', verifyToken, (req, res) => whatsappController.generateQR(req, res));

  // Desconectar sessão - Protegido
  router.post('/logout/:sessionId', verifyToken, (req, res) => whatsappController.logout(req, res));

  // Excluir sessão (logout + remover arquivos) - Protegido
  router.delete('/sessions/:sessionId', verifyToken, (req, res) => whatsappController.deleteSession(req, res));

  // Obter status da sessão - Protegido
  router.get('/status/:sessionId', verifyToken, (req, res) => whatsappController.getStatus(req, res));

  // Salvar configuração do assistente - Protegido
  router.post('/config/:sessionId', verifyToken, (req, res) => whatsappController.saveConfig(req, res));

  // Obter configuração - Protegido
  router.get('/config/:sessionId', verifyToken, (req, res) => whatsappController.getConfig(req, res));

  // Listar todas as sessões - Protegido
  router.get('/sessions', verifyToken, (req, res) => whatsappController.getAllSessions(req, res));

  // Forçar reconexão - Protegido
  router.post('/reconnect/:sessionId', verifyToken, (req, res) => whatsappController.forceReconnect(req, res));

  // Testar assistente OpenAI
  router.post('/test-assistant/:sessionId', (req, res) => whatsappController.testAssistant(req, res));

  // Testar transcrição de áudio
  router.post('/test-audio/:sessionId', upload.single('audio'), (req, res) => whatsappController.testAudioTranscription(req, res));

  // Testar análise de imagem
  router.post('/test-image/:sessionId', upload.single('image'), (req, res) => whatsappController.testImageAnalysis(req, res));

  // Testar processamento de documento
  router.post('/test-document/:sessionId', upload.single('document'), (req, res) => whatsappController.testDocumentProcessing(req, res));

  return router;
};

export default createWhatsAppRoutes;

