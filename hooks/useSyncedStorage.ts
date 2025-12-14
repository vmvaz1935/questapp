// Hook que sincroniza localStorage com Supabase automaticamente
import { useState, useEffect, useCallback } from 'react';
import { saveToSupabase, loadFromSupabase } from '../services/supabaseSync';
import { isSupabaseConfigured } from '../config/supabaseConfig';

interface UseSyncedStorageOptions {
  userId: string | null;
  isAuthenticated: boolean;
  dataKey: string; // Chave do localStorage (ex: 'patients_123')
  supabaseKey: string; // Chave no Supabase (ex: 'patients')
  initialValue: any;
}

/**
 * Hook que combina localStorage com sincronização Supabase
 */
export function useSyncedStorage<T>({
  userId,
  isAuthenticated,
  dataKey,
  supabaseKey,
  initialValue
}: UseSyncedStorageOptions): [T, (value: T | ((prev: T) => T)) => void] {
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(dataKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao carregar ${dataKey} do localStorage:`, error);
      return initialValue;
    }
  });

  // Carregar do Supabase na inicialização (se autenticado)
  useEffect(() => {
    if (userId && isAuthenticated && isSupabaseConfigured) {
      loadFromSupabase(userId, supabaseKey).then((supabaseData) => {
        if (supabaseData !== null && Array.isArray(supabaseData) && supabaseData.length > 0) {
          const localData = JSON.parse(localStorage.getItem(dataKey) || '[]');
          // Usar dados do Supabase se tiver mais itens ou se localStorage estiver vazio
          if (supabaseData.length >= localData.length || localData.length === 0) {
            setStoredValue(supabaseData as T);
            localStorage.setItem(dataKey, JSON.stringify(supabaseData));
          }
        }
      }).catch(error => {
        console.error(`Erro ao carregar ${supabaseKey} do Supabase:`, error);
      });
    }
  }, [userId, isAuthenticated, dataKey, supabaseKey]);

  // Função para atualizar valor (salva em ambos: localStorage e Supabase)
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Salvar no localStorage (sempre)
      localStorage.setItem(dataKey, JSON.stringify(valueToStore));
      
      // Salvar no Supabase (se autenticado)
      if (userId && isAuthenticated && isSupabaseConfigured) {
        saveToSupabase(userId, supabaseKey, valueToStore).catch(error => {
          console.error(`Erro ao salvar ${supabaseKey} no Supabase:`, error);
          // Não bloqueia a aplicação se o Supabase falhar
        });
      }
    } catch (error) {
      console.error(`Erro ao salvar ${dataKey}:`, error);
    }
  }, [storedValue, dataKey, supabaseKey, userId, isAuthenticated]);

  return [storedValue, setValue];
}

