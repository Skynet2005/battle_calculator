'use client';

import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import type { TroopMixConfig } from '@/shared/types';

export interface TroopMixEditorProps {
  title: string;
  mix: TroopMixConfig;
  onMixChange: (mix: TroopMixConfig) => void;
}

export function TroopMixEditor({ title, mix, onMixChange }: TroopMixEditorProps) {
  const safeMix = { ...DEFAULT_TROOP_MIX, ...mix };
  const ratioSum = safeMix.infantryRatio + safeMix.lancerRatio + safeMix.marksmanRatio;

  const handleChange = (field: keyof TroopMixConfig, value: number) => {
    const sanitized = Math.max(0, isNaN(value) ? 0 : value);
    onMixChange({
      ...safeMix,
      [field]: sanitized,
    });
  };

  const handleNormalize = () => {
    if (ratioSum === 0) {
      onMixChange({
        ...safeMix,
        infantryRatio: 34,
        lancerRatio: 33,
        marksmanRatio: 33,
      });
      return;
    }

    const scale = 100 / ratioSum;
    const rawInfantry = safeMix.infantryRatio * scale;
    const rawLancer = safeMix.lancerRatio * scale;
    const rawMarksman = safeMix.marksmanRatio * scale;

    const infantry = Math.round(rawInfantry * 100) / 100;
    const lancer = Math.round(rawLancer * 100) / 100;
    const marksman = Math.round((100 - infantry - lancer) * 100) / 100;

    onMixChange({
      ...safeMix,
      infantryRatio: infantry,
      lancerRatio: lancer,
      marksmanRatio: marksman,
    });
  };

  const needsNormalization = Math.abs(ratioSum - 100) > 0.5;

  return (
    <div className="card info-card">
      <h4>{title}</h4>
      <div className="grid gap-4">
        <div className="form-group">
          <label>Total Troops</label>
          <input
            title="Total Troops"
            type="number"
            min="0"
            value={safeMix.totalTroops}
            onChange={(e) => handleChange('totalTroops', parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Infantry %</label>
          <input
            title="Infantry %"
            type="number"
            min="0"
            max="100"
            value={safeMix.infantryRatio}
            onChange={(e) => handleChange('infantryRatio', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Lancer %</label>
          <input
            title="Lancer %"
            type="number"
            min="0"
            max="100"
            value={safeMix.lancerRatio}
            onChange={(e) => handleChange('lancerRatio', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Marksman %</label>
          <input
            title="Marksman %"
            type="number"
            min="0"
            max="100"
            value={safeMix.marksmanRatio}
            onChange={(e) => handleChange('marksmanRatio', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      {needsNormalization && (
        <div className="flex items-center gap-3 mt-2">
          <p className="text-xs text-amber-400">
            Ratios currently total {ratioSum.toFixed(2)}%.
          </p>
          <button
            type="button"
            onClick={handleNormalize}
            className="text-xs font-medium px-2.5 py-1 rounded-md border border-amber-400/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/70 transition-colors [data-theme='light']:text-amber-700 [data-theme='light']:border-amber-500 [data-theme='light']:bg-amber-50 [data-theme='light']:hover:bg-amber-100"
          >
            Normalize to 100%
          </button>
        </div>
      )}
    </div>
  );
}
