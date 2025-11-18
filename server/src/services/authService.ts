import { prisma } from '../config/database';
import { hashPassword, comparePasswords, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';
import { encryptSecret, decryptSecret } from '../utils/encryption';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutos

// Google OAuth Client
const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET)
  : null;

export const authService = {
  // ============================================
  // REGISTRO
  // ============================================

  async register(email: string, password: string, name: string) {
    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Verificar se email já existe
    const existing = await prisma.professional.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('Email já cadastrado');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Criar profissional
    const professional = await prisma.professional.create({
      data: {
        email,
        passwordHash,
        name,
        planType: 'FREE',
      },
    });

    // Gerar tokens
    const accessToken = generateAccessToken(professional.id, professional.email);
    const refreshToken = generateRefreshToken(professional.id);

    // Salvar refresh token
    await prisma.refreshToken.create({
      data: {
        professionalId: professional.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    // Enviar email de confirmação
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.emailVerification.create({
      data: {
        professionalId: professional.id,
        token: verificationToken,
        expiresAt,
      },
    });

    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: professional.email,
      subject: 'Confirme seu email - FisioQ',
      html: `
        <h1>Bem-vindo ao FisioQ!</h1>
        <p>Olá ${name},</p>
        <p>Clique no link abaixo para confirmar seu email:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Confirmar Email</a>
        <p>Este link expira em 24 horas.</p>
        <p>Se você não criou esta conta, ignore este email.</p>
      `,
    });

    return {
      professional: {
        id: professional.id,
        email: professional.email,
        name: professional.name,
        emailVerified: professional.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  },

  // ============================================
  // LOGIN
  // ============================================

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const professional = await prisma.professional.findUnique({
      where: { email },
    });

    if (!professional) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar se conta está bloqueada
    if (professional.lockUntil && professional.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((professional.lockUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Conta bloqueada. Tente novamente em ${minutesLeft} minutos.`);
    }

    // Comparar senha
    if (!professional.passwordHash) {
      throw new Error('Use login com Google para esta conta');
    }

    const passwordMatch = await comparePasswords(password, professional.passwordHash);

    if (!passwordMatch) {
      // Incrementar tentativas de login
      const newAttempts = professional.loginAttempts + 1;
      const lockUntil =
        newAttempts >= MAX_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCK_TIME)
          : null;

      await prisma.professional.update({
        where: { id: professional.id },
        data: {
          loginAttempts: newAttempts,
          lockUntil,
        },
      });

      // Log de tentativa falha
      await prisma.loginLog.create({
        data: {
          professionalId: professional.id,
          success: false,
          method: 'EMAIL',
          ipAddress,
          userAgent,
          errorMessage: 'Senha inválida',
        },
      });

      throw new Error('Email ou senha inválidos');
    }

    // Verificar se email está confirmado
    if (!professional.emailVerified) {
      throw new Error('Por favor, verifique seu email antes de fazer login');
    }

    // Se 2FA está ativado, retornar flag para pedir código
    if (professional.twoFactorEnabled) {
      const tempToken = generateAccessToken(professional.id, professional.email, {
        expiresIn: '5m',
        twoFactorPending: true,
      });

      return {
        requiresTwoFactor: true,
        tempToken,
        professionalId: professional.id,
      };
    }

    // Gerar tokens
    const accessToken = generateAccessToken(professional.id, professional.email);
    const refreshToken = generateRefreshToken(professional.id);

    // Salvar refresh token
    await prisma.refreshToken.create({
      data: {
        professionalId: professional.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    // Atualizar último login
    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0,
        lockUntil: null,
      },
    });

    // Log de login bem-sucedido
    await prisma.loginLog.create({
      data: {
        professionalId: professional.id,
        success: true,
        method: 'EMAIL',
        ipAddress,
        userAgent,
      },
    });

    return {
      professional: {
        id: professional.id,
        email: professional.email,
        name: professional.name,
        emailVerified: professional.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  },

  // ============================================
  // 2FA (TOTP)
  // ============================================

  async setupTwoFactor(professionalId: string) {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new Error('Profissional não encontrado');
    }

    // Gerar secret TOTP
    const secret = speakeasy.generateSecret({
      name: `FisioQ (${professional.email})`,
      issuer: 'FisioQ',
      length: 32,
    });

    // Gerar QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Gerar códigos de backup
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  },

  async confirmTwoFactor(professionalId: string, secret: string, token: string) {
    // Verificar token TOTP
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new Error('Código 2FA inválido');
    }

    // Gerar códigos de backup
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Salvar secret (criptografado)
    const encryptedSecret = encryptSecret(secret);

    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: backupCodes,
      },
    });

    return { backupCodes };
  },

  async verifyTwoFactor(professionalId: string, token: string, ipAddress?: string, userAgent?: string) {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional || !professional.twoFactorSecret) {
      throw new Error('2FA não está ativado');
    }

    // Descriptografar secret
    const secret = decryptSecret(professional.twoFactorSecret);

    // Verificar token TOTP
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    let isValid = verified;

    // Se não passou no TOTP, verificar código de backup
    if (!verified) {
      const backupCodeIndex = professional.twoFactorBackupCodes.indexOf(token);
      if (backupCodeIndex !== -1) {
        isValid = true;
        // Remover código de backup usado
        const updatedBackupCodes = [...professional.twoFactorBackupCodes];
        updatedBackupCodes.splice(backupCodeIndex, 1);

        await prisma.professional.update({
          where: { id: professionalId },
          data: {
            twoFactorBackupCodes: updatedBackupCodes,
          },
        });
      }
    }

    if (!isValid) {
      // Log de tentativa falha
      await prisma.loginLog.create({
        data: {
          professionalId: professional.id,
          success: false,
          method: 'TOTP',
          ipAddress,
          userAgent,
          errorMessage: 'Código 2FA inválido',
        },
      });

      throw new Error('Código 2FA inválido');
    }

    // Gerar tokens
    const accessToken = generateAccessToken(professional.id, professional.email);
    const refreshToken = generateRefreshToken(professional.id);

    await prisma.refreshToken.create({
      data: {
        professionalId: professional.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    // Atualizar último login
    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0,
        lockUntil: null,
      },
    });

    // Log de login bem-sucedido
    await prisma.loginLog.create({
      data: {
        professionalId: professional.id,
        success: true,
        method: 'TOTP',
        ipAddress,
        userAgent,
      },
    });

    return {
      professional: {
        id: professional.id,
        email: professional.email,
        name: professional.name,
        emailVerified: professional.emailVerified,
      },
      accessToken,
      refreshToken,
    };
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

  // ============================================
  // GOOGLE OAUTH
  // ============================================

  async loginWithGoogle(googleToken: string, ipAddress?: string, userAgent?: string) {
    if (!googleClient) {
      throw new Error('Google OAuth não configurado');
    }

    // Verificar token com Google
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Token do Google inválido');
    }

    // Procurar usuário por Google ID ou email
    let professional = await prisma.professional.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email: payload.email }],
      },
    });

    // Criar usuário se não existir
    if (!professional) {
      professional = await prisma.professional.create({
        data: {
          email: payload.email,
          name: payload.name || payload.email,
          googleId: payload.sub,
          googleEmail: payload.email,
          emailVerified: true, // Google verifica email
          planType: 'FREE',
        },
      });
    } else {
      // Atualizar Google ID se necessário
      if (!professional.googleId) {
        await prisma.professional.update({
          where: { id: professional.id },
          data: {
            googleId: payload.sub,
            googleEmail: payload.email,
            emailVerified: true,
          },
        });
      }
    }

    // Gerar tokens
    const accessToken = generateAccessToken(professional.id, professional.email);
    const refreshToken = generateRefreshToken(professional.id);

    await prisma.refreshToken.create({
      data: {
        professionalId: professional.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress,
        userAgent,
      },
    });

    // Atualizar último login
    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Log de login
    await prisma.loginLog.create({
      data: {
        professionalId: professional.id,
        success: true,
        method: 'GOOGLE',
        ipAddress,
        userAgent,
      },
    });

    return {
      professional: {
        id: professional.id,
        email: professional.email,
        name: professional.name,
        emailVerified: professional.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  },

  // ============================================
  // EMAIL VERIFICATION
  // ============================================

  async sendVerificationEmail(professionalId: string) {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!professional) {
      throw new Error('Profissional não encontrado');
    }

    if (professional.emailVerified) {
      throw new Error('Email já verificado');
    }

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.emailVerification.create({
      data: {
        professionalId: professional.id,
        token: verificationToken,
        expiresAt,
      },
    });

    const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: professional.email,
      subject: 'Confirme seu email - FisioQ',
      html: `
        <h1>Confirme seu email</h1>
        <p>Olá ${professional.name},</p>
        <p>Clique no link abaixo para confirmar seu email:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Confirmar Email</a>
        <p>Este link expira em 24 horas.</p>
      `,
    });
  },

  async verifyEmail(token: string) {
    const emailVerification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { professional: true },
    });

    if (!emailVerification) {
      throw new Error('Token de verificação inválido');
    }

    if (emailVerification.expiresAt < new Date()) {
      throw new Error('Token de verificação expirado');
    }

    if (emailVerification.usedAt) {
      throw new Error('Token de verificação já utilizado');
    }

    // Marcar email como verificado
    await prisma.professional.update({
      where: { id: emailVerification.professionalId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Marcar token como usado
    await prisma.emailVerification.update({
      where: { id: emailVerification.id },
      data: { usedAt: new Date() },
    });
  },

  // ============================================
  // PASSWORD RESET
  // ============================================

  async requestPasswordReset(email: string) {
    const professional = await prisma.professional.findUnique({
      where: { email },
    });

    if (!professional) {
      // Não revelar se email existe (segurança)
      return;
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordReset.create({
      data: {
        professionalId: professional.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Enviar email
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: professional.email,
      subject: 'Resetar sua senha - FisioQ',
      html: `
        <h1>Resetar Senha</h1>
        <p>Olá ${professional.name},</p>
        <p>Clique no link abaixo para resetar sua senha:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Resetar Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta alteração, ignore este email.</p>
      `,
    });
  },

  async resetPassword(token: string, newPassword: string) {
    // Validar força da senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Procurar token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!passwordReset) {
      throw new Error('Token de reset inválido');
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new Error('Token de reset expirado');
    }

    if (passwordReset.usedAt) {
      throw new Error('Token de reset já utilizado');
    }

    // Hash da nova senha
    const passwordHash = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.professional.update({
      where: { id: passwordReset.professionalId },
      data: { passwordHash },
    });

    // Marcar token como usado
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { usedAt: new Date() },
    });

    // Revogar todos os refresh tokens
    await prisma.refreshToken.updateMany({
      where: { professionalId: passwordReset.professionalId },
      data: { revokedAt: new Date() },
    });
  },

  // ============================================
  // REFRESH TOKEN
  // ============================================

  async refreshAccessToken(refreshToken: string) {
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new Error('Token de refresh inválido ou expirado');
    }

    const professional = await prisma.professional.findUnique({
      where: { id: token.professionalId },
    });

    if (!professional) {
      throw new Error('Profissional não encontrado');
    }

    const accessToken = generateAccessToken(professional.id, professional.email);

    return { accessToken };
  },

  // ============================================
  // LOGOUT
  // ============================================

  async logout(refreshToken: string) {
    await prisma.refreshToken.update({
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
};

