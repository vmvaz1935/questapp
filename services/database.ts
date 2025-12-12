import Dexie, { Table } from 'dexie';

// Interfaces para os dados
export interface PatientData {
  id?: number;
  patientId: string;
  professionalId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireData {
  id?: number;
  questionnaireId: string;
  professionalId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface ResultData {
  id?: number;
  resultId: string;
  patientId: string;
  questionnaireId: string;
  professionalId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  id?: number;
  profileId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentData {
  id?: number;
  professionalId: string;
  data: any;
  timestamp: string;
  version: string;
}

export interface DraftData {
  id?: number;
  draftId: string;
  questionnaireId: string;
  patientId?: string;
  professionalId: string;
  answers: Record<string, number>;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// Database class
export class FisioQDatabase extends Dexie {
  patients!: Table<PatientData, number>;
  questionnaires!: Table<QuestionnaireData, number>;
  results!: Table<ResultData, number>;
  profiles!: Table<ProfileData, number>;
  consents!: Table<ConsentData, number>;
  drafts!: Table<DraftData, number>;

  constructor(professionalId: string) {
    super(`FisioQ_${professionalId}`);
    
    this.version(1).stores({
      patients: '++id, patientId, professionalId, createdAt, updatedAt',
      questionnaires: '++id, questionnaireId, professionalId, createdAt, updatedAt',
      results: '++id, resultId, patientId, questionnaireId, professionalId, createdAt, updatedAt',
      profiles: '++id, profileId, createdAt, updatedAt',
      consents: '++id, professionalId, timestamp',
    });

    // Versão 2: adicionar store de drafts
    this.version(2).stores({
      patients: '++id, patientId, professionalId, createdAt, updatedAt',
      questionnaires: '++id, questionnaireId, professionalId, createdAt, updatedAt',
      results: '++id, resultId, patientId, questionnaireId, professionalId, createdAt, updatedAt',
      profiles: '++id, profileId, createdAt, updatedAt',
      consents: '++id, professionalId, timestamp',
      drafts: '++id, draftId, questionnaireId, patientId, professionalId, createdAt, updatedAt',
    });

    // Versão 3: otimizar índices para queries mais rápidas
    this.version(3).stores({
      patients: '++id, patientId, professionalId, createdAt, updatedAt, [professionalId+updatedAt]',
      questionnaires: '++id, questionnaireId, professionalId, createdAt, updatedAt',
      results: '++id, resultId, patientId, questionnaireId, professionalId, createdAt, updatedAt, [patientId+questionnaireId], [professionalId+createdAt], [patientId+createdAt]',
      profiles: '++id, profileId, createdAt, updatedAt',
      consents: '++id, professionalId, timestamp, [professionalId+timestamp]',
      drafts: '++id, draftId, questionnaireId, patientId, professionalId, createdAt, updatedAt, [questionnaireId+patientId], [professionalId+updatedAt]',
    });
  }
}

// Factory function para criar instância do database
export function createDatabase(professionalId: string): FisioQDatabase {
  return new FisioQDatabase(professionalId);
}

// Helper para obter database singleton por professionalId
const databaseCache = new Map<string, FisioQDatabase>();

export function getDatabase(professionalId: string): FisioQDatabase {
  if (!databaseCache.has(professionalId)) {
    databaseCache.set(professionalId, createDatabase(professionalId));
  }
  return databaseCache.get(professionalId)!;
}

