import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocketServer, closeSocketServer } from './socket';
import { reminderService } from './services/reminderService';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize real-time Socket.IO server
  initSocketServer(httpServer);

  // Connect to MongoDB Atlas
  try {
    await connectDatabase();
    // Start consultation reminder scheduler once database is connected
    reminderService.startReminderScheduler();
  } catch (error) {
    logger.warn(
      'Server started with MongoDB disconnected. Background auto-reconnect loop active...'
    );
    const retryInterval = setInterval(async () => {
      try {
        if (mongoose.connection.readyState === 0) {
          await connectDatabase();
          reminderService.startReminderScheduler();
          clearInterval(retryInterval);
          logger.info('MongoDB Atlas connected successfully via background retry loop.');
        }
      } catch {
        // Continue retrying every 5 seconds
      }
    }, 5000);
  }

  // Start HTTP Server
  const server = httpServer.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`CUCampusSaathi Backend Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`WebSocket real-time notification engine initialized`);
  });

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    reminderService.stopReminderScheduler();
    await closeSocketServer();

    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force shutdown if cleanup takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Forcing process termination.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal initialization error in bootstrap', err);
  process.exit(1);
});
