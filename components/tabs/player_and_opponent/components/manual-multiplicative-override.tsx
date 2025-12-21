import type { MultiplicativeManualOverride, StatType, TroopType } from '@/lib/battle/calculations';
import { useMemo } from 'react';

const TROOP_TYPES: TroopType[] = ['infantry', 'lancer', 'marksman'];
const STAT_TYPES: StatType[] = ['attack', 'defense', 'lethality', 'health'];

interface ManualMultiplicativeOverrideProps {
  overrides?: MultiplicativeManualOverride;
  onChange: (next: MultiplicativeManualOverride | undefined) => void;
}

export default function ManualMultiplicativeOverride({
  overrides,
  onChange
}: ManualMultiplicativeOverrideProps) {
  const hasActiveOverride = useMemo(
    () =>
      Boolean(
        overrides &&
        Object.values(overrides).some(
          (entry) =>
            entry &&
            Object.values(entry).some(
              (value) => value !== undefined && value !== null && !Number.isNaN(Number(value))
            )
        )
      ),
    [overrides]
  );

  const updateOverride = (troop: TroopType, stat: StatType, value: string) => {
    const parsed = value === '' ? undefined : Number(value);
    if (value !== '' && Number.isNaN(parsed)) return;

    const next: MultiplicativeManualOverride = { ...(overrides || {}) };
    if (parsed === undefined) {
      if (next[troop]) {
        const clone = { ...(next[troop] as Record<StatType, number | undefined>) };
        delete clone[stat];
        const hasValues = Object.values(clone).some((v) => v !== undefined && v !== null && !Number.isNaN(Number(v)));
        if (hasValues) {
          next[troop] = clone;
        } else {
          delete next[troop];
        }
      }
    } else {
      next[troop] = {
        ...(next[troop] || {}),
        [stat]: parsed
      };
    }

    const cleaned = Object.keys(next).length > 0 ? next : undefined;
    onChange(cleaned);
  };

  const clearAll = () => onChange(undefined);

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 [data-theme='light']:border-gray-200 [data-theme='light']:bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-100 [data-theme='light']:text-gray-900">
            Manual Multiplicative Override (optional)
          </div>
          <p className="text-xs text-slate-400 [data-theme='light']:text-gray-600">
            Enter total multiplicative % per troop and stat. Leave blank to use calculated summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveOverride && (
            <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 shadow-[0_0_6px_rgba(16,185,129,0.25)]">
              Override Active
            </span>
          )}
          {hasActiveOverride && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-slate-300 underline underline-offset-2 transition-colors hover:text-emerald-200 [data-theme='light']:text-gray-700 [data-theme='light']:hover:text-emerald-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {TROOP_TYPES.map((troop) => (
          <div key={troop} className="space-y-2 rounded-md border border-slate-800/60 bg-slate-900/60 p-3 [data-theme='light']:border-gray-200 [data-theme='light']:bg-gray-50">
            <div className="text-sm font-semibold capitalize text-slate-200 [data-theme='light']:text-gray-900">
              {troop}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STAT_TYPES.map((stat) => (
                <label key={stat} className="flex flex-col gap-1 text-xs font-medium text-slate-300 [data-theme='light']:text-gray-700">
                  <span className="capitalize">{stat}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="Auto"
                    value={(overrides?.[troop]?.[stat] ?? '') as string | number}
                    onChange={(e) => updateOverride(troop, stat, e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 [data-theme='light']:border-gray-300 [data-theme='light']:bg-white [data-theme='light']:text-gray-900"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
