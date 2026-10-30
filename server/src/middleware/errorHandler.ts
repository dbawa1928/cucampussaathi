import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown = undefined;

  // Known application operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if ('errors' in err && (err as any).errors) {
      errors = (err as any).errors;
    }
  }
  // Zod schema validation error
  else if (err.name === 'ZodError' || (err as any).issues) {
    statusCode = 400;
    message = 'Validation error';
    errors = ((err as any).issues || (err as any).errors || []).map((i: any) => ({
      field: i.path?.join('.') || 'field',
      message: i.message,
    }));
  }
  // Mongoose validation error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Data validation failed';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors = Object.values((err as any).errors).map((e: any) => e.message);
  }
  // Mongoose duplicate key error (code 11000)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if ((err as any).code === 11000) {
    statusCode = 409;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. An account with this ${field} already exists.`;
  }
  // Mongoose Server Selection / Connection Error
  else if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    err.message?.includes('buffering timed out') ||
    err.message?.includes('Could not connect to any servers')
  ) {
    statusCode = 503;
    message =
      'Database connection failed: Could not connect to MongoDB Atlas. Please verify that 0.0.0.0/0 (allow from anywhere) is added in MongoDB Atlas -> Network Access.';
  }
  // Mongoose CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier format';
  } else {
    logger.error('Unhandled internal server error', err);
    // Provide actual error message so issues can be immediately diagnosed
    message = err.message || 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
