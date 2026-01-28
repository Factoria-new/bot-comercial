
import prisma from '../config/prisma.js';
import { encrypt, decrypt } from '../utils/encryption.js';

import { generateSessionToken } from '../services/authService.js';

/**
 * Get the user's decrypted API Key
 * Multi-tenancy: Each user gets their own key from the database
 */
export const getApiKey = async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id || req.user?.userId;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Invalid token payload' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { geminiApiKey: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (!user.geminiApiKey) {
            return res.json({ success: true, apiKey: null });
        }

        // Decrypt the stored key
        const decryptedKey = decrypt(user.geminiApiKey);

        res.json({ success: true, apiKey: decryptedKey });
    } catch (error) {
        console.error('Get API Key error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch API Key' });
    }
};

export const updateApiKey = async (req, res) => {
    try {
        const userId = req.user?.uid || req.user?.id || req.user?.userId;
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API Key is required' });
        }

        const encryptedKey = encrypt(apiKey);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { geminiApiKey: encryptedKey }
        });

        // Generate new token with updated hasGeminiApiKey status
        const newToken = generateSessionToken({ ...updatedUser, geminiApiKey: encryptedKey });

        // Prepare safe user object
        const userResponse = {
            uid: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            displayName: updatedUser.displayName,
            hasGeminiApiKey: true
        };

        res.json({
            success: true,
            message: 'API Key saved successfully',
            token: newToken,
            user: userResponse
        });
    } catch (error) {
        console.error('Update API Key error:', error);
        res.status(500).json({ success: false, error: 'Failed to save API Key' });
    }
};

export const getProfile = async (req, res) => {
    try {
        console.log('🔍 [getProfile] Called. Headers:', req.headers.authorization ? 'Auth Present' : 'No Auth');
        console.log('🔍 [getProfile] req.user:', JSON.stringify(req.user, null, 2));

        const userId = req.user?.uid || req.user?.id || req.user?.userId;
        console.log('🔍 [getProfile] Extracted userId:', userId);

        if (!userId) {
            console.error('❌ [getProfile] No userId found in token');
            return res.status(400).json({ success: false, error: 'Invalid token payload' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                geminiApiKey: true,
            }
        });

        if (!user) {
            console.error('❌ [getProfile] User not found in DB for ID:', userId);
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log('✅ [getProfile] User found. Has API Key?', !!user.geminiApiKey);

        const hasGeminiApiKey = !!user.geminiApiKey;
        delete user.geminiApiKey;

        res.json({ success: true, user: { ...user, hasGeminiApiKey } });
    } catch (error) {
        console.error('❌ [getProfile] Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};
