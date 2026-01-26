import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Lazy load transporter to ensure env vars are loaded
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
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
            from: '"Suporte CajiAssist" <support@cajiassist.com>',
            to: email,
            subject: 'Ative sua conta Caji',
            html: `
        <h1>Bem-vindo ao Caji!</h1>
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

// Send Reset Password Email
export const sendPasswordResetEmail = async (email, token) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${frontendUrl}/setup-password?token=${token}`;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        logger.info(`[EmailService] SMTP not configured. Reset Link for ${email}: ${resetLink}`);
        return;
    }

    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: '"Suporte CajiAssist" <support@cajiassist.com>',
            to: email,
            subject: 'Redefinição de Senha - Caji',
            html: `
        <h1>Redefinição de Senha</h1>
        <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}">Redefinir Senha</a>
        <p>Se você não solicitou isso, apenas ignore este email.</p>
      `,
        });
        logger.info(`[EmailService] Reset email sent to ${email}`);
    } catch (error) {
        logger.error(`[EmailService] Error sending reset email to ${email}:`, error);
        logger.info(`[EmailService] (Fallback) Reset Link for ${email}: ${resetLink}`);
        throw error;
    }
};
