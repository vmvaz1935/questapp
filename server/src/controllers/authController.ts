import { Request, Response } from 'express';
import { authService } from '../services/authService';
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  twoFactorVerifySchema,
  twoFactorConfirmSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../schemas/auth';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data.email, data.password, data.name);

      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message || 'Erro ao registrar' });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(data.email, data.password, ipAddress, userAgent);

      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(401).json({ error: error.message || 'Erro ao fazer login' });
    }
  },

  setupTwoFactor: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const result = await authService.setupTwoFactor(req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao configurar 2FA' });
    }
  },

  confirmTwoFactor: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = twoFactorConfirmSchema.parse(req.body);
      const result = await authService.confirmTwoFactor(req.user.id, data.secret, data.token);

      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message || 'Erro ao confirmar 2FA' });
    }
  },

  verifyTwoFactor: async (req: Request, res: Response) => {
    try {
      const data = twoFactorVerifySchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.verifyTwoFactor(
        data.professionalId,
        data.token,
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(401).json({ error: error.message || 'Erro ao verificar 2FA' });
    }
  },

  disableTwoFactor: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      await authService.disableTwoFactor(req.user.id);
      res.json({ message: '2FA desativado com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao desativar 2FA' });
    }
  },

  loginWithGoogle: async (req: Request, res: Response) => {
    try {
      const data = googleLoginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.loginWithGoogle(data.token, ipAddress, userAgent);

      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(401).json({ error: error.message || 'Erro ao fazer login com Google' });
    }
  },

  sendVerificationEmail: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      await authService.sendVerificationEmail(req.user.id);
      res.json({ message: 'Email de verificação enviado' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao enviar email' });
    }
  },

  verifyEmail: async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      await authService.verifyEmail(token);
      res.json({ message: 'Email verificado com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao verificar email' });
    }
  },

  requestPasswordReset: async (req: Request, res: Response) => {
    try {
      const data = passwordResetRequestSchema.parse(req.body);
      await authService.requestPasswordReset(data.email);

      // Sempre retornar sucesso (não revelar se email existe)
      res.json({ message: 'Se o email existir, você receberá um link de reset' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message || 'Erro ao solicitar reset de senha' });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const data = passwordResetSchema.parse(req.body);
      await authService.resetPassword(data.token, data.password);

      res.json({ message: 'Senha resetada com sucesso' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message || 'Erro ao resetar senha' });
    }
  },

  refresh: async (req: Request, res: Response) => {
    try {
      const data = refreshTokenSchema.parse(req.body);
      const result = await authService.refreshAccessToken(data.refreshToken);

      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(401).json({ error: error.message || 'Erro ao renovar token' });
    }
  },

  logout: async (req: Request, res: Response) => {
    try {
      const data = logoutSchema.parse(req.body);
      await authService.logout(data.refreshToken);

      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message || 'Erro ao fazer logout' });
    }
  },

  logoutAll: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      await authService.logoutAll(req.user.id);
      res.json({ message: 'Logout de todos os dispositivos realizado com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao fazer logout' });
    }
  },
};

