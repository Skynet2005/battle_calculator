'use client';

import { useEffect, useState } from 'react';
import type { BasicBonuses } from '@/lib/battle/calculations';
import { getResearchBonuses, getWarAcademyBonuses } from '@/lib/battle/data-extractors';
import {
  getResearchCategories,
  getResearchLevels,
  getResearchTierLabels,
  getWarAcademyTech,
} from '@/lib/battle/data-selectors';
import {
  getMaxResearchLevels,
  getMaxWarAcademyLevels,
} from '@/lib/battle/data/max-levels';

interface ResearchSectionProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  warAcademySelections?: Record<string, number>;
  onWarAcademySelectionsChange?: (selections: Record<string, number>) => void;
}

export default function ResearchSection({
  basicBonuses,
  onBasicBonusesChange,
  warAcademySelections: providedWarAcademySelections,
  onWarAcademySelectionsChange,
}: ResearchSectionProps) {
  const [activeSection, setActiveSection] = useState<'research' | 'warAcademy'>('research');

  // Get max levels
  const maxResearchLevels = getMaxResearchLevels();
  const maxWarAcademyLevels = getMaxWarAcademyLevels();

  // Research selections - default to max for each category/tier
  const [researchSelections, setResearchSelections] = useState<Record<string, Record<string, number>>>(() => {
    const defaults: Record<string, Record<string, number>> = {};
    const categories = getResearchCategories();

    for (const category of categories) {
      defaults[category] = {};
      const tierLabels = getResearchTierLabels(category);

      for (const tierLabel of tierLabels) {
        defaults[category][tierLabel] = maxResearchLevels[category]?.[tierLabel] || 0;
      }
    }

    return defaults;
  });

  // War Academy selections - use local state that syncs with provided prop
  const [localWarAcademySelections, setLocalWarAcademySelections] = useState<Record<string, number>>(() => {
    return providedWarAcademySelections || maxWarAcademyLevels;
  });

  // Sync local state when prop changes
  useEffect(() => {
    if (providedWarAcademySelections) {
      setLocalWarAcademySelections(providedWarAcademySelections);
    }
  }, [providedWarAcademySelections]);

  const warAcademySelections = localWarAcademySelections;

  const setWarAcademySelections = (selections: Record<string, number>) => {
    setLocalWarAcademySelections(selections);
    if (onWarAcademySelectionsChange) {
      onWarAcademySelectionsChange(selections);
    }
  };

  // Update Research bonuses for all troop types
  useEffect(() => {
    if (!onBasicBonusesChange) return;

    const researchBonuses = getResearchBonuses(researchSelections, 'infantry');
    const newCombatTech = {
      ...basicBonuses.combatTech,
      troopTypeBonus: {
        infantry: {
          attack: researchBonuses.troopTypeBonus.infantry.attack,
          defense: researchBonuses.troopTypeBonus.infantry.defense,
          lethality: researchBonuses.troopTypeBonus.infantry.lethality,
          health: researchBonuses.troopTypeBonus.infantry.health,
        },
        lancer: {
          attack: researchBonuses.troopTypeBonus.lancer.attack,
          defense: researchBonuses.troopTypeBonus.lancer.defense,
          lethality: researchBonuses.troopTypeBonus.lancer.lethality,
          health: researchBonuses.troopTypeBonus.lancer.health,
        },
        marksman: {
          attack: researchBonuses.troopTypeBonus.marksman.attack,
          defense: researchBonuses.troopTypeBonus.marksman.defense,
          lethality: researchBonuses.troopTypeBonus.marksman.lethality,
          health: researchBonuses.troopTypeBonus.marksman.health,
        },
      },
      totalTroopBonus: researchBonuses.totalTroopBonus,
    };

    // Only update if values have changed
    const currentCombatTech = basicBonuses.combatTech;
    const troopTypeChanged =
      currentCombatTech.troopTypeBonus.infantry.attack !== newCombatTech.troopTypeBonus.infantry.attack ||
      currentCombatTech.troopTypeBonus.infantry.defense !== newCombatTech.troopTypeBonus.infantry.defense ||
      currentCombatTech.troopTypeBonus.infantry.lethality !== newCombatTech.troopTypeBonus.infantry.lethality ||
      currentCombatTech.troopTypeBonus.infantry.health !== newCombatTech.troopTypeBonus.infantry.health ||
      currentCombatTech.troopTypeBonus.lancer.attack !== newCombatTech.troopTypeBonus.lancer.attack ||
      currentCombatTech.troopTypeBonus.lancer.defense !== newCombatTech.troopTypeBonus.lancer.defense ||
      currentCombatTech.troopTypeBonus.lancer.lethality !== newCombatTech.troopTypeBonus.lancer.lethality ||
      currentCombatTech.troopTypeBonus.lancer.health !== newCombatTech.troopTypeBonus.lancer.health ||
      currentCombatTech.troopTypeBonus.marksman.attack !== newCombatTech.troopTypeBonus.marksman.attack ||
      currentCombatTech.troopTypeBonus.marksman.defense !== newCombatTech.troopTypeBonus.marksman.defense ||
      currentCombatTech.troopTypeBonus.marksman.lethality !== newCombatTech.troopTypeBonus.marksman.lethality ||
      currentCombatTech.troopTypeBonus.marksman.health !== newCombatTech.troopTypeBonus.marksman.health;

    const totalChanged =
      currentCombatTech.totalTroopBonus.attack !== newCombatTech.totalTroopBonus.attack ||
      currentCombatTech.totalTroopBonus.defense !== newCombatTech.totalTroopBonus.defense ||
      currentCombatTech.totalTroopBonus.lethality !== newCombatTech.totalTroopBonus.lethality ||
      currentCombatTech.totalTroopBonus.health !== newCombatTech.totalTroopBonus.health;

    if (troopTypeChanged || totalChanged) {
      onBasicBonusesChange({
        ...basicBonuses,
        combatTech: newCombatTech,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchSelections]);

  // Update War Academy bonuses
  useEffect(() => {
    if (!onBasicBonusesChange) return;

    const academyBonuses = getWarAcademyBonuses(warAcademySelections);
    const currentWarAcademy = basicBonuses.warAcademy || {
      infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
      lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
      marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };

    // Only update if values have changed
    const hasChanged =
      currentWarAcademy.infantry.attack !== academyBonuses.infantry.attack ||
      currentWarAcademy.infantry.defense !== academyBonuses.infantry.defense ||
      currentWarAcademy.infantry.lethality !== academyBonuses.infantry.lethality ||
      currentWarAcademy.infantry.health !== academyBonuses.infantry.health ||
      currentWarAcademy.lancer.attack !== academyBonuses.lancer.attack ||
      currentWarAcademy.lancer.defense !== academyBonuses.lancer.defense ||
      currentWarAcademy.lancer.lethality !== academyBonuses.lancer.lethality ||
      currentWarAcademy.lancer.health !== academyBonuses.lancer.health ||
      currentWarAcademy.marksman.attack !== academyBonuses.marksman.attack ||
      currentWarAcademy.marksman.defense !== academyBonuses.marksman.defense ||
      currentWarAcademy.marksman.lethality !== academyBonuses.marksman.lethality ||
      currentWarAcademy.marksman.health !== academyBonuses.marksman.health;

    if (hasChanged) {
      onBasicBonusesChange({
        ...basicBonuses,
        warAcademy: academyBonuses,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warAcademySelections]);

  const researchCategories = getResearchCategories();
  const warAcademyData = getWarAcademyTech();

  return (
    <div>
      <div className="tabs mb-6">
        <button
          className={`tab ${activeSection === 'research' ? 'active' : ''}`}
          onClick={() => setActiveSection('research')}
        >
          Research
        </button>
        <button
          className={`tab ${activeSection === 'warAcademy' ? 'active' : ''}`}
          onClick={() => setActiveSection('warAcademy')}
        >
          War Academy
        </button>
      </div>

      {/* Research Section */}
      {activeSection === 'research' && (
        <div>
          <h3>Battle Research</h3>
          <p className="section-description">
            Select research levels. This is a simplified view - full implementation would show the research tree.
          </p>

          {/* Total Research Bonuses Display */}
          {(() => {
            const totalTroopBonus = basicBonuses.combatTech?.totalTroopBonus || { attack: 0, defense: 0, lethality: 0, health: 0 };
            const troopTypeBonus = basicBonuses.combatTech?.troopTypeBonus || {
              infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
              lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
              marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
            };

            // Calculate troop-specific bonuses only (exclude global bonuses)
            const infantryTotal = {
              attack: troopTypeBonus.infantry.attack - totalTroopBonus.attack,
              defense: troopTypeBonus.infantry.defense - totalTroopBonus.defense,
              lethality: troopTypeBonus.infantry.lethality - totalTroopBonus.lethality,
              health: troopTypeBonus.infantry.health - totalTroopBonus.health,
            };
            const lancerTotal = {
              attack: troopTypeBonus.lancer.attack - totalTroopBonus.attack,
              defense: troopTypeBonus.lancer.defense - totalTroopBonus.defense,
              lethality: troopTypeBonus.lancer.lethality - totalTroopBonus.lethality,
              health: troopTypeBonus.lancer.health - totalTroopBonus.health,
            };
            const marksmanTotal = {
              attack: troopTypeBonus.marksman.attack - totalTroopBonus.attack,
              defense: troopTypeBonus.marksman.defense - totalTroopBonus.defense,
              lethality: troopTypeBonus.marksman.lethality - totalTroopBonus.lethality,
              health: troopTypeBonus.marksman.health - totalTroopBonus.health,
            };

            const hasBonuses =
              totalTroopBonus.attack > 0 || totalTroopBonus.defense > 0 || totalTroopBonus.lethality > 0 || totalTroopBonus.health > 0 ||
              troopTypeBonus.infantry.attack > 0 || troopTypeBonus.infantry.defense > 0 || troopTypeBonus.infantry.lethality > 0 || troopTypeBonus.infantry.health > 0 ||
              troopTypeBonus.lancer.attack > 0 || troopTypeBonus.lancer.defense > 0 || troopTypeBonus.lancer.lethality > 0 || troopTypeBonus.lancer.health > 0 ||
              troopTypeBonus.marksman.attack > 0 || troopTypeBonus.marksman.defense > 0 || troopTypeBonus.marksman.lethality > 0 || troopTypeBonus.marksman.health > 0;

            if (!hasBonuses) return null;

            return (
              <div className="card info-card mb-6">
                <h4 className="mb-4 text-lg font-semibold">Total Research Bonuses</h4>

                {/* All Troops (Global) */}
                <div className="mb-6">
                  <h5 className="stat-label text-cyan-300 dark:text-cyan-300 mb-2">All Troops (Global)</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {totalTroopBonus.attack > 0 ? '+' : ''}{totalTroopBonus.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {totalTroopBonus.defense > 0 ? '+' : ''}{totalTroopBonus.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {totalTroopBonus.lethality > 0 ? '+' : ''}{totalTroopBonus.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {totalTroopBonus.health > 0 ? '+' : ''}{totalTroopBonus.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Infantry Specific */}
                <div className="stat-section">
                  <h5 className="stat-label text-blue-300 dark:text-blue-300 mb-2">Infantry (Troop-Specific Only)</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {infantryTotal.attack > 0 ? '+' : ''}{infantryTotal.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {infantryTotal.defense > 0 ? '+' : ''}{infantryTotal.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {infantryTotal.lethality > 0 ? '+' : ''}{infantryTotal.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {infantryTotal.health > 0 ? '+' : ''}{infantryTotal.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lancer Specific */}
                <div className="stat-section">
                  <h5 className="stat-label text-rose-300 dark:text-rose-300 mb-2">Lancer (Troop-Specific Only)</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {lancerTotal.attack > 0 ? '+' : ''}{lancerTotal.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {lancerTotal.defense > 0 ? '+' : ''}{lancerTotal.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {lancerTotal.lethality > 0 ? '+' : ''}{lancerTotal.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {lancerTotal.health > 0 ? '+' : ''}{lancerTotal.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marksman Specific */}
                <div className="stat-section">
                  <h5 className="stat-label text-amber-300 dark:text-amber-300 mb-2">Marksman (Troop-Specific Only)</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {marksmanTotal.attack > 0 ? '+' : ''}{marksmanTotal.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {marksmanTotal.defense > 0 ? '+' : ''}{marksmanTotal.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {marksmanTotal.lethality > 0 ? '+' : ''}{marksmanTotal.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {marksmanTotal.health > 0 ? '+' : ''}{marksmanTotal.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          {researchCategories.map(category => {
            const tierLabels = getResearchTierLabels(category);
            return (
              <div key={category} className="card info-card mb-4">
                <h4>{category}</h4>
                {tierLabels.map(tierLabel => {
                  const levels = getResearchLevels(category, tierLabel);
                  const currentLevel = researchSelections[category]?.[tierLabel] || 0;

                  return (
                    <div key={tierLabel} className="form-group">
                      <label>{tierLabel}</label>
                      <select
                        value={currentLevel}
                        onChange={(e) => {
                          setResearchSelections({
                            ...researchSelections,
                            [category]: {
                              ...researchSelections[category],
                              [tierLabel]: parseInt(e.target.value) || 0,
                            },
                          });
                        }}
                      >
                        <option value="0">Not researched</option>
                        {levels.map(level => (
                          <option key={level.level} value={level.level}>
                            Level {level.level} - {level.stats.map(s => `${s.name}: ${s.value}%`).join(', ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* War Academy Section */}
      {activeSection === 'warAcademy' && (
        <div>
          <h3>War Academy Tech</h3>
          <p className="section-description">
            Select tech levels for each War Academy technology, organized by troop type.
          </p>

          {/* Total War Academy Bonuses Display */}
          {(() => {
            const academyBonuses = getWarAcademyBonuses(warAcademySelections);
            const hasBonuses =
              academyBonuses.infantry.attack > 0 || academyBonuses.infantry.defense > 0 || academyBonuses.infantry.lethality > 0 || academyBonuses.infantry.health > 0 ||
              academyBonuses.lancer.attack > 0 || academyBonuses.lancer.defense > 0 || academyBonuses.lancer.lethality > 0 || academyBonuses.lancer.health > 0 ||
              academyBonuses.marksman.attack > 0 || academyBonuses.marksman.defense > 0 || academyBonuses.marksman.lethality > 0 || academyBonuses.marksman.health > 0;

            if (!hasBonuses) return null;

            return (
              <div className="card info-card mb-6">
                <h4 className="mb-4 text-lg font-semibold">Total War Academy Bonuses</h4>

                {/* Infantry */}
                <div className="mb-6">
                  <h5 className="stat-label text-blue-300 dark:text-blue-300 mb-2">Infantry</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.infantry.attack > 0 ? '+' : ''}{academyBonuses.infantry.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.infantry.defense > 0 ? '+' : ''}{academyBonuses.infantry.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.infantry.lethality > 0 ? '+' : ''}{academyBonuses.infantry.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.infantry.health > 0 ? '+' : ''}{academyBonuses.infantry.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lancer */}
                <div className="stat-section">
                  <h5 className="stat-label text-rose-300 dark:text-rose-300 mb-2">Lancer</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.lancer.attack > 0 ? '+' : ''}{academyBonuses.lancer.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.lancer.defense > 0 ? '+' : ''}{academyBonuses.lancer.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.lancer.lethality > 0 ? '+' : ''}{academyBonuses.lancer.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.lancer.health > 0 ? '+' : ''}{academyBonuses.lancer.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marksman */}
                <div className="stat-section">
                  <h5 className="stat-label text-amber-300 dark:text-amber-300 mb-2">Marksman</h5>
                  <div className="stat-grid">
                    <div>
                      <div className="stat-label normal-case">Attack</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.marksman.attack > 0 ? '+' : ''}{academyBonuses.marksman.attack.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Defense</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.marksman.defense > 0 ? '+' : ''}{academyBonuses.marksman.defense.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Lethality</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.marksman.lethality > 0 ? '+' : ''}{academyBonuses.marksman.lethality.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="stat-label normal-case">Health</div>
                      <div className="stat-value text-xl">
                        {academyBonuses.marksman.health > 0 ? '+' : ''}{academyBonuses.marksman.health.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {(['infantry', 'lancer', 'marksman'] as const).map(troopType => {
            const troopTechs = warAcademyData.filter(tech => tech.type === troopType);

            return (
              <div key={troopType} className="card info-card mb-8">
                <h4 className="capitalize mb-4">{troopType} Tech</h4>
                <div className="grid">
                  {troopTechs.map(tech => {
                    // Use unique key combining name and type since some techs share names
                    const uniqueKey = `${tech.name}-${tech.type}`;
                    const currentLevel = warAcademySelections[uniqueKey] || 0;

                    return (
                      <div key={uniqueKey} className="form-group">
                        <label>{tech.name}</label>
                        <div className="text-sm text-gray-400 dark:text-gray-400 mb-1">
                          {tech.effect}
                        </div>
                        <select
                          value={currentLevel}
                          onChange={(e) => {
                            setWarAcademySelections({
                              ...warAcademySelections,
                              [uniqueKey]: parseInt(e.target.value) || 0,
                            });
                          }}
                        >
                          <option value="0">Level 0</option>
                          {tech.levels.map(level => {
                            // Format value based on whether it's a percentage or flat number
                            const isPercentage = level.value < 1;
                            const displayValue = isPercentage
                              ? `${(level.value * 100).toFixed(1)}%`
                              : level.value.toLocaleString();

                            return (
                              <option key={level.level} value={level.level}>
                                Level {level.level} ({displayValue})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

