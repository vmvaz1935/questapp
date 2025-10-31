import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDatabase } from '../services/database';
import { encryptData, decryptData } from '../services/encryption';
import { useAuth } from '../context/AuthContext';

interface UseIndexedDBOptions<T> {
  store: 'patients' | 'questionnaires' | 'results' | 'profiles' | 'consents';
  key: string;
  encrypt?: boolean; // Se deve criptografar os dados
  defaultValue?: T;
}

/**
 * Hook para usar IndexedDB com criptografia opcional
 * Substitui useLocalStorage para dados sensíveis
 */
export function useIndexedDB<T>({
  store,
  key,
  encrypt = false,
  defaultValue,
}: UseIndexedDBOptions<T>) {
  const { professionalId } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Obter database
  const db = professionalId ? getDatabase(professionalId) : null;

  // Query reativa usando Dexie React Hooks
  const data = useLiveQuery(async () => {
    if (!db || !professionalId) return defaultValue;

    try {
      // Construir query baseado no store
      let query;
      if (store === 'patients') {
        query = (db[store] as any).where('patientId').equals(key.includes('_') ? key.split('_')[1] : key);
      } else if (store === 'questionnaires') {
        query = (db[store] as any).where('questionnaireId').equals(key.includes('_') ? key.split('_')[1] : key);
      } else if (store === 'results') {
        query = (db[store] as any).where('resultId').equals(key.includes('_') ? key.split('_')[1] : key);
      } else if (store === 'profiles') {
        query = (db[store] as any).where('profileId').equals(key.includes('_') ? key.split('_')[1] : key);
      } else if (store === 'consents') {
        query = (db[store] as any).where('professionalId').equals(professionalId);
      } else {
        query = (db[store] as any).where('id').equals(parseInt(key) || key);
      }

      const record = await query.first();
      if (!record) return defaultValue;

      let decryptedData = record.data;
      if (encrypt && typeof decryptedData === 'string') {
        try {
          decryptedData = await decryptData(decryptedData, professionalId);
        } catch (e) {
          console.warn('Erro ao descriptografar dados:', e);
          return defaultValue;
        }
      }

      return decryptedData as T;
    } catch (e) {
      console.error('Erro ao ler do IndexedDB:', e);
      setError(e as Error);
      return defaultValue;
    }
  }, [db, store, key, encrypt, professionalId, defaultValue]);

  // Função para atualizar dados
  const setValue = async (value: T | ((prev: T | undefined) => T)) => {
    if (!db || !professionalId) {
      console.warn('Database não disponível');
      return;
    }

    try {
      const finalValue = typeof value === 'function' ? (value as any)(data) : value;
      
      let dataToStore = finalValue;
      if (encrypt) {
        dataToStore = await encryptData(finalValue, professionalId) as any;
      }

      const now = new Date().toISOString();
      const recordKey = key.includes('_') ? { [key.split('_')[0]]: key.split('_')[1] } : { id: key };

      // Verificar se existe
      const existing = await (db[store] as any).where(recordKey).first();
      
      if (existing) {
        await (db[store] as any).update(existing.id, {
          data: dataToStore,
          updatedAt: now,
        });
      } else {
        const newRecord: any = {
          ...recordKey,
          data: dataToStore,
          createdAt: now,
          updatedAt: now,
        };
        
        // Adicionar professionalId se aplicável
        if (store !== 'profiles') {
          newRecord.professionalId = professionalId;
        }
        
        // Adicionar campos específicos por store
        if (store === 'results') {
          newRecord.resultId = key;
        } else if (store === 'patients') {
          newRecord.patientId = key;
        } else if (store === 'questionnaires') {
          newRecord.questionnaireId = key;
        } else if (store === 'profiles') {
          newRecord.profileId = key;
        }

        await (db[store] as any).add(newRecord);
      }

      setError(null);
    } catch (e) {
      console.error('Erro ao salvar no IndexedDB:', e);
      setError(e as Error);
    }
  };

  useEffect(() => {
    if (db) {
      setIsInitialized(true);
    }
  }, [db]);

  return [data, setValue, isInitialized, error] as const;
}

/**
 * Hook simplificado para migração de localStorage para IndexedDB
 * Mantém compatibilidade com useLocalStorage
 */
export function useSecureStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const { professionalId } = useAuth();
  const [data, setData, isInitialized] = useIndexedDB<T>({
    store: 'profiles',
    key: `storage_${key}`,
    encrypt: true,
    defaultValue,
  });

  // Fallback para localStorage durante migração
  const [fallbackData, setFallbackData] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Migrar dados do localStorage para IndexedDB na primeira vez
  useEffect(() => {
    if (!professionalId || !isInitialized) return;

    const migrate = async () => {
      try {
        const item = localStorage.getItem(key);
        if (item && (!data || (typeof data === 'object' && Object.keys(data as any).length === 0))) {
          const parsed = JSON.parse(item);
          await setData(parsed);
          // Remover do localStorage após migração bem-sucedida
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('Erro na migração de localStorage para IndexedDB:', e);
      }
    };

    migrate();
  }, [professionalId, isInitialized, key, data, setData]);

  const finalData = isInitialized && data !== undefined ? data : fallbackData;

  const setValue = (value: T | ((prev: T) => T)) => {
    if (isInitialized) {
      setData(value);
    } else {
      setFallbackData(value);
      try {
        localStorage.setItem(key, JSON.stringify(typeof value === 'function' ? value(finalData) : value));
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }
    }
  };

  return [finalData, setValue];
}

