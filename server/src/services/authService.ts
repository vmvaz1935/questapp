import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { comparePasswords, hashPassword } from "../utils/password";
import {
  AccessTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { sendEmail } from "../utils/email";
import { decryptSecret, encryptSecret } from "../utils/crypto";

const oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const REFRESH_TOKEN_EXPIRATION_MS = env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

function calculateLockUntil(attempts: number): Date | null {
  if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
    return new Date(Date.now() + env.LOCK_TIME_MINUTES * 60 * 1000);
  }
  return null;
}

function createRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createBackupCodes(quantity = 10) {
  const plain: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < quantity; i += 1) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    plain.push(code);
    hashed.push(hashValue(code));
  }

  return { plain, hashed };
}

async function persistRefreshToken(
  client: PrismaClient,
  professionalId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string,
) {
  await client.refreshToken.create({
    data: {
      professionalId,
      token,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_MS),
      ipAddress,
      userAgent,
    },
  });
}

async function logLoginAttempt(
  professionalId: string,
  success: boolean,
  method: "EMAIL" | "GOOGLE" | "TOTP" | "BACKUP_CODE" | "REFRESH",
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string,
) {
  await prisma.loginLog.create({
    data: {
      professionalId,
      success,
      method,
      ipAddress,
      userAgent,
      errorMessage,
    },
  });
}

async function createVerificationToken(professionalId: string) {
  const token = createRandomToken(32);
  const hashedToken = hashValue(token);
  const expiresAt = new Date(
    Date.now() + env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
  );

  await prisma.emailVerificationToken.create({
    data: {
      professionalId,
      token: hashedToken,
      expiresAt,
    },
  });

  return token;
}

