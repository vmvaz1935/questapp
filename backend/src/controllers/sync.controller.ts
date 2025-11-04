import { Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const syncService = new SyncService();

export class SyncController {
  async sync(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const result = await syncService.sync(req.professionalId, req.body.changes);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const status = await syncService.getSyncStatus(req.professionalId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
}

