import express from 'express';
import mercadoPagoController from '../controllers/mercadoPagoController.js';

const router = express.Router();

router.post('/create-preference', mercadoPagoController.createPreference);
router.post('/webhook', mercadoPagoController.handleWebhook);
// Support GET for webhook verification if needed (MP sometimes sends validation challenges, though mostly POST)
router.get('/webhook', (req, res) => res.sendStatus(200));

export default router;
