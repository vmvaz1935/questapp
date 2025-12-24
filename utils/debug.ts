/**
 * Sistema de Debug para FisioQ
 * Fornece funções de diagnóstico para autenticação, armazenamento, sincronização, etc.
 */

import type {
  DiagnosticResult,
  DiagnosticCheck,
  DiagnosticStatus,
  AuthDiagnostic,
  StorageDiagnostic,
  SyncDiagnostic,
  RoutesDiagnostic,
  EncryptionDiagnostic,
  BuildDiagnostic,
} from '../types/debug';

/**
 * Cria um check de diagnóstico
 */
function createCheck(
  status: DiagnosticStatus,
  message: string,
  details?: Record<string, any>
): DiagnosticCheck {
  return {
    status,
    message,
    details,
    timestamp: Date.now(),
  };
}

/**
 * Verifica estado de autenticação
 */
export function checkAuthentication(): AuthDiagnostic {
  const timestamp = Date.now();
  
  // Verificar tokens
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const professionalId = localStorage.getItem('current_professional_id');
  const isGoogleAuth = localStorage.getItem('is_google_auth') === 'true';
  const professional = localStorage.getItem('professional');
  
  // Verificar Zustand store
  let zustandStore: DiagnosticCheck;
  try {
    // @ts-ignore - importação dinâmica
    const { useAuthStore } = require('../src/stores/authStore');
    const state = useAuthStore.getState();
    zustandStore = createCheck(
      state.professional ? 'ok' : 'warning',
      state.professional ? 'Zustand store contém profissional' : 'Zustand store vazio',
      { professional: state.professional ? { id: state.professional.id, email: state.professional.email } : null }
    );
  } catch (error) {
    zustandStore = createCheck('error', 'Erro ao acessar Zustand store', { error: String(error) });
  }
  
  return {
    isAuthenticated: createCheck(
      professionalId ? 'ok' : 'error',
      professionalId ? 'Usuário autenticado' : 'Usuário não autenticado',
      { professionalId }
    ),
    accessToken: createCheck(
      accessToken ? 'ok' : 'error',
      accessToken ? 'Access token presente' : 'Access token ausente',
      { hasToken: !!accessToken, length: accessToken?.length }
    ),
    refreshToken: createCheck(
      refreshToken ? 'ok' : 'warning',
      refreshToken ? 'Refresh token presente' : 'Refresh token ausente',
      { hasToken: !!refreshToken }
    ),
    professionalId: createCheck(
      professionalId ? 'ok' : 'error',
      professionalId ? `Professional ID: ${professionalId}` : 'Professional ID não encontrado',
      { professionalId }
    ),
    zustandStore,
    googleAuth: createCheck(
      isGoogleAuth ? 'ok' : 'unknown',
      isGoogleAuth ? 'Autenticação Google ativa' : 'Autenticação Google não ativa',
      { isGoogleAuth }
    ),
    timestamp,
  };
}

/**
 * Verifica armazenamento (localStorage e IndexedDB)
 */
