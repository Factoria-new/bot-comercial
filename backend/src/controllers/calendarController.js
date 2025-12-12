import logger from '../config/logger.js';
import { Composio } from '@composio/core';
import calendarService from '../services/calendarService.js';

class CalendarController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
        // Inicializar Composio client (apenas para métodos que ainda não foram migrados se houver, ou manter para compatibilidade temporária)
        // No futuro, tudo deve ir para o service.
        console.log('🔧 Inicializando CalendarController...');

        // AINDA MANTEMOS O CLIENTE AQUI PARA OS MÉTODOS NÃO MIGRADOS COMPLETAMENTE (initiateConnection, getConnectionStatus)
        // Idealmente refatorar tudo, mas o foco agora é o disconnect na remoção da instância.

        this.composioClient = null;
        if (process.env.COMPOSIO_API_KEY) {
            try {
                this.composioClient = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
            } catch (error) {
                console.error('❌ Erro ao inicializar Composio (Controller):', error.message);
            }
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

            // PADRONIZAÇÃO: Usar SessionId como ID no Composio (cada instância tem seu próprio Calendar)
            const composioUserId = sessionId;

            logger.info(`🔑 Identificação Composio: SessionId=${sessionId} (conexão independente por instância)`);

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

            // 0. Se houver settings, salvar na configuração da sessão
            if (req.body.settings && this.whatsappService) {
                try {
                    logger.info(`💾 [Connect] Recebendo settings para salvar: ${JSON.stringify(req.body.settings)}`);
                    logger.info(`💾 [Connect] SessionId alvo: ${sessionId}`);

                    const currentConfig = this.whatsappService.getConfig(sessionId) || {};
                    const newConfig = {
                        ...currentConfig,
                        calendarSettings: req.body.settings
                    };
                    await this.whatsappService.setSessionConfig(sessionId, newConfig);
                } catch (saveErr) {
                    logger.error('❌ Erro ao salvar configurações do Calendar:', saveErr);
                }
            }

            // 1. Verificar se já existe uma conexão para este usuário
            try {
                const connections = await this.composioClient.connectedAccounts.list({
                    userId: composioUserId
                });

                let existingActiveConnection = null;
                const connectionsToDelete = [];

                // Garantir que connections não é null/undefined antes de acessar
                const safeConnections = connections || {};
                const calendarConnections = Array.isArray(safeConnections) ? safeConnections : (safeConnections.items || []);

                // Iterar e verificar cada conexão
                for (const connection of calendarConnections) {
                    try {
                        // Verificar se é Google Calendar
                        const isCalendar =
                            (connection.toolkit && connection.toolkit.slug === 'googlecalendar') ||
                            connection.appUniqueId === 'googlecalendar' ||
                            connection.appName === 'googlecalendar';

                        if (isCalendar) {
                            if (connection.status === 'ACTIVE') {
                                existingActiveConnection = connection;
                            } else if (connection.status === 'INITIATED') {
                                // Marcar conexões INITIATED para remoção
                                connectionsToDelete.push(connection);
                                logger.info(`🗑️ Conexão INITIATED encontrada: ${connection.id} - será removida`);
                            }
                        }
                    } catch (err) {
                        logger.warn(`⚠️ Erro ao processar conexão ${connection.id}: ${err.message}`);
                    }
                }

                // Deletar conexões INITIATED (stale/incompletas)
                for (const conn of connectionsToDelete) {
                    try {
                        logger.info(`🗑️ Deletando conexão INITIATED ${conn.id}...`);
                        await this.composioClient.connectedAccounts.delete(conn.id);
                        logger.info(`✅ Conexão ${conn.id} deletada com sucesso`);
                    } catch (delErr) {
                        logger.warn(`⚠️ Erro ao deletar conexão ${conn.id}: ${delErr.message}`);
                    }
                }

                // Se existe conexão ATIVA, usar ela
                if (existingActiveConnection) {
                    logger.info(`🔄 Conexão ATIVA encontrada para ${composioUserId}: ${existingActiveConnection.id}`);

                    return res.json({
                        success: true,
                        alreadyConnected: true,
                        connectionId: existingActiveConnection.id,
                        message: 'Conta já está conectada'
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

            // PADRONIZAÇÃO: Usar SessionId como ID no Composio (cada instância tem seu próprio Calendar)
            const composioUserId = sessionId;

            logger.info(`🔑 [Status] Identificação Composio: SessionId=${sessionId} (conexão independente por instância)`);

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

            // Buscar conexão na lista usando composioUserId (sessionId)
            if (!calendarConnection) {
                try {
                    logger.info(`👉 Verificando conexões para: ${composioUserId}`);
                    const response = await this.composioClient.connectedAccounts.list({
                        userId: composioUserId
                    });

                    let connections = [];
                    if (Array.isArray(response)) {
                        connections = response;
                    } else if (response && Array.isArray(response.items)) {
                        connections = response.items;
                    } else if (response && Array.isArray(response.data)) {
                        connections = response.data;
                    }

                    logger.info(`   🔢 Conexões encontradas: ${connections.length}`);

                    // Tentar encontrar Calendar
                    const found = connections.find(c =>
                        (c.appUniqueId && c.appUniqueId.toLowerCase().includes('calendar')) ||
                        (c.appName && c.appName.toLowerCase().includes('calendar')) ||
                        (c.appUniqueId && c.appUniqueId.toLowerCase().includes('google')) ||
                        (c.toolkit && c.toolkit.slug && c.toolkit.slug.toLowerCase().includes('googlecalendar')) ||
                        (c.toolkit && c.toolkit.slug && c.toolkit.slug.toLowerCase().includes('calendar'))
                    );

                    if (found) {
                        calendarConnection = found;
                        logger.info(`✅ Conexão encontrada: ${found.id} (Status: ${found.status})`);
                    }
                } catch (listError) {
                    logger.warn(`⚠️ Erro ao listar conexões: ${listError.message}`);
                }
            }

            if (calendarConnection) {
                logger.info(`✅ Conexão Calendar encontrada: ${calendarConnection.status} (ID: ${calendarConnection.id})`);
            } else {
                logger.warn(`⚠️ Nenhuma conexão Calendar encontrada para ${sessionId} (User: ${composioUserId})`);
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
                            await this.whatsappService.setSessionConfig(sessionId, newConfig);
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

            // Recuperar configurações salvas para retornar ao frontend
            let savedSettings = null;
            if (this.whatsappService) {
                // FORCE RELOAD FROM DISK to ensure we have the latest settings saved
                // This prevents race conditions where memory might be stale or setSessionConfig didn't update map deep enough
                const config = this.whatsappService.loadSessionConfig(sessionId);

                logger.info(`🔍 [Status] Recuperando config (Disk Force) para ${sessionId}. Encontrado? ${!!config}`);
                if (config) {
                    logger.info(`🔍 [Status] Keys na config: ${Object.keys(config).join(', ')}`);
                    if (config.calendarSettings) {
                        logger.info(`🔍 [Status] calendarSettings encontrado: ${JSON.stringify(config.calendarSettings)}`);
                        savedSettings = config.calendarSettings;
                    } else {
                        logger.info(`⚠️ [Status] calendarSettings NÃO encontrado na config.`);
                    }
                }
            }

            return res.json({
                connected: true,
                status: calendarConnection.status,
                connectionId: calendarConnection.id,
                createdAt: calendarConnection.createdAt,
                appName: calendarConnection.appName,
                settings: savedSettings
            });

        } catch (error) {
            console.error('❌ FATAL ERROR in getConnectionStatus:', error);
            logger.error('❌ Erro ao verificar status da conexão (Details):', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code
            });

            return res.status(500).json({
                error: 'Erro ao verificar status',
                details: error.message || 'Erro desconhecido'
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

            // USANDO O NOVO SERVICE
            const result = await calendarService.disconnectCalendar(sessionId);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json({
                    error: 'Erro ao desconectar',
                    details: result.message || result.error
                });
            }

        } catch (error) {
            logger.error('❌ Erro ao desconectar Calendar (Controller):', error);
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

