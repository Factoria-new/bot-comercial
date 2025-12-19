import Stripe from 'stripe';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
import { db } from '../config/firebase.js';
import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map Plans to Stripe Price IDs
const PRICE_IDS = {
    'pro_monthly': 'price_1SflK7D2uFpx6YCVfbOwkN9d',
    'pro_semiannual': 'price_1SflLPD2uFpx6YCV48vF4UtC',
    'pro_annual': 'price_1SflMRD2uFpx6YCVtiHbZj4Z',
};

export const createCheckoutSession = async (req, res) => {
    try {
        const { email, plan, period } = req.body;

        if (!email || !plan || !period) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Determinar chave do Price ID
        const priceKey = `${plan}_${period}`;
        const priceId = PRICE_IDS[priceKey];

        if (!priceId) {
            logger.warn(`Price ID not found for plan: ${priceKey}`);
            return res.status(400).json({ error: 'Invalid plan configuration' });
        }

        logger.info(`Creating checkout session for ${email} - Plan: ${priceKey}`);

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            customer_email: email,
            success_url: `${frontendUrl}/check-email?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/payment?canceled=true`,
            metadata: {
                plan,
                period,
                user_email: email
            }
        });

        res.json({ url: session.url });

    } catch (error) {
        logger.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
};

export const handleWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        logger.info(`Checkout session completed! Session ID: ${session.id}`);
        await handleCheckoutCompleted(session);
    }

    res.json({ received: true });
};

// Lógica de criação de usuário
const handleCheckoutCompleted = async (session) => {
    const email = session.customer_email || session.metadata.user_email;
    const name = session.customer_details?.name || session.custom_fields?.[0]?.text?.value || '';
    const plan = session.metadata.plan;
    const period = session.metadata.period;

    if (!email) {
        logger.error('No email found in session metadata or customer details');
        return;
    }

    logger.info(`Processing new subscription for email: ${email} - Name: ${name} - Plan: ${plan}`);

    try {
        let userId;
        let token;

        // 1. Verificar se usuário já existe no Firestore
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            // New User
            logger.info(`Creating new pending user for ${email}`);
            // Pass name to createPendingUser
            token = await authService.createPendingUser(email, name);

            // Get the ID of the newly created user to update Plan BEFORE sending email
            const newSnap = await usersRef.where('email', '==', email).limit(1).get();
            userId = newSnap.docs[0].id;
        } else {
            // Existing User
            userId = snapshot.docs[0].id;
            logger.info(`Updating existing user: ${userId}`);

            // Update Name if missing and provided
            if (name && !snapshot.docs[0].data().displayName) {
                await usersRef.doc(userId).update({ displayName: name });
            }
        }

        // 2. Atualizar detalhes da assinatura no Firestore (Role PRO)
        // Isso garante que quando o usuário clicar no link, o Role já esteja correto.
        const subscriptionData = {
            role: plan === 'pro' || plan === 'Pro_Mensal' || plan === 'Pro_Semestral' || plan === 'Pro_Anual' ? 'pro' : 'basic',
            plan: plan,
            period: period,
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer,
            updatedAt: new Date().toISOString()
        };

        if (name) {
            subscriptionData.displayName = name;
        }

        await db.collection('users').doc(userId).set(subscriptionData, { merge: true });
        logger.info(`User ${userId} updated successfully with plan ${plan} (Role: ${subscriptionData.role})`);

        // 3. Enviar Email de Ativação (APÓS garantir que o Role está salvo)
        // Apenas enviamos se tivermos um token (novo usuário). 
        // Se for usuário existente, talvez não precisemos enviar o link de set-password, 
        // ou talvez devêssemos enviar um "Welcome Back" ou notificação.
        // O fluxo atual enviava apenas para novos criações no createPendingUser?
        // Ah, createPendingUser retorna token apenas se criou? Não, ele gera token sempre na minha implementação do passo 91?
        // Vamos checar authService.createPendingUser

        // Se createPendingUser foi chamado, temos Token.
        if (token) {
            await emailService.sendActivationEmail(email, token);
            logger.info(`Activation email sent to ${email}`);
        } else {
            // Se usuário já existia, talvez queiramos enviar email se ele ainda estiver pendente?
            // Mas aqui assumimos fluxo de nova compra. Se já existe, apenas atualizamos o plano.
            logger.info(`Activation email skipped for existing user ${email}`);
        }

    } catch (error) {
        logger.error(`Error handling checkout completion for ${email}:`, error);
        throw error;
    }
};

export default {
    createCheckoutSession,
    handleWebhook
};
