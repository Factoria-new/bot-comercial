import express from 'express';

const createCalendarRoutes = (calendarController) => {
    const router = express.Router();

    // Iniciar conexão OAuth com Google Calendar
    router.post('/connect', (req, res) => calendarController.initiateConnection(req, res));

    // Verificar status da conexão
    router.get('/status/:sessionId', (req, res) => calendarController.getConnectionStatus(req, res));

    // Desconectar Google Calendar
    router.delete('/disconnect/:sessionId', (req, res) => calendarController.disconnectCalendar(req, res));

    // Callback após OAuth (Composio gerencia, mas rota para logs)
    router.get('/callback', (req, res) => calendarController.handleCallback(req, res));

    return router;
};

export default createCalendarRoutes;
