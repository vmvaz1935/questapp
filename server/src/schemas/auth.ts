import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const googleLoginSchema = z.object({
  token: z.string().min(1, 'Token do Google é obrigatório'),
});

export const twoFactorVerifySchema = z.object({
  professionalId: z.string().min(1, 'ID do profissional é obrigatório'),
  token: z.string().length(6, 'Código 2FA deve ter 6 dígitos'),
});

export const twoFactorConfirmSchema = z.object({
  secret: z.string().min(1, 'Secret é obrigatório'),
  token: z.string().length(6, 'Código 2FA deve ter 6 dígitos'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

