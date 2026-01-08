'use client';

import { FormField, SectionCard } from '@/shared/ui';

import { CONTROL_CLASS } from '../playerInfo.constants';
import type { CityBonuses } from '../playerInfo.types';
import { capitalize } from '../playerInfo.utils';

export default function BonusSettingsCard({
  petSkillsEnabled,
  cityBonuses,
  onPetSkillsEnabledChange,
  onCityBonusChange
}: {
  petSkillsEnabled: boolean;
  cityBonuses: CityBonuses;
  onPetSkillsEnabledChange: (enabled: boolean) => void;
  onCityBonusChange: <K extends keyof CityBonuses>(key: K, value: CityBonuses[K]) => void;
}) {
  return (
    <SectionCard
      title="Bonus Settings"
      description="Toggle pet skills and city bonuses for calculations in the summary sections below."
      collapsible
      defaultCollapsed
    >
      <FormField label="Pet Skills" description="Include pet skills in multiplicative bonus calculations">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={petSkillsEnabled}
            onChange={(e) => onPetSkillsEnabledChange(e.target.checked)}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          <span>Pet Skills Enabled</span>
        </label>
      </FormField>

      <div className="section-divider" />
      <h4 className="mb-4 text-base font-semibold">City Bonuses</h4>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">City bonus level for each stat (0%, 10%, or 20%)</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => (
          <FormField key={stat} label={`${capitalize(stat)} City Bonus`}>
            <select
              value={cityBonuses[stat]}
              onChange={(e) => onCityBonusChange(stat, parseInt(e.target.value, 10) as 0 | 10 | 20)}
              className={CONTROL_CLASS}
              aria-label={`${capitalize(stat)} City Bonus`}
            >
              <option value="0">0% (Disabled)</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </FormField>
        ))}

        {(['enemyAttackReduction', 'enemyDefenseReduction'] as const).map((key) => (
          <FormField
            key={key}
            label={key === 'enemyAttackReduction' ? 'Enemy Attack Reduction City Bonus' : 'Enemy Defense Reduction City Bonus'}
          >
            <select
              value={cityBonuses[key]}
              onChange={(e) => onCityBonusChange(key, parseInt(e.target.value, 10) as 0 | 10 | 20)}
              className={CONTROL_CLASS}
              aria-label={key === 'enemyAttackReduction' ? 'Enemy Attack Reduction City Bonus' : 'Enemy Defense Reduction City Bonus'}
            >
              <option value="0">0% (Disabled)</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </FormField>
        ))}

        <FormField label="Total Deployment Capacity City Bonus">
          <select
            value={cityBonuses.deploymentCapacity}
            onChange={(e) => onCityBonusChange('deploymentCapacity', parseInt(e.target.value, 10) as 0 | 10 | 20)}
            className={CONTROL_CLASS}
            aria-label="Total Deployment Capacity City Bonus"
          >
            <option value="0">0% (Disabled)</option>
            <option value="10">10%</option>
            <option value="20">20%</option>
          </select>
        </FormField>
      </div>
    </SectionCard>
  );
}
