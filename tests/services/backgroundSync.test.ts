import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  incrementRetry,
  processSyncQueue,
  isBackgroundSyncAvailable,
} from '../../services/backgroundSync';

describe('backgroundSync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addToSyncQueue', () => {
    it('deve adicionar operação à fila', () => {
      addToSyncQueue({
        type: 'save',
        dataKey: 'patients',
        data: [{ id: '1', nome: 'Teste' }],
        userId: 'user123',
      });

      const queue = getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].type).toBe('save');
      expect(queue[0].dataKey).toBe('patients');
      expect(queue[0].userId).toBe('user123');
      expect(queue[0].retries).toBe(0);
    });

    it('deve gerar ID único para cada operação', () => {
      addToSyncQueue({
        type: 'save',
        dataKey: 'patients',
        data: [],
        userId: 'user123',
      });

      addToSyncQueue({
        type: 'save',
        dataKey: 'results',
        data: [],
        userId: 'user123',
      });

      const queue = getSyncQueue();
      expect(queue.length).toBe(2);
      expect(queue[0].id).not.toBe(queue[1].id);
    });
  });

  describe('removeFromSyncQueue', () => {
    it('deve remover operação da fila', () => {
      addToSyncQueue({
        type: 'save',
        dataKey: 'patients',
        data: [],
        userId: 'user123',
      });

      const queue = getSyncQueue();
      const operationId = queue[0].id;

      removeFromSyncQueue(operationId);

      const updatedQueue = getSyncQueue();
      expect(updatedQueue.length).toBe(0);
    });
  });

  describe('incrementRetry', () => {
    it('deve incrementar contador de tentativas', () => {
      addToSyncQueue({
        type: 'save',
        dataKey: 'patients',
        data: [],
        userId: 'user123',
      });

      const queue = getSyncQueue();
      const operationId = queue[0].id;

      incrementRetry(operationId);

      const updatedQueue = getSyncQueue();
      expect(updatedQueue[0].retries).toBe(1);
    });
  });

  describe('isBackgroundSyncAvailable', () => {
    it('deve verificar disponibilidade do Background Sync', () => {
      // Mock do ambiente
      const result = isBackgroundSyncAvailable();
      // Resultado depende do ambiente de teste
      expect(typeof result).toBe('boolean');
    });
  });
});

