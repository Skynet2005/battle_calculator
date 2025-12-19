'use client';

import type { AdditiveBonuses } from '@/lib/battle/calculations';

interface AdditiveBonusesInputProps {
  bonuses: AdditiveBonuses;
  onBonusesChange: (bonuses: AdditiveBonuses) => void;
}

export default function AdditiveBonusesInput({ bonuses, onBonusesChange }: AdditiveBonusesInputProps) {
  const updateStat = (category: keyof AdditiveBonuses, stat: 'attack' | 'defense' | 'lethality' | 'health', value: number) => {
    onBonusesChange({
      ...bonuses,
      [category]: {
        ...bonuses[category],
        [stat]: value,
      },
    });
  };

  // Calculate totals including auto-calculated from rally
  const getTotalForStat = (stat: 'attack' | 'defense' | 'lethality' | 'health') => {
    return (
      (bonuses.temporaryEvents[stat] || 0) +
      (bonuses.supremePresident[stat] || 0) +
      (bonuses.specialBuffs[stat] || 0)
    );
  };

  return (
    <div className="space-y-8">
      <div className="callout callout-info space-y-3">
        <h4 className="text-lg font-semibold text-white">About Additive Bonuses</h4>
        <p className="text-sm text-blue-50/80">
          Additive bonuses are <strong>flat percentage increases</strong> that add directly to your total before multiplication.
          These include temporary events, Supreme President skills, and special buffs.
        </p>
        <div className="font-mono text-sm text-white/90">
          <strong>Formula:</strong> Base Stat + Additive Bonus = Intermediate Stat
        </div>
        <div className="callout callout-success text-sm">
          <strong>Auto-calculated:</strong> Rally Joiner bonuses are automatically added to <em>Special Buffs</em> based on your Rally Configuration.
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white">Temporary Events</h3>
      <p className="section-description">
        Temporary event bonuses (e.g., weekend events, special promotions)
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.temporaryEvents[stat] || 0}
              onChange={(e) => updateStat('temporaryEvents', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Supreme President Skills</h3>
      <p className="section-description">
        Bonuses from Supreme President expedition skills
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.supremePresident[stat] || 0}
              onChange={(e) => updateStat('supremePresident', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Special Buffs</h3>
      <p className="section-description">
        Other special temporary buffs (e.g., alliance buffs, consumables).
        <strong> Rally Joiner bonuses are automatically included here.</strong>
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>
              {stat.charAt(0).toUpperCase() + stat.slice(1)} %
              {bonuses.specialBuffs[stat] !== 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-400 ml-2 italic">
                  (includes rally bonuses)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.1"
              value={bonuses.specialBuffs[stat] || 0}
              onChange={(e) => updateStat('specialBuffs', stat, parseFloat(e.target.value) || 0)}
              readOnly
              className="bg-slate-900/40 dark:bg-slate-900/40 cursor-not-allowed text-gray-400"
              title="This value is auto-calculated from Rally Configuration"
            />
          </div>
        ))}
      </div>

      <div className="card info-card">
        <h4 className="text-lg font-semibold mb-3">Total Additive Bonuses</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => {
            const total = getTotalForStat(stat);
            return (
              <div key={stat} className="stat-display-item text-center">
                <div className="stat-label normal-case text-xs mb-1">{stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                <div className="stat-value text-xl">
                  {total > 0 ? '+' : ''}{total.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

