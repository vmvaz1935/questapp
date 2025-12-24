/**
 * Types para sistema de debug do FisioQ
 */

export type DiagnosticStatus = 'ok' | 'warning' | 'error' | 'unknown';

export interface DiagnosticCheck {
  status: DiagnosticStatus;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface AuthDiagnostic {
  isAuthenticated: DiagnosticCheck;
  accessToken: DiagnosticCheck;
  refreshToken: DiagnosticCheck;
  professionalId: DiagnosticCheck;
  zustandStore: DiagnosticCheck;
  googleAuth: DiagnosticCheck;
  timestamp: number;
}

export interface StorageDiagnostic {
  localStorage: DiagnosticCheck;
  localStorageQuota: DiagnosticCheck;
  indexedDB: DiagnosticCheck;
  indexedDBQuota: DiagnosticCheck;
  patientsData: DiagnosticCheck;
  resultsData: DiagnosticCheck;
  questionnairesData: DiagnosticCheck;
  migrationStatus: DiagnosticCheck;
  timestamp: number;
}

export interface SyncDiagnostic {
  supabaseConfigured: DiagnosticCheck;
  firebaseConfigured: DiagnosticCheck;
  serviceWorker: DiagnosticCheck;
  backgroundSync: DiagnosticCheck;
  syncQueue: DiagnosticCheck;
  lastSync: DiagnosticCheck;
  conflicts: DiagnosticCheck;
  timestamp: number;
}

export interface RoutesDiagnostic {
  protectedRoute: DiagnosticCheck;
  lgpdConsent: DiagnosticCheck;
  currentRoute: DiagnosticCheck;
  navigationHistory: DiagnosticCheck;
  timestamp: number;
}

export interface EncryptionDiagnostic {
  webCryptoAvailable: DiagnosticCheck;
  encryptionCache: DiagnosticCheck;
  keyDerivation: DiagnosticCheck;
  saltGeneration: DiagnosticCheck;
  timestamp: number;
}

export interface BuildDiagnostic {
  environment: DiagnosticCheck;
  buildVersion: DiagnosticCheck;
  apiUrl: DiagnosticCheck;
  envVariables: DiagnosticCheck;
  timestamp: number;
}

export interface DiagnosticResult {
  timestamp: number;
  authentication: AuthDiagnostic;
  storage: StorageDiagnostic;
  sync: SyncDiagnostic;
  routes: RoutesDiagnostic;
  encryption: EncryptionDiagnostic;
  build: BuildDiagnostic;
}

export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: Record<string, any>;
}

export interface DebugPanelState {
  isOpen: boolean;
  activeTab: 'auth' | 'storage' | 'sync' | 'routes' | 'encryption' | 'build' | 'logs';
  logs: DebugLogEntry[];
  lastDiagnostic?: DiagnosticResult;
  isRunningDiagnostics: boolean;
}

