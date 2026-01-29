// Stripe Routes - Rotas para checkout, portal e webhooks Stripe
import express from 'express';
import {
    createCheckoutSession,
    createPortalSession,
    listPrices,
} from '../controllers/stripeController.js';

const router = express.Router();

// POST /api/stripe/create-checkout - Criar sessão de checkout
router.post('/create-checkout', createCheckoutSession);

// POST /api/stripe/create-portal - Criar portal de gerenciamento
router.post('/create-portal', createPortalSession);

// GET /api/stripe/prices - Listar preços disponíveis
router.get('/prices', listPrices);

// NOTA: A rota POST /api/stripe/webhook é configurada diretamente no server.js
// para garantir que o raw body seja capturado antes do express.json() processar

export default router;
