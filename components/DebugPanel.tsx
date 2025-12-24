/**
 * Painel de Debug do FisioQ
 * Apenas disponível em desenvolvimento
 */

import React, { useEffect, useState } from 'react';
import { useDebug } from '../hooks/useDebug';
import { DebugTab } from './DebugTab';
import { DebugIndicator } from './DebugIndicator';
import type { DiagnosticResult, DebugLogEntry } from '../types/debug';
import {
  checkAuthentication,
  checkStorage,
  checkSync,
  checkRoutes,
  checkEncryption,
  checkBuild,
} from '../utils/debug';

// Componente de Debug Panel
// Apenas renderiza em desenvolvimento
export const DebugPanel: React.FC = () => {
  // Em produção, não renderizar nada
  if (import.meta.env.PROD) {
    return null;
  }
  
  // Em desenvolvimento, renderizar o painel
  const {
    state,
    addLog,
    runDiagnostic,
    exportDiagnostic,
    clearLogs,
    togglePanel,
    setActiveTab,
    closePanel,
  } = useDebug();
    
    const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(state.lastDiagnostic || null);
    
    // Atalho de teclado: Ctrl+Shift+D
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          togglePanel();
        }
      };
      
      // Listener para evento customizado de abertura
      const handleOpenPanel = () => {
        openPanel();
      };
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('fisioq:open-debug-panel', handleOpenPanel);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('fisioq:open-debug-panel', handleOpenPanel);
    };
  }, [togglePanel, openPanel]);
  
  // Executar diagnóstico quando painel abrir
  useEffect(() => {
    if (state.isOpen && !diagnostics) {
      runDiagnostic().then(setDiagnostics).catch(console.error);
    }
  }, [state.isOpen, diagnostics, runDiagnostic]);
  
  const handleRunDiagnostics = async () => {
    const result = await runDiagnostic();
    setDiagnostics(result);
  };
  
  const handleExport = async () => {
    await exportDiagnostic();
  };
  
  const handleClearCache = () => {
    if (confirm('Tem certeza que deseja limpar o cache? Isso não afetará os dados do usuário.')) {
      // Limpar apenas cache de diagnóstico, não dados do usuário
      localStorage.removeItem('sync_queue');
      addLog('info', 'cache', 'Cache limpo');
    }
  };
  
  if (!state.isOpen) {
    return null;
  }
    
    const tabs = [
      { id: 'auth', label: 'Autenticação', icon: '🔐' },
      { id: 'storage', label: 'Armazenamento', icon: '💾' },
      { id: 'sync', label: 'Sincronização', icon: '🔄' },
      { id: 'routes', label: 'Rotas', icon: '🌐' },
      { id: 'encryption', label: 'Criptografia', icon: '🔒' },
      { id: 'build', label: 'Build', icon: '⚙️' },
      { id: 'logs', label: 'Logs', icon: '📋' },
    ];
    
    const errorCount = state.logs.filter(log => log.level === 'error').length;
    const warningCount = state.logs.filter(log => log.level === 'warn').length;
    
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closePanel();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-panel-title"
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 id="debug-panel-title" className="text-xl font-bold text-gray-900 dark:text-white">
              🔍 Painel de Debug - FisioQ
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunDiagnostics}
                disabled={state.isRunningDiagnostics}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isRunningDiagnostics ? 'Executando...' : 'Executar Diagnóstico'}
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Exportar
              </button>
              <button
                onClick={closePanel}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <DebugTab
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={state.activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                badge={
                  tab.id === 'logs'
                    ? errorCount + warningCount > 0
                      ? errorCount + warningCount
                      : undefined
                    : undefined
                }
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.activeTab === 'auth' && diagnostics && (
              <AuthTab diagnostics={diagnostics.authentication} />
            )}
            {state.activeTab === 'storage' && diagnostics && (
              <StorageTab diagnostics={diagnostics.storage} />
            )}
            {state.activeTab === 'sync' && diagnostics && (
              <SyncTab diagnostics={diagnostics.sync} />
            )}
            {state.activeTab === 'routes' && diagnostics && (
              <RoutesTab diagnostics={diagnostics.routes} />
            )}
            {state.activeTab === 'encryption' && diagnostics && (
              <EncryptionTab diagnostics={diagnostics.encryption} />
            )}
            {state.activeTab === 'build' && diagnostics && (
              <BuildTab diagnostics={diagnostics.build} />
            )}
            {state.activeTab === 'logs' && (
              <LogsTab logs={state.logs} onClear={clearLogs} />
            )}
            {!diagnostics && state.activeTab !== 'logs' && (
              <div className="text-center text-gray-500 py-8">
                Execute o diagnóstico para ver os dados
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Atalho: Ctrl+Shift+D | {diagnostics && new Date(diagnostics.timestamp).toLocaleString()}
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Limpar Cache
            </button>
          </div>
        </div>
      </div>
    );
};

