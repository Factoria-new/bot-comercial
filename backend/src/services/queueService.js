import admin, { db } from '../config/firebase.js';
import logger from '../config/logger.js';

const QUEUE_COLLECTION = 'message_queue';

/**
 * Adiciona uma mensagem à fila de processamento
 * @param {string} sessionId - ID da sessão do WhatsApp
 * @param {string} chatId - ID do chat (JID)
 * @param {object} message - Objeto da mensagem original do Baileys
 * @returns {Promise<string>} - ID do documento criado na fila
 */
export const addToQueue = async (sessionId, chatId, message) => {
    try {
        const docRef = await db.collection(QUEUE_COLLECTION).add({
            sessionId,
            chatId,
            message: JSON.parse(JSON.stringify(message)), // Garantir que é Plain Object
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            attempts: 0
        });
        // logger.debug(`Mensagem adicionada à fila: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        logger.error('Erro ao adicionar mensagem à fila:', error);
        throw error;
    }
};

/**
 * Inicia o Worker para processar mensagens da fila
 * @param {function} messageHandler - Função async (sessionId, chatId, message) => Promise<void>
 */
export const startWorker = (messageHandler) => {
    logger.info('🚀 Iniciando Worker da Fila de Mensagens (Firestore)...');

    // Escutar mensagens com status 'pending'
    // Limitamos a 10 por vez para não sobrecarregar
    // ORDENAÇÃO: IMPORTANTE ler as mais antigas primeiro (FIFO)
    const query = db.collection(QUEUE_COLLECTION)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .limit(10);

    const unsubscribe = query.onSnapshot(async (snapshot) => {
        if (snapshot.empty) return;

        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const doc = change.doc;
                const data = doc.data();

                // Tenta "travar" a mensagem para processamento (Atomic Transaction)
                // Isso evita que, se tivermos múltiplos workers, dois peguem a mesma task
                try {
                    await db.runTransaction(async (transaction) => {
                        const freshDoc = await transaction.get(doc.ref);
                        if (!freshDoc.exists) throw "Documento sumiu";

                        const freshData = freshDoc.data();
                        if (freshData.status !== 'pending') {
                            // Outro worker já pegou
                            return;
                        }

                        // Atualiza status para 'processing'
                        transaction.update(doc.ref, {
                            status: 'processing',
                            startedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    });

                    // Se passou pela transação, processa
                    await processTask(doc.id, data, messageHandler);

                } catch (e) {
                    // Se falhou na transação (concorrência), ignora
                    // Se foi outro erro, loga
                    if (e.message && !e.message.includes('Documento sumiu')) {
                        // logger.warn(`Worker: Race condition ou erro ao pegar task ${doc.id}:`, e);
                    }
                }
            }
        });
    }, (error) => {
        logger.error('❌ Erro no listener do Worker:', error);
    });

    return unsubscribe; // Retorna função para parar o worker
};

async function processTask(taskId, data, handler) {
    const { sessionId, chatId, message } = data;
    const docRef = db.collection(QUEUE_COLLECTION).doc(taskId);

    try {
        logger.info(`🔨 Worker processando task ${taskId} (${sessionId} - ${chatId})...`);

        // Executa a lógica do Bot (Gemini)
        await handler(sessionId, chatId, message);

        // Sucesso
        await docRef.update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`✅ Task ${taskId} concluída.`);

    } catch (error) {
        logger.error(`❌ Falha no processamento da task ${taskId}:`, error);

        // Retry logic básica
        // Se attempts < 3, volta para 'pending' com delay? 
        // Por simplicidade: marca como 'failed' e salva o erro.
        // Fila morta (Dead Letter Queue) seria 'failed'.

        await docRef.update({
            status: 'failed',
            error: error.message || String(error),
            failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
}
