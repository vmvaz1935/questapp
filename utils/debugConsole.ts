/**
 * Scripts de console para debug do FisioQ
 * Disponibiliza window.fisioqDebug para uso no console do navegador
 */

import {
  runDiagnostics,
  checkAuthentication,
  checkStorage,
  checkSync,
  checkRoutes,
  checkEncryption,
  checkBuild,
  exportDiagnostics,
  formatDiagnosticsForConsole,
} from './debug';

declare global {
  interface Window {
    fisioqDebug: {
      quick: () => Promise<void>;
      auth: () => Promise<void>;
      storage: () => Promise<void>;
      sync: () => Promise<void>;
      routes: () => Promise<void>;
      encryption: () => Promise<void>;
      build: () => Promise<void>;
      full: () => Promise<void>;
      export: () => Promise<void>;
      clear: () => void;
      help: () => void;
    };
  }
}

/**
 * Inicializa window.fisioqDebug
 * Apenas em desenvolvimento
 */
export function initDebugConsole(): void {
  if (import.meta.env.PROD) {
    return; // Não inicializar em produção
  }
  
  if (typeof window === 'undefined') {
    return; // Não está no navegador
  }
  
  // Verificar se já foi inicializado
  if (window.fisioqDebug) {
    console.warn('fisioqDebug já foi inicializado');
    return;
  }
  
  window.fisioqDebug = {
    /**
     * Diagnóstico rápido (apenas autenticação e storage)
     */
    async quick() {
      console.group('🔍 Diagnóstico Rápido - FisioQ');
      try {
        const auth = checkAuthentication();
        const storage = await checkStorage();
        
        console.log('Autenticação:', auth.isAuthenticated.status === 'ok' ? '✅' : '❌');
        console.log('Professional ID:', auth.professionalId.details?.professionalId || 'N/A');
        console.log('localStorage:', storage.localStorage.status === 'ok' ? '✅' : '❌');
        console.log('IndexedDB:', storage.indexedDB.status === 'ok' ? '✅' : '❌');
        console.log('Pacientes:', storage.patientsData.details?.count || 0);
        console.log('Resultados:', storage.resultsData.details?.count || 0);
      } catch (error) {
        console.error('Erro ao executar diagnóstico rápido:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Verificar autenticação
     */
    async auth() {
      console.group('🔐 Autenticação');
      try {
        const result = checkAuthentication();
        console.log('Autenticado:', result.isAuthenticated.status === 'ok' ? '✅' : '❌');
        console.log('Access Token:', result.accessToken.status === 'ok' ? '✅' : '❌');
        console.log('Refresh Token:', result.refreshToken.status === 'ok' ? '✅' : '❌');
        console.log('Professional ID:', result.professionalId.details?.professionalId || 'N/A');
        console.log('Zustand Store:', result.zustandStore.status === 'ok' ? '✅' : '❌');
        console.log('Google Auth:', result.googleAuth.status === 'ok' ? '✅' : '❌');
        console.table({
          'Autenticado': result.isAuthenticated.status,
          'Access Token': result.accessToken.status,
          'Refresh Token': result.refreshToken.status,
          'Professional ID': result.professionalId.details?.professionalId || 'N/A',
        });
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Verificar armazenamento
     */
    async storage() {
      console.group('💾 Armazenamento');
      try {
        const result = await checkStorage();
        console.log('localStorage:', result.localStorage.status === 'ok' ? '✅' : '❌');
        console.log('IndexedDB:', result.indexedDB.status === 'ok' ? '✅' : '❌');
        console.log('Pacientes:', result.patientsData.details?.count || 0);
        console.log('Resultados:', result.resultsData.details?.count || 0);
        console.log('Questionários:', result.questionnairesData.details?.count || 0);
        if (result.localStorageQuota.details?.usagePercent) {
          console.log('Uso de Quota:', `${result.localStorageQuota.details.usagePercent}%`);
        }
        console.table({
          'localStorage': result.localStorage.status,
          'IndexedDB': result.indexedDB.status,
          'Pacientes': result.patientsData.details?.count || 0,
          'Resultados': result.resultsData.details?.count || 0,
          'Questionários': result.questionnairesData.details?.count || 0,
        });
      } catch (error) {
        console.error('Erro ao verificar armazenamento:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Verificar sincronização
     */
    async sync() {
      console.group('🔄 Sincronização');
      try {
        const result = await checkSync();
        console.log('Supabase:', result.supabaseConfigured.status === 'ok' ? '✅' : '❌');
        console.log('Firebase:', result.firebaseConfigured.status === 'ok' ? '✅' : '⚠️');
        console.log('Service Worker:', result.serviceWorker.status === 'ok' ? '✅' : '❌');
        console.log('Background Sync:', result.backgroundSync.status === 'ok' ? '✅' : '❌');
        console.log('Fila de Sync:', result.syncQueue.details?.count || 0);
        console.log('Última Sync:', result.lastSync.message);
        console.log('Conflitos:', result.conflicts.details?.count || 0);
        console.table({
          'Supabase': result.supabaseConfigured.status,
          'Firebase': result.firebaseConfigured.status,
          'Service Worker': result.serviceWorker.status,
          'Background Sync': result.backgroundSync.status,
          'Fila': result.syncQueue.details?.count || 0,
        });
      } catch (error) {
        console.error('Erro ao verificar sincronização:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Verificar rotas
     */
    async routes() {
      console.group('🌐 Rotas');
      try {
        const result = checkRoutes();
        console.log('LGPD Consent:', result.lgpdConsent.status === 'ok' ? '✅' : '❌');
        console.log('Rota Atual:', result.currentRoute.details?.pathname || 'N/A');
        console.log('Histórico:', result.navigationHistory.details?.length || 0);
        console.table({
          'LGPD Consent': result.lgpdConsent.status,
          'Rota Atual': result.currentRoute.details?.pathname || 'N/A',
          'Histórico': result.navigationHistory.details?.length || 0,
        });
      } catch (error) {
        console.error('Erro ao verificar rotas:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Verificar criptografia
     */
    async encryption() {
      console.group('🔒 Criptografia');
      try {
        const result = await checkEncryption();
        console.log('Web Crypto API:', result.webCryptoAvailable.status === 'ok' ? '✅' : '❌');
        console.log('Cache:', result.encryptionCache.status === 'ok' ? '✅' : '❌');
        console.log('Derivação de Chave:', result.keyDerivation.status === 'ok' ? '✅' : '❌');
        console.log('Geração de Salt:', result.saltGeneration.status === 'ok' ? '✅' : '❌');
        console.table({
          'Web Crypto API': result.webCryptoAvailable.status,
          'Cache': result.encryptionCache.status,
          'Derivação de Chave': result.keyDerivation.status,
          'Geração de Salt': result.saltGeneration.status,
        });
      } catch (error) {
        console.error('Erro ao verificar criptografia:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Verificar build
     */
    async build() {
      console.group('⚙️ Build e Ambiente');
      try {
        const result = checkBuild();
        console.log('Ambiente:', result.environment.details?.mode || 'unknown');
        console.log('API URL:', result.apiUrl.details?.apiUrl || 'N/A');
        console.table(result.envVariables.details || {});
      } catch (error) {
        console.error('Erro ao verificar build:', error);
      }
      console.groupEnd();
    },
    
    /**
     * Diagnóstico completo
     */
    async full() {
      try {
        const result = await runDiagnostics();
        formatDiagnosticsForConsole(result);
        return result;
      } catch (error) {
        console.error('Erro ao executar diagnóstico completo:', error);
        throw error;
      }
    },
    
    /**
     * Exportar diagnóstico como JSON
     */
    async export() {
      try {
        const json = await exportDiagnostics();
        console.log('Diagnóstico exportado. Cole no console para ver:');
        console.log(json);
        
        // Também criar download automático
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fisioq-diagnostic-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Arquivo baixado!');
      } catch (error) {
        console.error('Erro ao exportar diagnóstico:', error);
        throw error;
      }
    },
    
    /**
     * Limpar cache e dados de debug
     */
    clear() {
      if (confirm('Tem certeza que deseja limpar o cache? Isso não afetará os dados do usuário.')) {
        localStorage.removeItem('sync_queue');
        console.log('✅ Cache limpo!');
      } else {
        console.log('❌ Operação cancelada');
      }
    },
    
    /**
     * Mostrar ajuda
     */
    help() {
      console.group('📖 Ajuda - fisioqDebug');
      console.log('Comandos disponíveis:');
      console.log('  fisioqDebug.quick()      - Diagnóstico rápido');
      console.log('  fisioqDebug.auth()       - Verificar autenticação');
      console.log('  fisioqDebug.storage()    - Verificar armazenamento');
      console.log('  fisioqDebug.sync()       - Verificar sincronização');
      console.log('  fisioqDebug.routes()     - Verificar rotas');
      console.log('  fisioqDebug.encryption()  - Verificar criptografia');
      console.log('  fisioqDebug.build()      - Verificar build');
      console.log('  fisioqDebug.full()      - Diagnóstico completo');
      console.log('  fisioqDebug.export()    - Exportar diagnóstico');
      console.log('  fisioqDebug.clear()      - Limpar cache');
      console.log('  fisioqDebug.help()       - Mostrar esta ajuda');
      console.groupEnd();
    },
  };
  
  // Mostrar mensagem de inicialização
  console.log('%c🔍 FisioQ Debug Console', 'color: #2563eb; font-size: 16px; font-weight: bold;');
  console.log('Digite fisioqDebug.help() para ver os comandos disponíveis');
}