// Componentes de abas individuais
function AuthTab({ diagnostics }: { diagnostics: DiagnosticResult['authentication'] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Autenticação</h3>
      <div className="space-y-2">
        <CheckItem check={diagnostics.isAuthenticated} label="Autenticado" />
        <CheckItem check={diagnostics.accessToken} label="Access Token" />
        <CheckItem check={diagnostics.refreshToken} label="Refresh Token" />
        <CheckItem check={diagnostics.professionalId} label="Professional ID" />
        <CheckItem check={diagnostics.zustandStore} label="Zustand Store" />
        <CheckItem check={diagnostics.googleAuth} label="Google Auth" />
      </div>
    </div>
  );
}

function StorageTab({ diagnostics }: { diagnostics: DiagnosticResult['storage'] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Armazenamento</h3>
      <div className="space-y-2">
        <CheckItem check={diagnostics.localStorage} label="localStorage" />
        <CheckItem check={diagnostics.localStorageQuota} label="Quota localStorage" />
        <CheckItem check={diagnostics.indexedDB} label="IndexedDB" />
        <CheckItem check={diagnostics.patientsData} label="Dados de Pacientes" />
        <CheckItem check={diagnostics.resultsData} label="Dados de Resultados" />
        <CheckItem check={diagnostics.questionnairesData} label="Dados de Questionários" />
        <CheckItem check={diagnostics.migrationStatus} label="Status de Migração" />
      </div>
    </div>
  );
}

function SyncTab({ diagnostics }: { diagnostics: DiagnosticResult['sync'] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sincronização</h3>
      <div className="space-y-2">
        <CheckItem check={diagnostics.supabaseConfigured} label="Supabase" />
        <CheckItem check={diagnostics.firebaseConfigured} label="Firebase" />
        <CheckItem check={diagnostics.serviceWorker} label="Service Worker" />
        <CheckItem check={diagnostics.backgroundSync} label="Background Sync" />
        <CheckItem check={diagnostics.syncQueue} label="Fila de Sincronização" />
        <CheckItem check={diagnostics.lastSync} label="Última Sincronização" />
        <CheckItem check={diagnostics.conflicts} label="Conflitos" />
      </div>
    </div>
  );
}

function RoutesTab({ diagnostics }: { diagnostics: DiagnosticResult['routes'] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Rotas</h3>
      <div className="space-y-2">
        <CheckItem check={diagnostics.lgpdConsent} label="LGPD Consent" />
        <CheckItem check={diagnostics.currentRoute} label="Rota Atual" />
        <CheckItem check={diagnostics.navigationHistory} label="Histórico" />
      </div>
    </div>
  );
}

function EncryptionTab({ diagnostics }: { diagnostics: DiagnosticResult['encryption'] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Criptografia</h3>
      <div className="space-y-2">
        <CheckItem check={diagnostics.webCryptoAvailable} label="Web Crypto API" />
        <CheckItem check={diagnostics.encryptionCache} label="Cache de Criptografia" />
        <CheckItem check={diagnostics.keyDerivation} label="Derivação de Chave" />
        <CheckItem check={diagnostics.saltGeneration} label="Geração de Salt" />
      </div>
    </div>
  );
}

function BuildTab({ diagnostics }: { diagnostics: DiagnosticResult['build'] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Build e Ambiente</h3>
      <div className="space-y-2">
        <CheckItem check={diagnostics.environment} label="Ambiente" />
        <CheckItem check={diagnostics.buildVersion} label="Versão" />
        <CheckItem check={diagnostics.apiUrl} label="API URL" />
        <CheckItem check={diagnostics.envVariables} label="Variáveis de Ambiente" />
      </div>
    </div>
  );
}

function LogsTab({ logs, onClear }: { logs: DebugLogEntry[]; onClear: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Logs de Debug</h3>
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Limpar Logs
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Nenhum log disponível</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded border-l-4 ${
                log.level === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : log.level === 'warn'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                      {log.category}
                    </span>
                    <span className="text-xs font-semibold uppercase">{log.level}</span>
                  </div>
                  <p className="mt-1 text-sm">{log.message}</p>
                  {log.data && (
                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckItem({ check, label }: { check: any; label: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex items-center gap-3">
        <DebugIndicator status={check.status} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {check.message}
      </div>
      {check.details && Object.keys(check.details).length > 0 && (
        <details className="ml-4">
          <summary className="cursor-pointer text-xs text-gray-500">Detalhes</summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
            {JSON.stringify(check.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

