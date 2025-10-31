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

// Database class
export class FisioQDatabase extends Dexie {
  patients!: Table<PatientData, number>;
  questionnaires!: Table<QuestionnaireData, number>;
  results!: Table<ResultData, number>;
  profiles!: Table<ProfileData, number>;
  consents!: Table<ConsentData, number>;

  constructor(professionalId: string) {
    super(`FisioQ_${professionalId}`);
    
    this.version(1).stores({
      patients: '++id, patientId, professionalId, createdAt, updatedAt',
      questionnaires: '++id, questionnaireId, professionalId, createdAt, updatedAt',
      results: '++id, resultId, patientId, questionnaireId, professionalId, createdAt, updatedAt',
      profiles: '++id, profileId, createdAt, updatedAt',
      consents: '++id, professionalId, timestamp',
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

