import { Request, Response, NextFunction } from 'express';
import { directoryService } from '../services/directoryService';
import { directoryQuerySchema } from '../utils/validators';

export class DirectoryController {
  /**
   * GET /api/v1/directory
   * Privacy-aware campus directory search.
   */
  async searchDirectory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = directoryQuerySchema.parse(req.query);
      const isCampusUser = Boolean(req.user);

      const result = await directoryService.searchDirectory(validatedQuery, isCampusUser);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const directoryController = new DirectoryController();
