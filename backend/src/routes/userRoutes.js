
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/apikey', authenticateToken, userController.getApiKey);
router.put('/apikey', authenticateToken, userController.updateApiKey);
router.get('/me', authenticateToken, userController.getProfile);

export default router;
