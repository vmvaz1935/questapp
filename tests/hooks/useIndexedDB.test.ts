import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIndexedDB } from '../../hooks/useIndexedDB';

// Mock do Dexie
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => null),
}));

// Mock do IndexedDB
const mockDB = {
  patients: {
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        first: vi.fn(() => Promise.resolve(null)),
      })),
    })),
    add: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
  },
};

vi.mock('../../services/database', () => ({
  getDatabase: vi.fn(() => mockDB),
}));

describe('useIndexedDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar valor padrão quando não há dados', async () => {
    const { result } = renderHook(() =>
      useIndexedDB({
        store: 'patients',
        key: 'test-key',
        encrypt: false,
        defaultValue: { name: 'Default' },
      })
    );

    expect(result.current[0]).toEqual({ name: 'Default' });
  });

  it('deve inicializar com valor padrão', () => {
    const { result } = renderHook(() =>
      useIndexedDB({
        store: 'patients',
        key: 'test-key',
        encrypt: false,
        defaultValue: [],
      })
    );

    expect(result.current[0]).toEqual([]);
  });

    it('deve retornar estado de inicialização', () => {
      const { result } = renderHook(() =>
        useIndexedDB({
          store: 'patients',
          key: 'test-key',
          encrypt: false,
          defaultValue: null,
        })
      );

      // Verifica se o terceiro elemento é boolean (isInitialized)
      expect(typeof result.current[2]).toBe('boolean');
    });
});

