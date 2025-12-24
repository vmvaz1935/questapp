/**
 * Componente indicador visual de status de debug
 */

import React from 'react';
import type { DiagnosticStatus } from '../types/debug';

interface DebugIndicatorProps {
  status: DiagnosticStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export const DebugIndicator: React.FC<DebugIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  label,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  const statusConfig = {
    ok: {
      bg: 'bg-green-500',
      text: 'text-green-500',
      icon: '✓',
      label: 'OK',
    },
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-500',
      icon: '⚠',
      label: 'Aviso',
    },
    error: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      icon: '✗',
      label: 'Erro',
    },
    unknown: {
      bg: 'bg-gray-400',
      text: 'text-gray-400',
      icon: '?',
      label: 'Desconhecido',
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${config.bg} rounded-full flex items-center justify-center text-white text-xs font-bold`}
        role="status"
        aria-label={config.label}
        title={config.label}
      >
        {size !== 'sm' && <span>{config.icon}</span>}
      </div>
      {showLabel && (
        <span className={`text-sm ${config.text} font-medium`}>
          {label || config.label}
        </span>
      )}
    </div>
  );
};

