import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '../utils/validators';
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from '../utils/token';
import { ValidationError, AppError } from '../utils/errors';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError(
          'Registration validation failed',
          parseResult.error.format()
        );
      }

      const result = await authService.register(parseResult.data);

      // Set HttpOnly access and refresh token cookies
      setAuthCookies(res, result.accessToken, result.refreshToken, result.expiresAt);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError(
          'Login validation failed',
          parseResult.error.format()
        );
      }

      const result = await authService.login(parseResult.data, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      setAuthCookies(res, result.accessToken, result.refreshToken, result.expiresAt);

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

      if (!rawRefreshToken) {
        throw new AppError('Refresh token session missing. Please sign in.', 401);
      }

      const result = await authService.refresh(rawRefreshToken, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      setAuthCookies(res, result.accessToken, result.refreshToken, result.expiresAt);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

      if (rawRefreshToken) {
        await authService.logout(rawRefreshToken);
      }

      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const userProfile = await authService.getCurrentUser(req.user._id.toString());

      res.status(200).json({
        success: true,
        data: {
          user: userProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
