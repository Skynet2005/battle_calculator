'use client';

import type { TroopType } from '@/lib/battle/calculations';
import { getAllTroopDefinitionsForType } from '@/lib/battle/data-selectors';

import type { CapacityReport } from '@/components/tabs/player-and-opponent/components/battle-predictor';
import CapacitySummaryGrid from '@/components/tabs/player-and-opponent/components/info/capacity/capacity-summary-grid';
import { FormField, SectionCard } from '@/components/ui';

import { TROOP_TYPE_LIST } from '@/lib/battle/battle-calculator-helpers';
import { CONTROL_CLASS } from '../playerInfo.constants';
import { capitalize } from '../playerInfo.utils';

export default function CapacityCard({
  troopLevels,
  baseCapacity,
  playerCapacityReport,
  onTroopLevelChange,
  onBaseCapacityChange
}: {
  troopLevels: Record<string, string | undefined>;
  baseCapacity: { rally: number; march: number };
  playerCapacityReport: CapacityReport | null;
  onTroopLevelChange: (troop: TroopType, value?: string) => void;
  onBaseCapacityChange: (key: 'march' | 'rally', value: number) => void;
}) {
  return (
    <SectionCard
      title="Capacity"
      description="Manual override inputs (optional). Leave at 0 to use calculated values from all sources below."
      collapsible
      defaultCollapsed
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {(TROOP_TYPE_LIST as TroopType[]).map((troop) => {
          const options = getAllTroopDefinitionsForType(troop);
          return (
            <FormField key={troop} label={`${capitalize(troop)} Troop Level`} description="Used for troop base stats in rally calculations">
              <select
                value={troopLevels[troop] ?? ''}
                onChange={(e) => onTroopLevelChange(troop, e.target.value || undefined)}
                className={CONTROL_CLASS}
              >
                <option value="">Not set</option>
                {options.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          );
        })}
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <FormField label="Manual Deployment Capacity Override" description="Set to override calculated total (0 = use calculated)">
          <input
            type="number"
            value={baseCapacity.march || 0}
            onChange={(e) => onBaseCapacityChange('march', parseInt(e.target.value, 10) || 0)}
            className={CONTROL_CLASS}
          />
        </FormField>

        <FormField label="Manual Rally Capacity Override" description="Set to override calculated total (0 = use calculated)">
          <input
            type="number"
            value={baseCapacity.rally || 0}
            onChange={(e) => onBaseCapacityChange('rally', parseInt(e.target.value, 10) || 0)}
            className={CONTROL_CLASS}
          />
        </FormField>
      </div>

      <div className="border-t border-slate-700 dark:border-slate-700 pt-4 mt-4">
        <h4 className="mb-4 text-base font-semibold">Total Capacity</h4>
        {playerCapacityReport ? (
          <CapacitySummaryGrid deployment={playerCapacityReport.deployment} rally={playerCapacityReport.rally} showTemporary />
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-400">Capacity data unavailable.</p>
        )}
      </div>
    </SectionCard>
  );
}
