import logger from '../config/logger.js';
import { Composio } from '@composio/core';

class CalendarController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
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
            const { sessionId, userId } = req.body;

            if (!sessionId) {
                return res.status(400).json({ error: 'sessionId é obrigatório' });
            }

            // Se userId (email) for fornecido, usar ele. Senão, fallback para sessionId (comportamento antigo)
            const composioUserId = userId || sessionId;

            if (!this.composioClient) {
                return res.status(500).json({ error: 'Composio não está configurado. Verifique COMPOSIO_API_KEY' });
            }

            if (!process.env.COMPOSIO_AUTH_CONFIG_ID) {
                return res.status(500).json({ error: 'COMPOSIO_AUTH_CONFIG_ID não configurado' });
            }

            logger.info(`📅 Iniciando conexão do Google Calendar para: ${composioUserId} (Sessão: ${sessionId})`);

            // URL de redirect para o nosso backend (que depois manda pro frontend)
            // Isso garante que o usuário não fique preso na tela do Composio
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:3003';
            const redirectUrl = `${backendUrl}/api/calendar/callback`;

            // 1. Verificar se já existe uma conexão para este usuário
            try {
                const connections = await this.composioClient.connectedAccounts.list({
                    userId: composioUserId
                });

                let existingConnection = null;
                // Garantir que connections não é null/undefined antes de acessar
                const safeConnections = connections || {};
                const calendarConnections = Array.isArray(safeConnections) ? safeConnections : (safeConnections.items || []);

                // 1. Tentar encontrar uma conexão ATIVA primeiro
                // Precisamos iterar e buscar detalhes completos pois o list retorna parcial
                for (const connection of calendarConnections) {
                    try {
                        // Verificar se é Google Calendar
                        const isCalendar =
                            (connection.toolkit && connection.toolkit.slug === 'googlecalendar') ||
                            connection.appUniqueId === 'googlecalendar' ||
                            connection.appName === 'googlecalendar';

                        if (isCalendar) {
                            if (connection.status === 'ACTIVE') {
                                existingConnection = connection;
                                break; // Encontrou ativa, para
                            } else if (!existingConnection) {
                                // Guarda a primeira inativa encontrada como fallback
                                existingConnection = connection;
                            }
                        }
                    } catch (err) {
                        logger.warn(`⚠️ Erro ao processar conexão ${connection.id}: ${err.message}`);
                    }
                }

                if (existingConnection) {
                    logger.info(`🔄 Conexão existente encontrada para ${composioUserId}: ${existingConnection.status}`);

                    // Se estiver INACTIVE, reativar
                    if (existingConnection.status !== 'ACTIVE') {
                        logger.info(`🔌 Reativando conexão ${existingConnection.id}...`);

                        if (this.composioClient.connectedAccounts.updateStatus) {
                            await this.composioClient.connectedAccounts.updateStatus(existingConnection.id, { status: 'ACTIVE' });
                        } else {
                            await this.composioClient.connectedAccounts.enable(existingConnection.id);
                        }

                        logger.info(`✅ Conexão ${existingConnection.id} reativada com sucesso!`);
                    }

                    // Retornar sucesso imediato (simulando o redirect ou retornando dados da conexão)
                    // Como o frontend espera authUrl, podemos mandar null e indicar que já está conectado
                    // OU mandar para o callback para finalizar o fluxo no frontend
                    return res.json({
                        success: true,
                        alreadyConnected: true,
                        connectionId: existingConnection.id,
                        message: 'Conta reativada com sucesso'
                    });
                }
            } catch (checkErr) {
                logger.warn(`⚠️ Erro ao verificar conexões existentes: ${checkErr.message}`);
                // Prosseguir para criação normal se falhar a verificação
            }

            // Iniciar conexão via Composio
            // Assinatura: initiate(userId, authConfigId, options)
            const connection = await this.composioClient.connectedAccounts.initiate(
                composioUserId,
                process.env.COMPOSIO_AUTH_CONFIG_ID,
                {
                    redirectUrl: redirectUrl
                }
            );

            logger.info(`✅ Link OAuth gerado para ${composioUserId}: ${connection.redirectUrl}`);

            return res.json({
                success: true,
                authUrl: connection.redirectUrl,
                connectionId: connection.id
            });

        } catch (error) {
            logger.error('❌ Erro ao iniciar conexão OAuth:', error);
            if (error.response) {
                logger.error('Response data:', error.response.data);
            }
            return res.status(500).json({
                error: 'Erro ao iniciar conexão com Google Calendar',
                details: error.message || String(error)
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
            const { connectionId, userId } = req.query;

            // Se userId (email) for fornecido, usar ele. Senão, fallback para sessionId
            const composioUserId = userId || sessionId;

            if (!this.composioClient) {
                return res.status(500).json({ error: 'Composio não está configurado' });
            }

            logger.info(`📊 Verificando status do Calendar para: ${composioUserId} (Sessão: ${sessionId}) ${connectionId ? `(ConnectionId: ${connectionId})` : ''}`);

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
                // Buscar connections desta sessão/usuário
                const response = await this.composioClient.connectedAccounts.list({
                    userId: composioUserId
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

            // SECONDA MUDANÇA: SALVAR O EMAIL NA CONFIG DA SESSÃO SE TIVER CONEXÃO ATIVA
            if (calendarConnection && calendarConnection.status === 'ACTIVE' && this.whatsappService) {
                try {
                    // O email geralmente está no connnection.user.email ou precisamos derivar
                    // No Composio, o email pode estar em connection.identifier ou connection.authConfig.id se o userId foi email
                    // Se o userId original foi o email, ótimo. Se não, tentamos pegar dos metadados da conexão.

                    // Estratégia: Se composioUserId parece um email, usamos ele.
                    // Se não, tentamos ver se a conexão tem metadados de email.

                    let emailToSave = null;
                    if (composioUserId.includes('@')) {
                        emailToSave = composioUserId;
                    }

                    if (emailToSave) {
                        logger.info(`💾 Salvando Calendar ID (Email) na sessão ${sessionId}: ${emailToSave}`);

                        // Obter config atual para preservar outros campos
                        const currentConfig = this.whatsappService.getConfig(sessionId) || {};

                        // Atualizar apenas se for diferente ou não existir
                        if (currentConfig.calendarID !== emailToSave) {
                            const newConfig = { ...currentConfig, calendarID: emailToSave };
                            await this.whatsappService.saveConfig(sessionId, newConfig);
                            logger.info('✅ Configuração de Calendar ID atualizada com sucesso');
                        }
                    }
                } catch (saveErr) {
                    logger.error('❌ Erro ao salvar Calendar ID na sessão:', saveErr);
                }
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
            const { userId } = req.query;

            // Se userId (email) for fornecido, usar ele. Senão, fallback para sessionId
            const composioUserId = userId || sessionId;

            logger.info(`🔌 [disconnectCalendar] Iniciando desconexão...`);
            logger.info(`   Params: sessionId=${sessionId}, userId=${userId}`);
            logger.info(`   ComposioUserId final: ${composioUserId}`);

            if (!this.composioClient) {
                logger.error('❌ Composio client não inicializado');
                return res.status(500).json({ error: 'Composio não está configurado' });
            }

            logger.info(`🔌 Desconectando Google Calendar para: ${composioUserId} (Sessão: ${sessionId})`);

            // Buscar connections desta sessão/usuário
            const response = await this.composioClient.connectedAccounts.list({
                userId: composioUserId
            });

            logger.info(`📦 [disconnectCalendar] Resposta list: ${JSON.stringify(response)}`);

            let connections = [];
            if (Array.isArray(response)) {
                connections = response;
            } else if (response && Array.isArray(response.items)) {
                connections = response.items;
            } else if (response && Array.isArray(response.data)) {
                connections = response.data;
            }

            logger.info(`🔍 [disconnectCalendar] Conexões encontradas: ${connections.length}`);

            if (connections.length > 0) {
                for (const connection of connections) {
                    try {
                        logger.info(`🔎 Verificando conexão ${connection.id}...`);

                        // Verificar se é Google Calendar (usando toolkit.slug que vem no list)
                        const isCalendar =
                            (connection.toolkit && connection.toolkit.slug === 'googlecalendar') ||
                            connection.appUniqueId === 'googlecalendar' ||
                            connection.appName === 'googlecalendar';

                        if (isCalendar) {
                            logger.info(`�️ Deletando conexão ${connection.id} (status: ${connection.status})...`);
                            await this.composioClient.connectedAccounts.delete(connection.id);
                            logger.info(`✅ Connection ${connection.id} deletada com sucesso`);
                        } else {
                            logger.info(`ℹ️ Ignorando conexão ${connection.id} (App: ${connection.appUniqueId || connection.appName})`);
                        }
                    } catch (err) {
                        logger.error(`❌ Erro ao processar/desativar conexão ${connection.id}:`, err);
                    }
                }
            } else {
                logger.warn(`⚠️ Nenhuma conexão encontrada para o usuário ${composioUserId}`);
            }

            return res.json({
                success: true,
                message: 'Google Calendar desconectado (desativado) com sucesso'
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