export async function checkStorage(): Promise<StorageDiagnostic> {
  const timestamp = Date.now();
  const professionalId = localStorage.getItem('current_professional_id');
  
  // Verificar localStorage
  let localStorageStatus: DiagnosticStatus = 'ok';
  let localStorageMessage = 'localStorage disponível';
  let localStorageDetails: Record<string, any> = {};
  
  try {
    const testKey = '__fisioq_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    localStorageDetails.available = true;
    
    // Verificar quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      localStorageDetails.quota = estimate.quota;
      localStorageDetails.usage = estimate.usage;
      localStorageDetails.usagePercent = estimate.quota ? ((estimate.usage || 0) / estimate.quota * 100).toFixed(2) : null;
    }
  } catch (error) {
    localStorageStatus = 'error';
    localStorageMessage = 'Erro ao acessar localStorage';
    localStorageDetails.error = String(error);
  }
  
  // Verificar IndexedDB
  let indexedDBStatus: DiagnosticStatus = 'unknown';
  let indexedDBMessage = 'IndexedDB não verificado';
  let indexedDBDetails: Record<string, any> = {};
  
  if (professionalId) {
    try {
      const { getDatabase } = await import('../services/database');
      const db = getDatabase(professionalId);
      
      // Tentar contar registros
      const patientsCount = await db.patients.count();
      const resultsCount = await db.results.count();
      const questionnairesCount = await db.questionnaires.count();
      
      indexedDBStatus = 'ok';
      indexedDBMessage = 'IndexedDB disponível e acessível';
      indexedDBDetails = {
        databaseName: `FisioQ_${professionalId}`,
        patientsCount,
        resultsCount,
        questionnairesCount,
      };
    } catch (error) {
      indexedDBStatus = 'warning';
      indexedDBMessage = 'IndexedDB não disponível ou erro ao acessar';
      indexedDBDetails.error = String(error);
    }
  } else {
    indexedDBStatus = 'warning';
    indexedDBMessage = 'IndexedDB não verificado (sem professionalId)';
  }
  
  // Verificar dados específicos
  const patientsKey = professionalId ? `patients_${professionalId}` : null;
  const resultsKey = professionalId ? `results_${professionalId}` : null;
  const questionnairesKey = 'published_questionnaires';
  
  let patientsData: DiagnosticCheck;
  let resultsData: DiagnosticCheck;
  let questionnairesData: DiagnosticCheck;
  
  if (patientsKey) {
    try {
      const patients = JSON.parse(localStorage.getItem(patientsKey) || '[]');
      patientsData = createCheck(
        Array.isArray(patients) ? 'ok' : 'warning',
        `Pacientes: ${patients.length} registros`,
        { count: patients.length, key: patientsKey }
      );
    } catch (error) {
      patientsData = createCheck('error', 'Erro ao ler dados de pacientes', { error: String(error) });
    }
  } else {
    patientsData = createCheck('warning', 'Chave de pacientes não disponível (sem professionalId)', {});
  }
  
  if (resultsKey) {
    try {
      const results = JSON.parse(localStorage.getItem(resultsKey) || '[]');
      resultsData = createCheck(
        Array.isArray(results) ? 'ok' : 'warning',
        `Resultados: ${results.length} registros`,
        { count: results.length, key: resultsKey }
      );
    } catch (error) {
      resultsData = createCheck('error', 'Erro ao ler dados de resultados', { error: String(error) });
    }
  } else {
    resultsData = createCheck('warning', 'Chave de resultados não disponível (sem professionalId)', {});
  }
  
  try {
    const questionnaires = JSON.parse(localStorage.getItem(questionnairesKey) || '[]');
    questionnairesData = createCheck(
      Array.isArray(questionnaires) ? 'ok' : 'warning',
      `Questionários: ${questionnaires.length} registros`,
      { count: questionnaires.length, key: questionnairesKey }
    );
  } catch (error) {
    questionnairesData = createCheck('error', 'Erro ao ler dados de questionários', { error: String(error) });
  }
  
  // Verificar status de migração
  const migrationStatus = createCheck(
    indexedDBStatus === 'ok' ? 'ok' : 'warning',
    indexedDBStatus === 'ok' ? 'Migração para IndexedDB concluída' : 'Migração para IndexedDB não concluída',
    { indexedDBAvailable: indexedDBStatus === 'ok' }
  );
  
  return {
    localStorage: createCheck(localStorageStatus, localStorageMessage, localStorageDetails),
    localStorageQuota: createCheck(
      localStorageDetails.usagePercent && parseFloat(localStorageDetails.usagePercent) > 90 ? 'warning' : 'ok',
      localStorageDetails.usagePercent ? `Uso: ${localStorageDetails.usagePercent}%` : 'Quota não disponível',
      localStorageDetails
    ),
    indexedDB: createCheck(indexedDBStatus, indexedDBMessage, indexedDBDetails),
    indexedDBQuota: createCheck('unknown', 'Quota do IndexedDB não verificada', {}),
    patientsData,
    resultsData,
    questionnairesData,
    migrationStatus,
    timestamp,
  };
}

/**
 * Verifica sincronização
 */
