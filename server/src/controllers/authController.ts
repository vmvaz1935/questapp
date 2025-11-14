import { Request, Response } from "express";
import { authService } from "../services/authService";
import {
  confirmTwoFactorSchema,
  googleLoginSchema,
  loginSchema,
  logoutSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshSchema,
  registerSchema,
  twoFactorTokenSchema,
} from "../schemas/auth";
import { AuthRequest } from "../middleware/auth";
import { logger } from "../config/logger";

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data.email, data.password, data.name);

      logger.info({ professionalId: result.professional.id }, "Registro concluído");

      return res.status(201).json(result);
    } catch (error) {
      logger.error({ err: error }, "Erro no registro");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");

      const result = await authService.login(data.email, data.password, ipAddress, userAgent);

      const professionalId =
        "professional" in result
          ? result.professional.id
          : result.professionalId ?? "2fa-pending";

      logger.info({ professionalId }, "Login processado");

      return res.json(result);
    } catch (error) {
      logger.warn({ err: error }, "Erro no login");
      return res.status(401).json({ error: (error as Error).message });
    }
  },

  setupTwoFactor: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const result = await authService.setupTwoFactor(req.user.id);
      return res.json(result);
    } catch (error) {
      logger.warn({ err: error }, "Erro ao iniciar 2FA");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  confirmTwoFactor: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const { secret, token } = confirmTwoFactorSchema.parse(req.body);
      const result = await authService.confirmTwoFactor(req.user.id, secret, token);

      return res.json(result);
    } catch (error) {
      logger.warn({ err: error }, "Erro ao confirmar 2FA");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  verifyTwoFactor: async (req: Request, res: Response) => {
    try {
      const data = twoFactorTokenSchema.parse(req.body);
      let professionalId = data.professionalId;

      const authHeader = req.headers.authorization;
      if (!professionalId && authHeader?.startsWith("Bearer ")) {
        const tempToken = authHeader.substring("Bearer ".length);
        const payload = await authService.validateTwoFactorTempToken(tempToken);
        professionalId = payload.sub;
      }

      if (!professionalId) {
        return res.status(400).json({ error: "Identificador do profissional ausente" });
      }

      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");

      const result = await authService.verifyTwoFactor({
        professionalId,
        token: data.token,
        ipAddress,
        userAgent,
      });

      return res.json(result);
    } catch (error) {
      logger.warn({ err: error }, "Erro ao verificar 2FA");
      return res.status(401).json({ error: (error as Error).message });
    }
  },

  disableTwoFactor: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      await authService.disableTwoFactor(req.user.id);
      return res.json({ message: "2FA desativado" });
    } catch (error) {
      logger.warn({ err: error }, "Erro ao desativar 2FA");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  loginWithGoogle: async (req: Request, res: Response) => {
    try {
      const { token } = googleLoginSchema.parse(req.body);
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");

      const result = await authService.loginWithGoogle(token, ipAddress, userAgent);

      return res.json(result);
    } catch (error) {
      logger.warn({ err: error }, "Erro no login com Google");
      return res.status(401).json({ error: (error as Error).message });
    }
  },

  requestPasswordReset: async (req: Request, res: Response) => {
    try {
      const { email } = passwordResetRequestSchema.parse(req.body);
      await authService.requestPasswordReset(email);

      return res.json({ message: "Se o email existir, enviaremos instruções." });
    } catch (error) {
      logger.warn({ err: error }, "Erro ao solicitar reset de senha");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, password } = passwordResetSchema.parse(req.body);
      await authService.resetPassword(token, password);

      return res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      logger.warn({ err: error }, "Erro ao redefinir senha");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  refresh: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await authService.refreshAccessToken(refreshToken);

      return res.json(result);
    } catch (error) {
      logger.warn({ err: error }, "Erro ao renovar token");
      return res.status(401).json({ error: (error as Error).message });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = logoutSchema.parse(req.body);
      await authService.logout(refreshToken);

      return res.json({ message: "Logout efetuado" });
    } catch (error) {
      logger.warn({ err: error }, "Erro no logout");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  logoutAll: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      await authService.logoutAll(req.user.id);

      return res.json({ message: "Sessões encerradas" });
    } catch (error) {
      logger.warn({ err: error }, "Erro ao encerrar todas as sessões");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  resendVerificationEmail: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      await authService.sendVerificationEmail(req.user.id);
      return res.json({ message: "Email de verificação enviado" });
    } catch (error) {
      logger.warn({ err: error }, "Erro ao reenviar verificação");
      return res.status(400).json({ error: (error as Error).message });
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (typeof token !== "string") {
        return res.status(400).json({ error: "Token inválido" });
      }

      await authService.verifyEmail(token);

      return res.json({ message: "Email verificado com sucesso" });
    } catch (error) {
      logger.warn({ err: error }, "Erro ao verificar email");
      return res.status(400).json({ error: (error as Error).message });
    }
  },
};
