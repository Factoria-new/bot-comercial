import express from 'express';
import stripeController from '../controllers/stripeController.js';

const router = express.Router();

router.post('/create-checkout-session', stripeController.createCheckoutSession);
// Webhook precisa ser POST
// A rota do webhook será /api/stripe/webhook ou /webhook/stripe?
// Geralmente webhooks ficam na raiz ou em /api/webhooks para facilitar configuração
// Vamos manter em /webhook separado no server.js ou aqui mesmo se o parser permitir.
// Por consistência, aqui:
router.post('/webhook', stripeController.handleWebhook);

export default router;
