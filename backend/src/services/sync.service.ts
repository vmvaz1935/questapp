import { PrismaClient, SyncStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import type { SyncChangeInput } from '../validators/sync.validator.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts: Array<{
    entityType: string;
    entityId: string;
    localData: any;
    serverData: any;
    resolution: 'LOCAL' | 'SERVER' | 'MANUAL';
  }>;
  errors: Array<{
    entityId: string;
    error: string;
  }>;
}

export class SyncService {
  async sync(
    professionalId: string,
    changes: SyncChangeInput[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      conflicts: [],
      errors: [],
    };

    for (const change of changes) {
      try {
        // Criar sync log
        const syncLog = await prisma.syncLog.create({
          data: {
            professionalId,
            entityType: change.entityType,
            entityId: change.entityId,
            operation: change.operation,
            localTimestamp: new Date(change.localTimestamp),
            data: change.data as any,
            status: SyncStatus.PENDING,
          },
        });

        // Processar mudança
        await this.processChange(professionalId, change);

        // Marcar como sincronizado
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: SyncStatus.SYNCED,
            serverTimestamp: new Date(),
            syncedAt: new Date(),
          },
        });

        result.synced++;
      } catch (error: any) {
        logger.error('Erro ao sincronizar mudança:', error);

        // Verificar se é conflito
        if (error.message?.includes('conflito') || error.message?.includes('conflict')) {
          result.conflicts.push({
            entityType: change.entityType,
            entityId: change.entityId,
            localData: change.data,
            serverData: null,
            resolution: 'MANUAL',
          });
        } else {
          result.failed++;
          result.errors.push({
            entityId: change.entityId,
            error: error.message || 'Erro desconhecido',
          });
        }
      }
    }

    return result;
  }

  private async processChange(
    professionalId: string,
    change: SyncChangeInput
  ): Promise<void> {
    switch (change.entityType) {
      case 'PATIENT':
        await this.syncPatient(professionalId, change);
        break;
      case 'RESULT':
        await this.syncResult(professionalId, change);
        break;
      case 'CONSENT':
        await this.syncConsent(professionalId, change);
        break;
      default:
        throw new AppError(400, `Tipo de entidade inválido: ${change.entityType}`);
    }
  }

  private async syncPatient(
    professionalId: string,
    change: SyncChangeInput
  ): Promise<void> {
    const data = change.data as any;

    switch (change.operation) {
      case 'CREATE':
      case 'UPDATE': {
        // Verificar se já existe
        const existing = await prisma.patient.findFirst({
          where: {
            id: change.entityId,
            professionalId,
          },
        });

        if (existing) {
          // Resolver conflito por timestamp (Last-Write-Wins)
          const localTime = new Date(change.localTimestamp);
          const serverTime = existing.updatedAt;

          if (localTime > serverTime) {
            // Atualizar com dados locais
            await prisma.patient.update({
              where: { id: change.entityId },
              data: {
                name: data.name,
                age: data.age,
                gender: data.gender,
                diagnosis: data.diagnosis,
                sidedAffected: data.sidedAffected,
                referringDoctor: data.referringDoctor,
                physiotherapist: data.physiotherapist,
                notes: data.notes,
              },
            });
          }
        } else {
          // Criar novo
          await prisma.patient.create({
            data: {
              id: change.entityId,
              professionalId,
              name: data.name,
              age: data.age,
              gender: data.gender,
              diagnosis: data.diagnosis,
              sidedAffected: data.sidedAffected,
              referringDoctor: data.referringDoctor,
              physiotherapist: data.physiotherapist,
              notes: data.notes,
            },
          });
        }
        break;
      }
      case 'DELETE':
        await prisma.patient.updateMany({
          where: {
            id: change.entityId,
            professionalId,
          },
          data: { isActive: false },
        });
        break;
    }
  }

  private async syncResult(
    professionalId: string,
    change: SyncChangeInput
  ): Promise<void> {
    const data = change.data as any;

    switch (change.operation) {
      case 'CREATE':
      case 'UPDATE': {
        // Verificar se já existe
        const existing = await prisma.result.findFirst({
          where: {
            id: change.entityId,
            professionalId,
          },
        });

        if (existing) {
          // Resolver conflito por timestamp
          const localTime = new Date(change.localTimestamp);
          const serverTime = existing.updatedAt;

          if (localTime > serverTime) {
            await prisma.result.update({
              where: { id: change.entityId },
              data: {
                responses: data.responses,
                scores: data.scores,
                interpretation: data.interpretation,
              },
            });
          }
        } else {
          // Criar novo
          await prisma.result.create({
            data: {
              id: change.entityId,
              professionalId,
              patientId: data.patientId,
              questionnaireId: data.questionnaireId,
              questionnaireName: data.questionnaireName,
              questionnaireAcronym: data.questionnaireAcronym,
              responses: data.responses,
              scores: data.scores,
              interpretation: data.interpretation,
            },
          });
        }
        break;
      }
      case 'DELETE':
        await prisma.result.deleteMany({
          where: {
            id: change.entityId,
            professionalId,
          },
        });
        break;
    }
  }

  private async syncConsent(
    professionalId: string,
    change: SyncChangeInput
  ): Promise<void> {
    const data = change.data as any;

    switch (change.operation) {
      case 'CREATE':
      case 'UPDATE': {
        await prisma.consent.upsert({
          where: {
            id: change.entityId,
          },
          create: {
            id: change.entityId,
            professionalId,
            consentType: data.consentType,
            status: data.status,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            data: data.data,
          },
          update: {
            status: data.status,
            data: data.data,
          },
        });
        break;
      }
      case 'DELETE':
        await prisma.consent.deleteMany({
          where: {
            id: change.entityId,
            professionalId,
          },
        });
        break;
    }
  }

  async getSyncStatus(professionalId: string): Promise<{
    pendingCount: number;
    lastSyncAt: string | null;
    conflicts: number;
  }> {
    const [pendingCount, conflicts, lastSync] = await Promise.all([
      prisma.syncLog.count({
        where: {
          professionalId,
          status: SyncStatus.PENDING,
        },
      }),
      prisma.syncLog.count({
        where: {
          professionalId,
          status: SyncStatus.CONFLICT,
        },
      }),
      prisma.syncLog.findFirst({
        where: {
          professionalId,
          status: SyncStatus.SYNCED,
        },
        orderBy: { syncedAt: 'desc' },
      }),
    ]);

    return {
      pendingCount,
      lastSyncAt: lastSync?.syncedAt?.toISOString() || null,
      conflicts,
    };
  }
}

