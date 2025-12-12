import { describe, it, expect, beforeEach } from 'vitest';
import { resolveConflict, ConflictData } from '../../services/firebaseSync';

describe('Sync Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('resolveConflict - integração', () => {
    it('deve resolver conflito e manter backup', () => {
      const conflict: ConflictData = {
        dataKey: 'results',
        localVersion: {
          data: [{ id: '1', score: 50 }],
          timestamp: '2024-01-01T10:00:00Z',
          hash: 'hash_local',
          version: 1,
        },
        remoteVersion: {
          data: [{ id: '1', score: 60 }],
          timestamp: '2024-01-01T11:00:00Z',
          hash: 'hash_remote',
          version: 2,
        },
      };

      localStorage.setItem('results_test', JSON.stringify(conflict.localVersion.data));
      localStorage.setItem('results_test_timestamp', conflict.localVersion.timestamp);
      localStorage.setItem('results_test_version', '1');

      resolveConflict('results', 'remote', conflict);

      // Verificar que versão remota foi salva
      const saved = JSON.parse(localStorage.getItem('results_test') || '[]');
      expect(saved[0].score).toBe(60);

      // Verificar que backup foi criado
      const backupKeys = Object.keys(localStorage).filter(key => key.includes('backup'));
      expect(backupKeys.length).toBeGreaterThan(0);
    });
  });
});

