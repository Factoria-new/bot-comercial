import { Composio } from '@composio/core';
import logger from '../config/logger.js';

class CalendarService {
    constructor() {
        this.client = null;
    }

    getClient() {
        if (!this.client) {
            if (process.env.COMPOSIO_API_KEY) {
                try {
                    this.client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
                    logger.info('✅ CalendarService: Composio client inicializado (Lazy)');
                } catch (error) {
                    logger.error('❌ CalendarService: Erro ao inicializar Composio (Lazy):', error.message);
                }
            } else {
                logger.warn('⚠️ CalendarService: COMPOSIO_API_KEY não encontrada ao tentar inicializar');
            }
        }
        return this.client;
    }

    /**
     * Desconecta o Google Calendar associado a uma sessão
     * @param {string} sessionId ID da sessão (usado como userId no Composio)
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async disconnectCalendar(sessionId) {
        try {
            const composioUserId = sessionId;
            logger.info(`🔌 CalendarService: Desconectando Calendar para ${composioUserId}...`);

            const client = this.getClient();

            if (!client) {
                logger.error('❌ CalendarService: Cliente não inicializado (Verifique COMPOSIO_API_KEY)');
                return { success: false, message: 'Composio não configurado' };
            }

            // Buscar connections desta sessão/usuário
            const response = await client.connectedAccounts.list({
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

            logger.info(`🔍 CalendarService: ${connections.length} conexões encontradas`);

            let disconnectedCount = 0;

            if (connections.length > 0) {
                for (const connection of connections) {
                    try {
                        logger.info(`🔍 [Disconnect] Analisando conexão: ID=${connection.id}, App=${connection.appName || connection.appUniqueId}, Slug=${connection.toolkit?.slug}`);

                        // Verificar se é Google Calendar
                        const isCalendar =
                            (connection.toolkit && connection.toolkit.slug === 'googlecalendar') ||
                            connection.appUniqueId === 'googlecalendar' ||
                            connection.appName === 'googlecalendar';

                        if (isCalendar) {
                            logger.info(`wm🗑️ [Disconnect] Encontrado Calendar! Deletando conexão ${connection.id} (${connection.status})...`);
                            await client.connectedAccounts.delete(connection.id);
                            logger.info(`✅ CalendarService: Conexão ${connection.id} deletada`);
                            disconnectedCount++;
                        }
                    } catch (err) {
                        logger.error(`❌ CalendarService: Erro ao deletar conexão ${connection.id}:`, err);
                    }
                }
            }

            if (disconnectedCount > 0) {
                return { success: true, message: `Google Calendar desconectado (${disconnectedCount} conexões removidas)` };
            } else {
                return { success: true, message: 'Nenhuma conexão ativa do Google Calendar encontrada' };
            }

        } catch (error) {
            logger.error('❌ CalendarService: Erro fatal ao desconectar:', error);
            // Não lançar erro para não quebrar fluxos maiores (como deleteSession)
            return { success: false, error: error.message };
        }
    }
}

export default new CalendarService();
