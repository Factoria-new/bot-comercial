import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';

const createCalendarRoutes = (calendarController) => {
    const router = express.Router();

    // Iniciar conexão OAuth com Google Calendar
    router.post('/connect', verifyToken, (req, res) => calendarController.initiateConnection(req, res));

    // Verificar status da conexão
    router.get('/status/:sessionId', verifyToken, (req, res) => calendarController.getConnectionStatus(req, res));

    // Desconectar Google Calendar
    router.delete('/disconnect/:sessionId', verifyToken, (req, res) => calendarController.disconnectCalendar(req, res));

    // Callback após OAuth (Composio gerencia, mas rota para logs) - Callback publico, não requer token
    router.get('/callback', (req, res) => calendarController.handleCallback(req, res));

    return router;
};

export default createCalendarRoutes;
