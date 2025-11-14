import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  EMAIL_VERIFICATION_TOKEN_EXPIRATION_MINUTES: z
    .coerce.number()
    .int()
    .positive()
    .default(60),
  RESET_TOKEN_EXPIRATION_MINUTES: z.coerce.number().int().positive().default(60),
  LOCK_TIME_MINUTES: z.coerce.number().int().positive().default(15),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  FRONTEND_URL: z.string().url("FRONTEND_URL deve ser uma URL válida"),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_FROM_EMAIL: z.string().email(),
  GOOGLE_CLIENT_ID: z.string(),
  TWO_FACTOR_ENCRYPTION_KEY: z
    .string()
    .min(32, "TWO_FACTOR_ENCRYPTION_KEY deve ter pelo menos 32 caracteres")
    .max(32, "TWO_FACTOR_ENCRYPTION_KEY deve ter exatamente 32 caracteres"),
});

export const env = envSchema.parse(process.env);
