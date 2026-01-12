// Cakto Routes - Rotas para webhooks e integrações Cakto
import express from 'express';
import { handleWebhook } from '../controllers/caktoController.js';

const router = express.Router();

// Webhook endpoint para receber eventos da Cakto
// Configure este URL no painel da Cakto: https://seu-dominio.com/api/cakto/webhook
router.post('/webhook', handleWebhook);

export default router;
