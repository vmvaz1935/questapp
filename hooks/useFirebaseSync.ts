// Hook para sincronizar dados entre localStorage e Firebase
import { useEffect, useCallback, useState } from 'react';
import { saveToFirebase, syncAllData, loadAllDataFromFirebase, detectConflicts, resolveConflict, ConflictData } from '../services/firebaseSync';
import { isFirebaseConfigured } from '../config/firebaseConfig';
import { addToSyncQueue, processSyncQueue, registerBackgroundSync, isBackgroundSyncAvailable, scheduleNextSync } from '../services/backgroundSync';

interface UseFirebaseSyncOptions {
  userId: string | null;
  isGoogleAuth: boolean; // Indica se o usuário autenticou com Google
}

/**
 * Hook para sincronização automática com Firebase
 * Inclui detecção e resolução de conflitos
 */
export function useFirebaseSync({ userId, isGoogleAuth }: UseFirebaseSyncOptions) {
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Carregar dados do Firebase na inicialização (se autenticado com Google)
  useEffect(() => {
    if (userId && isGoogleAuth && isFirebaseConfigured) {
      const loadData = async () => {
        setIsCheckingConflicts(true);
        try {
          const detectedConflicts = await loadAllDataFromFirebase(userId);
          if (detectedConflicts.length > 0) {
            setConflicts(detectedConflicts);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do Firebase:', error);
        } finally {
          setIsCheckingConflicts(false);
        }
      };
      loadData();
    }
  }, [userId, isGoogleAuth]);

  // Processar fila de sincronização quando online
  useEffect(() => {
    const handleOnline = () => {
      if (userId && isGoogleAuth && isFirebaseConfigured) {
        processSyncQueue().then(({ success, failed }) => {
          if (success > 0) {
            console.log(`Sincronização concluída: ${success} operações bem-sucedidas`);
          }
          if (failed > 0) {
            console.warn(`${failed} operações falharam e serão tentadas novamente`);
          }
        });
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Processar imediatamente se já estiver online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [userId, isGoogleAuth]);

  // Função para salvar dados específicos no Firebase
  const syncData = useCallback(async (dataKey: string, data: any) => {
    if (!userId || !isGoogleAuth || !isFirebaseConfigured) {
      return;
    }

    // Salvar timestamp e versão local antes de sincronizar
    const storageKey = dataKey === 'questionnaires' 
      ? 'published_questionnaires' 
      : `${dataKey}_${userId}`;
    const timestamp = new Date().toISOString();
    localStorage.setItem(`${storageKey}_timestamp`, timestamp);
    const currentVersion = parseInt(localStorage.getItem(`${storageKey}_version`) || '0', 10);
    localStorage.setItem(`${storageKey}_version`, String(currentVersion + 1));
    
    try {
      // Tentar salvar diretamente
      await saveToFirebase(userId, dataKey, data);
    } catch (error) {
      // Se falhar (ex: offline), adicionar à fila de sincronização
      console.warn('Falha ao sincronizar, adicionando à fila:', error);
      addToSyncQueue({
        type: 'save',
        dataKey,
        data,
        userId,
      });
      
      // Registrar Background Sync se disponível
      if (isBackgroundSyncAvailable()) {
        registerBackgroundSync();
      } else {
        // Fallback: agendar próxima tentativa
        scheduleNextSync();
      }
    }
  }, [userId, isGoogleAuth]);

  // Função para sincronizar todos os dados
  const syncAll = useCallback(async () => {
    if (userId && isGoogleAuth && isFirebaseConfigured) {
      setIsCheckingConflicts(true);
      try {
        // Detectar conflitos antes de sincronizar
        const detectedConflicts = await detectConflicts(userId);
        if (detectedConflicts.length > 0) {
          setConflicts(detectedConflicts);
          return; // Parar sincronização até resolver conflitos
        }
        
        await syncAllData(userId);
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
      } finally {
        setIsCheckingConflicts(false);
      }
    }
  }, [userId, isGoogleAuth]);

  // Função para resolver conflito
  const handleResolveConflict = useCallback((dataKey: string, keepVersion: 'local' | 'remote' | 'merge') => {
    const conflict = conflicts.find(c => c.dataKey === dataKey);
    if (conflict) {
      resolveConflict(dataKey, keepVersion, conflict);
      
      // Remover conflito resolvido
      setConflicts(prev => prev.filter(c => c.dataKey !== dataKey));
      
      // Continuar sincronização após resolver
      if (conflicts.length === 1) {
        syncAll();
      }
    }
  }, [conflicts, syncAll]);

  return { 
    syncData, 
    syncAll, 
    conflicts, 
    isCheckingConflicts,
    resolveConflict: handleResolveConflict,
    clearConflicts: () => setConflicts([]),
  };
}

