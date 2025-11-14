import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  twoFactorPending?: boolean;
}

interface GenerateAccessTokenOptions {
  expiresIn?: SignOptions["expiresIn"];
  audience?: SignOptions["audience"];
  issuer?: SignOptions["issuer"];
  twoFactorPending?: boolean;
}

export function generateAccessToken(
  userId: string,
  email: string,
  options?: GenerateAccessTokenOptions,
): string {
  const { twoFactorPending, ...signOptions } = options ?? {};
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
  };

  if (typeof twoFactorPending !== "undefined") {
    payload.twoFactorPending = twoFactorPending;
  }

  const finalOptions: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  };

  if (signOptions.expiresIn) {
    finalOptions.expiresIn = signOptions.expiresIn;
  }

  if (signOptions.audience) {
    finalOptions.audience = signOptions.audience;
  }

  if (signOptions.issuer) {
    finalOptions.issuer = signOptions.issuer;
  }

  return jwt.sign(payload, env.JWT_SECRET, finalOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: `${env.REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
    },
  );
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
