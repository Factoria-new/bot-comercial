// History Service - Persistência de histórico de conversas no banco de dados
// Usa Prisma com PostgreSQL (Supabase)

import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

// Limite padrão de mensagens para carregar no histórico
const DEFAULT_HISTORY_LIMIT = 20;

/**
 * Obtém ou cria uma instância pelo número de telefone
 * @param {string} phoneNumber - Número de telefone da instância (bot)
 * @returns {Promise<Instance>}
 */
async function getOrCreateInstance(phoneNumber) {
    try {
        let instance = await prisma.instance.findUnique({
            where: { phoneNumber }
        });

        if (!instance) {
            instance = await prisma.instance.create({
                data: { phoneNumber }
            });
            logger.info(`📱 Nova instância criada: ${phoneNumber}`);
        }

        return instance;
    } catch (error) {
        logger.error(`❌ Erro ao obter/criar instância: ${error.message}`);
        throw error;
    }
}

/**
 * Obtém ou cria uma conversa entre instância e cliente
 * @param {string} instancePhone - Número da instância (bot)
 * @param {string} customerPhone - Número do cliente
 * @returns {Promise<Conversation>}
 */
async function getOrCreateConversation(instancePhone, customerPhone) {
    try {
        const instance = await getOrCreateInstance(instancePhone);

        let conversation = await prisma.conversation.findUnique({
            where: {
                instanceId_customerPhone: {
                    instanceId: instance.id,
                    customerPhone
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    instanceId: instance.id,
                    customerPhone
                }
            });
            logger.info(`💬 Nova conversa criada: ${instancePhone} <-> ${customerPhone}`);
        }

        return conversation;
    } catch (error) {
        logger.error(`❌ Erro ao obter/criar conversa: ${error.message}`);
        throw error;
    }
}

/**
 * Busca o histórico de mensagens de uma conversa
 * @param {string} instancePhone - Número da instância (bot)
 * @param {string} customerPhone - Número do cliente
 * @param {number} limit - Quantidade máxima de mensagens a retornar
 * @returns {Promise<Array<{role: string, content: string}>>} Histórico no formato simples
 */
export async function getConversationHistory(instancePhone, customerPhone, limit = DEFAULT_HISTORY_LIMIT) {
    try {
        logger.info(`🔍 Buscando histórico - instancePhone: ${instancePhone}, customerPhone: ${customerPhone}`);

        const instance = await prisma.instance.findUnique({
            where: { phoneNumber: instancePhone }
        });

        if (!instance) {
            logger.info(`📭 Nenhuma instância encontrada para ${instancePhone}`);
            return [];
        }

        const conversation = await prisma.conversation.findUnique({
            where: {
                instanceId_customerPhone: {
                    instanceId: instance.id,
                    customerPhone
                }
            }
        });

        if (!conversation) {
            logger.info(`📭 Nenhuma conversa encontrada para ${instancePhone} <-> ${customerPhone}`);
            return [];
        }

        // Buscar mensagens ordenadas por data (mais antigas primeiro)
        const messages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: {
                role: true,
                content: true
            }
        });

        logger.info(`📚 Histórico carregado: ${messages.length} mensagens para ${customerPhone}`);
        return messages;
    } catch (error) {
        logger.error(`❌ Erro ao buscar histórico: ${error.message}`);
        return []; // Retorna vazio em caso de erro para não quebrar o fluxo
    }
}

/**
 * Salva uma mensagem no histórico
 * @param {string} instancePhone - Número da instância (bot)
 * @param {string} customerPhone - Número do cliente
 * @param {string} role - "user" ou "model"
 * @param {string} content - Conteúdo da mensagem
 * @returns {Promise<Message>}
 */
export async function saveMessage(instancePhone, customerPhone, role, content) {
    try {
        logger.debug(`💾 Salvando mensagem - instancePhone: ${instancePhone}, customerPhone: ${customerPhone}, role: ${role}`);

        const conversation = await getOrCreateConversation(instancePhone, customerPhone);

        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role,
                content
            }
        });

        // Atualizar timestamp da conversa
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        return message;
    } catch (error) {
        logger.error(`❌ Erro ao salvar mensagem: ${error.message}`);
        return null;
    }
}

/**
 * Limpa o histórico de uma conversa específica
 * @param {string} instancePhone - Número da instância (bot)
 * @param {string} customerPhone - Número do cliente
 * @returns {Promise<number>} Número de mensagens deletadas
 */
export async function clearHistory(instancePhone, customerPhone) {
    try {
        const instance = await prisma.instance.findUnique({
            where: { phoneNumber: instancePhone }
        });

        if (!instance) return 0;

        const conversation = await prisma.conversation.findUnique({
            where: {
                instanceId_customerPhone: {
                    instanceId: instance.id,
                    customerPhone
                }
            }
        });

        if (!conversation) return 0;

        const result = await prisma.message.deleteMany({
            where: { conversationId: conversation.id }
        });

        logger.info(`🗑️ Histórico limpo: ${result.count} mensagens deletadas para ${customerPhone}`);
        return result.count;
    } catch (error) {
        logger.error(`❌ Erro ao limpar histórico: ${error.message}`);
        return 0;
    }
}

/**
 * Limpa mensagens antigas de todas as conversas (manutenção)
 * @param {number} daysOld - Deletar mensagens mais antigas que X dias
 * @returns {Promise<number>} Número de mensagens deletadas
 */
export async function cleanupOldMessages(daysOld = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await prisma.message.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        logger.info(`🧹 Limpeza: ${result.count} mensagens antigas deletadas (>${daysOld} dias)`);
        return result.count;
    } catch (error) {
        logger.error(`❌ Erro na limpeza de mensagens antigas: ${error.message}`);
        return 0;
    }
}

/**
 * Desconecta o Prisma Client (para shutdown graceful)
 */
export async function disconnect() {
    await prisma.$disconnect();
    logger.info('🔌 Prisma desconectado');
}

export default {
    getConversationHistory,
    saveMessage,
    clearHistory,
    cleanupOldMessages,
    disconnect
};
