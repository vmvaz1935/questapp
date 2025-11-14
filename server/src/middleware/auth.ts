import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { logger } from "../config/logger";
import { AccessTokenPayload, verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  tokenPayload?: AccessTokenPayload;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.substring("Bearer ".length);
    const payload = verifyAccessToken(token);

    if (payload.twoFactorPending) {
      return res
        .status(403)
        .json({ error: "2FA pendente. Conclua a verificação." });
    }

    const professional = await prisma.professional.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!professional) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    req.user = {
      id: professional.id,
      email: professional.email,
    };
    req.tokenPayload = payload;

    return next();
  } catch (error) {
    logger.warn({ err: error }, "Falha na autenticação");
    return res.status(401).json({ error: "Token inválido" });
  }
}
