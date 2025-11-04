import { PrismaClient, Patient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import type {
  CreatePatientInput,
  UpdatePatientInput,
} from '../validators/patient.validator.js';

const prisma = new PrismaClient();

export class PatientService {
  async create(
    professionalId: string,
    input: CreatePatientInput
  ): Promise<Patient> {
    // Verificar limites do plano
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: { patients: { where: { isActive: true } } },
    });

    if (!professional) {
      throw new AppError(404, 'Profissional não encontrado');
    }

    if (
      professional.maxPatients &&
      professional.patients.length >= professional.maxPatients
    ) {
      throw new AppError(
        403,
        'Limite de pacientes atingido. Faça upgrade do seu plano.'
      );
    }

    // Criar paciente
    const patient = await prisma.patient.create({
      data: {
        professionalId,
        name: input.name,
        age: input.age,
        gender: input.gender,
        diagnosis: input.diagnosis,
        sidedAffected: input.sidedAffected,
        referringDoctor: input.referringDoctor,
        physiotherapist: input.physiotherapist,
        notes: input.notes,
      },
    });

    return patient;
  }

  async findAll(
    professionalId: string,
    options?: {
      skip?: number;
      take?: number;
      search?: string;
    }
  ): Promise<{ data: Patient[]; total: number }> {
    const where: any = {
      professionalId,
      isActive: true,
    };

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { diagnosis: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(professionalId: string, id: string): Promise<Patient> {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        professionalId,
        isActive: true,
      },
    });

    if (!patient) {
      throw new AppError(404, 'Paciente não encontrado');
    }

    return patient;
  }

  async update(
    professionalId: string,
    id: string,
    input: UpdatePatientInput
  ): Promise<Patient> {
    // Verificar se existe e pertence ao profissional
    await this.findOne(professionalId, id);

    // Atualizar
    const patient = await prisma.patient.update({
      where: { id },
      data: input,
    });

    return patient;
  }

  async delete(professionalId: string, id: string): Promise<void> {
    // Verificar se existe e pertence ao profissional
    await this.findOne(professionalId, id);

    // Soft delete
    await prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

