import { auth } from '../config/firebase.js';
import logger from '../config/logger.js';

/**
 * Middleware para verificar o token de autenticação do Firebase
 */
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação não fornecido'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token malformado'
            });
        }

        try {
            const decodedToken = await auth.verifyIdToken(token);
            req.user = decodedToken;
            next();
        } catch (error) {
            logger.warn(`Falha na verificação do token: ${error.code || error.message}`);
            return res.status(401).json({
                success: false,
                error: 'Token inválido ou expirado'
            });
        }
    } catch (error) {
        logger.error('Erro interno na autenticação:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno de autenticação'
        });
    }
};
