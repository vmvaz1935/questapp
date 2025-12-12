import React, { useEffect, useState } from 'react';
import { processSyncQueue } from '../services/backgroundSync';

interface SyncStatusNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Componente para exibir notificações de status de sincronização
 */
export const SyncStatusNotification: React.FC<SyncStatusNotificationProps> = ({
  isVisible,
  onClose,
}) => {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (isVisible && navigator.onLine) {
      setStatus('syncing');
      setMessage('Sincronizando dados...');

      processSyncQueue()
        .then(({ success, failed }) => {
          if (failed === 0 && success > 0) {
            setStatus('success');
            setMessage(`${success} operação(ões) sincronizada(s) com sucesso!`);
          } else if (success > 0) {
            setStatus('success');
            setMessage(`${success} sincronizada(s), ${failed} pendente(s)`);
          } else if (failed > 0) {
            setStatus('error');
            setMessage(`${failed} operação(ões) falharam. Tentando novamente...`);
          } else {
            setStatus('idle');
            setMessage('Nada para sincronizar');
          }
        })
        .catch((error) => {
          setStatus('error');
          setMessage(`Erro ao sincronizar: ${error.message}`);
        });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'syncing':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 ${getBgColor()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 min-w-[300px] max-w-md`}
      role="status"
      aria-live="polite"
    >
      {getIcon()}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 focus:outline-none"
        aria-label="Fechar notificação"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default SyncStatusNotification;