export async function checkSync(): Promise<SyncDiagnostic> {
  const timestamp = Date.now();
  const professionalId = localStorage.getItem('current_professional_id');
  
  // Verificar Supabase
  let supabaseConfigured: DiagnosticCheck;
  try {
    const { isSupabaseConfigured, getSupabaseClient } = await import('../config/supabaseConfig');
    const client = getSupabaseClient();
    supabaseConfigured = createCheck(
      isSupabaseConfigured && client ? 'ok' : 'warning',
      isSupabaseConfigured && client ? 'Supabase configurado' : 'Supabase não configurado',
      { isConfigured: isSupabaseConfigured, hasClient: !!client }
    );
  } catch (error) {
    supabaseConfigured = createCheck('error', 'Erro ao verificar Supabase', { error: String(error) });
  }
  
  // Verificar Firebase
  let firebaseConfigured: DiagnosticCheck;
  try {
    const { isFirebaseConfigured } = await import('../config/firebaseConfig');
    firebaseConfigured = createCheck(
      isFirebaseConfigured ? 'ok' : 'unknown',
      isFirebaseConfigured ? 'Firebase configurado' : 'Firebase não configurado (opcional)',
      { isConfigured: isFirebaseConfigured }
    );
  } catch (error) {
    firebaseConfigured = createCheck('unknown', 'Firebase não disponível', {});
  }
  
  // Verificar Service Worker
  let serviceWorker: DiagnosticCheck;
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      serviceWorker = createCheck(
        registration ? 'ok' : 'warning',
        registration ? 'Service Worker registrado' : 'Service Worker não registrado',
        {
          registered: !!registration,
          state: registration?.active?.state,
          scope: registration?.scope,
        }
      );
    } catch (error) {
      serviceWorker = createCheck('error', 'Erro ao verificar Service Worker', { error: String(error) });
    }
  } else {
    serviceWorker = createCheck('error', 'Service Worker não suportado', {});
  }
  
  // Verificar Background Sync
  const backgroundSyncAvailable = 'sync' in (ServiceWorkerRegistration.prototype || {});
  const backgroundSync = createCheck(
    backgroundSyncAvailable ? 'ok' : 'warning',
    backgroundSyncAvailable ? 'Background Sync disponível' : 'Background Sync não disponível',
    { available: backgroundSyncAvailable }
  );
  
  // Verificar fila de sincronização
  let syncQueue: DiagnosticCheck;
  try {
    const syncQueueData = localStorage.getItem('sync_queue');
    const queue = syncQueueData ? JSON.parse(syncQueueData) : [];
    syncQueue = createCheck(
      Array.isArray(queue) ? 'ok' : 'warning',
      `Fila de sincronização: ${queue.length} itens`,
      { count: queue.length, items: queue.slice(0, 5) } // Mostrar apenas primeiros 5
    );
  } catch (error) {
    syncQueue = createCheck('error', 'Erro ao verificar fila de sincronização', { error: String(error) });
  }
  
  // Verificar última sincronização
  let lastSync: DiagnosticCheck;
  if (professionalId) {
    const patientsKey = `patients_${professionalId}`;
    const lastSyncTimestamp = localStorage.getItem(`${patientsKey}_timestamp`);
    lastSync = createCheck(
      lastSyncTimestamp ? 'ok' : 'warning',
      lastSyncTimestamp ? `Última sincronização: ${new Date(lastSyncTimestamp).toLocaleString()}` : 'Nenhuma sincronização registrada',
      { timestamp: lastSyncTimestamp }
    );
  } else {
    lastSync = createCheck('warning', 'Não é possível verificar última sincronização (sem professionalId)', {});
  }
  
  // Verificar conflitos
  let conflicts: DiagnosticCheck;
  try {
    if (professionalId) {
      // Tentar detectar conflitos (se função disponível)
      const { detectConflicts } = await import('../services/supabaseSync').catch(() => ({ detectConflicts: null }));
      if (detectConflicts) {
        const conflictList = await detectConflicts(professionalId).catch(() => []);
        conflicts = createCheck(
          conflictList.length === 0 ? 'ok' : 'warning',
          conflictList.length === 0 ? 'Nenhum conflito detectado' : `${conflictList.length} conflito(s) detectado(s)`,
          { count: conflictList.length }
        );
      } else {
        conflicts = createCheck('unknown', 'Detecção de conflitos não disponível', {});
      }
    } else {
      conflicts = createCheck('warning', 'Não é possível verificar conflitos (sem professionalId)', {});
    }
  } catch (error) {
    conflicts = createCheck('error', 'Erro ao verificar conflitos', { error: String(error) });
  }
  
  return {
    supabaseConfigured,
    firebaseConfigured,
    serviceWorker,
    backgroundSync,
    syncQueue,
    lastSync,
    conflicts,
    timestamp,
  };
}

