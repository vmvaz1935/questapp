/**
 * Componente de aba reutilizável para DebugPanel
 */

import React from 'react';

interface DebugTabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  icon?: string;
}

export const DebugTab: React.FC<DebugTabProps> = ({
  id,
  label,
  isActive,
  onClick,
  badge,
  icon,
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium transition-colors
        border-b-2
        ${isActive
          ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        relative
      `}
      aria-selected={isActive}
      role="tab"
      aria-controls={`panel-${id}`}
    >
      <div className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
};

