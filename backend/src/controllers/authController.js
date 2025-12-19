import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';
import logger from '../config/logger.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }

        const { token, user } = await authService.login(email, password);
        res.json({ success: true, token, user });
    } catch (error) {
        logger.warn(`Login failed for ${req.body.email}: ${error.message}`);
        res.status(401).json({ success: false, error: error.message });
    }
};

export const setPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, error: 'Token and password required' });
        }

        const sessionToken = await authService.setPassword(token, password);
        res.json({ success: true, token: sessionToken });
    } catch (error) {
        logger.error(`Set password error: ${error.message}`);
        res.status(400).json({ success: false, error: error.message });
    }
};

// Internal/Admin endpoint (e.g., called by Stripe webhook)
// For manual testing, we might expose this protected or public dev-only
export const createPendingUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const token = await authService.createPendingUser(email);
        await emailService.sendActivationEmail(email, token);

        res.json({ success: true, message: 'Activation email sent' });
    } catch (error) {
        logger.error(`Error creating pending user: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
}

export const verifyToken = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = await authService.verifyToken(token);
        res.json({ success: true, decoded });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
