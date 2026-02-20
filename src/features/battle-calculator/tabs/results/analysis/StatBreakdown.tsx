import type { EffectiveStatSnapshot } from '@/domain/battle/engine/types';
import { formatNumber } from '../utils/format';

interface StatBreakdownProps {
  title: string;
  detail?: EffectiveStatSnapshot;
}

export function StatBreakdown({ title, detail }: StatBreakdownProps) {
  if (!detail) return null;
  const rows: Array<{ key: keyof EffectiveStatSnapshot; label: string }> = [
    { key: 'attack', label: 'Attack' },
    { key: 'lethality', label: 'Lethality' },
    { key: 'defense', label: 'Defense' },
    { key: 'health', label: 'Health' }
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between text-slate-200">
            <span>{row.label}</span>
            <span>
              {formatNumber(detail[row.key].base)} → {formatNumber(detail[row.key].effective)} ({formatNumber(detail[row.key].finalPercent)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
