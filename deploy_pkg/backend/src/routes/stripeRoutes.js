// Stripe Routes - Rotas para checkout, portal e webhooks Stripe
import express from 'express';
import {
    createCheckoutSession,
    createPortalSession,
    listPrices,
    handleWebhook,
} from '../controllers/stripeController.js';

const router = express.Router();

// POST /api/stripe/create-checkout - Criar sessão de checkout
router.post('/create-checkout', createCheckoutSession);

// POST /api/stripe/create-portal - Criar portal de gerenciamento
router.post('/create-portal', createPortalSession);

// GET /api/stripe/prices - Listar preços disponíveis
router.get('/prices', listPrices);

// POST /api/stripe/webhook - Webhook handler (raw body já configurado no server.js)
router.post('/webhook', handleWebhook);

export default router;
