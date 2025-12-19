import { cn } from '@/lib/utils/cn';
import type { ButtonHTMLAttributes, HTMLAttributes, OptionHTMLAttributes, SelectHTMLAttributes } from 'react';
import React from 'react';

type WithChildren<P = unknown> = P & { children?: React.ReactNode };

export type ButtonProps = WithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>;
export const Button: React.FC<ButtonProps> = ({ children, className, variant, size, ...rest }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
  };
  const sizeClasses = {
    default: 'px-4 py-2',
    icon: 'p-2',
    sm: 'px-2 py-1 text-sm',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant as keyof typeof variantClasses] || variantClasses.default,
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export type FormControlProps = WithChildren<HTMLAttributes<HTMLDivElement>>;
export const FormControl: React.FC<FormControlProps> = ({ children, className, ...rest }) => (
  <div className={cn('mb-4', className)} {...rest}>{children}</div>
);

export type LabelProps = WithChildren<HTMLAttributes<HTMLLabelElement>>;
export const Label: React.FC<LabelProps> = ({ children, className, ...rest }) => (
  <label className={cn('block text-sm font-medium mb-1', className)} {...rest}>{children}</label>
);

export type SelectProps = WithChildren<SelectHTMLAttributes<HTMLSelectElement>>;
export const Select: React.FC<SelectProps> = ({ children, className, ...rest }) => (
  <select
    className={cn(
      'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md',
      'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
      className
    )}
    {...rest}
  >
    {children}
  </select>
);

export type SelectOptionProps = OptionHTMLAttributes<HTMLOptionElement>;
export const SelectOption: React.FC<SelectOptionProps> = ({ children, ...rest }) => (
  <option {...rest}>{children}</option>
);

export type AlertProps = WithChildren<HTMLAttributes<HTMLDivElement> & { variant?: 'muted' | 'info' | 'warning' | 'error' }>;
export const Alert: React.FC<AlertProps> = ({ children, className, variant = 'muted', ...rest }) => {
  const variantClasses = {
    muted: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-md border',
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const DarkModeScript: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const theme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', theme);
          })();
        `,
      }}
    />
  );
};

// Export cn utility for convenience
export { cn };

