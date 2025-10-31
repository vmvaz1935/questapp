// Hook para sincronizar dados entre localStorage e Firebase
import { useEffect, useCallback } from 'react';
import { saveToFirebase, syncAllData, loadAllDataFromFirebase } from '../services/firebaseSync';
import { isFirebaseConfigured } from '../config/firebaseConfig';

interface UseFirebaseSyncOptions {
  userId: string | null;
  isGoogleAuth: boolean; // Indica se o usuário autenticou com Google
}

/**
 * Hook para sincronização automática com Firebase
 */
export function useFirebaseSync({ userId, isGoogleAuth }: UseFirebaseSyncOptions) {
  // Carregar dados do Firebase na inicialização (se autenticado com Google)
  useEffect(() => {
    if (userId && isGoogleAuth && isFirebaseConfigured) {
      loadAllDataFromFirebase(userId);
    }
  }, [userId, isGoogleAuth]);

  // Função para salvar dados específicos no Firebase
  const syncData = useCallback(async (dataKey: string, data: any) => {
    if (userId && isGoogleAuth && isFirebaseConfigured) {
      await saveToFirebase(userId, dataKey, data);
    }
  }, [userId, isGoogleAuth]);

  // Função para sincronizar todos os dados
  const syncAll = useCallback(async () => {
    if (userId && isGoogleAuth && isFirebaseConfigured) {
      await syncAllData(userId);
    }
  }, [userId, isGoogleAuth]);

  return { syncData, syncAll };
}

