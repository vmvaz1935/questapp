import { Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const patientService = new PatientService();

export class PatientController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const patient = await patientService.create(req.professionalId, req.body);
      res.status(201).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const { skip, take, search } = req.query;
      const result = await patientService.findAll(req.professionalId, {
        skip: skip ? parseInt(skip as string, 10) : undefined,
        take: take ? parseInt(take as string, 10) : undefined,
        search: search as string | undefined,
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
      const patient = await patientService.findOne(req.professionalId, req.params.id);
      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      const patient = await patientService.update(
        req.professionalId,
        req.params.id,
        req.body
      );
      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.professionalId) {
        throw new Error('Professional ID não encontrado');
      }
      await patientService.delete(req.professionalId, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

