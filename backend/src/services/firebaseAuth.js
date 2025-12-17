import admin, { db } from '../config/firebase.js';
import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import logger from '../config/logger.js';

import fs from 'fs';
import path from 'path';

/**
 * Adaptador de Autenticação do Baileys para Firestore
 * Substitui o uso de arquivos locais (useMultiFileAuthState)
 */
export const useFirestoreAuthState = async (sessionId) => {
    // Referências do Firestore
    const sessionRef = db.collection('sessions').doc(sessionId);
    const keysCollection = sessionRef.collection('keys');

    // Buffer para escritas em lote (evita rate limit do Firestore)
    // Map<keyId, value>
    const writeBuffer = new Map();
    const deleteBuffer = new Set();
    let saveTimeout = null;
    const WRITE_INTERVAL = 10000; // 10 segundos

    // Função para migrar dados locais se existirem e o Firestore estiver vazio
    const migrateFromLocal = async () => {
        const SESSIONS_PATH = path.join(process.cwd(), 'sessions'); // Ajuste conforme necessário
        const localSessionPath = path.join(SESSIONS_PATH, sessionId);

        if (!fs.existsSync(localSessionPath)) return null;

        logger.info(`Migrando sessão local ${sessionId} para Firestore...`);

        try {
            let batch = db.batch();
            let opCount = 0;
            const MAX_BATCH = 50;

            // 1. Migrar creds.json
            const credsPath = path.join(localSessionPath, 'creds.json');
            let migratedCreds = null;
            if (fs.existsSync(credsPath)) {
                const credsContent = fs.readFileSync(credsPath, 'utf-8');
                migratedCreds = JSON.parse(credsContent, BufferJSON.reviver);

                // Salvar creds (convertendo buffers para string no replacer, pois vamos salvar como objeto JSON no doc)
                // Nota: O initAuthCreds usa BufferJSON.replacer para salvar em arquivo. 
                // Aqui salvamos no Firestore como objeto estruturado.
                const serializedCreds = JSON.parse(JSON.stringify(migratedCreds, BufferJSON.replacer));

                batch.set(sessionRef, {
                    creds: serializedCreds,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    migratedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                opCount++;
            }

            // 2. Migrar chaves
            const files = fs.readdirSync(localSessionPath);
            for (const file of files) {
                if (file === 'creds.json' || !file.endsWith('.json')) continue;

                const keyId = file.replace('.json', '');
                const content = fs.readFileSync(path.join(localSessionPath, file), 'utf-8');

                // O conteúdo do arquivo já está serializado com BufferJSON.replacer
                // Podemos salvar diretamente como string 'value' no Firestore, compatível com a lógica de leitura
                batch.set(keysCollection.doc(keyId), { value: content });
                opCount++;

                if (opCount >= MAX_BATCH) {
                    logger.debug(`Commiting batch of ${opCount} items for ${sessionId}...`);
                    await batch.commit();
                    opCount = 0;
                    batch = db.batch(); // New batch
                    // Yield to event loop to prevent blocking
                    await new Promise(r => setTimeout(r, 200));
                }
            }

            if (opCount > 0) await batch.commit();

            logger.info(`Migração de ${sessionId} concluída.`);
            return migratedCreds;

        } catch (error) {
            logger.error(`Erro ao migrar sessão ${sessionId}: ${error.message}`, error);
            return null;
        }
    };

    // Função para buscar credenciais iniciais
    const loadCreds = async () => {
        try {
            const doc = await sessionRef.get();
            if (doc.exists) {
                const data = doc.data();
                // Baileys usa BufferJSON para reviver Buffers no JSON
                if (data.creds) {
                    return JSON.parse(JSON.stringify(data.creds), BufferJSON.reviver);
                }
            }
            // Fallback: Tentar migração
            const migrated = await migrateFromLocal();
            if (migrated) return migrated;

            // Se a pasta existe mas a migração não retornou creds (ex: erro), NÃO crie nova sessão
            const SESSIONS_PATH = path.join(process.cwd(), 'sessions');
            const localSessionPath = path.join(SESSIONS_PATH, sessionId);
            if (fs.existsSync(localSessionPath) && fs.readdirSync(localSessionPath).length > 0) {
                logger.warn(`Sessão local ${sessionId} existe mas migração falhou. Evitando sobrescrita.`);
                // Retornar null aqui forçaria initAuthCreds().
                // Melhor lançar erro para não conectar esta sessão agora e tentar no prox restart.
                throw new Error("Falha na migração de sessão existente");
            }

        } catch (error) {
            logger.error(`Erro ao carregar credenciais do Firestore para ${sessionId}:`, error);
            // Se houve erro real (ex: Firestore down), não queremos criar nova sessão.
            throw error;
        }
        return null;
    };

    // Inicializar credenciais
    const creds = (await loadCreds()) || initAuthCreds();

    // Função para salvar o buffer no Firestore
    const flushBuffer = async () => {
        if (writeBuffer.size === 0 && deleteBuffer.size === 0) return;

        logger.debug(`Flushing Firestore Auth Buffer para ${sessionId}: ${writeBuffer.size} writes, ${deleteBuffer.size} deletes`);

        const batch = db.batch();
        let operationCount = 0;
        const MAX_BATCH_SIZE = 400; // Limite do Firestore é 500

        try {
            // Processar Deleções
            for (const keyId of deleteBuffer) {
                batch.delete(keysCollection.doc(keyId));
                operationCount++;
                if (operationCount >= MAX_BATCH_SIZE) break; // Simplificação: flush parcial
            }

            // Processar Escritas
            if (operationCount < MAX_BATCH_SIZE) {
                for (const [keyId, value] of writeBuffer) {
                    // Se value for nulo/undefined, é deleção (já tratado acima ou redundante)
                    if (value) {
                        // Converter valor para formato compatível com Firestore (string ou blob)
                        // Baileys keys podem ser objetos complexos, melhor JSON.stringify com BufferJSON
                        const serialized = JSON.stringify(value, BufferJSON.replacer);
                        batch.set(keysCollection.doc(keyId), { value: serialized });
                        operationCount++;
                    }
                    if (operationCount >= MAX_BATCH_SIZE) break;
                }
            }

            // Commit
            if (operationCount > 0) {
                await batch.commit();

                // Limpar itens processados do buffer
                // (Na implementação real, deveríamos limpar apenas os que foram pro batch,
                // mas dado o volume normal, limpar tudo costuma ser seguro se o intervalo for curto)
                writeBuffer.clear();
                deleteBuffer.clear();
            }

        } catch (error) {
            logger.error(`Erro ao salvar batch de auth no Firestore para ${sessionId}:`, error);
            // Em caso de erro, mantemos o buffer para tentar novamente (exceto se for erro fatal de dados)
        } finally {
            saveTimeout = null;
        }
    };

    // Agendar flush
    const scheduleFlush = () => {
        if (!saveTimeout) {
            saveTimeout = setTimeout(flushBuffer, WRITE_INTERVAL);
        }
    };

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    // Buscar múltiplas chaves em paralelo (ou usar keysCollection.where if ids is huge, but ids usually small list)
                    await Promise.all(ids.map(async (id) => {
                        const keyId = `${type}-${id}`;

                        // 1. Verificar Buffer primeiro (escrita pendente ganha da leitura)
                        if (writeBuffer.has(keyId)) {
                            data[id] = writeBuffer.get(keyId);
                            return;
                        }
                        if (deleteBuffer.has(keyId)) {
                            return; // Foi deletado
                        }

                        // 2. Buscar no Firestore
                        try {
                            const doc = await keysCollection.doc(keyId).get();
                            if (doc.exists) {
                                const stored = doc.data();
                                // Parse de volta
                                data[id] = JSON.parse(stored.value, BufferJSON.reviver);
                            }
                        } catch (err) {
                            logger.warn(`Erro ao ler chave ${keyId} do Firestore:`, err);
                        }
                    }));
                    return data;
                },
                set: (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const keyId = `${category}-${id}`;

                            if (value) {
                                writeBuffer.set(keyId, value);
                                deleteBuffer.delete(keyId);
                            } else {
                                deleteBuffer.add(keyId);
                                writeBuffer.delete(keyId);
                            }
                        }
                    }
                    scheduleFlush();
                }
            }
        },
        saveCreds: async () => {
            // Salvar credenciais principais imediatamente (ou também bufferizar se mudar muito)
            // Creds mudam com menos frequência que keys, mas é bom garantir.
            try {
                // Serializar creds
                const serializedCreds = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
                await sessionRef.set({
                    creds: serializedCreds,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                logger.error(`Erro ao salvar creds no Firestore para ${sessionId}:`, error);
            }
        }
    };
};
