// Prompt Routes - Gerenciamento de prompt do agente por usuário
import express from 'express';
import prisma from '../config/prisma.js';
import * as authService from '../services/authService.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Middleware para extrair userId do token
 */
const extractUserId = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Token não fornecido' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await authService.verifyToken(token);
        req.userId = decoded.uid;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
    }
};

/**
 * GET /api/user/prompt - Buscar prompt do usuário
 */
router.get('/prompt', extractUserId, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { customPrompt: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            prompt: user.customPrompt,
            hasPrompt: !!user.customPrompt
        });
    } catch (error) {
        logger.error('Erro ao buscar prompt:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar prompt' });
    }
});

/**
 * PUT /api/user/prompt - Salvar/atualizar prompt do usuário
 */
router.put('/prompt', extractUserId, async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ success: false, error: 'Prompt é obrigatório' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                customPrompt: prompt,
                updatedAt: new Date()
            },
            select: { id: true, customPrompt: true }
        });

        logger.info(`✅ Prompt salvo para usuário ${req.userId} (${prompt.length} chars)`);

        res.json({
            success: true,
            message: 'Prompt salvo com sucesso',
            hasPrompt: true
        });
    } catch (error) {
        logger.error('Erro ao salvar prompt:', error);
        res.status(500).json({ success: false, error: 'Erro ao salvar prompt' });
    }
});

/**
 * GET /api/user/whatsapp-status - Verificar status de conexão do WhatsApp
 * Usado para restaurar estado de conexão após refresh do navegador
 */
router.get('/whatsapp-status', extractUserId, async (req, res) => {
    try {
        // 1. Buscar instância do usuário no banco
        const instance = await prisma.instance.findUnique({
            where: { userId: req.userId },
            select: { id: true, phoneNumber: true }
        });

        if (!instance) {
            return res.json({
                hasInstance: false,
                connected: false,
                phoneNumber: null
            });
        }

        // 2. Verificar se sessão está ativa na memória
        // Import dinâmico para evitar circular dependency
        const { isSessionConnected } = await import('../services/whatsappService.js');
        const sessionId = `user_${req.userId}`;
        const isConnected = isSessionConnected(sessionId);

        // 3. Determinar phoneNumber real (ignora pending_)
        const phoneNumber = instance.phoneNumber?.startsWith('pending_')
            ? null
            : instance.phoneNumber;

        logger.info(`📱 WhatsApp status for user ${req.userId}: hasInstance=true, connected=${isConnected}, phone=${phoneNumber}`);

        res.json({
            hasInstance: true,
            connected: isConnected,
            phoneNumber
        });
    } catch (error) {
        logger.error('Erro ao verificar status WhatsApp:', error);
        res.status(500).json({
            hasInstance: false,
            connected: false,
            error: 'Erro ao verificar status'
        });
    }
});

/**
 * GET /api/user/business-info - Buscar informações de funcionamento
 */
router.get('/business-info', extractUserId, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                businessHours: true,
                serviceType: true,
                businessAddress: true,
                appointmentDuration: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            businessHours: user.businessHours,
            serviceType: user.serviceType,
            businessAddress: user.businessAddress,
            appointmentDuration: user.appointmentDuration,
            hasBusinessInfo: !!(user.businessHours || user.serviceType)
        });
    } catch (error) {
        logger.error('Erro ao buscar business info:', error);
        console.error('🔴 FULL GET ERROR:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar informações de funcionamento' });
    }
});

/**
 * PUT /api/user/business-info - Salvar/atualizar informações de funcionamento
 */
router.put('/business-info', extractUserId, async (req, res) => {
    try {
        const { businessHours, serviceType, businessAddress, appointmentDuration } = req.body;

        // Validação básica
        if (serviceType && !['online', 'presencial'].includes(serviceType)) {
            return res.status(400).json({
                success: false,
                error: 'serviceType deve ser "online" ou "presencial"'
            });
        }

        // Validar duração se fornecida
        if (appointmentDuration && ![30, 45, 60, 90, 120].includes(appointmentDuration)) {
            return res.status(400).json({
                success: false,
                error: 'appointmentDuration deve ser 30, 45, 60, 90 ou 120 minutos'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                businessHours: businessHours || undefined,
                serviceType: serviceType || undefined,
                businessAddress: businessAddress || undefined,
                appointmentDuration: appointmentDuration || undefined,
                updatedAt: new Date()
            },
            select: {
                id: true,
                businessHours: true,
                serviceType: true,
                businessAddress: true,
                appointmentDuration: true
            }
        });

        logger.info(`✅ Business info salvo para usuário ${req.userId}`);

        res.json({
            success: true,
            message: 'Informações de funcionamento salvas com sucesso',
            data: updatedUser
        });
    } catch (error) {
        logger.error('Erro ao salvar business info:', error);
        console.error('🔴 FULL ERROR:', error);
        res.status(500).json({ success: false, error: 'Erro ao salvar informações de funcionamento' });
    }
});

export default router;

