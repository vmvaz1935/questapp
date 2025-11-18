import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const payload = verifyToken(token);

    // Verificar se é um token pendente de 2FA
    if (payload.twoFactorPending) {
      return res.status(401).json({ error: '2FA necessário' });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