async function revokeExistingVerificationTokens(professionalId: string) {
  await prisma.emailVerificationToken.deleteMany({
    where: {
      professionalId,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

async function verifyGoogleToken(token: string): Promise<TokenPayload> {
  const ticket = await oauthClient.verifyIdToken({
    idToken: token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Token do Google inválido");
  }

  if (!payload.email_verified) {
    throw new Error("Email do Google não verificado");
  }

  return payload;
}

async function issueTokens(options: {
  professional: { id: string; email: string };
  ipAddress?: string;
  userAgent?: string;
  client?: PrismaClient;
}) {
  const { professional, ipAddress, userAgent, client = prisma } = options;
  const accessToken = generateAccessToken(professional.id, professional.email);
  const refreshToken = generateRefreshToken(professional.id);

  await persistRefreshToken(client, professional.id, refreshToken, ipAddress, userAgent);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.professional.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error("Email já registrado");
    }

    const passwordHash = await hashPassword(password);

    const professional = await prisma.professional.create({
      data: {
        email,
        passwordHash,
        name,
        planType: "FREE",
      },
      select: {
        id: true,
        email: true,
        name: true,
        planType: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    await revokeExistingVerificationTokens(professional.id);
    const verificationToken = await createVerificationToken(professional.id);
    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: professional.email,
      subject: "Confirme seu email - FisioQ",
      html: `
        <h1>Bem-vindo ao FisioQ!</h1>
        <p>Clique no link abaixo para confirmar seu email:</p>
        <a href="${verificationLink}">Confirmar Email</a>
        <p>Se você não criou uma conta no FisioQ, ignore este email.</p>
      `,
    });

    const professionalSafe = {
      id: professional.id,
      email: professional.email,
      name: professional.name,
      planType: professional.planType,
      emailVerified: professional.emailVerified,
      twoFactorEnabled: professional.twoFactorEnabled,
    };

    const tokens = await issueTokens({
      professional: { id: professionalSafe.id, email: professionalSafe.email },
    });

    logger.info({ professionalId: professional.id }, "Profissional registrado");

    return {
      professional: professionalSafe,
      ...tokens,
    };
  },

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const professional = await prisma.professional.findUnique({
      where: { email },
    });

    if (!professional) {
      throw new Error("Email ou senha inválidos");
    }

    if (professional.lockUntil && professional.lockUntil > new Date()) {
      throw new Error("Conta bloqueada temporariamente. Tente novamente mais tarde.");
    }

    if (!professional.passwordHash) {
      throw new Error("Esta conta usa login social. Utilize Google.");
    }

    const passwordMatch = await comparePasswords(password, professional.passwordHash);
    if (!passwordMatch) {
      const newAttempts = professional.loginAttempts + 1;
      const lockUntil = calculateLockUntil(newAttempts);

      await prisma.professional.update({
        where: { id: professional.id },
        data: {
          loginAttempts: newAttempts,
          lockUntil,
        },
      });

      await logLoginAttempt(
        professional.id,
        false,
        "EMAIL",
        ipAddress,
        userAgent,
        "Senha inválida",
      );

      throw new Error("Email ou senha inválidos");
    }

    if (!professional.emailVerified) {
      throw new Error("Confirme seu email antes de continuar");
    }

    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
      },
    });

    if (professional.twoFactorEnabled) {
      const tempToken = generateAccessToken(professional.id, professional.email, {
        twoFactorPending: true,
        expiresIn: "5m",
      });

      await logLoginAttempt(professional.id, true, "EMAIL", ipAddress, userAgent);

      return {
        requiresTwoFactor: true,
        professionalId: professional.id,
        tempToken,
      };
    }

    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const tokens = await issueTokens({
      professional: { id: professional.id, email: professional.email },
      ipAddress,
      userAgent,
    });

    await logLoginAttempt(professional.id, true, "EMAIL", ipAddress, userAgent);

    return {
      professional: {
        id: professional.id,
        email: professional.email,
        name: professional.name,
      },
      ...tokens,
    };
  },

  async setupTwoFactor(professionalId: string) {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new Error("Profissional não encontrado");
    }

    const secret = speakeasy.generateSecret({
      name: `FisioQ (${professional.email})`,
      issuer: "FisioQ",
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url ?? "");

    return {
      secret: secret.base32,
      qrCode,
    };
  },

  async confirmTwoFactor(professionalId: string, secret: string, token: string) {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw new Error("Código 2FA inválido");
    }

    const { plain, hashed } = createBackupCodes();
    const encryptedSecret = encryptSecret(secret);

    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashed,
      },
    });

    return { backupCodes: plain };
  },

  async verifyTwoFactor(options: {
    professionalId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { professionalId, token, ipAddress, userAgent } = options;

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional || !professional.twoFactorSecret) {
      throw new Error("2FA não habilitado");
    }

    const secret = decryptSecret(professional.twoFactorSecret);

    const isTotpValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!isTotpValid) {
      const hashedToken = hashValue(token);
      const backupIndex = professional.twoFactorBackupCodes.findIndex(
        (code: string) => code === hashedToken,
      );

      if (backupIndex === -1) {
        await logLoginAttempt(
          professional.id,
          false,
          "TOTP",
          ipAddress,
          userAgent,
          "Código 2FA inválido",
        );
        throw new Error("Código 2FA inválido");
      }

      professional.twoFactorBackupCodes.splice(backupIndex, 1);
      await prisma.professional.update({
        where: { id: professional.id },
        data: {
          twoFactorBackupCodes: professional.twoFactorBackupCodes,
        },
      });

      await logLoginAttempt(professional.id, true, "BACKUP_CODE", ipAddress, userAgent);
    } else {
      await logLoginAttempt(professional.id, true, "TOTP", ipAddress, userAgent);
    }

    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const tokens = await issueTokens({
      professional: { id: professional.id, email: professional.email },
      ipAddress,
      userAgent,
    });

    const professionalSafe = {
      id: professional.id,
      email: professional.email,
      name: professional.name,
      planType: professional.planType,
      emailVerified: professional.emailVerified,
      twoFactorEnabled: professional.twoFactorEnabled,
    };

    return { professional: professionalSafe, ...tokens };
  },

  async disableTwoFactor(professionalId: string) {
    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });
  },

  async loginWithGoogle(googleToken: string, ipAddress?: string, userAgent?: string) {
    const payload = await verifyGoogleToken(googleToken);

    if (!payload.email) {
      throw new Error("Token do Google sem email");
    }

    let professional = await prisma.professional.findFirst({
      where: {
        OR: [{ googleId: payload.sub ?? "" }, { email: payload.email }],
      },
    });

    if (!professional) {
      professional = await prisma.professional.create({
        data: {
          email: payload.email,
          name: payload.name ?? payload.email,
          googleId: payload.sub ?? undefined,
          googleEmail: payload.email,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          planType: "FREE",
        },
      });
    } else if (!professional.googleId && payload.sub) {
      professional = await prisma.professional.update({
        where: { id: professional.id },
        data: {
          googleId: payload.sub,
          googleEmail: payload.email,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    const tokens = await issueTokens({
      professional: { id: professional.id, email: professional.email },
      ipAddress,
      userAgent,
    });

    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    await logLoginAttempt(professional.id, true, "GOOGLE", ipAddress, userAgent);

    return {
      professional: {
        id: professional.id,
        email: professional.email,
        name: professional.name,
      },
      ...tokens,
    };
  },

  async sendVerificationEmail(professionalId: string) {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new Error("Profissional não encontrado");
    }

    await revokeExistingVerificationTokens(professional.id);
    const token = await createVerificationToken(professional.id);
    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: professional.email,
      subject: "Confirme seu email - FisioQ",
      html: `
        <h1>Confirme seu email</h1>
        <p>Clique no link abaixo para confirmar seu email:</p>
        <a href="${verificationLink}">Confirmar Email</a>
      `,
    });
  },

  async verifyEmail(token: string) {
    const hashedToken = hashValue(token);

    const verification = await prisma.emailVerificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verification) {
      throw new Error("Token de verificação inválido");
    }

    if (verification.consumedAt) {
      throw new Error("Token já utilizado");
    }

    if (verification.expiresAt < new Date()) {
      throw new Error("Token expirado");
    }

    await prisma.$transaction([
      prisma.professional.update({
        where: { id: verification.professionalId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verification.id },
        data: {
          consumedAt: new Date(),
        },
      }),
    ]);
  },

  async requestPasswordReset(email: string) {
    const professional = await prisma.professional.findUnique({
      where: { email },
    });

    if (!professional) {
      return;
    }

    const token = createRandomToken(32);
    const hashedToken = hashValue(token);
    const expiresAt = new Date(Date.now() + env.RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    await prisma.passwordReset.create({
      data: {
        professionalId: professional.id,
        token: hashedToken,
        expiresAt,
      },
    });

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: professional.email,
      subject: "Redefinição de senha - FisioQ",
      html: `
        <h1>Resetar Senha</h1>
        <p>Clique no link abaixo para resetar sua senha:</p>
        <a href="${resetLink}">Resetar Senha</a>
        <p>Este link expira em 1 hora.</p>
      `,
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = hashValue(token);

    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
    });

    if (!passwordReset) {
      throw new Error("Token inválido");
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new Error("Token expirado");
    }

    if (passwordReset.usedAt) {
      throw new Error("Token já utilizado");
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.professional.update({
        where: { id: passwordReset.professionalId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { professionalId: passwordReset.professionalId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  async refreshAccessToken(refreshToken: string) {
    verifyRefreshToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new Error("Refresh token inválido ou expirado");
    }

    const professional = await prisma.professional.findUnique({
      where: { id: tokenRecord.professionalId },
    });

    if (!professional) {
      throw new Error("Usuário não encontrado");
    }

    const accessToken = generateAccessToken(professional.id, professional.email);

    await logLoginAttempt(professional.id, true, "REFRESH");

    return { accessToken };
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  },

  async logoutAll(professionalId: string) {
    await prisma.refreshToken.updateMany({
      where: { professionalId },
      data: { revokedAt: new Date() },
    });
  },

  async validateTwoFactorTempToken(tempToken: string): Promise<AccessTokenPayload> {
    const payload = verifyAccessToken(tempToken);
    if (!payload.twoFactorPending) {
      throw new Error("Token temporário inválido");
    }
    return payload;
  },
};
