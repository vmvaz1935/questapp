import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { validate } from '../middleware/validator.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';
import type { AuthRequest } from '../middleware/auth.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.googleAuth(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

// Exportar rotas
export const authRoutes = {
  register: [validate(registerSchema), new AuthController().register.bind(new AuthController())],
  login: [validate(loginSchema), new AuthController().login.bind(new AuthController())],
  googleAuth: [validate(googleAuthSchema), new AuthController().googleAuth.bind(new AuthController())],
  refreshToken: [validate(refreshTokenSchema), new AuthController().refreshToken.bind(new AuthController())],
  logout: [new AuthController().logout.bind(new AuthController())],
};

