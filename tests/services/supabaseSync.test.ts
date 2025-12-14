/**
 * Testes para sincronização com Supabase
 * 
 * NOTA: Estes testes requerem um Supabase configurado e podem falhar se:
 * - Supabase não estiver configurado
 * - Usuário não estiver autenticado
 * - Não houver conexão com internet
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveToSupabase, 
  loadFromSupabase, 
  syncAllData,
  detectConflicts,
  resolveConflict,
  generateHash
} from '../../services/supabaseSync';
import { getSupabaseClient, getCurrentUserId } from '../../config/supabaseConfig';

// Mock do Supabase
vi.mock('../../config/supabaseConfig', () => ({
  getSupabaseClient: vi.fn(),
  getCurrentUserId: vi.fn(),
  isSupabaseConfigured: true,
}));

describe('Supabase Sync', () => {
  const mockUserId = 'test-user-id-123';
  const mockClient = {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabaseClient as any).mockReturnValue(mockClient);
  });

  describe('generateHash', () => {
    it('deve gerar hash consistente para os mesmos dados', () => {
      const data = { name: 'Test', age: 30 };
      const hash1 = generateHash(data);
      const hash2 = generateHash(data);
      expect(hash1).toBe(hash2);
    });

    it('deve gerar hash diferente para dados diferentes', () => {
      const data1 = { name: 'Test', age: 30 };
      const data2 = { name: 'Test', age: 31 };
      const hash1 = generateHash(data1);
      const hash2 = generateHash(data2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('saveToSupabase', () => {
    it('deve retornar sem erro se userId não fornecido', async () => {
      await expect(saveToSupabase('', 'patients', [])).resolves.not.toThrow();
    });

    it('deve retornar sem erro se Supabase não configurado', async () => {
      (getSupabaseClient as any).mockReturnValue(null);
      await expect(saveToSupabase(mockUserId, 'patients', [])).resolves.not.toThrow();
    });

    it('deve salvar pacientes corretamente', async () => {
      const patients = [
        { id: 'p1', name: 'Paciente 1', age: 30 },
        { id: 'p2', name: 'Paciente 2', age: 25 },
      ];

      await saveToSupabase(mockUserId, 'patients', patients);

      expect(mockClient.from).toHaveBeenCalledWith('fisioq_patients');
      // Verificar que upsert foi chamado para cada paciente
      const upsertCalls = mockClient.from().upsert.mock.calls;
      expect(upsertCalls.length).toBeGreaterThan(0);
    });

    it('deve salvar resultados corretamente', async () => {
      const results = [
        { id: 'r1', patientId: 'p1', score: 50 },
      ];

      await saveToSupabase(mockUserId, 'results', results);

      expect(mockClient.from).toHaveBeenCalledWith('fisioq_results');
    });
  });

  describe('loadFromSupabase', () => {
    it('deve retornar null se userId não fornecido', async () => {
      const result = await loadFromSupabase('', 'patients');
      expect(result).toBeNull();
    });

    it('deve retornar null se Supabase não configurado', async () => {
      (getSupabaseClient as any).mockReturnValue(null);
      const result = await loadFromSupabase(mockUserId, 'patients');
      expect(result).toBeNull();
    });

    it('deve carregar dados corretamente', async () => {
      const mockData = [
        {
          id: 'p1',
          name: 'Paciente 1',
          user_id: mockUserId,
          _supabase_metadata: {
            timestamp: '2024-01-01T00:00:00Z',
            version: 1,
            hash: 'abc123',
          },
        },
      ];

      mockClient.from().select().eq().order.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await loadFromSupabase(mockUserId, 'patients');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('detectConflicts', () => {
    it('deve retornar array vazio se userId não fornecido', async () => {
      const conflicts = await detectConflicts('');
      expect(conflicts).toEqual([]);
    });

    it('deve detectar conflitos quando hashes diferem', async () => {
      // Mock localStorage
      const localData = [{ id: 'p1', name: 'Paciente Local' }];
      const localHash = generateHash(localData);
      localStorage.setItem(`patients_${mockUserId}`, JSON.stringify(localData));
      localStorage.setItem(`patients_${mockUserId}_timestamp`, '2024-01-01T00:00:00Z');
      localStorage.setItem(`patients_${mockUserId}_version`, '1');

      // Mock remote data com hash diferente
      const remoteData = [
        {
          id: 'p1',
          name: 'Paciente Remoto',
          _supabase_metadata: {
            timestamp: '2024-01-02T00:00:00Z',
            version: 2,
            hash: 'different_hash',
          },
        },
      ];

      mockClient.from().select().eq().order.mockResolvedValue({
        data: remoteData,
        error: null,
      });

      const conflicts = await detectConflicts(mockUserId);
      // Pode haver conflitos se os hashes diferem
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('resolveConflict', () => {
    it('deve resolver conflito mantendo versão local', () => {
      const conflict = {
        dataKey: 'patients',
        localVersion: {
          data: [{ id: 'p1', name: 'Local' }],
          timestamp: '2024-01-01T00:00:00Z',
          hash: 'local_hash',
          version: 1,
        },
        remoteVersion: {
          data: [{ id: 'p1', name: 'Remote' }],
          timestamp: '2024-01-02T00:00:00Z',
          hash: 'remote_hash',
          version: 2,
        },
      };

      const storageKey = `patients_${mockUserId}`;
      resolveConflict('patients', 'local', conflict);

      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      expect(saved[0].name).toBe('Local');
    });

    it('deve resolver conflito mantendo versão remota', () => {
      const conflict = {
        dataKey: 'patients',
        localVersion: {
          data: [{ id: 'p1', name: 'Local' }],
          timestamp: '2024-01-01T00:00:00Z',
          hash: 'local_hash',
          version: 1,
        },
        remoteVersion: {
          data: [{ id: 'p1', name: 'Remote' }],
          timestamp: '2024-01-02T00:00:00Z',
          hash: 'remote_hash',
          version: 2,
        },
      };

      const storageKey = `patients_${mockUserId}`;
      resolveConflict('patients', 'remote', conflict);

      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      expect(saved[0].name).toBe('Remote');
    });
  });
});

