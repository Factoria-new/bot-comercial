import logger from '../config/logger.js';
import { Composio } from '@composio/core';

class CalendarController {
    constructor() {
        // Inicializar Composio client
        console.log('🔧 Inicializando CalendarController...');
        console.log('   COMPOSIO_API_KEY:', process.env.COMPOSIO_API_KEY ? `Configurada (${process.env.COMPOSIO_API_KEY.substring(0, 10)}...)` : 'NÃO configurada');
        console.log('   COMPOSIO_AUTH_CONFIG_ID:', process.env.COMPOSIO_AUTH_CONFIG_ID || 'NÃO configurada');

        this.composioClient = null;
        if (process.env.COMPOSIO_API_KEY) {
            try {
                this.composioClient = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
                console.log('✅ Composio client inicializado');
            } catch (error) {
                console.error('❌ Erro ao inicializar Composio:', error.message);
            }
        } else {
            console.warn('⚠️ COMPOSIO_API_KEY não encontrada - Calendar não disponível');
        }
    }

    /**
     * Inicia o fluxo OAuth do Google Calendar para um cliente
     * POST /api/calendar/connect
     */
    async initiateConnection(req, res) {
        try {
            const { sessionId } = req.body;

            if (!sessionId) {
                return res.status(400).json({ error: 'sessionId é obrigatório' });
            }

            if (!this.composioClient) {
                return res.status(500).json({ error: 'Composio não está configurado. Verifique COMPOSIO_API_KEY' });
            }

            if (!process.env.COMPOSIO_AUTH_CONFIG_ID) {
                return res.status(500).json({ error: 'COMPOSIO_AUTH_CONFIG_ID não configurado' });
            }

            logger.info(`📅 Iniciando conexão do Google Calendar para sessão: ${sessionId}`);

            // URL de redirect para o nosso backend (que depois manda pro frontend)
            // Isso garante que o usuário não fique preso na tela do Composio
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:3003';
            const redirectUrl = `${backendUrl}/api/calendar/callback`;

            // Iniciar conexão via Composio
            // Assinatura: initiate(userId, authConfigId, options)
            const connection = await this.composioClient.connectedAccounts.initiate(
                sessionId,
                process.env.COMPOSIO_AUTH_CONFIG_ID,
                {
                    redirectUrl: redirectUrl
                }
            );

            logger.info(`✅ Link OAuth gerado para sessão ${sessionId}: ${connection.redirectUrl}`);

            return res.json({
                success: true,
                authUrl: connection.redirectUrl,
                connectionId: connection.id
            });

        } catch (error) {
            logger.error('❌ Erro ao iniciar conexão OAuth:', error.message);
            logger.error('Stack trace:', error.stack);
            logger.error('Error details:', JSON.stringify(error, null, 2));
            return res.status(500).json({
                error: 'Erro ao iniciar conexão com Google Calendar',
                details: error.message
            });
        }
    }

