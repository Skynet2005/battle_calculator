'use client';

import { useState, type ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  headerActions?: ReactNode;
  tone?: 'default' | 'muted' | 'elevated';
  footer?: ReactNode;
}

export default function SectionCard({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  headerActions,
  tone = 'default',
  footer
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toneClasses: Record<'default' | 'muted' | 'elevated', string> = {
    default: 'card',
    muted: 'card border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm',
    elevated: 'card shadow-2xl shadow-blue-900/40 border border-blue-500/20'
  };

  return (
    <div className={`${toneClasses[tone]} ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="mb-2">{title}</h3>
          {description && (
            <p className="section-description">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="button px-3 py-1.5 text-xs"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <>
          <div className="mt-4">{children}</div>
          {footer && <div className="mt-6 border-t border-slate-800 pt-4">{footer}</div>}
        </>
      )}
    </div>
  );
}
