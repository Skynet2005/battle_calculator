'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCommandCenterCapacityBonuses } from '@/lib/battle/data/capacity/command-center-capacity';
import type { BasicBonuses } from '@/lib/battle/calculations';
import { getAllCommandCenterLevels } from '@/lib/battle/data/command_center/command_center';
import { getChiefCharmBonuses, getChiefGearBonuses } from '@/lib/battle/data-extractors';
import {
  getCharmLevels,
  getChiefGearOptions,
  getChiefGearTypes,
} from '@/lib/battle/data-selectors';
import {
  getMaxCharmLevel,
  getMaxChiefGearOption,
} from '@/lib/battle/data/max-levels';

// Add explicit type for gear options
type ChiefGearOption = ReturnType<typeof getChiefGearOptions>[number];

interface ChiefSectionProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  chiefGearSelections?: Record<string, { tier: string; stars: number; step?: number }>;
  onChiefGearSelectionsChange?: (selections: Record<string, { tier: string; stars: number; step?: number }>) => void;
  charmLevels?: Record<string, number[]>;
  onCharmLevelsChange?: (levels: Record<string, number[]>) => void;
  commandCenterLevel?: string;
  onCommandCenterLevelChange?: (level: string) => void;
}

export default function ChiefSection({
  basicBonuses,
  onBasicBonusesChange,
  chiefGearSelections: providedGearSelections,
  onChiefGearSelectionsChange,
  charmLevels: providedCharmLevels,
  onCharmLevelsChange,
  commandCenterLevel: providedCommandCenterLevel,
  onCommandCenterLevelChange,
}: ChiefSectionProps) {
  const [activeSection, setActiveSection] = useState<'gear' | 'charms' | 'commandCenter'>('gear');

  // Get max levels
  const maxCharmLevel = getMaxCharmLevel();
  const allGearTypes = getChiefGearTypes();

  // Derive chief gear selections from props with defaults - always in sync like HeroGearSelector
  const safeChiefGearSelections = useMemo(() => {
    // Always start with defaults
    const defaults: Record<string, { tier: string; stars: number; step?: number }> = {};
    for (const gearType of allGearTypes) {
      const maxOption = getMaxChiefGearOption(gearType);
      if (maxOption) {
        defaults[gearType] = maxOption;
      }
    }

    // Merge with saved selections from profile if they exist
    if (providedGearSelections && Object.keys(providedGearSelections).length > 0) {
      return { ...defaults, ...providedGearSelections };
    }

    return defaults;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedGearSelections]);

  // Derive charm levels from props with defaults - always in sync
  const safeCharmLevels = useMemo(() => {
    // Always start with defaults
    const defaults: Record<string, number[]> = {
      Cap: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
      Watch: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
      Coat: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
      Pants: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
      Ring: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
      Weapon: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    };

    // Merge with saved selections from profile if they exist
    if (providedCharmLevels && Object.keys(providedCharmLevels).length > 0) {
      return { ...defaults, ...providedCharmLevels };
    }

    return defaults;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedCharmLevels]);

  // Update Chief Gear bonuses - only when gear selections are actually provided
  useEffect(() => {
    // Only update if gear selections are provided (not using defaults for opponent)
    if (providedGearSelections === undefined || onChiefGearSelectionsChange === undefined) {
      return;
    }

    const gearBonuses = getChiefGearBonuses(safeChiefGearSelections);
    // Only update if the bonuses actually changed to prevent infinite loops
    if (
      basicBonuses.chiefGear.attack !== gearBonuses.attack ||
      basicBonuses.chiefGear.defense !== gearBonuses.defense
    ) {
      onBasicBonusesChange({
        ...basicBonuses,
        chiefGear: gearBonuses,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeChiefGearSelections, providedGearSelections, onChiefGearSelectionsChange]);

  // Update Charm bonuses - only when charm levels are actually provided
  useEffect(() => {
    // Only update if charm levels are provided (not using defaults for opponent)
    if (providedCharmLevels === undefined || onCharmLevelsChange === undefined) {
      return;
    }

    const charmBonuses = getChiefCharmBonuses(safeCharmLevels);
    // Only update if the bonuses actually changed to prevent infinite loops
    const currentCharms = basicBonuses.charms;
    if (
      currentCharms.infantry.lethality !== charmBonuses.infantry.lethality ||
      currentCharms.infantry.health !== charmBonuses.infantry.health ||
      currentCharms.lancer.lethality !== charmBonuses.lancer.lethality ||
      currentCharms.lancer.health !== charmBonuses.lancer.health ||
      currentCharms.marksman.lethality !== charmBonuses.marksman.lethality ||
      currentCharms.marksman.health !== charmBonuses.marksman.health
    ) {
      onBasicBonusesChange({
        ...basicBonuses,
        charms: charmBonuses,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCharmLevels, providedCharmLevels, onCharmLevelsChange]);

  const gearTypes = allGearTypes;
  const charmData = getCharmLevels();
  const commandCenterLevels = getAllCommandCenterLevels();
  const currentCommandCenterLevel = providedCommandCenterLevel || '';

  // Get Command Center capacity bonuses
  const commandCenterCapacity = getCommandCenterCapacityBonuses(currentCommandCenterLevel);

  return (
    <div>
      <div className="tabs mb-6">
        <button
          className={`tab ${activeSection === 'gear' ? 'active' : ''}`}
          onClick={() => setActiveSection('gear')}
        >
          Chief Gear
        </button>
        <button
          className={`tab ${activeSection === 'charms' ? 'active' : ''}`}
          onClick={() => setActiveSection('charms')}
        >
          Charms
        </button>
        <button
          className={`tab ${activeSection === 'commandCenter' ? 'active' : ''}`}
          onClick={() => setActiveSection('commandCenter')}
        >
          Command Center
        </button>
      </div>

      {/* Chief Gear Section */}
      {activeSection === 'gear' && (
        <div>
          <h3>Chief Gear (6 Pieces)</h3>
          <p className="section-description">
            Select tier, stars, and step for each piece of gear. Affects ATK/DEF only.
          </p>
          <div className="grid">
            {gearTypes.map((gearType: string) => {
              const options = getChiefGearOptions(gearType);
              const currentSelection = safeChiefGearSelections[gearType];

              return (
                <div key={gearType} className="card info-card">
                  <h4>{gearType}</h4>
                  <div className="form-group">
                    <label>Selection</label>
                    <select
                      value={currentSelection ? `${currentSelection.tier}-${currentSelection.stars}-${currentSelection.step !== undefined ? currentSelection.step : 0}` : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [tier, stars, stepStr] = e.target.value.split('-');
                          const stepNum = parseInt(stepStr);
                          const updated = {
                            ...safeChiefGearSelections,
                            [gearType]: {
                              tier,
                              stars: parseInt(stars),
                              // Preserve step 0 as 0, only use undefined if step is not a number or not in the data
                              step: isNaN(stepNum) ? undefined : (stepNum === 0 ? 0 : stepNum),
                            },
                          };
                          // Directly notify parent to save - like HeroGearSelector
                          if (onChiefGearSelectionsChange) {
                            onChiefGearSelectionsChange(updated);
                          }
                        }
                      }}
                    >
                      <option value="">Select {gearType}...</option>
                      {(() => {
                        // Group options by tier
                        const groupedByTier: Record<string, ChiefGearOption[]> = {};
                        options.forEach((opt: ChiefGearOption) => {
                          if (!groupedByTier[opt.tier]) {
                            groupedByTier[opt.tier] = [];
                          }
                          groupedByTier[opt.tier].push(opt);
                        });

                        // Render optgroups for each tier
                        return Object.entries(groupedByTier).map(([tier, tierOptions]) => {
                          // Check if this is a Red tier with steps (base Red or T1, T2, T3, T4)
                          const isRedTierWithSteps = tier.includes('Red (Legendary)') &&
                            tierOptions.some((opt: ChiefGearOption) => opt.step !== undefined);

                          if (isRedTierWithSteps) {
                            // Group by stars for Red tiers with steps
                            const groupedByStars: Record<number, ChiefGearOption[]> = {};
                            tierOptions.forEach((opt: ChiefGearOption) => {
                              const stars = opt.stars ?? 0;
                              if (!groupedByStars[stars]) {
                                groupedByStars[stars] = [];
                              }
                              groupedByStars[stars].push(opt);
                            });

                            // Render separate optgroups for each star level within the tier
                            return Object.entries(groupedByStars)
                              .sort(([starsA], [starsB]) => parseInt(starsA) - parseInt(starsB))
                              .map(([stars, starOptions]) => {
                                const starLabel = `${tier} - ${stars} Star${parseInt(stars) !== 1 ? 's' : ''}`;
                                return (
                                  <optgroup key={`${tier}-${stars}`} label={starLabel}>
                                    {starOptions
                                      .sort((a: ChiefGearOption, b: ChiefGearOption) => (a.step ?? 0) - (b.step ?? 0))
                                      .map((opt: ChiefGearOption, idx: number) => (
                                        <option key={`${tier}-${stars}-${idx}`} value={`${opt.tier}-${opt.stars}-${opt.step || 0}`}>
                                          {opt.label}
                                        </option>
                                      ))}
                                  </optgroup>
                                );
                              });
                          } else {
                            // Regular tier grouping (no star/step subdivision)
                            return (
                              <optgroup key={tier} label={tier}>
                                {tierOptions.map((opt: ChiefGearOption, idx: number) => (
                                  <option key={`${tier}-${idx}`} value={`${opt.tier}-${opt.stars}-${opt.step || 0}`}>
                                    {opt.label}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          }
                        });
                      })()}
                    </select>
                  </div>
                  {currentSelection && (() => {
                    // Find the matching option
                    const selectedOption = options.find((o: ChiefGearOption) => {
                      if (o.tier !== currentSelection.tier) return false;
                      if (o.stars !== currentSelection.stars) return false;
                      // Handle step: need to match exactly, including 0
                      // If currentSelection.step is undefined, look for options without step
                      // If currentSelection.step is 0 or any number, match that exact value
                      if (currentSelection.step === undefined) {
                        // Looking for gear without step property
                        return o.step === undefined;
                      } else {
                        // Looking for gear with specific step value (including 0)
                        return o.step === currentSelection.step;
                      }
                    });

                    if (!selectedOption) return null;

                    return (
                      <div className="mt-3 p-3 bg-slate-900/40 dark:bg-slate-900/40 rounded-lg border border-slate-700/60 text-sm text-gray-300 space-y-1">
                        <div className="flex justify-between text-xs uppercase tracking-wide text-gray-400">
                          <span>Stats</span>
                          <span>Power</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>ATK: {selectedOption.attack} | DEF: {selectedOption.defense}</span>
                          <span>{selectedOption.power ? selectedOption.power.toLocaleString() : 'N/A'}</span>
                        </div>
                        {selectedOption.marchCapacity && selectedOption.marchCapacity > 0 && (
                          <div className="text-xs text-blue-300">
                            March Capacity: +{selectedOption.marchCapacity.toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charms Section */}
      {activeSection === 'charms' && (
        <div>
          <h3>Chief Charms (3 per Gear Piece)</h3>
          <p className="section-description">
            Set level for each charm. 3 charms per gear piece. Affects LETH/HP only.
            <br />
            <span className="inline-pill mt-2 block w-fit">
              Cap & Watch: Lancer | Coat & Pants: Infantry | Ring & Weapon: Marksman
            </span>
          </p>
          <div className="grid">
            {(['Cap', 'Watch', 'Coat', 'Pants', 'Ring', 'Weapon'] as const).map((gearPiece: string) => {
              const troopType =
                gearPiece === 'Cap' || gearPiece === 'Watch' ? 'Lancer' :
                  gearPiece === 'Coat' || gearPiece === 'Pants' ? 'Infantry' :
                    'Marksman';

              return (
                <div key={gearPiece} className="card info-card">
                  <h4>{gearPiece} ({troopType})</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">
                    Affects {troopType} Lethality & Health
                  </p>
                  {[0, 1, 2].map((charmIndex: number) => (
                    <div key={charmIndex} className="form-group mb-3 last:mb-0">
                      <label>Charm {charmIndex + 1}</label>
                      <select
                        value={safeCharmLevels[gearPiece]?.[charmIndex] || 0}
                        onChange={(e) => {
                          const newLevels = { ...safeCharmLevels };
                          if (!newLevels[gearPiece]) {
                            newLevels[gearPiece] = [0, 0, 0];
                          }
                          newLevels[gearPiece] = [...newLevels[gearPiece]];
                          newLevels[gearPiece][charmIndex] = parseInt(e.target.value) || 0;
                          // Directly notify parent to save - like HeroGearSelector
                          if (onCharmLevelsChange) {
                            onCharmLevelsChange(newLevels);
                          }
                        }}
                      >
                        <option value="0">Level 0</option>
                        {charmData.map((charm: { level: number, lethality: number, health: number }) => (
                          <option key={charm.level} value={charm.level}>
                            Level {charm.level} (LETH: {charm.lethality.toFixed(2)}%, HP: {charm.health.toFixed(2)}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {(() => {
                    const totalLethality = (safeCharmLevels[gearPiece] || [0, 0, 0]).reduce((sum: number, level: number) => {
                      const charm = charmData.find((c: { level: number }) => c.level === level);
                      return sum + (charm ? charm.lethality : 0); // Already in percentage
                    }, 0);
                    const totalHealth = (safeCharmLevels[gearPiece] || [0, 0, 0]).reduce((sum: number, level: number) => {
                      const charm = charmData.find((c: { level: number }) => c.level === level);
                      return sum + (charm ? charm.health : 0); // Already in percentage
                    }, 0);
                    return (
                      <div className="mt-4 p-3 rounded-lg bg-slate-900/40 dark:bg-slate-900/40 border border-slate-700/60 text-sm">
                        <strong>Total for {gearPiece}:</strong> LETH: +{totalLethality.toFixed(2)}%, HP: +{totalHealth.toFixed(2)}%
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Command Center Section */}
      {activeSection === 'commandCenter' && (
        <div>
          <h3>Command Center Building</h3>
          <p className="section-description">
            Select the Command Center building level. Affects Rally Capacity and Troops Deployment Capacity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card info-card">
              <h4>Building Level</h4>
              <div className="form-group">
                <label>Level</label>
                <select
                  value={currentCommandCenterLevel}
                  onChange={(e) => {
                    if (onCommandCenterLevelChange) {
                      onCommandCenterLevelChange(e.target.value);
                    }
                  }}
                >
                  <option value="">Select Level...</option>
                  {commandCenterLevels.map((level: { level: string }) => (
                    <option key={level.level} value={level.level}>
                      Level {level.level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="card info-card">
              <h4>Capacity Bonuses</h4>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2 block">
                    Total Rally Capacity
                  </label>
                  <div className="p-3 rounded-lg bg-slate-900/40 dark:bg-slate-900/40 border border-slate-700/60 text-xl font-bold text-gray-100">
                    +{commandCenterCapacity.rallyCapacity.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2 block">
                    Troops Deployment Capacity
                  </label>
                  <div className="p-3 rounded-lg bg-slate-900/40 dark:bg-slate-900/40 border border-slate-700/60 text-xl font-bold text-gray-100">
                    +{commandCenterCapacity.deploymentCapacity.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

