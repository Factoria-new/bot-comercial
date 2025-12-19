import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/set-password', authController.setPassword);
router.post('/verify-token', authController.verifyToken);

// This endpoint matches what the user would expect from a "purchase" event conceptually
// Ideally protected or internal. For now, public but undocumented for dev testing.
router.post('/register-pending', authController.createPendingUser);

export default router;
