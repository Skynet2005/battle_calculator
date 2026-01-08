import { useState } from 'react';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import { clampCountsToCap, computeCountsFromMix, countsToMix, normalizeRatios, type TroopType as MixTroopType } from '@/domain/rally/mix-utils';
import type { TroopMixConfig } from '@/shared/types';
import type { MixTroopCounts } from '@/features/battle-calculator/model/types';
import { TROOP_TYPES } from '@/features/battle-calculator/model/types';
import './TroopMixSlider.css';

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
  const [editingValues, setEditingValues] = useState<Partial<Record<string, string>>>({});
  const derivedCounts: MixTroopCounts = counts && totalTroops(counts) > 0 ? counts : computeCountsFromMix(mix);

  // Calculate total ratio for warning
  const totalRatio = (mix.infantryRatio || 0) + (mix.lancerRatio || 0) + (mix.marksmanRatio || 0);
  const exceeds100 = totalRatio > 100.01; // Small tolerance for floating point

  const handlePercentChange = (type: string, value: number) => {
    if (!onChange) return;
    // Allow free input - don't auto-adjust other ratios
    const sanitized = Math.max(0, Number.isNaN(value) ? 0 : value);
    const ratioKey = `${type}Ratio` as keyof TroopMixConfig;
    onChange({
      ...mix,
      [ratioKey]: sanitized,
    });
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
    <div className="rounded-lg border border-slate-700/50 p-5 bg-gradient-to-br from-slate-900/60 to-slate-800/40 backdrop-blur-sm shadow-lg">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex-1">
          <div className="text-base font-semibold text-slate-100 mb-1">{title}</div>
          <div className="text-xs text-gray-400">
            Rally size: <span className="text-slate-300 font-medium">{Math.round(mix.totalTroops).toLocaleString()}</span> troops
            {displayMix && displayMix.totalTroops !== mix.totalTroops && (
              <span className="ml-2 text-amber-400">
                → {Math.round(displayMix.totalTroops).toLocaleString()} used
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700/50">
          {['percent', 'count'].map((modeValue) => (
            <button
              key={modeValue}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                mode === modeValue
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => {
                setMode(modeValue as 'percent' | 'count');
                setEditingValues({}); // Clear editing values when switching modes
              }}
            >
              {modeValue === 'percent' ? '% Ratio' : 'Unit Count'}
            </button>
          ))}
        </div>
      </div>

      {/* Warning if total exceeds 100% */}
      {mode === 'percent' && exceeds100 && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <span className="font-semibold">⚠️</span>
            <span>Total ratio exceeds 100% ({totalRatio.toFixed(2)}%)</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            Total Troops
          </label>
          <input
            title="Total Troops"
            type="number"
            min={0}
            value={Math.round(mix.totalTroops)}
            onChange={(e) => handleTotalChange(parseInt(e.target.value, 10) || 0)}
            disabled={mode === 'count'}
            className="w-full bg-slate-900/70 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          {mode === 'count' && (
            <p className="text-xs text-gray-500 mt-1.5">
              Total is derived from individual troop counts in Unit Count mode.
            </p>
          )}
        </div>

        <div className="space-y-3">
          {TROOP_TYPES.map((type) => {
            const ratioKey = `${type}Ratio` as const;
            // Use raw mix values for display, not normalized
            const rawPercentValue = mix[ratioKey] ?? 0;
            const unitValue = derivedCounts[type] ?? 0;
            const normalizedMix = normalizeRatios(mix, DEFAULT_TROOP_MIX);
            const normalizedPercent = displayMix ? displayMix[ratioKey] ?? normalizedMix[ratioKey] : normalizedMix[ratioKey];

            // Calculate units from raw percentage
            const calculatedUnits = Math.round((rawPercentValue / 100) * mix.totalTroops);

            // Determine max value for slider
            const maxValue = mode === 'percent' ? 100 : mix.totalTroops;
            const currentValue = mode === 'percent' ? rawPercentValue : unitValue;

            return (
              <div key={type} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {type}
                  </span>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {mode === 'percent' ? (
                        <span className="text-slate-200 font-medium">{calculatedUnits.toLocaleString()} units</span>
                      ) : (
                        <span className="text-slate-200 font-medium">{normalizedMix[ratioKey]?.toFixed(2) ?? '0.00'}%</span>
                      )}
                    </div>
                    {displayMix && normalizedPercent !== rawPercentValue && (
                      <div className="text-[10px] text-amber-400 mt-0.5">
                        Effective: {normalizedPercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    title={`${type} Ratio`}
                    type="number"
                    min={0}
                    max={maxValue}
                    step={mode === 'percent' ? 0.1 : 1}
                    value={editingValues[`${mode}-${type}`] !== undefined
                      ? editingValues[`${mode}-${type}`]
                      : (mode === 'percent' ? rawPercentValue : unitValue)}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Store the raw input value for display
                      setEditingValues(prev => ({ ...prev, [`${mode}-${type}`]: value }));

                      if (value === '') {
                        // Allow empty input temporarily while typing
                        return;
                      }
                      const parsed = parseFloat(value);
                      if (Number.isNaN(parsed)) {
                        return;
                      }
                      if (mode === 'percent') {
                        handlePercentChange(type, parsed);
                      } else {
                        handleCountChange(type, parsed);
                      }
                    }}
                    onBlur={(e) => {
                      // Clear editing state and ensure value is set
                      setEditingValues(prev => {
                        const next = { ...prev };
                        delete next[`${mode}-${type}`];
                        return next;
                      });

                      const value = e.target.value;
                      if (value === '' || value === null || value === undefined) {
                        if (mode === 'percent') {
                          onChange?.({ ...mix, [ratioKey]: 0 });
                        } else {
                          handleCountChange(type, 0);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Store current value when focusing
                      const currentValue = mode === 'percent' ? rawPercentValue : unitValue;
                      setEditingValues(prev => ({ ...prev, [`${mode}-${type}`]: currentValue.toString() }));
                    }}
                    className="w-24 bg-slate-800/70 border border-slate-600/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all placeholder:text-gray-600"
                    placeholder={mode === 'percent' ? '0.0' : '0'}
                  />
                  <input
                    type="range"
                    min={0}
                    max={maxValue}
                    step={mode === 'percent' ? 0.1 : 1}
                    value={currentValue}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      setEditingValues(prev => {
                        const next = { ...prev };
                        delete next[`${mode}-${type}`];
                        return next;
                      });
                      if (mode === 'percent') {
                        handlePercentChange(type, parsed);
                      } else {
                        handleCountChange(type, parsed);
                      }
                    }}
                    className="troop-mix-slider flex-1 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(244 63 94) 0%, rgb(244 63 94) ${maxValue > 0 ? (currentValue / maxValue) * 100 : 0}%, rgb(51 65 85 / 0.5) ${maxValue > 0 ? (currentValue / maxValue) * 100 : 0}%, rgb(51 65 85 / 0.5) 100%)`
                    }}
                  />
                </div>
                {mode === 'percent' && (
                  <div className="mt-1.5 text-xs text-gray-500">
                    Ratio: <span className="text-slate-300">{rawPercentValue.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {mode === 'percent' && (
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total Ratio:</span>
              <span className={`font-semibold ${exceeds100 ? 'text-amber-400' : 'text-slate-300'}`}>
                {totalRatio.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
