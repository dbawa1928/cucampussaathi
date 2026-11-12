import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import apiRoutes from './routes';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // 1. Security Headers (configured to allow Vite SPA assets and scripts)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration with automatic support for Render, client origin, and local development
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);
        if (
          env.CLIENT_ORIGIN === '*' ||
          requestOrigin === env.CLIENT_ORIGIN ||
          requestOrigin.endsWith('.onrender.com') ||
          requestOrigin.includes('localhost') ||
          requestOrigin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body & Cookie Parsing Middleware
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. API v1 Routes
  app.use('/api/v1', apiRoutes);

  // 5. Serve Frontend static files for All-in-One deployment (if dist exists)
  const candidatePaths = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), '../dist'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(__dirname, '../dist'),
    path.resolve(__dirname, '../../../dist'),
  ];
  const frontendDistPath = candidatePaths.find((p) => fs.existsSync(p));

  if (frontendDistPath) {
    app.use(express.static(frontendDistPath));

    // Wildcard SPA route fallback for React Router (skip /api routes)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      const indexPath = path.join(frontendDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      next();
    });
  }

  // 6. 404 Not Found Handler for unknown API routes
  app.use(notFoundHandler);

  // 7. Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
