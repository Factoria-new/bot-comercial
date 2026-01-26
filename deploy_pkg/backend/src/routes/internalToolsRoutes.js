import express from 'express';
import { sendMessageToUser } from '../services/whatsappService.js';
import { sendDM, addToHistory } from '../services/instagramService.js';
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

// POST /instagram/send-dm
// Called by Python AI Engine to send Instagram DMs
router.post('/instagram/send-dm', async (req, res) => {
    try {
        const { userId, recipientId, message } = req.body;

        if (!userId || !recipientId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, recipientId, message'
            });
        }

        const result = await sendDM(userId, recipientId, message);

        if (result.success) {
            // Update conversation history
            addToHistory(userId, recipientId, message);
            logger.info(`Instagram DM sent to ${recipientId} (User: ${userId})`);
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        logger.error(`Error sending Instagram DM: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /whatsapp/send-audio
// Called by Python AI Engine to send AUDIO messages (TTS)
router.post('/whatsapp/send-audio', async (req, res) => {
    try {
        const { userId, phoneNumber, message } = req.body;

        if (!userId || !phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, phoneNumber, message'
            });
        }

        // Call sendMessageToUser with forceAudio option
        await sendMessageToUser(userId, phoneNumber, message, 'text', { forceAudio: true });

        logger.info(`Audio message (TTS) sent via internal tool to ${phoneNumber} (Session: ${userId})`);

        res.json({
            success: true,
            message: 'Audio message sent successfully'
        });
    } catch (error) {
        logger.error(`Error sending audio via internal tool: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send audio'
        });
    }
});

export default router;
