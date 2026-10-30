import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cookie from 'cookie';
import { env } from './config/env';
import { verifyAccessToken, ACCESS_TOKEN_COOKIE, TokenPayload } from './utils/token';
import { logger } from './utils/logger';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: TokenPayload;
  };
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO instance and attach authentication middleware.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Authentication Middleware: Verifies the JWT cookie on handshake
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined;

      // 1. Try reading from HttpOnly cookie
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const parsedCookies = cookie.parse(cookieHeader);
        token = parsedCookies[ACCESS_TOKEN_COOKIE];
      }

      // 2. Fallback to auth object or Authorization header if provided
      if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      }
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }

      if (!token) {
        logger.warn('Socket connection rejected: Missing authentication token');
        return next(new Error('Authentication token required'));
      }

      // 3. Verify JWT
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (err: any) {
      logger.warn(`Socket connection rejected: Invalid or expired token (${err.message})`);
      next(new Error('Invalid or expired authentication credentials'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // Join authenticated socket into a private user room
    const userRoom = `user:${user.sub}`;
    socket.join(userRoom);
    logger.info(`Socket connected: [${user.role}] ${user.email} (joined room: ${userRoom})`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${user.email} (reason: ${reason})`);
    });
  });

  return io;
}

/**
 * Get the initialized Socket.IO server instance.
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Safely emit an event to a specific user's private room.
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (!io) {
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Close Socket.IO server cleanly.
 */
export async function closeSocketServer(): Promise<void> {
  if (io) {
    logger.info('Closing Socket.IO server connections...');
    await new Promise<void>((resolve) => {
      io!.close(() => resolve());
    });
    io = null;
  }
}
