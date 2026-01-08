import type { ModifierComponentLog } from '@/domain/combat/types';
import { formatNumber } from '../utils/format';

interface ModifierListProps {
  title: string;
  items: ModifierComponentLog[];
  multiplier?: number;
}

export function ModifierList({ title, items, multiplier }: ModifierListProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
        <span>{title}</span>
        <span className="text-slate-300">× {formatNumber(multiplier ?? 1)}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-500 mt-1">None applied</div>
      ) : (
        <div className="mt-2 space-y-1 text-xs text-slate-200">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.source ?? item.id}</span>
              <span>{formatNumber(item.magnitude)} (stack {item.stackingKey ?? '—'})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
