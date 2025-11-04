import { PrismaClient, Result } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateResultInput } from '../validators/result.validator.js';

const prisma = new PrismaClient();

export class ResultService {
  async create(
    professionalId: string,
    input: CreateResultInput
  ): Promise<Result> {
    // Verificar se paciente existe e pertence ao profissional
    const patient = await prisma.patient.findFirst({
      where: {
        id: input.patientId,
        professionalId,
        isActive: true,
      },
    });

    if (!patient) {
      throw new AppError(404, 'Paciente não encontrado');
    }

    // Criar resultado
    const result = await prisma.result.create({
      data: {
        professionalId,
        patientId: input.patientId,
        questionnaireId: input.questionnaireId,
        questionnaireName: input.questionnaireName,
        questionnaireAcronym: input.questionnaireAcronym,
        responses: input.responses as any,
        scores: input.scores as any,
        interpretation: input.interpretation,
      },
    });

    return result;
  }

  async findAll(
    professionalId: string,
    options?: {
      patientId?: string;
      questionnaireId?: string;
      skip?: number;
      take?: number;
    }
  ): Promise<{ data: Result[]; total: number }> {
    const where: any = {
      professionalId,
    };

    if (options?.patientId) {
      where.patientId = options.patientId;
    }

    if (options?.questionnaireId) {
      where.questionnaireId = options.questionnaireId;
    }

    const [data, total] = await Promise.all([
      prisma.result.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.result.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(professionalId: string, id: string): Promise<Result> {
    const result = await prisma.result.findFirst({
      where: {
        id,
        professionalId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!result) {
      throw new AppError(404, 'Resultado não encontrado');
    }

    return result;
  }

  async delete(professionalId: string, id: string): Promise<void> {
    // Verificar se existe e pertence ao profissional
    await this.findOne(professionalId, id);

    // Deletar
    await prisma.result.delete({
      where: { id },
    });
  }
}

