import apiClient, { isBackendEnabled, isOnline } from './apiClient';
import { getDatabase } from './database';

// Tipos para sincronização
export interface SyncChange {
  entityType: 'PATIENT' | 'RESULT' | 'CONSENT';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  localTimestamp: string; // ISO 8601
  data: any;
}

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

// Interface para sincronização
interface SyncQueueItem {
  id: string;
  change: SyncChange;
  attempts: number;
  lastAttemptAt?: number;
}

export class BackendSyncService {
  private static syncQueue: SyncQueueItem[] = [];
  private static isSyncing = false;

  /**
   * Adicionar mudança à fila de sincronização
   */
  static async queueChange(change: SyncChange): Promise<void> {
    // Carregar fila do IndexedDB
    const queueKey = `sync_queue_${change.entityType}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]') as SyncQueueItem[];

    const queueItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      change,
      attempts: 0,
    };

    queue.push(queueItem);
    localStorage.setItem(queueKey, JSON.stringify(queue));
    this.syncQueue = queue;

    // Tentar sincronizar imediatamente se online
    if (isOnline() && isBackendEnabled()) {
      this.sync();
    }
  }

  /**
   * Sincronizar mudanças pendentes
   */
  static async sync(): Promise<SyncResult> {
    if (this.isSyncing || !isOnline() || !isBackendEnabled()) {
      return { synced: 0, failed: 0, conflicts: [], errors: [] };
    }

    this.isSyncing = true;

    try {
      // Carregar todas as filas
      const allChanges: SyncChange[] = [];
      const queueKeys = ['sync_queue_PATIENT', 'sync_queue_RESULT', 'sync_queue_CONSENT'];

      for (const key of queueKeys) {
        const queue = JSON.parse(localStorage.getItem(key) || '[]') as SyncQueueItem[];
        const unsynced = queue.filter((item) => item.attempts < 3);
        allChanges.push(...unsynced.map((item) => item.change));
      }

      if (allChanges.length === 0) {
        this.isSyncing = false;
        return { synced: 0, failed: 0, conflicts: [], errors: [] };
      }

      // Enviar para backend
      const response = await apiClient.post<SyncResult>('/sync', {
        changes: allChanges,
      });

      // Processar resultado
      const result = response.data;

      // Marcar mudanças sincronizadas como concluídas
      for (const key of queueKeys) {
        const queue = JSON.parse(localStorage.getItem(key) || '[]') as SyncQueueItem[];
        const updatedQueue = queue.map((item) => {
          const synced = result.synced > 0 && allChanges.some((c) => c.entityId === item.change.entityId);
          if (synced) {
            return { ...item, attempts: 999 }; // Marcar como concluído
          }
          return { ...item, attempts: item.attempts + 1, lastAttemptAt: Date.now() };
        }).filter((item) => item.attempts < 3); // Remover após 3 tentativas

        localStorage.setItem(key, JSON.stringify(updatedQueue));
      }

      this.isSyncing = false;
      return result;
    } catch (error: any) {
      this.isSyncing = false;
      console.error('Sync failed:', error);
      return {
        synced: 0,
        failed: 1,
        conflicts: [],
        errors: [{ entityId: 'unknown', error: error.message }],
      };
    }
  }

  /**
   * Sincronizar pacientes específicos
   */
  static async syncPatients(professionalId: string): Promise<void> {
    if (!isOnline() || !isBackendEnabled()) {
      return;
    }

    try {
      const db = getDatabase(professionalId);
      const localPatients = await db.patients.toArray();

      // Converter para formato do backend
      const changes: SyncChange[] = localPatients.map((p) => ({
        entityType: 'PATIENT' as const,
        entityId: p.patientId,
        operation: 'CREATE' as const, // Ou UPDATE se já existir
        localTimestamp: p.updatedAt || p.createdAt,
        data: p.data,
      }));

      if (changes.length > 0) {
        await apiClient.post('/sync', { changes });
      }
    } catch (error) {
      console.error('Failed to sync patients:', error);
    }
  }

  /**
   * Sincronizar resultados específicos
   */
  static async syncResults(professionalId: string): Promise<void> {
    if (!isOnline() || !isBackendEnabled()) {
      return;
    }

    try {
      const db = getDatabase(professionalId);
      const localResults = await db.results.toArray();

      // Converter para formato do backend
      const changes: SyncChange[] = localResults.map((r) => ({
        entityType: 'RESULT' as const,
        entityId: r.resultId,
        operation: 'CREATE' as const,
        localTimestamp: r.updatedAt || r.createdAt,
        data: r.data,
      }));

      if (changes.length > 0) {
        await apiClient.post('/sync', { changes });
      }
    } catch (error) {
      console.error('Failed to sync results:', error);
    }
  }

  /**
   * Buscar dados do servidor e mesclar com local
   */
  static async pullFromServer(professionalId: string): Promise<void> {
    if (!isOnline() || !isBackendEnabled()) {
      return;
    }

    try {
      const db = getDatabase(professionalId);

      // Buscar pacientes do servidor
      const patientsResponse = await apiClient.get('/patients');
      const serverPatients = patientsResponse.data.data || [];

      // Mesclar com dados locais
      for (const serverPatient of serverPatients) {
        const localPatient = await db.patients
          .where('patientId')
          .equals(serverPatient.id)
          .first();

        if (!localPatient || new Date(serverPatient.updatedAt) > new Date(localPatient.updatedAt)) {
          // Atualizar com dados do servidor (mais recente)
          await db.patients.put({
            patientId: serverPatient.id,
            professionalId,
            data: serverPatient,
            createdAt: serverPatient.createdAt,
            updatedAt: serverPatient.updatedAt,
          });
        }
      }

      // Buscar resultados do servidor
      const resultsResponse = await apiClient.get('/results');
      const serverResults = resultsResponse.data.data || [];

      // Mesclar com dados locais
      for (const serverResult of serverResults) {
        const localResult = await db.results
          .where('resultId')
          .equals(serverResult.id)
          .first();

        if (!localResult || new Date(serverResult.updatedAt) > new Date(localResult.updatedAt)) {
          // Atualizar com dados do servidor (mais recente)
          await db.results.put({
            resultId: serverResult.id,
            patientId: serverResult.patientId,
            questionnaireId: serverResult.questionnaireId,
            professionalId,
            data: serverResult,
            createdAt: serverResult.createdAt,
            updatedAt: serverResult.updatedAt,
          });
        }
      }
    } catch (error) {
      console.error('Failed to pull from server:', error);
    }
  }
}