    /**
     * Verifica o status da conexão do Google Calendar
     * GET /api/calendar/status/:sessionId?connectionId=...
     */
    async getConnectionStatus(req, res) {
        try {
            const { sessionId } = req.params;
            const { connectionId } = req.query;

            if (!this.composioClient) {
                return res.status(500).json({ error: 'Composio não está configurado' });
            }

            logger.info(`📊 Verificando status do Calendar para sessão: ${sessionId} ${connectionId ? `(ConnectionId: ${connectionId})` : ''}`);

            let calendarConnection = null;

            // Se tiver connectionId, buscar diretamente (mais confiável)
            if (connectionId) {
                try {
                    const connection = await this.composioClient.connectedAccounts.get(connectionId);
                    if (connection) {
                        logger.info(`✅ Conexão encontrada via ID: ${connection.status}`);
                        calendarConnection = connection;
                    }
                } catch (error) {
                    logger.warn(`⚠️ Erro ao buscar conexão por ID ${connectionId}: ${error.message}`);
                }
            }

            // Fallback: Buscar na lista se não achou pelo ID
            if (!calendarConnection) {
                // Buscar connections desta sessão
                const response = await this.composioClient.connectedAccounts.list({
                    userId: sessionId
                });

                logger.info(`📦 Resposta bruta do Composio list: ${JSON.stringify(response, null, 2)}`);

                let connections = [];
                if (Array.isArray(response)) {
                    connections = response;
                } else if (response && Array.isArray(response.items)) {
                    connections = response.items;
                } else if (response && Array.isArray(response.data)) {
                    connections = response.data;
                }

                logger.info(`🔍 Conexões processadas para ${sessionId}: ${connections.length}`);

                // Filtrar localmente por app se necessário
                // Usando includes e toLowerCase para ser mais robusto
                calendarConnection = connections.find(c =>
                    (c.appUniqueId && c.appUniqueId.toLowerCase().includes('calendar')) ||
                    (c.appName && c.appName.toLowerCase().includes('calendar')) ||
                    (c.appUniqueId && c.appUniqueId.toLowerCase().includes('google'))
                );
            }

            if (calendarConnection) {
                logger.info(`✅ Conexão Calendar encontrada: ${calendarConnection.status}`);
            } else {
                logger.warn(`⚠️ Nenhuma conexão Calendar encontrada para ${sessionId}`);
            }

            if (!calendarConnection || calendarConnection.status !== 'ACTIVE') {
                return res.json({
                    connected: false,
                    message: 'Google Calendar não conectado'
                });
            }

            return res.json({
                connected: true,
                status: calendarConnection.status,
                connectionId: calendarConnection.id,
                createdAt: calendarConnection.createdAt,
                appName: calendarConnection.appName
            });

        } catch (error) {
            logger.error('❌ Erro ao verificar status da conexão:', error.message);
            logger.error('Stack trace:', error.stack);
            logger.error('Error details:', JSON.stringify(error, null, 2));
            return res.status(500).json({
                error: 'Erro ao verificar status',
                details: error.message
            });
        }
    }

    /**
     * Desconecta o Google Calendar
     * DELETE /api/calendar/disconnect/:sessionId
     */
    async disconnectCalendar(req, res) {
        try {
            const { sessionId } = req.params;

            if (!this.composioClient) {
                return res.status(500).json({ error: 'Composio não está configurado' });
            }

            logger.info(`🔌 Desconectando Google Calendar para sessão: ${sessionId}`);

            // Buscar connections desta sessão
            const response = await this.composioClient.connectedAccounts.list({
                userId: sessionId
            });

            let connections = [];
            if (Array.isArray(response)) {
                connections = response;
            } else if (response && Array.isArray(response.items)) {
                connections = response.items;
            } else if (response && Array.isArray(response.data)) {
                connections = response.data;
            }

            const calendarConnections = connections.filter(c =>
                c.appUniqueId === 'googlecalendar' || c.appName === 'googlecalendar'
            );

            if (calendarConnections.length > 0) {
                for (const connection of calendarConnections) {
                    await this.composioClient.connectedAccounts.delete(connection.id);
                    logger.info(`✅ Connection ${connection.id} deletada`);
                }
            }

            return res.json({
                success: true,
                message: 'Google Calendar desconectado com sucesso'
            });

        } catch (error) {
            logger.error('❌ Erro ao desconectar Calendar:', error);
            return res.status(500).json({
                error: 'Erro ao desconectar',
                details: error.message
            });
        }
    }

    /**
     * Callback após OAuth (apenas para validação/log, Composio gerencia automaticamente)
     * GET /api/calendar/callback
     */
    async handleCallback(req, res) {
        try {
            const { code, state } = req.query;

            logger.info('✅ Callback OAuth recebido', {
                hasCode: !!code,
                state
            });

            // Composio já processou o callback automaticamente
            // Redirecionar para o frontend com sucesso
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/dashboard?calendar=connected`);

        } catch (error) {
            logger.error('❌ Erro no callback OAuth:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/dashboard?calendar=error`);
        }
    }
}

export default CalendarController;
