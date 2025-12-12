import { useState, useEffect, useCallback, useRef } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutosaveOptions<T> {
  value: T;
  debounceMs?: number;
  onSave: (value: T) => Promise<void>;
  onError?: (error: Error) => void;
}

export interface UseAutosaveReturn {
  status: AutosaveStatus;
  lastSaved: Date | null;
  error: Error | null;
  saveNow: () => Promise<void>;
}

/**
 * Hook para autosave com feedback visual
 * Gerencia salvamento automático com debounce e feedback de status
 */
export function useAutosave<T>({
  value,
  debounceMs = 500,
  onSave,
  onError,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const previousValueRef = useRef<T>(value);

  // Função de salvamento
  const save = useCallback(async () => {
    // Verificar se o valor realmente mudou
    if (JSON.stringify(previousValueRef.current) === JSON.stringify(value)) {
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      // Chamar callback de salvamento
      await onSave(value);

      previousValueRef.current = value;
      setStatus('saved');
      setLastSaved(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido ao salvar');
      setError(error);
      setStatus('error');
      
      if (onError) {
        onError(error);
      } else {
        console.error('Erro no autosave:', error);
      }
    }
  }, [value, onSave, onError]);

  // Debounce do salvamento
  useEffect(() => {
    // Não salvar na montagem inicial
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousValueRef.current = value;
      return;
    }

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Criar novo timer
    debounceTimerRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, debounceMs, save]);

  // Função para forçar salvamento imediato
  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await save();
  }, [save]);

  // Resetar status 'saved' após 3 segundos
  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    status,
    lastSaved,
    error,
    saveNow,
  };
}

