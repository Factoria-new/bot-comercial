// Stripe Controller - Gerenciamento de pagamentos e webhooks
// Integração com Stripe para assinaturas recorrentes

import Stripe from 'stripe';
import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// IDs dos preços configurados no Stripe Dashboard
// Estes devem ser atualizados após criar os produtos no Stripe
const PRICE_IDS = {
    basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    basic_semiannual: process.env.STRIPE_PRICE_BASIC_SEMIANNUAL,
    basic_annual: process.env.STRIPE_PRICE_BASIC_ANNUAL,
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_semiannual: process.env.STRIPE_PRICE_PRO_SEMIANNUAL,
    pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
};

/**
 * Cria uma sessão de checkout do Stripe
 */
export const createCheckoutSession = async (req, res) => {
    try {
        const { priceId, email, planType, period } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: 'priceId é obrigatório' });
        }

        const sessionConfig = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/#pricing`,
            metadata: {
                planType: planType || 'pro',
                period: period || 'monthly',
            },
        };

        // Se email foi fornecido, pré-preencher no checkout
        if (email) {
            sessionConfig.customer_email = email;
        }

        // Habilitar Pix se disponível (Brasil)
        sessionConfig.payment_method_types = ['card'];
        // Nota: Para habilitar Pix, descomentar abaixo após configurar no Dashboard
        // sessionConfig.payment_method_types = ['card', 'pix'];

        const session = await stripe.checkout.sessions.create(sessionConfig);

        logger.info(`✅ Checkout session criada: ${session.id}`);

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        logger.error(error, 'Erro ao criar checkout session:');
        console.error('STRIPE ERROR DETAIL:', error); // Force log to stdout

        // Return clear error to frontend for debugging
        res.status(500).json({
            error: 'Erro ao criar sessão de pagamento',
            details: error.message,
            code: error.code || 'unknown'
        });
    }
};

/**
 * Cria um portal de gerenciamento de assinatura para o cliente
 */
export const createPortalSession = async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: 'customerId é obrigatório' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.FRONTEND_URL}/dashboard`,
        });

        res.json({
            success: true,
            url: session.url,
        });
    } catch (error) {
        logger.error(error, 'Erro ao criar portal session:');
        res.status(500).json({ error: 'Erro ao criar portal de gerenciamento' });
    }
};

/**
 * Lista preços disponíveis
 */
export const listPrices = async (req, res) => {
    try {
        const prices = await stripe.prices.list({
            active: true,
            expand: ['data.product'],
        });

        res.json({
            success: true,
            prices: prices.data,
        });
    } catch (error) {
        logger.error(error, 'Erro ao listar preços:');
        res.status(500).json({ error: 'Erro ao listar preços' });
    }
};

/**
 * Webhook handler para eventos do Stripe
 */
export const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // === DIAGNÓSTICO - INÍCIO ===
    logger.info(`🔍 Webhook recebido - Headers: ${JSON.stringify({
        'content-type': req.headers['content-type'],
        'stripe-signature': sig ? sig.substring(0, 50) + '...' : 'MISSING',
        'content-length': req.headers['content-length'],
    })}`);
    logger.info(`🔍 rawBody existe: ${!!req.rawBody}, tamanho: ${req.rawBody?.length || 0}`);
    logger.info(`🔍 webhookSecret configurado: ${!!webhookSecret}`);
    // === DIAGNÓSTICO - FIM ===

    let event;

    try {
        // Verificar assinatura do webhook
        if (!req.rawBody) {
            logger.error(`❌ rawBody não foi capturado! Verifique a ordem dos middlewares.`);
            return res.status(400).send('Webhook Error: rawBody not captured');
        }
        if (!webhookSecret) {
            logger.error(`❌ STRIPE_WEBHOOK_SECRET não está configurado!`);
            return res.status(400).send('Webhook Error: webhookSecret not configured');
        }
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        const bodyPreview = Buffer.isBuffer(req.rawBody)
            ? req.rawBody.toString('utf8').substring(0, 100)
            : req.rawBody?.substring?.(0, 100) || 'N/A';
        logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        logger.error(`⚠️ Primeiros 100 chars do rawBody: ${bodyPreview}`);
        logger.error(`⚠️ Webhook Secret (primeiros 15 chars): ${webhookSecret?.substring(0, 15)}...`);
        logger.error(`⚠️ Content-Length: ${req.headers['content-length']}, rawBody.length: ${req.rawBody?.length}`);
        logger.error(`⚠️ rawBody é Buffer: ${Buffer.isBuffer(req.rawBody)}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info(`📦 Stripe Webhook recebido: ${event.type}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            default:
                logger.info(`Evento Stripe não tratado: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        logger.error(error, 'Erro ao processar webhook Stripe:');
        res.status(500).json({ error: 'Erro interno ao processar webhook' });
    }
};

