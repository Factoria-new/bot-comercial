import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Lazy load transporter to ensure env vars are loaded
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

export const sendActivationEmail = async (email, token) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const activationLink = `${frontendUrl}/setup-password?token=${token}`;

    // If no SMTP config, log to console for dev
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        logger.info(`[EmailService] SMTP not configured. Activation Link for ${email}: ${activationLink}`);
        return;
    }

    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: '"Factoria Bot" <noreply@factoria.com>',
            to: email,
            subject: 'Ative sua conta Factoria',
            html: `
        <h1>Bem-vindo ao Factoria!</h1>
        <p>Para ativar sua conta e definir sua senha, clique no link abaixo:</p>
        <a href="${activationLink}">Definir Senha</a>
        <p>Se você não solicitou este email, apenas ignore.</p>
      `,
        });
        logger.info(`[EmailService] Activation email sent to ${email}`);
    } catch (error) {
        logger.error(`[EmailService] Error sending email to ${email}:`, error);
        // Fallback log for dev
        logger.info(`[EmailService] (Fallback) Activation Link for ${email}: ${activationLink}`);
        throw error;
    }
};
