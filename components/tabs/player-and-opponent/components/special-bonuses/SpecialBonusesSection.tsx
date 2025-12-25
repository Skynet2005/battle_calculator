import type { AdditiveBonuses, BasicBonuses } from '@/lib/battle/calculations';
import { STAT_KEYS } from './DataSelectors.utils';
import SpecialBuffsContributors from './SpecialBuffsContributors';
import type { ContributingHero } from './DataSelectors.utils';

export default function SpecialBonusesSection({
  basicBonuses,
  onBasicBonusesChange,

  vipSelectValue,
  onVipChange,

  onToggleSpecialHero,

  additiveBonuses,
  onChangeAdditive,

  contributingHeroes
}: {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (b: BasicBonuses) => void;

  vipSelectValue: string;
  onVipChange: (value: string) => void;

  onToggleSpecialHero: (hero: 'jeronimo' | 'natalia', checked: boolean) => void;

  additiveBonuses?: AdditiveBonuses;
  onChangeAdditive?: (bucket: 'temporaryEvents' | 'supremePresident', stat: (typeof STAT_KEYS)[number], next: number) => void;

  contributingHeroes: ContributingHero[];
}) {
  const safeAdditive = additiveBonuses;

  return (
    <div>
      <h3>Special Bonuses</h3>
      <p className="section-description">
        Configure VIP Prestige, Special Heroes, Globe, Temporary Events, Supreme President, and Special Buffs (from Rally Configuration).
      </p>

      {/* VIP */}
      <div className="card info-card mb-4">
        <h4>VIP Prestige & Globe (VIP Skin)</h4>
        <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
          Select VIP level and Globe skin level. Globe Level 1 only applies when VIP 12 is selected.
        </p>

        <div className="grid">
          <div className="form-group">
            <label>VIP Prestige Level</label>
            <select value={vipSelectValue} onChange={(e) => onVipChange(e.target.value)}>
              <option value="none">None</option>
              <option value="9">VIP 9 (10% Defense)</option>
              <option value="10">VIP 10 (12% Defense, 12% Attack)</option>
              <option value="11">VIP 11 (14% Defense, 14% Attack, 14% Health)</option>
              <option value="12">VIP 12 (16% Defense, 16% Attack, 16% Health, 16% Lethality)</option>
              <option value="12-globe1">VIP 12 + Globe Level 1 (16% Defense, 21% Attack, 16% Health, 16% Lethality)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2">Current Values:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {(STAT_KEYS as readonly string[]).map((stat) => {
              const s = stat as any;
              const vipValue = (basicBonuses.vipPrestige as any)?.[s] || 0;
              const globeValue = (basicBonuses.globe as any)?.[s] || 0;
              const totalValue = vipValue + globeValue;
              return (
                <div key={stat} className="text-gray-400 dark:text-gray-400">
                  <span className="capitalize">{stat}:</span> {totalValue > 0 ? '+' : ''}
                  {totalValue.toFixed(0)}%
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Special Heroes */}
      <div className="card info-card mb-4">
        <h4>Special Heroes</h4>
        <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
          Jeronimo: +15% LETH & HP | Natalia: +10% ATK & DEF (always active)
        </p>
        <div className="grid">
          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={basicBonuses.specialHeroes?.jeronimo || false}
                onChange={(e) => onToggleSpecialHero('jeronimo', e.target.checked)}
              />
              <span>Jeronimo (+15% LETH & HP)</span>
            </label>
          </div>
          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={basicBonuses.specialHeroes?.natalia || false}
                onChange={(e) => onToggleSpecialHero('natalia', e.target.checked)}
              />
              <span>Natalia (+10% ATK & DEF)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Additive Bonuses */}
      {safeAdditive && onChangeAdditive && (
        <>
          <div className="card info-card mb-4">
            <h4>Temporary Events</h4>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
              Temporary event bonuses (e.g., weekend events, special promotions)
            </p>
            <div className="grid">
              {STAT_KEYS.map((stat) => (
                <div key={stat} className="form-group">
                  <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={safeAdditive.temporaryEvents[stat] || 0}
                    onChange={(e) => onChangeAdditive('temporaryEvents', stat, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card info-card mb-4">
            <h4>Supreme President Skills</h4>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
              Bonuses from Supreme President expedition skills
            </p>
            <div className="grid">
              {STAT_KEYS.map((stat) => (
                <div key={stat} className="form-group">
                  <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={safeAdditive.supremePresident[stat] || 0}
                    onChange={(e) => onChangeAdditive('supremePresident', stat, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card info-card mb-4">
            <h4>Special Buffs</h4>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
              Auto-calculated from Rally Configuration (Leader skills and Joiner bonuses). This value is read-only.
            </p>

            <div className="grid">
              {STAT_KEYS.map((stat) => (
                <div key={stat} className="form-group">
                  <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={safeAdditive.specialBuffs[stat] || 0}
                    readOnly
                    className="bg-slate-900/40 dark:bg-slate-900/40 cursor-not-allowed text-gray-400"
                    title="This value is auto-calculated from Rally Configuration"
                  />
                </div>
              ))}
            </div>

            <SpecialBuffsContributors heroes={contributingHeroes} />
          </div>
        </>
      )}
    </div>
  );
}
