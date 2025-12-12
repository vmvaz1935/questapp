import React from 'react';

interface ValidationMessageProps {
  error?: string;
  itemId: string;
  className?: string;
}

/**
 * Componente para exibir mensagens de validação inline
 */
export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  error,
  itemId,
  className = '',
}) => {
  if (!error) {
    return null;
  }

  return (
    <div
      id={`error-${itemId}`}
      role="alert"
      aria-live="polite"
      className={`mt-2 text-sm text-red-600 dark:text-red-400 ${className}`}
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{error}</span>
      </div>
    </div>
  );
};

export default ValidationMessage;

