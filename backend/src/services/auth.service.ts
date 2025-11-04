import { PrismaClient, Professional, PlanType } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import type {
  RegisterInput,
  LoginInput,
  GoogleAuthInput,
} from '../validators/auth.validator.js';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret
);

export interface AuthResult {
  professional: Omit<Professional, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    // Verificar se email já existe
    const existing = await prisma.professional.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError(400, 'Email já está em uso');
    }

    // Hash da senha
    const passwordHash = await hashPassword(input.password);

    // Criar profissional
    const professional = await prisma.professional.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        cpf: input.cpf,
        phone: input.phone,
        planType: PlanType.FREE,
        maxPatients: 10, // Limite para plano FREE
        maxQuestionnaires: 50,
      },
    });

    // Gerar tokens
    const accessToken = generateAccessToken({
      professionalId: professional.id,
      email: professional.email,
      planType: professional.planType,
    });

    const refreshToken = generateRefreshToken({
      professionalId: professional.id,
      email: professional.email,
      planType: professional.planType,
    });

    // Salvar refresh token
    await prisma.refreshToken.create({
      data: {
        professionalId: professional.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    // Atualizar último login
    await prisma.professional.update({
      where: { id: professional.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _, ...professionalWithoutPassword } = professional;

    return {
      professional: professionalWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    // Buscar profissional
    const professional = await prisma.professional.findUnique({
      where: { email: input.email },
    });

    if (!professional) {
      throw new AppError(401, 'Email ou senha inválidos');
    }

    // Verificar se está ativo
    if (!professional.isActive) {
      throw new AppError(403, 'Conta desativada');
    }

    // Verificar senha
    if (!professional.passwordHash) {
      throw new AppError(401, 'Senha não configurada. Use login com Google.');
    }

    const isValid = await comparePassword(input.password, professional.passwordHash);

    if (!isValid) {
      throw new AppError(401, 'Email ou senha inválidos');
    }

    // Gerar tokens
    const accessToken = generateAccessToken({
      professionalId: professional.id,
      email: professional.email,
      planType: professional.planType,
    });

    const refreshToken = generateRefreshToken({
      professionalId: professional.id,
      email: professional.email,
      planType: professional.planType,
    });

    // Salvar refresh token
    await prisma.refreshToken.create({
      data: {
        professionalId: professional.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    // Atualizar último login
    await prisma.professional.update({
      where: { id: professional.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _, ...professionalWithoutPassword } = professional;

    return {
      professional: professionalWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async googleAuth(input: GoogleAuthInput): Promise<AuthResult> {
    try {
      // Verificar token do Google
      const ticket = await googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError(401, 'Token do Google inválido');
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!email) {
        throw new AppError(400, 'Email não fornecido pelo Google');
      }

      // Buscar ou criar profissional
      let professional = await prisma.professional.findFirst({
        where: {
          OR: [{ email }, { googleId }],
        },
      });

      if (professional) {
        // Atualizar dados do Google
        professional = await prisma.professional.update({
          where: { id: professional.id },
          data: {
            googleId,
            googleEmail: email,
            isGoogleAuth: true,
            name: name || professional.name,
            profileImageUrl: picture || professional.profileImageUrl,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Criar novo profissional
        professional = await prisma.professional.create({
          data: {
            email,
            googleId,
            googleEmail: email,
            isGoogleAuth: true,
            name: name || 'Usuário',
            profileImageUrl: picture,
            planType: PlanType.FREE,
            maxPatients: 10,
            maxQuestionnaires: 50,
            lastLoginAt: new Date(),
          },
        });
      }

      // Gerar tokens
      const accessToken = generateAccessToken({
        professionalId: professional.id,
        email: professional.email,
        planType: professional.planType,
      });

      const refreshToken = generateRefreshToken({
        professionalId: professional.id,
        email: professional.email,
        planType: professional.planType,
      });

      // Salvar refresh token
      await prisma.refreshToken.create({
        data: {
          professionalId: professional.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
      });

      const { passwordHash: _, ...professionalWithoutPassword } = professional;

      return {
        professional: professionalWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      logger.error('Erro no Google Auth:', error);
      throw new AppError(401, 'Erro ao autenticar com Google');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Buscar token
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { professional: true },
    });

    if (!token || token.isRevoked) {
      throw new AppError(401, 'Refresh token inválido');
    }

    if (token.expiresAt < new Date()) {
      throw new AppError(401, 'Refresh token expirado');
    }

    // Gerar novo access token
    const accessToken = generateAccessToken({
      professionalId: token.professional.id,
      email: token.professional.email,
      planType: token.professional.planType,
    });

    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }
}

