import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authMiddleware, authController.logoutAll);

router.post("/2fa/setup", authMiddleware, authController.setupTwoFactor);
router.post("/2fa/confirm", authMiddleware, authController.confirmTwoFactor);
router.post("/2fa/verify", authController.verifyTwoFactor);
router.delete("/2fa", authMiddleware, authController.disableTwoFactor);

router.post("/google", authController.loginWithGoogle);

router.post("/password-reset/request", authController.requestPasswordReset);
router.post("/password-reset/confirm", authController.resetPassword);

router.post("/email/resend", authMiddleware, authController.resendVerificationEmail);
router.get("/email/verify", authController.verifyEmail);

export default router;
