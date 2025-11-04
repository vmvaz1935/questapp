import { Response, NextFunction } from 'express';
import { ResultService } from '../services/result.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const resultService = new ResultService();

export class ResultController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const result = await resultService.create(req.professionalId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const { patientId, questionnaireId, skip, take } = req.query;
      const result = await resultService.findAll(req.professionalId, {
        patientId: patientId as string | undefined,
        questionnaireId: questionnaireId as string | undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
        take: take ? parseInt(take as string, 10) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const result = await resultService.findOne(req.professionalId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      await resultService.delete(req.professionalId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

