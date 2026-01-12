// Cakto Controller - Gerenciamento de pagamentos e webhooks
// Integração com a plataforma Cakto para assinaturas recorrentes

import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';

/**
 * Webhook handler para eventos da Cakto
 * Recebe notificações de compras, assinaturas, cancelamentos, etc.
 */
export const handleWebhook = async (req, res) => {
    try {
        const event = req.body;

        logger.info(`📦 Cakto Webhook recebido: ${event.event || 'unknown'}`);
        logger.info(`Payload: ${JSON.stringify(event, null, 2)}`);

        // Eventos principais da Cakto
        switch (event.event) {
            case 'purchase.approved':
            case 'PURCHASE_APPROVED':
                await handlePurchaseApproved(event);
                break;

            case 'subscription.renewed':
            case 'SUBSCRIPTION_RENEWED':
                await handleSubscriptionRenewed(event);
                break;

            case 'subscription.canceled':
            case 'SUBSCRIPTION_CANCELED':
                await handleSubscriptionCanceled(event);
                break;

            case 'subscription.expired':
            case 'SUBSCRIPTION_EXPIRED':
                await handleSubscriptionExpired(event);
                break;

            case 'refund.requested':
            case 'REFUND_REQUESTED':
                await handleRefundRequested(event);
                break;

            default:
                logger.info(`Evento Cakto não tratado: ${event.event}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Erro ao processar webhook Cakto:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Processa compra aprovada - cria usuário e libera acesso
 */
const handlePurchaseApproved = async (event) => {
    const data = event.data || event;

    // Extrair dados do cliente
    const email = data.customer?.email || data.buyer?.email || data.email;
    const name = data.customer?.name || data.buyer?.name || data.name || '';
    const productId = data.product?.id || data.product_id;
    const productName = data.product?.name || data.product_name || '';
    const purchaseId = data.purchase?.id || data.purchase_id || data.id;

    if (!email) {
        logger.error('❌ Webhook Cakto: Email não encontrado no payload');
        return;
    }

    logger.info(`✅ Compra aprovada para ${email} - Produto: ${productName}`);

    try {
        // Verificar se usuário já existe
        let user = await prisma.user.findUnique({
            where: { email }
        });

        let token = null;
        let isNewUser = false;

        if (!user) {
            // Novo usuário - criar com status pending
            logger.info(`👤 Criando novo usuário para ${email}`);
            token = await authService.createPendingUser(email, name);
            isNewUser = true;

            // Buscar usuário recém-criado
            user = await prisma.user.findUnique({
                where: { email }
            });
        }

        // Determinar role baseado no produto
        const role = determineRoleFromProduct(productName, productId);
        const plan = determinePlanFromProduct(productName, productId);

        // Atualizar assinatura do usuário
        await prisma.user.update({
            where: { id: user.id },
            data: {
                role,
                plan,
                subscriptionStatus: 'active',
                caktoCustomerId: data.customer?.id || data.buyer?.id,
                caktoSubscriptionId: purchaseId,
                displayName: name || user.displayName
            }
        });

        logger.info(`📝 Usuário ${user.id} atualizado com plano ${plan} (Role: ${role})`);

        // Enviar email de ativação para novos usuários
        if (isNewUser && token) {
            try {
                await emailService.sendActivationEmail(email, token);
                logger.info(`📧 Email de ativação enviado para ${email}`);
            } catch (emailError) {
                logger.error(`❌ Erro ao enviar email de ativação:`, emailError.message);
            }
        }

    } catch (error) {
        logger.error(`❌ Erro ao processar compra para ${email}:`, error);
        throw error;
    }
};

/**
 * Processa renovação de assinatura
 */
const handleSubscriptionRenewed = async (event) => {
    const data = event.data || event;
    const email = data.customer?.email || data.buyer?.email || data.email;

    if (!email) {
        logger.error('❌ Webhook Cakto: Email não encontrado para renovação');
        return;
    }

    logger.info(`🔄 Assinatura renovada para ${email}`);

    try {
        await prisma.user.update({
            where: { email },
            data: {
                subscriptionStatus: 'active',
                updatedAt: new Date()
            }
        });
        logger.info(`✅ Status de assinatura atualizado para ${email}`);
    } catch (error) {
        logger.error(`❌ Erro ao renovar assinatura para ${email}:`, error);
    }
};

/**
 * Processa cancelamento de assinatura
 */
const handleSubscriptionCanceled = async (event) => {
    const data = event.data || event;
    const email = data.customer?.email || data.buyer?.email || data.email;

    if (!email) {
        logger.error('❌ Webhook Cakto: Email não encontrado para cancelamento');
        return;
    }

    logger.info(`❌ Assinatura cancelada para ${email}`);

    try {
        await prisma.user.update({
            where: { email },
            data: {
                subscriptionStatus: 'canceled',
                role: 'basic' // Downgrade para básico
            }
        });
        logger.info(`✅ Acesso revogado para ${email}`);
    } catch (error) {
        logger.error(`❌ Erro ao cancelar assinatura para ${email}:`, error);
    }
};

/**
 * Processa expiração de assinatura
 */
const handleSubscriptionExpired = async (event) => {
    const data = event.data || event;
    const email = data.customer?.email || data.buyer?.email || data.email;

    if (!email) {
        logger.error('❌ Webhook Cakto: Email não encontrado para expiração');
        return;
    }

    logger.info(`⏰ Assinatura expirada para ${email}`);

    try {
        await prisma.user.update({
            where: { email },
            data: {
                subscriptionStatus: 'expired',
                role: 'basic'
            }
        });
        logger.info(`✅ Acesso revogado por expiração para ${email}`);
    } catch (error) {
        logger.error(`❌ Erro ao processar expiração para ${email}:`, error);
    }
};

/**
 * Processa solicitação de reembolso
 */
const handleRefundRequested = async (event) => {
    const data = event.data || event;
    const email = data.customer?.email || data.buyer?.email || data.email;

    if (!email) {
        logger.error('❌ Webhook Cakto: Email não encontrado para reembolso');
        return;
    }

    logger.info(`💸 Reembolso solicitado para ${email}`);

    try {
        await prisma.user.update({
            where: { email },
            data: {
                subscriptionStatus: 'refunded',
                role: 'basic'
            }
        });
        logger.info(`✅ Acesso revogado por reembolso para ${email}`);
    } catch (error) {
        logger.error(`❌ Erro ao processar reembolso para ${email}:`, error);
    }
};

/**
 * Determina a role do usuário baseado no produto
 */
const determineRoleFromProduct = (productName, productId) => {
    const nameLower = (productName || '').toLowerCase();

    if (nameLower.includes('pro') || nameLower.includes('premium') || nameLower.includes('profissional')) {
        return 'pro';
    }
    if (nameLower.includes('enterprise') || nameLower.includes('empresarial')) {
        return 'enterprise';
    }

    return 'pro'; // Default para compras
};

/**
 * Determina o plano baseado no produto
 */
const determinePlanFromProduct = (productName, productId) => {
    const nameLower = (productName || '').toLowerCase();

    if (nameLower.includes('anual') || nameLower.includes('annual')) {
        return 'pro_annual';
    }
    if (nameLower.includes('semestral') || nameLower.includes('semiannual')) {
        return 'pro_semiannual';
    }
    if (nameLower.includes('trimestral') || nameLower.includes('quarterly')) {
        return 'pro_quarterly';
    }

    return 'pro_monthly'; // Default mensal
};

export default {
    handleWebhook
};
