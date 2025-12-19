'use client';

import type { MultiplicativeBonuses } from '@/lib/battle/calculations';
import { PETS_DATA } from '@/lib/battle/data/pets/pet_skills';

interface MultiplicativeBonusesInputProps {
  bonuses: MultiplicativeBonuses;
  onBonusesChange: (bonuses: MultiplicativeBonuses) => void;
  petSkillSelections?: Record<string, number>;
  isOpponent?: boolean;
}

export default function MultiplicativeBonusesInput({
  bonuses,
  onBonusesChange,
  petSkillSelections,
  isOpponent = false
}: MultiplicativeBonusesInputProps) {
  // Calculate pet debuffs from pet selections
  const getPetDebuffs = (): Record<'attack' | 'defense' | 'lethality' | 'health', number> => {
    const petDebuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };

    if (isOpponent) {
      // Opponent uses max levels
      Object.entries(PETS_DATA).forEach(([petName, pet]) => {
        const maxLevel = Math.max(...Object.keys(pet.levels).map(k => parseInt(k)));
        const levelValue = pet.levels[maxLevel.toString()];
        if (levelValue === undefined) return;

        const stat = pet.stat.toLowerCase();
        const isDebuff = stat.includes('reduction');

        if (stat.includes('health') && isDebuff) {
          petDebuffs.health += levelValue;
        } else if (stat.includes('defense') && isDebuff) {
          petDebuffs.defense += levelValue;
        }
      });
    } else if (petSkillSelections) {
      // Player uses selected levels
      Object.entries(petSkillSelections).forEach(([petName, level]) => {
        if (!level) return;
        const pet = PETS_DATA[petName];
        if (!pet) return;
        const levelValue = pet.levels[level.toString()];
        if (levelValue === undefined) return;

        const stat = pet.stat.toLowerCase();
        const isDebuff = stat.includes('reduction');

        if (stat.includes('health') && isDebuff) {
          petDebuffs.health += levelValue;
        } else if (stat.includes('defense') && isDebuff) {
          petDebuffs.defense += levelValue;
        }
      });
    }

    return petDebuffs;
  };

  const updateStat = (category: keyof MultiplicativeBonuses, stat: 'attack' | 'defense' | 'lethality' | 'health', value: number) => {
    // For combat debuffs, user is setting the total (pet + manual)
    // Store it directly - PetsSection will preserve manual when updating pet portion
    onBonusesChange({
      ...bonuses,
      [category]: {
        ...bonuses[category],
        [stat]: value,
      },
    });
  };

  const getTotalBuffs = (stat: 'attack' | 'defense' | 'lethality' | 'health') => {
    return (
      (bonuses.castleBuffs[stat] || 0) +
      (bonuses.eventBuffs[stat] || 0) +
      (bonuses.petSkills[stat] || 0) +
      (bonuses.combatBuffs[stat] || 0) +
      (bonuses.exclusiveWeapon[stat] || 0) +
      (bonuses.allianceTerritory[stat] || 0) +
      (bonuses.tyrantSpire[stat] || 0)
    );
  };

  return (
    <div className="space-y-8">
      <div className="callout callout-info space-y-3">
        <h4 className="text-lg font-semibold text-white">About Multiplicative Bonuses</h4>
        <p className="text-sm text-blue-50/80">
          Multiplicative bonuses <strong>scale your total stats</strong> after additive bonuses are applied.
          These include castle buffs, event buffs, pet skills, and combat buffs/debuffs.
        </p>
        <div className="font-mono text-sm text-white/90">
          <strong>Formula:</strong> X&apos; = X × (1 + Σbuffs%) ÷ (1 + Σdebuffs%)
        </div>
        <p className="text-xs text-blue-100/80">
          Note: Debuffs divide the total instead of subtracting, preventing buffs/debuffs from canceling evenly.
        </p>
        <div className="callout callout-success text-sm">
          <strong>Auto-calculated:</strong> Exclusive Weapon effects from Rally Leaders are automatically added to “Exclusive Weapon” bonuses.
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white">Castle Buffs</h3>
      <p className="section-description">
        Buffs from your castle (e.g., Castle Buff items)
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.castleBuffs[stat] || 0}
              onChange={(e) => updateStat('castleBuffs', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Event Buffs</h3>
      <p className="section-description">
        Multiplicative buffs from events
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.eventBuffs[stat] || 0}
              onChange={(e) => updateStat('eventBuffs', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Active Pet Skills</h3>
      <p className="section-description">
        Active pet skills (active for 2 hours)
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.petSkills[stat] || 0}
              onChange={(e) => updateStat('petSkills', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Combat Buffs</h3>
      <p className="section-description">
        Combat buffs (typically 10-20%)
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.combatBuffs[stat] || 0}
              onChange={(e) => updateStat('combatBuffs', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Combat Debuffs</h3>
      <p className="section-description">
        Combat debuffs (reduce effectiveness more than equivalent buffs)
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.combatDebuffs[stat] || 0}
              onChange={(e) => updateStat('combatDebuffs', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Exclusive Weapon Effects</h3>
      <p className="section-description">
        Multiplicative bonuses from exclusive weapons.
        <strong> Leader exclusive weapon bonuses are automatically included here.</strong>
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>
              {stat.charAt(0).toUpperCase() + stat.slice(1)} %
              {bonuses.exclusiveWeapon[stat] !== 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-400 ml-2 italic">
                  (includes leader bonuses)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.1"
              value={bonuses.exclusiveWeapon[stat] || 0}
              onChange={(e) => updateStat('exclusiveWeapon', stat, parseFloat(e.target.value) || 0)}
              readOnly
              className="bg-slate-900/40 dark:bg-slate-900/40 cursor-not-allowed text-gray-400"
              title="This value is auto-calculated from Rally Configuration"
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Alliance Territory</h3>
      <p className="section-description">
        Bonuses from alliance territory
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.allianceTerritory[stat] || 0}
              onChange={(e) => updateStat('allianceTerritory', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-white">Tyrant Spire Skills</h3>
      <p className="section-description">
        Bonuses from Tyrant Spire skills
      </p>
      <div className="grid">
        {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
          <div key={stat} className="form-group">
            <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} %</label>
            <input
              type="number"
              step="0.1"
              value={bonuses.tyrantSpire[stat] || 0}
              onChange={(e) => updateStat('tyrantSpire', stat, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <div className="card info-card">
        <h4 className="text-lg font-semibold mb-3">Total Multiplicative Bonuses</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => {
            const totalBuffs = getTotalBuffs(stat);
            const totalDebuffs = bonuses.combatDebuffs[stat] || 0;
            return (
              <div key={stat} className="stat-display-item text-left">
                <div className="stat-label normal-case">
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </div>
                <div className="text-sm">
                  Buffs: <span className="font-semibold">{totalBuffs > 0 ? '+' : ''}{totalBuffs.toFixed(2)}%</span>
                </div>
                {totalDebuffs > 0 && (
                  <div className="text-sm text-red-300">
                    Debuffs: -{totalDebuffs.toFixed(2)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