/**
 * Verifica rotas e navegação
 */
export function checkRoutes(): RoutesDiagnostic {
  const timestamp = Date.now();
  
  // Verificar LGPD consent
  let lgpdConsent: DiagnosticCheck;
  try {
    const consent = localStorage.getItem('lgpd_consent');
    const consentData = consent ? JSON.parse(consent) : null;
    lgpdConsent = createCheck(
      consentData?.accepted ? 'ok' : 'warning',
      consentData?.accepted ? 'LGPD consent aceito' : 'LGPD consent não aceito',
      { accepted: consentData?.accepted, timestamp: consentData?.timestamp }
    );
  } catch (error) {
    lgpdConsent = createCheck('error', 'Erro ao verificar LGPD consent', { error: String(error) });
  }
  
  // Verificar rota atual
  const currentRoute = createCheck(
    'ok',
    `Rota atual: ${window.location.pathname}`,
    { pathname: window.location.pathname, hash: window.location.hash, search: window.location.search }
  );
  
  // Verificar ProtectedRoute (não podemos verificar diretamente, apenas inferir)
  const protectedRoute = createCheck(
    'unknown',
    'ProtectedRoute verificado via componente',
    {}
  );
  
  // Verificar histórico de navegação
  const navigationHistory = createCheck(
    'ok',
    `Histórico: ${window.history.length} entradas`,
    { length: window.history.length }
  );
  
  return {
    protectedRoute,
    lgpdConsent,
    currentRoute,
    navigationHistory,
    timestamp,
  };
}

/**
 * Verifica criptografia
 */
export async function checkEncryption(): Promise<EncryptionDiagnostic> {
  const timestamp = Date.now();
  
  // Verificar Web Crypto API
  const webCryptoAvailable = typeof crypto !== 'undefined' && 'subtle' in crypto;
  const webCrypto = createCheck(
    webCryptoAvailable ? 'ok' : 'error',
    webCryptoAvailable ? 'Web Crypto API disponível' : 'Web Crypto API não disponível',
    { available: webCryptoAvailable }
  );
  
  // Verificar cache de criptografia
  const professionalId = localStorage.getItem('current_professional_id');
  let encryptionCache: DiagnosticCheck;
  if (professionalId) {
    try {
      // Tentar acessar cache (se disponível)
      const { getDatabase } = await import('../services/database');
      const db = getDatabase(professionalId);
      const metadataRecord = await db.profiles
        .where('profileId')
        .equals(`key_metadata_${professionalId}`)
        .first();
      
      encryptionCache = createCheck(
        metadataRecord ? 'ok' : 'warning',
        metadataRecord ? 'Cache de criptografia encontrado' : 'Cache de criptografia não encontrado',
        { hasMetadata: !!metadataRecord }
      );
    } catch (error) {
      encryptionCache = createCheck('error', 'Erro ao verificar cache de criptografia', { error: String(error) });
    }
  } else {
    encryptionCache = createCheck('warning', 'Cache de criptografia não verificado (sem professionalId)', {});
  }
  
  // Verificar derivação de chave
  const keyDerivation = createCheck(
    webCryptoAvailable ? 'ok' : 'error',
    webCryptoAvailable ? 'Derivação de chave disponível' : 'Derivação de chave não disponível',
    {}
  );
  
  // Verificar geração de salt
  const saltGeneration = createCheck(
    webCryptoAvailable ? 'ok' : 'error',
    webCryptoAvailable ? 'Geração de salt disponível' : 'Geração de salt não disponível',
    {}
  );
  
  return {
    webCryptoAvailable: webCrypto,
    encryptionCache,
    keyDerivation,
    saltGeneration,
    timestamp,
  };
}

/**
 * Verifica build e ambiente
 */
