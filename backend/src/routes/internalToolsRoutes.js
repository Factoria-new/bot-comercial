import express from 'express';
import { sendMessageToUser } from '../services/whatsappService.js';
import logger from '../config/logger.js';

const router = express.Router();

// POST /whatsapp/send-text
// Called by Python AI Engine to send messages
router.post('/whatsapp/send-text', async (req, res) => {
    try {
        const { userId, phoneNumber, message } = req.body;

        if (!userId || !phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, phoneNumber, message'
            });
        }

        // userId here maps to sessionId in our system
        await sendMessageToUser(userId, phoneNumber, message);

        logger.info(`Message sent via internal tool to ${phoneNumber} (Session: ${userId})`);

        res.json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        logger.error(`Error sending message via internal tool: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send message'
        });
    }
});

export default router;
