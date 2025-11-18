import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  id: string;
  email: string;
  twoFactorPending?: boolean;
}

export function generateAccessToken(
  id: string,
  email: string,
  options?: { expiresIn?: string; twoFactorPending?: boolean }
): string {
  const payload: JWTPayload = {
    id,
    email,
    twoFactorPending: options?.twoFactorPending,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: options?.expiresIn || env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function generateRefreshToken(id: string): string {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

