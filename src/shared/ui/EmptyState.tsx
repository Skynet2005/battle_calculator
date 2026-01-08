'use client';

import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  description,
  action,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  const resolvedMessage = description ?? message;
  const resolvedAction =
    action ?? (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined);

  return (
    <div className={`card text-center py-12 ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {resolvedMessage && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-md mx-auto">
          {resolvedMessage}
        </p>
      )}
      {resolvedAction && (
        <button
          type="button"
          onClick={resolvedAction.onClick}
          className="button"
        >
          {resolvedAction.label}
        </button>
      )}
    </div>
  );
}
