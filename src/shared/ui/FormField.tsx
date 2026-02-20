'use client';

import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  description,
  error,
  required = false,
  children,
  className = ''
}: FormFieldProps) {
  const descriptionId = htmlFor ? `${htmlFor}-description` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const describedBy = [
    description ? descriptionId : undefined,
    error ? errorId : undefined,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-group ${className}`} data-described-by={describedBy} data-invalid={!!error || undefined}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
      </label>
      {description && (
        <p id={descriptionId} className="text-xs text-gray-400 dark:text-gray-500 mb-2 mt-1">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="text-sm text-red-400 dark:text-red-500 mt-1.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
