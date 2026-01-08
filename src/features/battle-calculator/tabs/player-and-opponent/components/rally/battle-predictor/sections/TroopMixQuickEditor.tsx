import { useState } from 'react';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import { clampCountsToCap, computeCountsFromMix, countsToMix, normalizeRatios, setRatioKeeping100, type TroopType as MixTroopType } from '@/domain/rally/mix-utils';
import type { TroopMixConfig } from '@/shared/types';
import type { MixTroopCounts } from '../types';
import { TROOP_TYPES } from '../types';

interface TroopMixQuickEditorProps {
  title: string;
  mix: TroopMixConfig;
  displayMix?: TroopMixConfig | null;
  counts: MixTroopCounts | null | undefined;
  onChange?: (mix: TroopMixConfig) => void;
  maxTotal?: number;
}

export function TroopMixQuickEditor({
  title,
  mix,
  displayMix,
  counts,
  onChange,
  maxTotal,
}: TroopMixQuickEditorProps) {
  const [mode, setMode] = useState<'percent' | 'count'>('percent');
  const derivedCounts: MixTroopCounts = counts && totalTroops(counts) > 0 ? counts : computeCountsFromMix(mix);

  const handlePercentChange = (type: string, value: number) => {
    if (!onChange) return;
    const mixType = type as MixTroopType;
    const next = setRatioKeeping100(normalizeRatios(mix, DEFAULT_TROOP_MIX), mixType, value, DEFAULT_TROOP_MIX);
    onChange(next);
  };

  const handleCountChange = (type: string, value: number) => {
    if (!onChange) return;
    const sanitized = Math.max(0, Math.trunc(value || 0));
    const baseCounts = counts && totalTroops(counts) > 0 ? counts : computeCountsFromMix(mix);
    const nextCounts = { ...baseCounts, [type]: sanitized } as MixTroopCounts;
    const cappedCounts = clampCountsToCap(nextCounts, maxTotal);
    onChange(countsToMix(cappedCounts));
  };

  const handleTotalChange = (value: number) => {
    if (!onChange) return;
    const sanitized = Math.max(0, Math.trunc(value || 0));
    const capped = maxTotal ? Math.min(maxTotal, sanitized) : sanitized;
    onChange(normalizeRatios({ ...mix, totalTroops: capped }, DEFAULT_TROOP_MIX));
  };

  return (
    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/40">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-gray-400">
            Rally size: {Math.round(mix.totalTroops).toLocaleString()} troops
            {displayMix && displayMix.totalTroops !== mix.totalTroops && (
              <> &rarr; {Math.round(displayMix.totalTroops).toLocaleString()} used</>
            )}
          </div>
        </div>
        <div className="text-xs bg-slate-800/60 rounded-full p-1 flex">
          {['percent', 'count'].map((modeValue) => (
            <button
              key={modeValue}
              className={`px-2 py-1 rounded-full ${mode === modeValue ? 'bg-rose-500/70 text-white' : 'text-gray-300'}`}
              onClick={() => setMode(modeValue as 'percent' | 'count')}
            >
              {modeValue === 'percent' ? '% Ratio' : 'Unit Count'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <div className="form-group mb-2">
          <label>Total Troops</label>
          <input
            type="number"
            min={0}
            value={Math.round(mix.totalTroops)}
            onChange={(e) => handleTotalChange(parseInt(e.target.value, 10) || 0)}
            disabled={mode === 'count'}
            className="bg-slate-900/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
          />
          {mode === 'count' && (
            <p className="text-xs text-gray-500 mt-1">
              Total is derived from individual troop counts in Unit Count mode.
            </p>
          )}
        </div>
        {TROOP_TYPES.map((type) => {
          const ratioKey = `${type}Ratio` as const;
          const normalizedMix = normalizeRatios(mix, DEFAULT_TROOP_MIX);
          const percentValue = normalizedMix[ratioKey] ?? 0;
          const unitValue = derivedCounts[type] ?? 0;
          const normalizedPercent = displayMix ? displayMix[ratioKey] ?? percentValue : percentValue;
          return (
            <div key={type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs uppercase text-gray-400">
                <span>{type}</span>
                <span>
                  {mode === 'percent'
                    ? `${unitValue.toLocaleString()} units`
                    : `${percentValue.toFixed(2)}%`}
                </span>
              </div>
              {displayMix && (
                <div className="text-[11px] text-gray-500 flex justify-between">
                  <span>Effective</span>
                  <span>{normalizedPercent.toFixed(2)}%</span>
                </div>
              )}
              <input
                type="number"
                min={0}
                value={mode === 'percent' ? Number(percentValue.toFixed(2)) : unitValue}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  if (Number.isNaN(parsed)) {
                    return;
                  }
                  if (mode === 'percent') {
                    handlePercentChange(type, parsed);
                  } else {
                    handleCountChange(type, parsed);
                  }
                }}
                className="bg-slate-900/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
