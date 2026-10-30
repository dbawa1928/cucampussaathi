import { Request, Response, NextFunction } from 'express';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '../utils/token';
import { User, IUser, UserRole } from '../models/User';

// Extend Express Request type to attach authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT access token.
 * Reads from HttpOnly cookie or Authorization: Bearer header.
 */
export async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please re-authenticate.',
      });
      return;
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Account associated with this session no longer exists.',
      });
      return;
    }

    if (user.accountStatus === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : 'Account has been suspended by university administration.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    if (user.accountStatus === 'DEACTIVATED') {
      res.status(403).json({
        success: false,
        message: 'Account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Enforces that req.user has one of the allowed roles.
 */
export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Access restricted to authorized roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware for privacy-aware endpoints (e.g. campus directory).
 * If a valid session is present, attaches req.user.
 * If not present, allows the request to continue anonymously as a public guest.
 */
export async function optionalAuthGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        const user = await User.findById(payload.sub);
        if (user) {
          req.user = user;
        }
      } catch {
        // Silently proceed as unauthenticated public visitor
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
