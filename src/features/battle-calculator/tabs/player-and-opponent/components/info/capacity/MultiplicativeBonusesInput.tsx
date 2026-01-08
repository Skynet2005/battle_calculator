'use client';

import type { MultiplicativeBonuses } from '@/domain/battle/calculations';
import { PETS_DATA } from '@/domain/battle/data/pets/pet_skills';
import { useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface MultiplicativeBonusesInputProps {
  bonuses: MultiplicativeBonuses;
  onBonusesChange: (bonuses: MultiplicativeBonuses) => void;
  petSkillSelections?: Record<string, number>;
  isOpponent?: boolean;
}

type StatType = 'attack' | 'defense' | 'lethality' | 'health';

// ============================================================================
// Constants
// ============================================================================

const STAT_TYPES: StatType[] = ['attack', 'defense', 'lethality', 'health'];

// ============================================================================
// Main Component
// ============================================================================

export default function MultiplicativeBonusesInput({
  bonuses,
  onBonusesChange,
  petSkillSelections,
  isOpponent = false
}: MultiplicativeBonusesInputProps) {
  // --------------------------------------------------------------------------
  // Auto-calculate Pet Skills
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!petSkillSelections) return;

    const petSkillBonuses = { attack: 0, defense: 0, lethality: 0, health: 0 };
    const petDebuffBonuses = { attack: 0, defense: 0, lethality: 0, health: 0 };

    Object.entries(petSkillSelections).forEach(([petName, level]) => {
      if (level === 0) return;
      const pet = PETS_DATA[petName];
      if (!pet) return;
      const levelValue = pet.levels[level.toString()];
      if (levelValue === undefined) return;

      const stat = pet.stat.toLowerCase();
      const isDebuff = stat.includes('reduction');

      if (stat.includes('attack')) {
        petSkillBonuses.attack += levelValue;
      } else if (stat.includes('defense') && !isDebuff) {
        petSkillBonuses.defense += levelValue;
      } else if (stat.includes('lethality')) {
        petSkillBonuses.lethality += levelValue;
      } else if (stat.includes('health') && !isDebuff) {
        petSkillBonuses.health += levelValue;
      } else if (stat.includes('health') && isDebuff) {
        petDebuffBonuses.health += levelValue;
      } else if (stat.includes('defense') && isDebuff) {
        petDebuffBonuses.defense += levelValue;
      }
    });

    // Update pet skills bonuses
    const currentPetSkills = bonuses.petSkills || { attack: 0, defense: 0, lethality: 0, health: 0 };
    const skillsChanged =
      currentPetSkills.attack !== petSkillBonuses.attack ||
      currentPetSkills.defense !== petSkillBonuses.defense ||
      currentPetSkills.lethality !== petSkillBonuses.lethality ||
      currentPetSkills.health !== petSkillBonuses.health;

    // Update combat debuffs from pet skills (only add pet debuffs, don't overwrite manual debuffs)
    const currentCombatDebuffs = bonuses.combatDebuffs || { attack: 0, defense: 0, lethality: 0, health: 0 };
    const debuffsChanged =
      currentCombatDebuffs.defense !== petDebuffBonuses.defense ||
      currentCombatDebuffs.health !== petDebuffBonuses.health;

    if (skillsChanged || debuffsChanged) {
      onBonusesChange({
        ...bonuses,
        petSkills: petSkillBonuses,
        combatDebuffs: {
          ...currentCombatDebuffs,
          defense: petDebuffBonuses.defense,
          health: petDebuffBonuses.health,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petSkillSelections]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const updateStat = (
    category: keyof MultiplicativeBonuses,
    stat: StatType,
    value: number
  ) => {
    onBonusesChange({
      ...bonuses,
      [category]: {
        ...bonuses[category],
        [stat]: value,
      },
    });
  };

  // --------------------------------------------------------------------------
  // Derived Values
  // --------------------------------------------------------------------------

  const getTotalBuffs = (stat: StatType) => {
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

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Info Callout */}
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
          <strong>Auto-calculated:</strong> Exclusive Weapon effects from Rally Leaders are automatically added to "Exclusive Weapon" bonuses.
        </div>
      </div>

      {/* Castle Buffs */}
      <BonusSection
        title="Castle Buffs"
        description="Buffs from your castle (e.g., Castle Buff items)"
        bonuses={bonuses.castleBuffs}
        onUpdate={(stat, value) => updateStat('castleBuffs', stat, value)}
      />

      {/* Event Buffs */}
      <BonusSection
        title="Event Buffs"
        description="Multiplicative buffs from events"
        bonuses={bonuses.eventBuffs}
        onUpdate={(stat, value) => updateStat('eventBuffs', stat, value)}
      />

      {/* Active Pet Skills */}
      <BonusSection
        title="Active Pet Skills"
        description="Active pet skills (active for 2 hours). Automatically calculated from Pet Skills selection."
        bonuses={bonuses.petSkills}
        onUpdate={(stat, value) => updateStat('petSkills', stat, value)}
        readOnly={!!petSkillSelections}
        readOnlyMessage="This value is auto-calculated from Pet Skills selection"
      />

      {/* Combat Buffs */}
      <BonusSection
        title="Combat Buffs"
        description="Combat buffs (typically 10-20%)"
        bonuses={bonuses.combatBuffs}
        onUpdate={(stat, value) => updateStat('combatBuffs', stat, value)}
      />

      {/* Combat Debuffs */}
      <BonusSection
        title="Combat Debuffs"
        description="Combat debuffs (reduce effectiveness more than equivalent buffs)"
        bonuses={bonuses.combatDebuffs}
        onUpdate={(stat, value) => updateStat('combatDebuffs', stat, value)}
      />

      {/* Exclusive Weapon Effects */}
      <BonusSection
        title="Exclusive Weapon Effects"
        description="Multiplicative bonuses from exclusive weapons. Leader exclusive weapon bonuses are automatically included here."
        bonuses={bonuses.exclusiveWeapon}
        onUpdate={(stat, value) => updateStat('exclusiveWeapon', stat, value)}
        readOnly
        readOnlyMessage="This value is auto-calculated from Rally Configuration"
      />

      {/* Alliance Territory */}
      <BonusSection
        title="Alliance Territory"
        description="Bonuses from alliance territory"
        bonuses={bonuses.allianceTerritory}
        onUpdate={(stat, value) => updateStat('allianceTerritory', stat, value)}
      />

      {/* Tyrant Spire Skills */}
      <BonusSection
        title="Tyrant Spire Skills"
        description="Bonuses from Tyrant Spire skills"
        bonuses={bonuses.tyrantSpire}
        onUpdate={(stat, value) => updateStat('tyrantSpire', stat, value)}
      />

      {/* Total Summary */}
      <div className="card info-card">
        <h4 className="text-lg font-semibold mb-3">Total Multiplicative Bonuses</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {STAT_TYPES.map(stat => {
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

// ============================================================================
// Sub-Components
// ============================================================================

interface BonusSectionProps {
  title: string;
  description: string;
  bonuses: Record<StatType, number>;
  onUpdate: (stat: StatType, value: number) => void;
  readOnly?: boolean;
  readOnlyMessage?: string;
}

function BonusSection({
  title,
  description,
  bonuses,
  onUpdate,
  readOnly = false,
  readOnlyMessage
}: BonusSectionProps) {
  return (
    <>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="section-description">{description}</p>
      <div className="grid">
        {STAT_TYPES.map(stat => (
          <div key={stat} className="form-group">
            <label>
              {stat.charAt(0).toUpperCase() + stat.slice(1)} %
              {readOnly && bonuses[stat] !== 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-400 ml-2 italic">
                  (includes leader bonuses)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.1"
              value={bonuses[stat] || 0}
              onChange={(e) => onUpdate(stat, parseFloat(e.target.value) || 0)}
              readOnly={readOnly}
              className={readOnly ? 'bg-slate-900/40 dark:bg-slate-900/40 cursor-not-allowed text-gray-400' : ''}
              title={readOnly ? readOnlyMessage : undefined}
            />
          </div>
        ))}
      </div>
    </>
  );
}
