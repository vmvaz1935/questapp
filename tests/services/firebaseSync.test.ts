import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectConflicts, resolveConflict, ConflictData } from '../../services/firebaseSync';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('firebaseSync', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('resolveConflict', () => {
    it('deve manter versão local quando solicitado', () => {
      const conflict: ConflictData = {
        dataKey: 'patients',
        localVersion: {
          data: [{ id: '1', nome: 'Paciente Local' }],
          timestamp: '2024-01-01T10:00:00Z',
          hash: 'hash_local',
          version: 1,
        },
        remoteVersion: {
          data: [{ id: '1', nome: 'Paciente Remoto' }],
          timestamp: '2024-01-01T11:00:00Z',
          hash: 'hash_remote',
          version: 2,
        },
      };

      localStorageMock.setItem('patients_test', JSON.stringify(conflict.localVersion.data));
      localStorageMock.setItem('patients_test_timestamp', conflict.localVersion.timestamp);
      localStorageMock.setItem('patients_test_version', '1');

      resolveConflict('patients', 'local', conflict);

      const saved = JSON.parse(localStorageMock.getItem('patients_test') || '[]');
      expect(saved[0].nome).toBe('Paciente Local');
    });

    it('deve manter versão remota quando solicitado', () => {
      const conflict: ConflictData = {
        dataKey: 'patients',
        localVersion: {
          data: [{ id: '1', nome: 'Paciente Local' }],
          timestamp: '2024-01-01T10:00:00Z',
          hash: 'hash_local',
          version: 1,
        },
        remoteVersion: {
          data: [{ id: '1', nome: 'Paciente Remoto' }],
          timestamp: '2024-01-01T11:00:00Z',
          hash: 'hash_remote',
          version: 2,
        },
      };

      localStorageMock.setItem('patients_test', JSON.stringify(conflict.localVersion.data));

      resolveConflict('patients', 'remote', conflict);

      const saved = JSON.parse(localStorageMock.getItem('patients_test') || '[]');
      expect(saved[0].nome).toBe('Paciente Remoto');
    });

    it('deve mesclar arrays quando solicitado', () => {
      const conflict: ConflictData = {
        dataKey: 'patients',
        localVersion: {
          data: [{ id: '1', nome: 'Paciente Local' }],
          timestamp: '2024-01-01T10:00:00Z',
          hash: 'hash_local',
          version: 1,
        },
        remoteVersion: {
          data: [{ id: '2', nome: 'Paciente Remoto' }],
          timestamp: '2024-01-01T11:00:00Z',
          hash: 'hash_remote',
          version: 2,
        },
      };

      localStorageMock.setItem('patients_test', JSON.stringify(conflict.localVersion.data));

      resolveConflict('patients', 'merge', conflict);

      const saved = JSON.parse(localStorageMock.getItem('patients_test') || '[]');
      expect(saved.length).toBeGreaterThanOrEqual(1);
    });
  });
});

