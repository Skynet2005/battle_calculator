'use client';

import { type ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

export default function ErrorState({
  title = 'Error',
  message,
  retry,
  icon,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 ${className}`}>
      <div className="flex items-start gap-4">
        {icon && (
          <div className="text-red-500 dark:text-red-400 flex-shrink-0 mt-1">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            {title}
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{message}</p>
          {retry && (
            <button
              type="button"
              onClick={retry.onClick}
              className="button bg-red-600 hover:bg-red-700 text-white"
            >
              {retry.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
