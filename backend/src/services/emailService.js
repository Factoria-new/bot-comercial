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

// Base email template wrapper
const getEmailWrapper = (content) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caji Assist</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23; color: #ffffff;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 30px 40px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0;">
                            <div style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -1px;">
                                CAJ<span style="color: #00A947;">IA</span>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #8b8b9a; font-size: 13px;">Seu assistente inteligente de WhatsApp</p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="background-color: #1a1a2e; padding: 40px; border-left: 1px solid #2a2a4a; border-right: 1px solid #2a2a4a;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #12122a; padding: 30px 40px; border-radius: 0 0 16px 16px; border: 1px solid #2a2a4a; border-top: none;">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 12px 0; color: #6b6b7b; font-size: 12px;">
                                            © 2025 Caji Solutions. Todos os direitos reservados.
                                        </p>
                                        <p style="margin: 0; color: #4a4a5a; font-size: 11px;">
                                            Este é um email automático, por favor não responda diretamente.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Styled button component
const getButton = (href, text) => `
<table role="presentation" style="width: 100%; margin: 30px 0;">
    <tr>
        <td align="center">
            <a href="${href}" target="_blank" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #00A947 0%, #00873a 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 169, 71, 0.3);">
                ${text}
            </a>
        </td>
    </tr>
</table>
`;

export const sendActivationEmail = async (email, token) => {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://cajiassist.com').replace(/\/$/, '');
    const activationLink = `${frontendUrl}/setup-password?token=${token}`;

    // If no SMTP config, log to console for dev
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        logger.info(`[EmailService] SMTP not configured. Activation Link for ${email}: ${activationLink}`);
        return;
    }

    const content = `
        <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #ffffff; text-align: center;">
            🎉 Bem-vindo ao Caji!
        </h1>
        
        <p style="margin: 0 0 20px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6; text-align: center;">
            Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.
        </p>
        
        <div style="background: linear-gradient(135deg, #2a2a4a 0%, #1f1f3a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #3a3a5a;">
            <p style="margin: 0; color: #a0a0b0; font-size: 14px; text-align: center;">
                Para começar a usar sua assistente virtual Lia, você precisa definir uma senha de acesso.
            </p>
        </div>
        
        ${getButton(activationLink, '✨ Definir Minha Senha')}
        
        <table role="presentation" style="width: 100%; margin-top: 30px; border-top: 1px solid #2a2a4a; padding-top: 20px;">
            <tr>
                <td style="text-align: center;">
                    <p style="margin: 0; color: #6b6b7b; font-size: 12px;">
                        Se você não criou uma conta no Caji, pode ignorar este email com segurança.
                    </p>
                </td>
            </tr>
        </table>
    `;

    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: '"Suporte CajiAssist" <support@cajiassist.com>',
            to: email,
            subject: '🚀 Ative sua conta Caji',
            html: getEmailWrapper(content),
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

    const content = `
        <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #ffffff; text-align: center;">
            🔐 Redefinição de Senha
        </h1>
        
        <p style="margin: 0 0 20px 0; color: #c0c0d0; font-size: 16px; line-height: 1.6; text-align: center;">
            Recebemos uma solicitação para redefinir a senha da sua conta Caji.
        </p>
        
        <div style="background: linear-gradient(135deg, #2a2a4a 0%, #1f1f3a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #3a3a5a;">
            <p style="margin: 0; color: #a0a0b0; font-size: 14px; text-align: center;">
                Clique no botão abaixo para criar uma nova senha. Este link expira em <strong style="color: #00A947;">1 hora</strong>.
            </p>
        </div>
        
        ${getButton(resetLink, '🔑 Redefinir Minha Senha')}
        
        <table role="presentation" style="width: 100%; margin-top: 30px; border-top: 1px solid #2a2a4a; padding-top: 20px;">
            <tr>
                <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #6b6b7b; font-size: 12px;">
                        Se você não solicitou esta redefinição, ignore este email.
                    </p>
                    <p style="margin: 0; color: #5a5a6a; font-size: 11px;">
                        Sua senha atual permanecerá inalterada.
                    </p>
                </td>
            </tr>
        </table>
    `;

    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: '"Suporte CajiAssist" <support@cajiassist.com>',
            to: email,
            subject: '🔐 Redefinição de Senha - Caji',
            html: getEmailWrapper(content),
        });
        logger.info(`[EmailService] Reset email sent to ${email}`);
    } catch (error) {
        logger.error(`[EmailService] Error sending reset email to ${email}:`, error);
        logger.info(`[EmailService] (Fallback) Reset Link for ${email}: ${resetLink}`);
        throw error;
    }
};

