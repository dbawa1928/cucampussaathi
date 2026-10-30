import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// Connection states mapped from mongoose.connection.readyState
export const MONGOOSE_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Connect to MongoDB Atlas cluster using Mongoose.
 */
export async function connectDatabase(): Promise<void> {
  const maskedUri = env.MONGODB_URI.replace(
    /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/i,
    '$1*****$3'
  );

  logger.info(`Connecting to MongoDB at ${maskedUri}...`);

  try {
    mongoose.set('strictQuery', true);

    // Event listeners
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB Atlas connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB Atlas connection runtime error', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Atlas disconnected.');
    });

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000, // Fail fast if IP is not whitelisted or host is unreachable
      maxPoolSize: 10,
    });
  } catch (error: unknown) {
    logger.error('Failed to connect to MongoDB Atlas cluster.');

    if (error instanceof Error) {
      if (error.name === 'MongooseServerSelectionError' || error.message.includes('whitelist') || error.message.includes('querySrv')) {
        logger.warn(
          'Atlas Connectivity Notice: If this is an IP restriction error, ensure your current IP address is added to the MongoDB Atlas Network Access allowlist (or allow 0.0.0.0/0 for development).'
        );
      }
    }

    throw error;
  }
}

/**
 * Disconnect cleanly during server shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB connection closed.');
  }
}
