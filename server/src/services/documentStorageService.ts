import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export class DocumentStorageService {
  private baseStorageDir: string;

  constructor() {
    this.baseStorageDir = path.resolve(process.cwd(), env.DOCUMENTS_STORAGE_PATH);
    this.ensureStorageDirectory();
  }

  /**
   * Ensure local uploads directory exists.
   */
  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.baseStorageDir)) {
      fs.mkdirSync(this.baseStorageDir, { recursive: true });
    }
  }

  /**
   * Save uploaded PDF buffer with a cryptographically secure random filename.
   * Path traversal resistant.
   */
  async saveFile(
    fileBuffer: Buffer,
    _originalFilename: string
  ): Promise<{ storageKey: string; storagePath: string; fileSize: number }> {
    this.ensureStorageDirectory();

    const storageKey = `${crypto.randomUUID()}.pdf`;
    const fullPath = path.join(this.baseStorageDir, storageKey);

    // Verify target path does not escape baseStorageDir
    const normalized = path.normalize(fullPath);
    if (!normalized.startsWith(this.baseStorageDir)) {
      throw new AppError('Invalid storage path destination detected.', 400);
    }

    await fs.promises.writeFile(fullPath, fileBuffer);

    // Return relative storage path for portability across host environments
    const relativeStoragePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

    return {
      storageKey,
      storagePath: relativeStoragePath,
      fileSize: fileBuffer.length,
    };
  }

  /**
   * Get secure absolute path to stored file. Prevents directory traversal attacks.
   */
  resolveAbsolutePath(storagePath: string): string {
    const resolved = path.resolve(process.cwd(), storagePath);
    if (!resolved.startsWith(this.baseStorageDir)) {
      throw new AppError('Unauthorized file access attempt outside storage boundary.', 403);
    }
    return resolved;
  }

  /**
   * Read stored file buffer safely.
   */
  async readFile(storagePath: string): Promise<Buffer> {
    const fullPath = this.resolveAbsolutePath(storagePath);
    if (!fs.existsSync(fullPath)) {
      throw new AppError('Document binary file not found on server.', 404);
    }
    return fs.promises.readFile(fullPath);
  }

  /**
   * Delete stored file safely on document deletion or upload rollback.
   */
  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolveAbsolutePath(storagePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      logger.warn('Failed to delete physical document file during cleanup', err);
      return false;
    }
  }
}

export const documentStorageService = new DocumentStorageService();
