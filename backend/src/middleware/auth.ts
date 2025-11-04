import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export interface AuthRequest extends Request {
  professionalId?: string;
  email?: string;
  planType?: string;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const payload = verifyToken(token);
    req.professionalId = payload.professionalId;
    req.email = payload.email;
    req.planType = payload.planType;

    next();
  } catch (error: any) {
    logger.error('Erro de autenticação:', error);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

