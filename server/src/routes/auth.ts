import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { authController } from '../controllers/authController';

const router = Router();

// Registro e Login
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// 2FA
router.post('/2fa/setup', authMiddleware, authController.setupTwoFactor);
router.post('/2fa/confirm', authMiddleware, authController.confirmTwoFactor);
router.post('/2fa/verify', authController.verifyTwoFactor);
router.delete('/2fa', authMiddleware, authController.disableTwoFactor);

// Google OAuth
router.post('/google', authController.loginWithGoogle);

// Email Verification
router.post('/verify-email/send', authMiddleware, authController.sendVerificationEmail);
router.get('/verify-email', authController.verifyEmail);

// Password Reset
router.post('/password-reset/request', authController.requestPasswordReset);
router.post('/password-reset/confirm', authController.resetPassword);

// Logout
router.post('/logout-all', authMiddleware, authController.logoutAll);

export default router;

