import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAutosave } from '../../hooks/useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve iniciar no estado idle', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    
    const { result } = renderHook(() =>
      useAutosave({
        value: { test: 'data' },
        onSave,
      })
    );

    expect(result.current.status).toBe('idle');
  });

  it('deve salvar após debounce', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave, debounceMs: 500 }),
      { initialProps: { value: { test: 'data1' }, onSave } }
    );

    // Mudar valor
    rerender({ value: { test: 'data2' }, onSave });

    // Avançar timer
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ test: 'data2' });
    });
  });

  it('deve atualizar status para saving durante salvamento', async () => {
    const onSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave, debounceMs: 100 }),
      { initialProps: { value: { test: 'data1' }, onSave } }
    );

    rerender({ value: { test: 'data2' }, onSave });
    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(result.current.status).toBe('saving');
    });
  });

  it('deve tratar erros de salvamento', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Erro ao salvar'));
    const onError = vi.fn();
    
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave, onError, debounceMs: 100 }),
      { initialProps: { value: { test: 'data1' }, onSave, onError } }
    );

    rerender({ value: { test: 'data2' }, onSave, onError });
    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeDefined();
      expect(onError).toHaveBeenCalled();
    });
  });
});

