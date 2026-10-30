import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z
  .object({
    PORT: z
      .string()
      .default('5000')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
        message: 'PORT must be a valid port number between 1 and 65535',
      }),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_ORIGIN: z
      .string()
      .url({ message: 'CLIENT_ORIGIN must be a valid URL (e.g. http://localhost:5173)' })
      .default('http://localhost:5173'),
    MONGODB_URI: z
      .string({ required_error: 'MONGODB_URI is required' })
      .refine(
        (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
        {
          message: 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"',
        }
      ),
    JWT_ACCESS_SECRET: z
      .string({ required_error: 'JWT_ACCESS_SECRET is required' })
      .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_REFRESH_SECRET: z
      .string({ required_error: 'JWT_REFRESH_SECRET is required' })
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    SEED_DEFAULT_PASSWORD: z.string().default('CampusSaathi@2026'),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        return (
          data.JWT_ACCESS_SECRET.length >= 32 && data.JWT_REFRESH_SECRET.length >= 32
        );
      }
      return true;
    },
    {
      message: 'In production, JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters long',
      path: ['JWT_ACCESS_SECRET'],
    }
  );

export type EnvConfig = z.infer<typeof envSchema>;

function loadAndValidateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    logger.error('Environment variable configuration error:\n' + errorDetails);
    throw new Error(
      'Invalid server environment configuration. Please check server/.env against server/.env.example.'
    );
  }

  return result.data;
}

export const env = loadAndValidateEnv();
