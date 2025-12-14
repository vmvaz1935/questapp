/**
 * Background Sync API - Sincronização em segundo plano
 * Implementa fila de operações pendentes e retry automático
 */

export interface SyncOperation {
  id: string;
  type: 'save' | 'delete' | 'update';
  dataKey: string;
  data: any;
  userId: string;
  timestamp: number;
  retries: number;
  maxRetries?: number;
}

const SYNC_QUEUE_KEY = 'fisioq_sync_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos

/**
 * Adiciona operação à fila de sincronização
 */
export function addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getSyncQueue();
  const newOperation: SyncOperation = {
    ...operation,
    id: `${operation.type}_${operation.dataKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: operation.maxRetries || MAX_RETRIES,
  };

  queue.push(newOperation);
  saveSyncQueue(queue);
}

/**
 * Obtém fila de sincronização do IndexedDB
 */
export function getSyncQueue(): SyncOperation[] {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao ler fila de sincronização:', error);
    return [];
  }
}

/**
 * Salva fila de sincronização no IndexedDB
 */
function saveSyncQueue(queue: SyncOperation[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Erro ao salvar fila de sincronização:', error);
  }
}

/**
 * Remove operação da fila após sucesso
 */
export function removeFromSyncQueue(operationId: string): void {
  const queue = getSyncQueue();
  const filtered = queue.filter(op => op.id !== operationId);
  saveSyncQueue(filtered);
}

/**
 * Incrementa contador de tentativas de uma operação
 */
export function incrementRetry(operationId: string): void {
  const queue = getSyncQueue();
  const operation = queue.find(op => op.id === operationId);
  if (operation) {
    operation.retries += 1;
    operation.timestamp = Date.now(); // Atualizar timestamp para próxima tentativa
    saveSyncQueue(queue);
  }
}

/**
 * Processa fila de sincronização
 */
export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = { success: 0, failed: 0 };

  for (const operation of queue) {
    // Verificar se excedeu número máximo de tentativas
    if (operation.retries >= (operation.maxRetries || MAX_RETRIES)) {
      console.warn(`Operação ${operation.id} excedeu número máximo de tentativas. Removendo da fila.`);
      removeFromSyncQueue(operation.id);
      results.failed++;
      continue;
    }

    try {
      // Importar dinamicamente para evitar erros quando Supabase não está instalado
      const { saveToSupabase } = await import('./supabaseSync');
      
      await saveToSupabase(operation.userId, operation.dataKey, operation.data);
      
      // Sucesso: remover da fila
      removeFromSyncQueue(operation.id);
      results.success++;
    } catch (error) {
      console.error(`Erro ao processar operação ${operation.id}:`, error);
      
      // Incrementar contador de tentativas
      incrementRetry(operation.id);
      results.failed++;
    }
  }

  return results;
}

/**
 * Registra Background Sync no Service Worker (se disponível)
 */
export function registerBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'sync' in (self as any).registration) {
    navigator.serviceWorker.ready.then((registration: any) => {
      // Registrar tag de sincronização
      registration.sync.register('fisioq-sync').catch((error: Error) => {
        console.warn('Background Sync não disponível:', error);
      });
    });
  }
}

/**
 * Verifica se Background Sync está disponível
 */
export function isBackgroundSyncAvailable(): boolean {
  return 'serviceWorker' in navigator && 'sync' in (self as any).registration;
}

/**
 * Agenda próxima tentativa de sincronização
 */
export function scheduleNextSync(delayMs: number = RETRY_DELAY): void {
  setTimeout(() => {
    processSyncQueue().then(({ success, failed }) => {
      if (failed > 0) {
        // Se ainda houver falhas, agendar próxima tentativa
        scheduleNextSync(RETRY_DELAY * 2); // Backoff exponencial
      }
    });
  }, delayMs);
}

