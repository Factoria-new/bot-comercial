import admin from 'firebase-admin';
import { createRequire } from 'module';
import logger from './logger.js';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

try {
    // Tentar carregar serviceAccountKey.json (Desenvolvimento/Produção Manual)
    // Caminho relativo ao arquivo atual (backend/src/config/firebase.js)
    const serviceAccountPath = path.join(process.cwd(), 'src', 'config', 'serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require('./serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        logger.info('Firebase Admin inicializado com serviceAccountKey.json');
    } else {
        // Fallback para variáveis de ambiente (Produção/Deploy)
        logger.warn('serviceAccountKey.json não encontrado. Tentando variáveis de ambiente...');

        // Se você usa variáveis de ambiente padrão do Firebase (GOOGLE_APPLICATION_CREDENTIALS)
        // admin.initializeApp(); 

        // Ou inicialização manual se preferir
        if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID,
            });
            logger.info('Firebase Admin inicializado com variáveis de ambiente');
        } else {
            logger.error('Nenhuma credencial do Firebase encontrada. A autenticação falhará.');
        }
    }
} catch (error) {
    logger.error('Erro ao inicializar Firebase Admin:', error);
}

export const auth = admin.auth();
export default admin;