export function checkBuild(): BuildDiagnostic {
  const timestamp = Date.now();
  
  const environment = createCheck(
    import.meta.env.DEV ? 'ok' : 'ok',
    `Ambiente: ${import.meta.env.MODE || 'unknown'}`,
    { mode: import.meta.env.MODE, dev: import.meta.env.DEV, prod: import.meta.env.PROD }
  );
  
  // Verificar versão do build (se disponível)
  const buildVersion = createCheck(
    'unknown',
    'Versão do build não disponível',
    {}
  );
  
  // Verificar URL da API
  const apiUrl = (import.meta as any).env?.VITE_API_URL || null;
  const apiUrlCheck = createCheck(
    apiUrl ? 'ok' : 'warning',
    apiUrl ? `API URL: ${apiUrl}` : 'API URL não configurada',
    { apiUrl }
  );
  
  // Verificar variáveis de ambiente importantes
  const envVariables = createCheck(
    'ok',
    'Variáveis de ambiente verificadas',
    {
      VITE_API_URL: !!(import.meta as any).env?.VITE_API_URL,
      VITE_ENABLE_SENTRY: !!(import.meta as any).env?.VITE_ENABLE_SENTRY,
      VITE_PLAUSIBLE_DOMAIN: !!(import.meta as any).env?.VITE_PLAUSIBLE_DOMAIN,
      VITE_SUPABASE_URL: !!(import.meta as any).env?.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY,
    }
  );
  
  return {
    environment,
    buildVersion,
    apiUrl: apiUrlCheck,
    envVariables,
    timestamp,
  };
}

/**
 * Executa diagnóstico completo
 */
export async function runDiagnostics(): Promise<DiagnosticResult> {
  const timestamp = Date.now();
  
  const [storage, sync, encryption] = await Promise.all([
    checkStorage(),
    checkSync(),
    checkEncryption(),
  ]);
  
  return {
    timestamp,
    authentication: checkAuthentication(),
    storage,
    sync,
    routes: checkRoutes(),
    encryption,
    build: checkBuild(),
  };
}

/**
 * Exporta diagnóstico completo como JSON
 */
export async function exportDiagnostics(): Promise<string> {
  const diagnostics = await runDiagnostics();
  return JSON.stringify(diagnostics, null, 2);
}

/**
 * Formata diagnóstico para exibição no console
 */
export function formatDiagnosticsForConsole(diagnostics: DiagnosticResult): void {
  console.group('🔍 Diagnóstico FisioQ');
  console.log('Timestamp:', new Date(diagnostics.timestamp).toLocaleString());
  
  console.group('🔐 Autenticação');
  console.log('Autenticado:', diagnostics.authentication.isAuthenticated.status === 'ok' ? '✅' : '❌');
  console.log('Access Token:', diagnostics.authentication.accessToken.status === 'ok' ? '✅' : '❌');
  console.log('Professional ID:', diagnostics.authentication.professionalId.details?.professionalId || 'N/A');
  console.groupEnd();
  
  console.group('💾 Armazenamento');
  console.log('localStorage:', diagnostics.storage.localStorage.status === 'ok' ? '✅' : '❌');
  console.log('IndexedDB:', diagnostics.storage.indexedDB.status === 'ok' ? '✅' : '❌');
  console.log('Pacientes:', diagnostics.storage.patientsData.details?.count || 0);
  console.log('Resultados:', diagnostics.storage.resultsData.details?.count || 0);
  console.groupEnd();
  
  console.group('🔄 Sincronização');
  console.log('Supabase:', diagnostics.sync.supabaseConfigured.status === 'ok' ? '✅' : '❌');
  console.log('Firebase:', diagnostics.sync.firebaseConfigured.status === 'ok' ? '✅' : '⚠️');
  console.log('Service Worker:', diagnostics.sync.serviceWorker.status === 'ok' ? '✅' : '❌');
  console.log('Background Sync:', diagnostics.sync.backgroundSync.status === 'ok' ? '✅' : '❌');
  console.log('Fila de Sync:', diagnostics.sync.syncQueue.details?.count || 0);
  console.groupEnd();
  
  console.group('🔒 Criptografia');
  console.log('Web Crypto API:', diagnostics.encryption.webCryptoAvailable.status === 'ok' ? '✅' : '❌');
  console.log('Cache:', diagnostics.encryption.encryptionCache.status === 'ok' ? '✅' : '❌');
  console.groupEnd();
  
  console.group('🌐 Build');
  console.log('Ambiente:', diagnostics.build.environment.details?.mode || 'unknown');
  console.log('API URL:', diagnostics.build.apiUrl.details?.apiUrl || 'N/A');
  console.groupEnd();
  
  console.groupEnd();
}

