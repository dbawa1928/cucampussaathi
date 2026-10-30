import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authGuard } from '../middleware/authGuard';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Authentication Endpoints (rate limited)
router.post('/register', authRateLimiter, (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter, (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/forgot-password', authRateLimiter, (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

// Protected Authentication Endpoint
router.get('/me', authGuard, (req, res, next) =>
  authController.me(req, res, next)
);

export default router;
