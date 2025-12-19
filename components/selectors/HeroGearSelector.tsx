'use client';

import { useEffect, useMemo } from 'react';
import { getHeroGearBonuses, getHeroGearPower, type HeroGearConfig, type HeroGearSelections } from '../../lib/battle';
import type { BasicBonuses } from '../../lib/battle/calculations';

interface HeroGearSelectorProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  heroGearSelections?: HeroGearSelections;
  onHeroGearSelectionsChange?: (selections: HeroGearSelections) => void;
}

const defaultGearConfig: HeroGearConfig = {
  level: 200,
  masteryForged: true,
  masteryLevel: 20,
  essenceLevel: 0, // No UI for essence level, so default to 0
  empowermentLevel: 100, // Default to +100
  stacking: 'additive',
};

export default function HeroGearSelector({
  basicBonuses,
  onBasicBonusesChange,
  heroGearSelections: providedSelections,
  onHeroGearSelectionsChange
}: HeroGearSelectorProps) {
  // Ensure we always have valid selections structure
  const safeSelections = useMemo(() => {
    if (!providedSelections || !providedSelections.infantry || !providedSelections.lancer || !providedSelections.marksman) {
      // Return defaults if structure is invalid
      return {
        infantry: {
          goggles: { ...defaultGearConfig },
          glove: { ...defaultGearConfig },
          boot: { ...defaultGearConfig },
          belt: { ...defaultGearConfig },
        },
        lancer: {
          goggles: { ...defaultGearConfig },
          glove: { ...defaultGearConfig },
          boot: { ...defaultGearConfig },
          belt: { ...defaultGearConfig },
        },
        marksman: {
          goggles: { ...defaultGearConfig },
          glove: { ...defaultGearConfig },
          boot: { ...defaultGearConfig },
          belt: { ...defaultGearConfig },
        },
      };
    }
    return providedSelections;
  }, [providedSelections]);

  // Calculate gear bonuses and update when selections change
  const gearBonuses = useMemo(() => {
    return getHeroGearBonuses(safeSelections);
  }, [safeSelections]);

  // Calculate gear power for all pieces
  const gearPower = useMemo(() => {
    return getHeroGearPower(safeSelections);
  }, [safeSelections]);

  // Update hero gear bonuses when they change
  useEffect(() => {
    onBasicBonusesChange({
      ...basicBonuses,
      heroGear: gearBonuses,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gearBonuses]);

  const updateGearConfig = (
    troopType: 'infantry' | 'lancer' | 'marksman',
    gearPiece: 'goggles' | 'glove' | 'boot' | 'belt',
    field: keyof HeroGearConfig,
    value: HeroGearConfig[keyof HeroGearConfig]
  ) => {
    const updated = {
      ...safeSelections,
      [troopType]: {
        ...safeSelections[troopType],
        [gearPiece]: {
          ...safeSelections[troopType][gearPiece],
          [field]: value,
        },
      },
    };

    // Notify parent to save - just like HeroSelector does
    if (onHeroGearSelectionsChange) {
      onHeroGearSelectionsChange(updated);
    }
  };

  const renderGearPiece = (
    troopType: 'infantry' | 'lancer' | 'marksman',
    gearPiece: 'goggles' | 'glove' | 'boot' | 'belt',
    label: string,
    statType: 'lethality' | 'health'
  ) => {
    const config = safeSelections[troopType][gearPiece];
    const piecePower = gearPower[troopType][gearPiece];

    return (
      <div key={gearPiece} className="card info-card space-y-3">
        <h4>{label}</h4>
        <p className="text-xs text-gray-400 dark:text-gray-400">
          {statType === 'lethality' ? 'Lethality' : 'Health'} gear
        </p>
        <p className="text-sm font-semibold text-gray-100">
          Power: {piecePower.toFixed(1)}
        </p>
        <div className="form-group">
          <label>Gear Level (1-200)</label>
          <input
            type="number"
            min="1"
            max="200"
            value={config.level}
            onChange={(e) => updateGearConfig(troopType, gearPiece, 'level', parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.masteryForged}
              onChange={(e) => updateGearConfig(troopType, gearPiece, 'masteryForged', e.target.checked)}
              className="mr-2"
            />
            Mastery Forged
          </label>
        </div>
        {config.masteryForged && (
          <>
            <div className="form-group">
              <label>Mastery Forged Level (0-20)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={config.masteryLevel}
                onChange={(e) => updateGearConfig(troopType, gearPiece, 'masteryLevel', parseInt(e.target.value) || 0)}
              />
            </div>
          </>
        )}
        <div className="form-group">
          <label>Empowerment Level</label>
          <select
            value={config.empowermentLevel}
            onChange={(e) => updateGearConfig(troopType, gearPiece, 'empowermentLevel', parseInt(e.target.value) || 0)}
          >
            <option value="0">None (0)</option>
            <option value="20" disabled={config.level < 120}>+20 (unlocks at level 120)</option>
            <option value="40" disabled={config.level < 140}>+40 (unlocks at level 140)</option>
            <option value="60" disabled={config.level < 160}>+60 (unlocks at level 160)</option>
            <option value="80" disabled={config.level < 180}>+80 (unlocks at level 180)</option>
            <option value="100" disabled={config.level < 200}>+100 (unlocks at level 200)</option>
          </select>
          {config.level < 120 && config.empowermentLevel > 0 && (
            <p className="text-xs text-amber-200 dark:text-amber-200 mt-1">
              Gear level must be at least 120 for Empowerment
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3>Hero Gear Configuration</h3>
      <p className="section-description">
        Configure hero gear for each troop type. Goggles and Boots provide Lethality, Gloves and Belts provide Health.
        Mastery Forge applies progressive % bonuses. Empowerment unlocks at specific gear levels: +20 (level 120+), +40 (level 140+), +60 (level 160+), +80 (level 180+), +100 (level 200+).
      </p>

      {(['infantry', 'lancer', 'marksman'] as const).map(troopType => (
        <div key={troopType} className="mb-10">
          <h4 className="capitalize mb-4 text-lg font-semibold text-white">{troopType} Gear</h4>
          <div className="grid">
            {renderGearPiece(troopType, 'goggles', 'Goggles', 'lethality')}
            {renderGearPiece(troopType, 'glove', 'Glove', 'health')}
            {renderGearPiece(troopType, 'boot', 'Boot', 'lethality')}
            {renderGearPiece(troopType, 'belt', 'Belt', 'health')}
          </div>
          <div className="card info-card mt-4 space-y-4">
            <h5 className="text-base font-semibold">Total {troopType.charAt(0).toUpperCase() + troopType.slice(1)} Bonuses</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-display-item text-left">
                <div className="stat-label normal-case">Lethality</div>
                <div className="stat-value text-xl">{gearBonuses[troopType].lethality.toFixed(2)}%</div>
              </div>
              <div className="stat-display-item text-left">
                <div className="stat-label normal-case">Health</div>
                <div className="stat-value text-xl">{gearBonuses[troopType].health.toFixed(2)}%</div>
              </div>
              <div className="stat-display-item text-left">
                <div className="stat-label normal-case">Attack (Empower)</div>
                <div className="stat-value text-xl">{gearBonuses[troopType].attack.toFixed(2)}%</div>
              </div>
              <div className="stat-display-item text-left">
                <div className="stat-label normal-case">Defense (Empower)</div>
                <div className="stat-value text-xl">{gearBonuses[troopType].defense.toFixed(2)}%</div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <h5 className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-1">
                Total {troopType.charAt(0).toUpperCase() + troopType.slice(1)} Power
              </h5>
              <div className="text-2xl font-bold text-white">
                {gearPower[troopType].total.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
