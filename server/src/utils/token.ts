import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { UserRole } from '../models/User';

export const ACCESS_TOKEN_COOKIE = 'ccs_access_token';
export const REFRESH_TOKEN_COOKIE = 'ccs_refresh_token';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  uid: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // Unique token identifier
}

/**
 * Generate SHA-256 hash of a refresh token for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sign an Access Token (15 minutes default).
 */
export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    issuer: 'cucampussaathi',
    audience: 'cucampussaathi-client',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/**
 * Sign a Refresh Token (7 days default).
 */
export function signRefreshToken(userId: string): { token: string; jti: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    issuer: 'cucampussaathi',
    audience: 'cucampussaathi-client',
  };
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, options);

  // 7 days from now (or parsed from expiration)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { token, jti, expiresAt };
}

/**
 * Verify an Access Token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  const options: VerifyOptions = {
    issuer: 'cucampussaathi',
    audience: 'cucampussaathi-client',
  };
  return jwt.verify(token, env.JWT_ACCESS_SECRET, options) as TokenPayload;
}

/**
 * Verify a Refresh Token.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const options: VerifyOptions = {
    issuer: 'cucampussaathi',
    audience: 'cucampussaathi-client',
  };
  return jwt.verify(token, env.JWT_REFRESH_SECRET, options) as RefreshTokenPayload;
}

/**
 * Base security cookie options for HttpOnly, SameSite, Secure.
 */
export const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

/**
 * Set authentication cookies (access & refresh).
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date
): void {
  // Access Token: 15 minutes maxAge
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Refresh Token: 7 days maxAge
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    expires: refreshExpiresAt,
  });
}

/**
 * Clear authentication cookies on logout.
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
}
