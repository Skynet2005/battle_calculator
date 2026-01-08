'use client';

import type { BasicBonuses, MultiplicativeBonuses } from '@/domain/battle/calculations';
import { getColorTierBonuses } from '@/domain/battle/data/pets/color-tier-bonuses';
import { PETS_DATA } from '@/domain/battle/data/pets/pet_skills';
import { useEffect, useMemo, useState } from 'react';

// -------------------------
// Types & Constants
// -------------------------

interface PetsSectionProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  multiplicativeBonuses?: MultiplicativeBonuses;
  onMultiplicativeBonusesChange?: (bonuses: MultiplicativeBonuses) => void;
  capacity?: { rally: number; march: number };
  onCapacityChange?: (capacity: { rally: number; march: number }) => void;
  petSkillSelections?: Record<string, number>;
  onPetSkillSelectionsChange?: (selections: Record<string, number>) => void;
  isOpponent?: boolean;
  colorTier?: 'grey' | 'green' | 'blue' | 'purple' | 'gold';
  onColorTierChange?: (colorTier: 'grey' | 'green' | 'blue' | 'purple' | 'gold' | undefined) => void;
}

// -------------------------
// Helpers
// -------------------------

function getAffectsStat(stat: string): string | null {
  const _stat = stat.toLowerCase();
  if (_stat.includes('attack')) return 'Attack';
  if (_stat.includes('defense') && !_stat.includes('reduction')) return 'Defense';
  if (_stat.includes('lethality')) return 'Lethality';
  if (_stat.includes('health') && !_stat.includes('reduction')) return 'Health';
  if (_stat.includes('health') && _stat.includes('reduction')) return 'Enemy Health (Debuff)';
  if (_stat.includes('defense') && _stat.includes('reduction')) return 'Enemy Defense (Debuff)';
  if (_stat.includes('rally capacity')) return 'Rally Capacity';
  if (_stat.includes('squad capacity')) return 'Squad/March Capacity';
  return null;
}

type PetRefinementInput = {
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
  troops: { attack: number; defense: number };
};

