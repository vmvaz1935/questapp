import React from 'react';
import { AutosaveStatus } from '../hooks/useAutosave';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSaved: Date | null;
  error?: Error | null;
  className?: string;
}

/**
 * Componente que exibe o status do autosave
 * Estados: "Salvando...", "Salvo há X segundos", "Erro ao salvar"
 */
export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSaved,
  error,
  className = '',
}) => {
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  };

  const renderContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium">Salvando...</span>
          </div>
        );

      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">
              {lastSaved ? `Salvo há ${getTimeAgo(lastSaved)}` : 'Salvo'}
            </span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">
              Erro ao salvar
              {error && (
                <span className="ml-1 text-xs opacity-75" title={error.message}>
                  (tente novamente)
                </span>
              )}
            </span>
          </div>
        );

      case 'idle':
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex items-center ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {renderContent()}
    </div>
  );
};

export default AutosaveIndicator;

