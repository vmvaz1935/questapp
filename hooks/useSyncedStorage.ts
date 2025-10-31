// Hook que sincroniza localStorage com Firebase automaticamente
import { useState, useEffect, useCallback } from 'react';
import { saveToFirebase, loadFromFirebase } from '../services/firebaseSync';
import { isFirebaseConfigured } from '../config/firebaseConfig';

interface UseSyncedStorageOptions {
  userId: string | null;
  isGoogleAuth: boolean;
  dataKey: string; // Chave do localStorage (ex: 'patients_123')
  firebaseKey: string; // Chave no Firebase (ex: 'patients')
  initialValue: any;
}

/**
 * Hook que combina localStorage com sincronização Firebase
 */
export function useSyncedStorage<T>({
  userId,
  isGoogleAuth,
  dataKey,
  firebaseKey,
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

  // Carregar do Firebase na inicialização (se autenticado com Google)
  useEffect(() => {
    if (userId && isGoogleAuth && isFirebaseConfigured) {
      loadFromFirebase(userId, firebaseKey).then((firebaseData) => {
        if (firebaseData !== null && Array.isArray(firebaseData) && firebaseData.length > 0) {
          const localData = JSON.parse(localStorage.getItem(dataKey) || '[]');
          // Usar dados do Firebase se tiver mais itens ou se localStorage estiver vazio
          if (firebaseData.length >= localData.length || localData.length === 0) {
            setStoredValue(firebaseData as T);
            localStorage.setItem(dataKey, JSON.stringify(firebaseData));
          }
        }
      }).catch(error => {
        console.error(`Erro ao carregar ${firebaseKey} do Firebase:`, error);
      });
    }
  }, [userId, isGoogleAuth, dataKey, firebaseKey]);

  // Função para atualizar valor (salva em ambos: localStorage e Firebase)
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Salvar no localStorage (sempre)
      localStorage.setItem(dataKey, JSON.stringify(valueToStore));
      
      // Salvar no Firebase (se autenticado com Google)
      if (userId && isGoogleAuth && isFirebaseConfigured) {
        saveToFirebase(userId, firebaseKey, valueToStore).catch(error => {
          console.error(`Erro ao salvar ${firebaseKey} no Firebase:`, error);
          // Não bloqueia a aplicação se o Firebase falhar
        });
      }
    } catch (error) {
      console.error(`Erro ao salvar ${dataKey}:`, error);
    }
  }, [storedValue, dataKey, firebaseKey, userId, isGoogleAuth]);

  return [storedValue, setValue];
}