function PetRefinementInputs({
  petRefinement, setPetRefinement
}: {
  petRefinement: PetRefinementInput,
  setPetRefinement: (r: PetRefinementInput) => void
}) {
  return (
    <>
      {/* Infantry */}
      <div className="card info-card mb-4">
        <h4>Infantry</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Infantry Lethality (%)">Infantry Lethality (%)</label>
            <input
              type="number"
              aria-label="Infantry Lethality (%)"
              step="0.01"
              value={petRefinement.infantry.lethality}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  infantry: {
                    ...petRefinement.infantry,
                    lethality: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label aria-label="Infantry Health (%)">Infantry Health (%)</label>
            <input
              type="number"
              aria-label="Infantry Health (%)"
              step="0.01"
              value={petRefinement.infantry.health}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  infantry: {
                    ...petRefinement.infantry,
                    health: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
      {/* Lancer */}
      <div className="card info-card mb-4">
        <h4>Lancer</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Lancer Lethality (%)">Lancer Lethality (%)</label>
            <input
              type="number"
              aria-label="Lancer Lethality (%)"
              step="0.01"
              value={petRefinement.lancer.lethality}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  lancer: {
                    ...petRefinement.lancer,
                    lethality: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label aria-label="Lancer Health (%)">Lancer Health (%)</label>
            <input
              type="number"
              aria-label="Lancer Health (%)"
              step="0.01"
              value={petRefinement.lancer.health}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  lancer: {
                    ...petRefinement.lancer,
                    health: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
      {/* Marksman */}
      <div className="card info-card mb-4">
        <h4>Marksman</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Marksman Lethality (%)">Marksman Lethality (%)</label>
            <input
              type="number"
              aria-label="Marksman Lethality (%)"
              step="0.01"
              value={petRefinement.marksman.lethality}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  marksman: {
                    ...petRefinement.marksman,
                    lethality: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label aria-label="Marksman Health (%)">Marksman Health (%)</label>
            <input
              type="number"
              aria-label="Marksman Health (%)"
              step="0.01"
              value={petRefinement.marksman.health}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  marksman: {
                    ...petRefinement.marksman,
                    health: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
      {/* Troops Attack/Defense */}
      <div className="card info-card mb-4">
        <h4>Troops (All Types)</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Troops Attack (%)">Troops Attack (%)</label>
            <input
              type="number"
              aria-label="Troops Attack (%)"
              step="0.01"
              value={petRefinement.troops.attack}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  troops: {
                    ...petRefinement.troops,
                    attack: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
          <div className="form-group">
            <label aria-label="Troops Defense (%)">Troops Defense (%)</label>
            <input
              type="number"
              aria-label="Troops Defense (%)"
              step="0.01"
              value={petRefinement.troops.defense}
              onChange={e =>
                setPetRefinement({
                  ...petRefinement,
                  troops: {
                    ...petRefinement.troops,
                    defense: parseFloat(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}

function PetSkillsGrid({
  safePetSkillSelections,
  onPetSkillSelectionsChange
}: {
  safePetSkillSelections: Record<string, number>,
  onPetSkillSelectionsChange?: (selections: Record<string, number>) => void,
}) {
  return (
    <div className="grid">
      {Object.entries(PETS_DATA).map(([petName, pet]) => {
        const currentLevel = safePetSkillSelections[petName] || 0;
        const maxLevel = Math.max(...Object.keys(pet.levels).map(k => parseInt(k)));
        const stat = pet.stat.toLowerCase();
        const isDebuff = stat.includes('reduction');
        const isCapacity = stat.includes('capacity');
        const affectsStat = getAffectsStat(pet.stat);

        if (!affectsStat) return null;

        return (
          <div key={petName} className="card info-card">
            <h4>{petName}</h4>
            <div className="text-sm text-gray-400 dark:text-gray-400 mb-2">
              <strong>Skill:</strong> {pet.skill}<br />
              <strong>Stat:</strong> {pet.stat}
            </div>
            <div className="form-group">
              <label aria-label="Skill Level (0-{maxLevel})">Skill Level (0-{maxLevel})</label>
              <select
                aria-label="Skill Level (0-{maxLevel})"
                value={currentLevel}
                onChange={e => {
                  const newLevel = parseInt(e.target.value) || 0;
                  const updated = {
                    ...safePetSkillSelections,
                    [petName]: newLevel,
                  };
                  if (onPetSkillSelectionsChange) {
                    onPetSkillSelectionsChange(updated);
                  }
                }}
              >
                <option value="0">Level 0 (Inactive)</option>
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map(level => {
                  const levelValue = pet.levels[level.toString()];
                  const displayValue = isCapacity ? levelValue.toLocaleString() : `${isDebuff ? '-' : '+'}${levelValue}%`;
                  return (
                    <option key={level} value={level}>
                      Level {level} ({displayValue})
                    </option>
                  );
                })}
              </select>
            </div>
            {currentLevel > 0 && (
              <div className="text-sm text-gray-400 dark:text-gray-400 mt-2">
                <strong>Current {isDebuff ? 'Debuff' : isCapacity ? 'Capacity' : 'Bonus'}:</strong>{' '}
                {isCapacity
                  ? pet.levels[currentLevel.toString()].toLocaleString()
                  : `${isDebuff ? '-' : '+'}${pet.levels[currentLevel.toString()]}%`
                } {affectsStat}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PetSkillsTotals({
  safePetSkillSelections
}: {
  safePetSkillSelections: Record<string, number>;
}) {
  // Compute buffs & debuffs totals
  const buffTotals = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const debuffTotals = { attack: 0, defense: 0, lethality: 0, health: 0 };

  Object.entries(safePetSkillSelections).forEach(([petName, level]) => {
    if (level === 0) return;
    const pet = PETS_DATA[petName];
    if (!pet) return;
    const levelValue = pet.levels[level.toString()];
    if (levelValue === undefined) return;

    const stat = pet.stat.toLowerCase();
    const isDebuff = stat.includes('reduction');
    if (isDebuff) {
      if (stat.includes('health')) debuffTotals.health += levelValue;
      else if (stat.includes('defense')) debuffTotals.defense += levelValue;
    } else {
      if (stat.includes('attack')) buffTotals.attack += levelValue;
      else if (stat.includes('defense')) buffTotals.defense += levelValue;
      else if (stat.includes('lethality')) buffTotals.lethality += levelValue;
      else if (stat.includes('health')) buffTotals.health += levelValue;
    }
  });

  const hasBuffs = Object.values(buffTotals).some(v => v > 0);
  const hasDebuffs = Object.values(debuffTotals).some(v => v > 0);

  return (
    <>
      {hasBuffs && (
        <div className="card info-card mt-4">
          <h4>Total Pet Skill Bonuses (Multiplicative)</h4>
          <div className="grid">
            {buffTotals.attack > 0 && (
              <div className="form-group">
                <label>Attack</label>
                <div className="text-2xl font-bold text-emerald-300">
                  +{buffTotals.attack.toFixed(1)}%
                </div>
              </div>
            )}
            {buffTotals.defense > 0 && (
              <div className="form-group">
                <label>Defense</label>
                <div className="text-2xl font-bold text-emerald-300">
                  +{buffTotals.defense.toFixed(1)}%
                </div>
              </div>
            )}
            {buffTotals.lethality > 0 && (
              <div className="form-group">
                <label>Lethality</label>
                <div className="text-2xl font-bold text-emerald-300">
                  +{buffTotals.lethality.toFixed(1)}%
                </div>
              </div>
            )}
            {buffTotals.health > 0 && (
              <div className="form-group">
                <label>Health</label>
                <div className="text-2xl font-bold text-emerald-300">
                  +{buffTotals.health.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {hasDebuffs && (
        <div className="card info-card mt-4">
          <h4>Total Pet Skill Debuffs (Enemy Reduction)</h4>
          <div className="grid">
            {debuffTotals.defense > 0 && (
              <div className="form-group">
                <label>Enemy Defense Reduction</label>
                <div className="text-2xl font-bold text-red-300">
                  -{debuffTotals.defense.toFixed(1)}%
                </div>
              </div>
            )}
            {debuffTotals.health > 0 && (
              <div className="form-group">
                <label>Enemy Health Reduction</label>
                <div className="text-2xl font-bold text-red-300">
                  -{debuffTotals.health.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function OpponentColorTierSelector({
  colorTier,
  onColorTierChange,
  setPetRefinement,
  petRefinement,
  basicBonuses,
  onBasicBonusesChange
}: {
  colorTier?: 'grey' | 'green' | 'blue' | 'purple' | 'gold';
  onColorTierChange?: (colorTier: 'grey' | 'green' | 'blue' | 'purple' | 'gold' | undefined) => void;
  setPetRefinement: (r: PetRefinementInput) => void;
  petRefinement: PetRefinementInput;
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (b: BasicBonuses) => void;
}) {
  return (
    <div className="card info-card mb-6">
      <h4>Color Tier</h4>
      <p className="section-description mb-4">
        Select the opponent&apos;s color tier to apply Lethality and Health bonuses to all troop types (affects Charms bonuses).
      </p>
      <div className="form-group">
        <label aria-label="Color Tier">Color Tier</label>
        <select
          aria-label="Color Tier"
          value={colorTier || ''}
          onChange={e => {
            const newColorTier = e.target.value as 'grey' | 'green' | 'blue' | 'purple' | 'gold' | '';
            const selectedTier = newColorTier || undefined;

            onColorTierChange && onColorTierChange(selectedTier);

            if (selectedTier) {
              const colorBonuses = getColorTierBonuses(selectedTier);

              setPetRefinement({
                infantry: {
                  lethality: colorBonuses.lethality,
                  health: colorBonuses.health,
                },
                lancer: {
                  lethality: colorBonuses.lethality,
                  health: colorBonuses.health,
                },
                marksman: {
                  lethality: colorBonuses.lethality,
                  health: colorBonuses.health,
                },
                troops: petRefinement.troops,
              });

              onBasicBonusesChange({
                ...basicBonuses,
                charms: {
                  infantry: {
                    lethality: colorBonuses.lethality,
                    health: colorBonuses.health,
                  },
                  lancer: {
                    lethality: colorBonuses.lethality,
                    health: colorBonuses.health,
                  },
                  marksman: {
                    lethality: colorBonuses.lethality,
                    health: colorBonuses.health,
                  },
                },
              });
            } else {
              setPetRefinement({
                infantry: { lethality: 0, health: 0 },
                lancer: { lethality: 0, health: 0 },
                marksman: { lethality: 0, health: 0 },
                troops: petRefinement.troops,
              });
            }
          }}
        >
          <option value="">Select Color Tier...</option>
          <option value="grey">Grey (70.4)</option>
          <option value="green">Green (178.12)</option>
          <option value="blue">Blue (233.53)</option>
          <option value="purple">Purple (326.92)</option>
          <option value="gold">Gold (467.02)</option>
        </select>
      </div>
      {colorTier && (
        <div className="callout callout-muted mt-4 text-sm space-y-2">
          <strong>Applied Charms Bonuses:</strong>
          <div className="space-y-1">
            <div>
              Infantry: LETH +{getColorTierBonuses(colorTier).lethality.toFixed(2)}%, HP +{getColorTierBonuses(colorTier).health.toFixed(2)}%
            </div>
            <div>
              Lancer: LETH +{getColorTierBonuses(colorTier).lethality.toFixed(2)}%, HP +{getColorTierBonuses(colorTier).health.toFixed(2)}%
            </div>
            <div>
              Marksman: LETH +{getColorTierBonuses(colorTier).lethality.toFixed(2)}%, HP +{getColorTierBonuses(colorTier).health.toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------
// Main Component
// -------------------------

export default function PetsSection({
  basicBonuses,
  onBasicBonusesChange,
  multiplicativeBonuses,
  onMultiplicativeBonusesChange,
  capacity,
  onCapacityChange,
  petSkillSelections: initialPetSkillSelections,
  onPetSkillSelectionsChange,
  isOpponent = false,
  colorTier,
  onColorTierChange,
}: PetsSectionProps) {
  const [activeSection, setActiveSection] = useState<'refinement' | 'skills'>('refinement');

  // -------------------------
  // State & Derived
  // -------------------------

  // Pet Refinement State
  const [petRefinement, setPetRefinement] = useState(() => ({
    infantry: {
      lethality: basicBonuses.petRefinement?.infantry?.lethality || 0,
      health: basicBonuses.petRefinement?.infantry?.health || 0,
    },
    lancer: {
      lethality: basicBonuses.petRefinement?.lancer?.lethality || 0,
      health: basicBonuses.petRefinement?.lancer?.health || 0,
    },
    marksman: {
      lethality: basicBonuses.petRefinement?.marksman?.lethality || 0,
      health: basicBonuses.petRefinement?.marksman?.health || 0,
    },
    troops: {
      attack: basicBonuses.petRefinement?.troops?.attack || 0,
      defense: basicBonuses.petRefinement?.troops?.defense || 0,
    },
  }));

  // Track previous pet debuff values to preserve manual inputs
  const [previousPetDebuffs, setPreviousPetDebuffs] = useState<Record<string, number>>({
    attack: 0, defense: 0, lethality: 0, health: 0,
  });

  // Memo: Pet Skill Selections (sync with possible initialPetSkillSelections)
  const safePetSkillSelections = useMemo(() => {
    const defaults: Record<string, number> = {};
    Object.entries(PETS_DATA).forEach(([petName, pet]) => {
      const maxLevel = Math.max(...Object.keys(pet.levels).map(k => parseInt(k)));
      defaults[petName] = maxLevel;
    });
    if (initialPetSkillSelections && Object.keys(initialPetSkillSelections).length > 0)
      return { ...defaults, ...initialPetSkillSelections };
    return defaults;
  }, [initialPetSkillSelections]);

  // -------------------------
  // Effects
  // -------------------------

  // Effect: Sync petRefinement state when basicBonuses.petRefinement changes externally
  useEffect(() => {
    const currentRefinement = basicBonuses.petRefinement || {
      infantry: { lethality: 0, health: 0 },
      lancer: { lethality: 0, health: 0 },
      marksman: { lethality: 0, health: 0 },
      troops: { attack: 0, defense: 0 },
    };
    const stateChanged =
      currentRefinement.infantry.lethality !== petRefinement.infantry.lethality ||
      currentRefinement.infantry.health !== petRefinement.infantry.health ||
      currentRefinement.lancer.lethality !== petRefinement.lancer.lethality ||
      currentRefinement.lancer.health !== petRefinement.lancer.health ||
      currentRefinement.marksman.lethality !== petRefinement.marksman.lethality ||
      currentRefinement.marksman.health !== petRefinement.marksman.health ||
      currentRefinement.troops.attack !== petRefinement.troops.attack ||
      currentRefinement.troops.defense !== petRefinement.troops.defense;
    if (stateChanged) {
      setPetRefinement({
        infantry: {
          lethality: currentRefinement.infantry.lethality || 0,
          health: currentRefinement.infantry.health || 0,
        },
        lancer: {
          lethality: currentRefinement.lancer.lethality || 0,
          health: currentRefinement.lancer.health || 0,
        },
        marksman: {
          lethality: currentRefinement.marksman.lethality || 0,
          health: currentRefinement.marksman.health || 0,
        },
        troops: {
          attack: currentRefinement.troops.attack || 0,
          defense: currentRefinement.troops.defense || 0,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicBonuses.petRefinement]);

  // Effect: Derive color tier from petRefinement if unset and isOpponent
  useEffect(() => {
    if (!isOpponent || !onColorTierChange || colorTier) return;
    const currentLethality = petRefinement.infantry.lethality;
    const currentHealth = petRefinement.infantry.health;
    if (currentLethality === 0 && currentHealth === 0) return;
    const colorTiers: Array<'grey' | 'green' | 'blue' | 'purple' | 'gold'> = ['grey', 'green', 'blue', 'purple', 'gold'];
    const matchingTier = colorTiers.find(tier => {
      const tierBonuses = getColorTierBonuses(tier);
      return Math.abs(tierBonuses.lethality - currentLethality) < 0.01 &&
        Math.abs(tierBonuses.health - currentHealth) < 0.01;
    });
    if (matchingTier) onColorTierChange(matchingTier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petRefinement.infantry.lethality, petRefinement.infantry.health]);

  // Effect: Trigger basic bonuses ref update when petRefinement changes
  useEffect(() => {
    const currentRefinement = basicBonuses.petRefinement || {
      infantry: { lethality: 0, health: 0 },
      lancer: { lethality: 0, health: 0 },
      marksman: { lethality: 0, health: 0 },
      troops: { attack: 0, defense: 0 },
    };
    const hasChanged =
      currentRefinement.infantry.lethality !== petRefinement.infantry.lethality ||
      currentRefinement.infantry.health !== petRefinement.infantry.health ||
      currentRefinement.lancer.lethality !== petRefinement.lancer.lethality ||
      currentRefinement.lancer.health !== petRefinement.lancer.health ||
      currentRefinement.marksman.lethality !== petRefinement.marksman.lethality ||
      currentRefinement.marksman.health !== petRefinement.marksman.health ||
      currentRefinement.troops.attack !== petRefinement.troops.attack ||
      currentRefinement.troops.defense !== petRefinement.troops.defense;
    if (hasChanged) {
      onBasicBonusesChange({
        ...basicBonuses,
        petRefinement: petRefinement,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petRefinement]);

  // Effect: MultiplicativeBonuses - pet skills and debuffs calculations
  useEffect(() => {
    if (!multiplicativeBonuses || !onMultiplicativeBonusesChange) return;
    const petSkillBonuses = { attack: 0, defense: 0, lethality: 0, health: 0 };
    const petDebuffBonuses = { attack: 0, defense: 0, lethality: 0, health: 0 };

    Object.entries(safePetSkillSelections).forEach(([petName, level]) => {
      if (level === 0) return;
      const pet = PETS_DATA[petName];
      if (!pet) return;
      const levelValue = pet.levels[level.toString()];
      if (levelValue === undefined) return;

      const stat = pet.stat.toLowerCase();
      const isDebuff = stat.includes('reduction');

      if (stat.includes('attack')) petSkillBonuses.attack += levelValue;
      else if (stat.includes('defense') && !isDebuff) petSkillBonuses.defense += levelValue;
      else if (stat.includes('lethality')) petSkillBonuses.lethality += levelValue;
      else if (stat.includes('health') && !isDebuff) petSkillBonuses.health += levelValue;
      else if (stat.includes('health') && isDebuff) petDebuffBonuses.health += levelValue;
      else if (stat.includes('defense') && isDebuff) petDebuffBonuses.defense += levelValue;
    });

    const currentPetSkills = multiplicativeBonuses.petSkills || { attack: 0, defense: 0, lethality: 0, health: 0 };
    const currentCombatDebuffs = multiplicativeBonuses.combatDebuffs || { attack: 0, defense: 0, lethality: 0, health: 0 };
    const skillsChanged =
      currentPetSkills.attack !== petSkillBonuses.attack ||
      currentPetSkills.defense !== petSkillBonuses.defense ||
      currentPetSkills.lethality !== petSkillBonuses.lethality ||
      currentPetSkills.health !== petSkillBonuses.health;

    // Manual input preservation for debuffs
    const isFirstRun = previousPetDebuffs.attack === 0 && previousPetDebuffs.defense === 0 &&
      previousPetDebuffs.lethality === 0 && previousPetDebuffs.health === 0;
    let manualDebuffs;
    if (isFirstRun) {
      manualDebuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };
    } else {
      manualDebuffs = {
        attack: Math.max(0, (currentCombatDebuffs.attack || 0) - previousPetDebuffs.attack),
        defense: Math.max(0, (currentCombatDebuffs.defense || 0) - previousPetDebuffs.defense),
        lethality: Math.max(0, (currentCombatDebuffs.lethality || 0) - previousPetDebuffs.lethality),
        health: Math.max(0, (currentCombatDebuffs.health || 0) - previousPetDebuffs.health),
      };
    }

    const newCombatDebuffs = {
      attack: petDebuffBonuses.attack + manualDebuffs.attack,
      defense: petDebuffBonuses.defense + manualDebuffs.defense,
      lethality: petDebuffBonuses.lethality + manualDebuffs.lethality,
      health: petDebuffBonuses.health + manualDebuffs.health,
    };
    const debuffsChanged =
      currentCombatDebuffs.attack !== newCombatDebuffs.attack ||
      currentCombatDebuffs.defense !== newCombatDebuffs.defense ||
      currentCombatDebuffs.lethality !== newCombatDebuffs.lethality ||
      currentCombatDebuffs.health !== newCombatDebuffs.health;

    if (skillsChanged || debuffsChanged) {
      setPreviousPetDebuffs(petDebuffBonuses);
      onMultiplicativeBonusesChange({
        ...multiplicativeBonuses,
        petSkills: petSkillBonuses,
        combatDebuffs: newCombatDebuffs,
      });
    } else if (
      previousPetDebuffs.attack === 0 &&
      previousPetDebuffs.defense === 0 &&
      previousPetDebuffs.lethality === 0 &&
      previousPetDebuffs.health === 0 &&
      (petDebuffBonuses.attack > 0 || petDebuffBonuses.defense > 0 || petDebuffBonuses.lethality > 0 || petDebuffBonuses.health > 0)
    ) {
      setPreviousPetDebuffs(petDebuffBonuses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePetSkillSelections]);

  // Effect: Pet Capacity (Rhino, Snow Ape)
  useEffect(() => {
    if (!capacity || !onCapacityChange) return;
    let rallyCapacity = 0;
    let marchCapacity = 0;
    Object.entries(safePetSkillSelections).forEach(([petName, level]) => {
      if (level === 0) return;
      const pet = PETS_DATA[petName];
      if (!pet) return;
      const levelValue = pet.levels[level.toString()];
      if (levelValue === undefined) return;
      if (petName === 'Rhino' && pet.stat.includes('Rally Capacity')) rallyCapacity = levelValue;
      else if (petName === 'Snow Ape' && pet.stat.includes('Squad Capacity')) marchCapacity = levelValue;
    });
    if (capacity.rally !== rallyCapacity || capacity.march !== marchCapacity) {
      onCapacityChange({ rally: rallyCapacity, march: marchCapacity });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePetSkillSelections]);

  // -------------------------
  // Render Section tabs
  // -------------------------

  return (
    <div>
      <div className="tabs mb-6">
        <button
          className={`tab ${activeSection === 'refinement' ? 'active' : ''}`}
          onClick={() => setActiveSection('refinement')}
        >
          Refinement
        </button>
        <button
          className={`tab ${activeSection === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveSection('skills')}
        >
          Skills
        </button>
      </div>

      {/* --------------------- Pet Refinement Section --------------------- */}
      {activeSection === 'refinement' && (
        <div>
          <h3>Pet Refinement</h3>
          {isOpponent && (
            <OpponentColorTierSelector
              colorTier={colorTier}
              onColorTierChange={onColorTierChange}
              setPetRefinement={setPetRefinement}
              petRefinement={petRefinement}
              basicBonuses={basicBonuses}
              onBasicBonusesChange={onBasicBonusesChange}
            />
          )}
          <p className="section-description">
            Enter pet refinement bonuses from the Pet Stat Bonuses Details window. Values should be entered as percentages (e.g., 207.20 for +207.20%).
          </p>
          <PetRefinementInputs petRefinement={petRefinement} setPetRefinement={setPetRefinement} />
        </div>
      )}

      {/* --------------------- Pet Skills Section --------------------- */}
      {activeSection === 'skills' &&
        multiplicativeBonuses &&
        onMultiplicativeBonusesChange && (
          <div>
            <h3>Pet Skills</h3>
            <p className="section-description">
              Select active pet skills and their levels. Pet skills are <strong>multiplicative bonuses</strong> that scale your total stats. Active for 2 hours when used.
            </p>
            <PetSkillsGrid
              safePetSkillSelections={safePetSkillSelections}
              onPetSkillSelectionsChange={onPetSkillSelectionsChange}
            />
            <PetSkillsTotals safePetSkillSelections={safePetSkillSelections} />
          </div>
        )}
    </div>
  );
}

