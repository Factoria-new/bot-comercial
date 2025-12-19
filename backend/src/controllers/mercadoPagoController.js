import { MercadoPagoConfig, Preference } from 'mercadopago';
import logger from '../config/logger.js';
import dotenv from 'dotenv';
import { db } from '../config/firebase.js';
import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';

dotenv.config();

// Move client init inside to ensure we catch env changes if any (though usually static)
// const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const createPreference = async (req, res) => {
    try {
        const { email, plan, period, price, title } = req.body;

        console.log('--- START MERCADO PAGO PREFERENCE ---');
        console.log('Email:', email);
        console.log('Plan:', plan);
        console.log('Period:', period);
        console.log('Raw Price:', price);

        if (!email || !plan || !period || !price) {
            console.log('Missing fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        console.log('Access Token Length:', accessToken ? accessToken.length : 'MISSING');

        const client = new MercadoPagoConfig({ accessToken: accessToken });

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

        // Sanitize price
        let unitPrice = 10;
        try {
            unitPrice = parseFloat(price.replace('R$', '').replace(',', '.').trim());
            if (isNaN(unitPrice)) unitPrice = 10;
        } catch (e) {
            console.log('Error parsing price, defaulting to 10');
        }
        console.log('Parsed Unit Price:', unitPrice);

        const preferenceBody = {
            items: [
                {
                    id: `${plan}_${period}`,
                    title: title || `Plano ${plan} - ${period}`,
                    quantity: 1,
                    unit_price: unitPrice,
                }
            ],
            payer: {
                email: email
            },
            back_urls: {
                success: `${frontendUrl}/check-email`,
                failure: `${frontendUrl}/payment?status=failure`,
                pending: `${frontendUrl}/payment?status=pending`
            },
            // auto_return: 'approved', // Commented out: MP API returning error "back_url.success must be defined" likely due to HTTP localhost
            metadata: {
                plan,
                period,
                user_email: email
            }
        };

        console.log('Preference Payload:', JSON.stringify(preferenceBody, null, 2));

        const preference = new Preference(client);

        const result = await preference.create({
            body: preferenceBody
        });

        console.log('Preference Created Success:', result.id);
        res.json({ init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });

    } catch (error) {
        console.error('!!! ERROR CREATING PREFERENCE !!!');
        console.error('Error Object:', error);
        console.error('Type of Error:', typeof error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            // @ts-ignore
            if (error.cause) console.error('Cause:', JSON.stringify(error.cause, null, 2));
        }
        // Mercado Pago specific
        if (error && error.response) {
            console.error('MP Response Data:', JSON.stringify(error.response.data || {}, null, 2));
        }

        res.status(500).json({ error: 'Failed to create preference', details: error ? error.toString() : 'Unknown Error' });
    }
};

export const handleWebhook = async (req, res) => {
    try {
        const { query } = req;
        const topic = query.topic || query.type;

        // Mercado Pago sends 'payment' via topic or type
        if (topic === 'payment') {
            const paymentId = query.id || query['data.id'];

            // Here you would normally fetch the payment details from MP to verify status
            // For now, let's log it. In a real implementation you MUST fetch the payment
            // to verify it's 'approved' before granting access to prevent spoofing.

            // Note: Efficient implementation would verify signature if provided or fetch from API
            // const payment = await new Payment(client).get({ id: paymentId });
            // if (payment.status === 'approved') ...

            logger.info(`Mercado Pago Payment received: ${paymentId}`);

            // To properly update user, we need to fetch the payment to get the Metadata
            // associated with the preference.
            // CAUTION: MP Webhooks for 'payment' might trigger multiple times.

            // For MVP/Test, we might just log "Received" but to actually update user:
            // We need to implement the fetch logic.

            // Let's try to fetch payment info details:
            try {
                // Using dynamic import or internal fetch because headers might differ?
                // Actually the SDK has Payment class.
                // const payment = await new Payment(client).get({ id: paymentId });
                // const metadata = payment.metadata;
                // handleCheckoutCompleted(metadata, payment.payer.email);
            } catch (err) {
                logger.error('Error fetching payment details', err);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        logger.error('Error handling Mercado Pago webhook:', error);
        res.sendStatus(500);
    }
};

// Reusing logic from stripeController (simplified)
const handleCheckoutCompleted = async (metadata, payerEmail) => {
    // Logic similar to stripeController...
    // Currently disabled until we fully implement payment fetching
};

export default {
    createPreference,
    handleWebhook
};
