import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MONGOOSE_STATES } from '../config/database';

export function getHealthStatus(_req: Request, res: Response): void {
  const readyState = mongoose.connection.readyState;
  const isDbConnected = readyState === 1;
  const dbStateName = MONGOOSE_STATES[readyState] || 'unknown';

  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'cucampussaathi-backend',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      state: dbStateName,
    },
  });
}
