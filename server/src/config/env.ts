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
      .default('http://localhost:5173')
      .refine(
        (val) => val === '*' || val.startsWith('http://') || val.startsWith('https://'),
        { message: 'CLIENT_ORIGIN must be a valid URL (e.g. http://localhost:5173) or "*"' }
      ),
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
    GROQ_API_KEY: z.string().optional().default(''),
    GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
    RAG_CHUNK_SIZE: z
      .string()
      .default('800')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 100 && val <= 4000, {
        message: 'RAG_CHUNK_SIZE must be between 100 and 4000',
      }),
    RAG_CHUNK_OVERLAP: z
      .string()
      .default('150')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 0 && val <= 1000, {
        message: 'RAG_CHUNK_OVERLAP must be between 0 and 1000',
      }),
    MAX_DOCUMENT_SIZE_MB: z
      .string()
      .default('15')
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
        message: 'MAX_DOCUMENT_SIZE_MB must be between 1 and 100',
      }),
    DOCUMENTS_STORAGE_PATH: z.string().default('uploads/documents'),
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
