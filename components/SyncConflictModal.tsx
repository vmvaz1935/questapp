import React from 'react';

export interface ConflictData {
  dataKey: string;
  localVersion: {
    data: any;
    timestamp: string;
    hash: string;
  };
  remoteVersion: {
    data: any;
    timestamp: string;
    hash: string;
  };
}

interface SyncConflictModalProps {
  conflicts: ConflictData[];
  isOpen: boolean;
  onResolve: (dataKey: string, keepVersion: 'local' | 'remote' | 'merge') => void;
  onCancel: () => void;
}

/**
 * Modal para resolução de conflitos de sincronização
 */
export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  conflicts,
  isOpen,
  onResolve,
  onCancel,
}) => {
  if (!isOpen || conflicts.length === 0) {
    return null;
  }

  const formatDate = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const getDataKeyLabel = (key: string): string => {
    const labels: Record<string, string> = {
      patients: 'Pacientes',
      results: 'Resultados',
      questionnaires: 'Questionários',
      profiles: 'Perfis',
    };
    return labels[key] || key;
  };

  const getDataPreview = (data: any): string => {
    if (Array.isArray(data)) {
      return `${data.length} item(ns)`;
    }
    if (typeof data === 'object' && data !== null) {
      return `${Object.keys(data).length} campo(s)`;
    }
    return String(data).substring(0, 50);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-conflict-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 id="sync-conflict-title" className="text-xl font-bold text-gray-800 dark:text-white">
                Conflitos de Sincronização Detectados
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Fechar"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Foram detectados {conflicts.length} conflito(s). Escolha qual versão manter para cada item.
          </p>
        </div>

        {/* Conflicts List */}
        <div className="p-4 space-y-4">
          {conflicts.map((conflict, index) => (
            <div
              key={conflict.dataKey}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
            >
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                {getDataKeyLabel(conflict.dataKey)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Versão Local */}
                <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="font-medium text-blue-800 dark:text-blue-300">Versão Local (Este Dispositivo)</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Atualizado: {formatDate(conflict.localVersion.timestamp)}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {getDataPreview(conflict.localVersion.data)}
                  </p>
                </div>

                {/* Versão Remota */}
                <div className="border border-green-200 dark:border-green-700 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="h-5 w-5 text-green-600 dark:text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                      />
                    </svg>
                    <span className="font-medium text-green-800 dark:text-green-300">Versão Remota (Nuvem)</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Atualizado: {formatDate(conflict.remoteVersion.timestamp)}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {getDataPreview(conflict.remoteVersion.data)}
                  </p>
                </div>
              </div>

              {/* Botões de Resolução */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onResolve(conflict.dataKey, 'local')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                  aria-label="Manter versão local"
                >
                  Manter Local
                </button>
                <button
                  onClick={() => onResolve(conflict.dataKey, 'remote')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm"
                  aria-label="Manter versão remota"
                >
                  Manter Remota
                </button>
                <button
                  onClick={() => onResolve(conflict.dataKey, 'merge')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-sm"
                  aria-label="Mesclar versões"
                >
                  Mesclar (Automático)
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancelar Sincronização
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncConflictModal;