/**
 * Processa checkout completo - cria/atualiza usuário e libera acesso
 */
const handleCheckoutCompleted = async (session) => {
    const email = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const metadata = session.metadata || {};

    if (!email) {
        logger.error('❌ Webhook Stripe: Email não encontrado no checkout');
        return;
    }

    logger.info(`✅ Checkout completo para ${email}`);

    try {
        // Buscar detalhes da assinatura
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        // Verificar se usuário já existe
        let user = await prisma.user.findUnique({
            where: { email },
        });

        let token = null;
        let isNewUser = false;

        if (!user) {
            // Novo usuário - criar com status pending
            const name = session.customer_details?.name || '';
            logger.info(`👤 Criando novo usuário para ${email}`);
            token = await authService.createPendingUser(email, name);
            isNewUser = true;

            user = await prisma.user.findUnique({
                where: { email },
            });
        }

        // Determinar role e plano
        const role = determineRoleFromMetadata(metadata);
        const plan = determinePlanFromMetadata(metadata);

        // Atualizar usuário com dados da assinatura
        await prisma.user.update({
            where: { id: user.id },
            data: {
                role,
                plan,
                subscriptionStatus: 'active',
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                displayName: session.customer_details?.name || user.displayName,
            },
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
        logger.error(error, `❌ Erro ao processar checkout para ${email}:`);
        throw error;
    }
};

/**
 * Processa pagamento de fatura (renovação de assinatura)
 */
const handleInvoicePaid = async (invoice) => {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        // Fatura avulsa, não é assinatura
        return;
    }

    logger.info(`💰 Fatura paga - Customer: ${customerId}`);

    try {
        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: 'active',
                    updatedAt: new Date(),
                },
            });
            logger.info(`✅ Assinatura renovada para ${user.email}`);
        }
    } catch (error) {
        logger.error(error, `❌ Erro ao processar pagamento de fatura:`);
    }
};

/**
 * Processa falha de pagamento
 */
const handlePaymentFailed = async (invoice) => {
    const customerId = invoice.customer;

    logger.warn(`⚠️ Pagamento falhou - Customer: ${customerId}`);

    try {
        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: 'past_due',
                },
            });
            logger.info(`⚠️ Status atualizado para past_due: ${user.email}`);
        }
    } catch (error) {
        logger.error(error, `❌ Erro ao processar falha de pagamento:`);
    }
};

/**
 * Processa atualização de assinatura (upgrade/downgrade)
 */
const handleSubscriptionUpdated = async (subscription) => {
    const customerId = subscription.customer;
    const status = subscription.status;
    const priceId = subscription.items.data[0]?.price?.id;

    logger.info(`🔄 Assinatura atualizada - Customer: ${customerId}, Status: ${status}`);

    try {
        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (user) {
            const updateData = {
                subscriptionStatus: mapStripeStatus(status),
                stripePriceId: priceId,
                updatedAt: new Date(),
            };

            // Se cancelada/expirada, fazer downgrade
            if (['canceled', 'unpaid', 'past_due'].includes(status)) {
                updateData.role = 'basic';
            }

            await prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            logger.info(`✅ Assinatura atualizada para ${user.email}: ${status}`);
        }
    } catch (error) {
        logger.error(error, `❌ Erro ao atualizar assinatura:`);
    }
};

/**
 * Processa cancelamento de assinatura
 */
const handleSubscriptionDeleted = async (subscription) => {
    const customerId = subscription.customer;

    logger.info(`❌ Assinatura cancelada - Customer: ${customerId}`);

    try {
        const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subscriptionStatus: 'canceled',
                    role: 'basic',
                },
            });
            logger.info(`✅ Acesso revogado para ${user.email}`);
        }
    } catch (error) {
        logger.error(error, `❌ Erro ao processar cancelamento:`);
    }
};

/**
 * Mapeia status do Stripe para status interno
 */
const mapStripeStatus = (stripeStatus) => {
    const statusMap = {
        active: 'active',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'expired',
        incomplete: 'pending',
        incomplete_expired: 'expired',
        trialing: 'trialing',
    };
    return statusMap[stripeStatus] || stripeStatus;
};

/**
 * Determina role baseado nos metadados do checkout
 */
const determineRoleFromMetadata = (metadata) => {
    const planType = (metadata.planType || '').toLowerCase();
    if (planType === 'enterprise') return 'enterprise';
    if (planType === 'pro' || planType === 'premium') return 'pro';
    return 'pro'; // Default para compras
};

/**
 * Determina plano baseado nos metadados do checkout
 */
const determinePlanFromMetadata = (metadata) => {
    const planType = (metadata.planType || 'pro').toLowerCase();
    const period = (metadata.period || 'monthly').toLowerCase();
    return `${planType}_${period}`;
};

export default {
    createCheckoutSession,
    createPortalSession,
    listPrices,
    handleWebhook,
};
