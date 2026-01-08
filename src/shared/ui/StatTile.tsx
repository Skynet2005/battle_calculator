'use client';

import { type ReactNode } from 'react';

type StatTone = 'success' | 'info' | 'warning' | 'error' | 'muted';

interface StatTileProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: StatTone;
  helper?: string;
}

export default function StatTile({
  label,
  value,
  trend,
  trendValue,
  description,
  icon,
  className = '',
  size = 'md',
  tone = 'muted',
  helper
}: StatTileProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl'
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const toneStyles: Record<StatTone, { bg: string; border: string; value: string; helper: string }> = {
    success: {
      bg: 'bg-gradient-to-br from-emerald-600/20 to-emerald-700/10',
      border: 'border-emerald-500/40',
      value: 'text-emerald-100',
      helper: 'text-emerald-200/80'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-600/20 to-blue-700/10',
      border: 'border-blue-500/40',
      value: 'text-blue-100',
      helper: 'text-blue-200/80'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-600/20 to-amber-700/10',
      border: 'border-amber-500/40',
      value: 'text-amber-100',
      helper: 'text-amber-200/80'
    },
    error: {
      bg: 'bg-gradient-to-br from-rose-600/20 to-rose-700/10',
      border: 'border-rose-500/40',
      value: 'text-rose-100',
      helper: 'text-rose-200/80'
    },
    muted: {
      bg: 'bg-gradient-to-br from-slate-800/60 to-slate-900/40',
      border: 'border-slate-700/50',
      value: 'text-slate-200',
      helper: 'text-slate-300/70'
    }
  };

  const style = toneStyles[tone];

  return (
    <div
      className={`${sizeClasses[size]} ${style.bg} border ${style.border} ${className} rounded-xl text-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] backdrop-blur-sm`}
    >
      {icon && <div className="mb-2 flex justify-center">{icon}</div>}
      <div className="label text-slate-300/90 font-medium uppercase tracking-wide text-xs mb-2.5">{label}</div>
      <div className={`value ${valueSizeClasses[size]} font-bold ${style.value} mb-1.5`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {trend && trendValue && (
        <div className={`text-xs mt-1 ${trendColors[trend]}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
        </div>
      )}
      {description && (
        <div className="text-xs text-slate-300/70 mt-2">{description}</div>
      )}
      {helper && <div className={`text-[11px] font-medium mt-2 ${style.helper}`}>{helper}</div>}
    </div>
  );
}
