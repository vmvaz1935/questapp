import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "A senha deve conter letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter número"),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const twoFactorTokenSchema = z.object({
  professionalId: z.string().cuid().optional(),
  token: z.string().min(6).max(10),
});

export const confirmTwoFactorSchema = z.object({
  secret: z.string().min(16),
  token: z.string().min(6).max(10),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "A senha deve conter letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter número"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});

export const googleLoginSchema = z.object({
  token: z.string().min(10),
});
