import type { ExpertSelections } from '@/domain/battle';
import { getExpertBonuses, PETS_DATA } from '@/domain/battle';
import {
  createDefaultAdditiveBonuses,
  createDefaultMultiplicativeBonuses,
  defaultExpertSelections,
  TROOP_TYPE_LIST,
} from '@/domain/battle/battle-calculator-helpers';
import type {
  AdditiveBonuses,
  AdditiveManualOverride,
  BasicBonuses,
  MultiplicativeBonuses,
  MultiplicativeManualOverride,
  StatType,
  TroopType
} from '@/domain/battle/calculations';
import { calculateBasicBonus } from '@/domain/battle/calculations';
import { getChiefCharmBonuses, getChiefGearBonuses } from '@/domain/battle/data-extractors';
import { getAllTroopDefinitionsForType } from '@/domain/battle/data-selectors';
import { getDefaultOpponentBasicBonuses, getDefaultOpponentExpertSelections, getMaxCharmLevel } from '@/domain/battle/index';
import { extractJoinerBonuses, extractLeaderBonuses } from '@/domain/rally/rally-bonus-extractor';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { HeroLevel, RallyHero, TroopMixConfig, UserProfile } from '@/shared/types';
import { FormField, SectionCard } from '@/shared/ui';
import { memo, useMemo } from 'react';
import AdditiveBonusesInput from '../rally_config/additive-bonuses-input';
import ChiefSection from './components/chief-gear/ChiefSection';
import HeroSelector from './components/hero/HeroSelector';
import CapacitySummaryGrid from './components/info/capacity/capacity-summary-grid';
import MultiplicativeBonusesInput from './components/info/capacity/MultiplicativeBonusesInput';
import ManualAdditiveOverride from './components/info/manual-additive-override';
import ManualMultiplicativeOverride from './components/info/manual-multiplicative-override';
import PetsSection from './components/pets-section';
import ResearchSection from './components/research/ResearchSection';
import DataSelectors from './components/special-bonuses/DataSelectors';

type SubTab = 'info' | 'heroes' | 'basic' | 'research' | 'chief' | 'pets';

interface OpponentTabProps {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  opponentSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
  opponentCapacityReport: CapacityReport | null;
  opponentJoinerInfo: ReturnType<typeof extractJoinerBonuses> | null;
  onTroopMixChange: (side: 'opponent', mix: TroopMixConfig) => void;
}

function OpponentTab({
  currentProfile,
  setCurrentProfile,
  opponentSubTab,
  onSubTabChange,
  opponentCapacityReport,
  opponentJoinerInfo,
  onTroopMixChange: _onTroopMixChange
}: OpponentTabProps) {
  void _onTroopMixChange;
  const effectiveOpponentJoinerInfo = useMemo(() => {
    const rally = currentProfile?.rally;
    if (!rally) return opponentJoinerInfo;
    const mode = rally.specialWidgetBonus?.opponent || 'defending';
    const joiners = rally.opponentJoiners || [];
    return opponentJoinerInfo ?? extractJoinerBonuses(joiners, mode);
  }, [currentProfile?.rally, opponentJoinerInfo]);

  const handleOpponentManualOverrideChange = (manualOverrideTotals?: AdditiveManualOverride) => {
    setCurrentProfile((prev) => {
      if (!prev) return prev;
      const existingOpponent = prev.opponent || {
        heroLevels: {},
        basicBonuses: getDefaultOpponentBasicBonuses(),
        expertSelections: getDefaultOpponentExpertSelections()
      };
      const existingAdditive = existingOpponent.additiveBonuses || createDefaultAdditiveBonuses();
      return {
        ...prev,
        opponent: {
          ...existingOpponent,
          additiveBonuses: {
            ...createDefaultAdditiveBonuses(),
            ...existingAdditive,
            manualOverrideTotals
          }
        }
      };
    });
  };

  const handleOpponentManualMultiplicativeOverrideChange = (manualOverrideTotals?: MultiplicativeManualOverride) => {
    setCurrentProfile((prev) => {
      if (!prev) return prev;
      const existingOpponent = prev.opponent || {
        heroLevels: {},
        basicBonuses: getDefaultOpponentBasicBonuses(),
        expertSelections: getDefaultOpponentExpertSelections()
      };
      const existingMultiplicative = existingOpponent.multiplicativeBonuses || createDefaultMultiplicativeBonuses();
      return {
        ...prev,
        opponent: {
          ...existingOpponent,
          multiplicativeBonuses: {
            ...createDefaultMultiplicativeBonuses(),
            ...existingMultiplicative,
            manualOverrideTotals
          }
        }
      };
    });
  };

  return (
    <div className="tab-content active">
      <div className="tabs mb-4">
        <button className={`tab ${opponentSubTab === 'info' ? 'active' : ''}`} onClick={() => onSubTabChange('info')}>
          Opponent Info
        </button>
        <button className={`tab ${opponentSubTab === 'heroes' ? 'active' : ''}`} onClick={() => onSubTabChange('heroes')}>
          Heroes
        </button>
        <button className={`tab ${opponentSubTab === 'basic' ? 'active' : ''}`} onClick={() => onSubTabChange('basic')}>
          Basic Bonuses
        </button>
        <button className={`tab ${opponentSubTab === 'research' ? 'active' : ''}`} onClick={() => onSubTabChange('research')}>
          Research
        </button>
        <button className={`tab ${opponentSubTab === 'chief' ? 'active' : ''}`} onClick={() => onSubTabChange('chief')}>
          Chief
        </button>
        <button className={`tab ${opponentSubTab === 'pets' ? 'active' : ''}`} onClick={() => onSubTabChange('pets')}>
          Pets
        </button>
      </div>

      {opponentSubTab === 'info' && (
        <div>
          <SectionCard
            title={`Opponent: ${currentProfile.name}`}
            description={`Created: ${new Date(currentProfile.createdAt).toLocaleString()} • Last Updated: ${new Date(currentProfile.updatedAt).toLocaleString()}`}
          >
            <div className="mt-4"></div>
          </SectionCard>

          <SectionCard
            title="Bonus Settings"
            description="Toggle pet skills and city bonuses for calculations in the summary sections below."
            collapsible
            defaultCollapsed
          >
            <FormField
              label="Pet Skills"
              description="Include pet skills in multiplicative bonus calculations"
            >
              <label aria-label="Pet Skills Enabled" className="flex items-center gap-2 cursor-pointer">
                <input
                  aria-label="Pet Skills Enabled"
                  type="checkbox"
                  checked={currentProfile.opponent?.petSkillsEnabled !== false}
                  onChange={(e) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        petSkillsEnabled: e.target.checked
                      }
                    });
                  }}
                  className="w-auto cursor-pointer"
                />
                <span>Pet Skills Enabled</span>
              </label>
            </FormField>

            <div className="section-divider" />
            <h4 className="mb-4 text-base font-semibold">City Bonuses</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              City bonus level for each stat (0%, 10%, or 20%)
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => (
                <FormField
                  key={stat}
                  label={`${stat.charAt(0).toUpperCase() + stat.slice(1)} City Bonus`}
                >
                  <select
                    aria-label={`${stat.charAt(0).toUpperCase() + stat.slice(1)} City Bonus`}
                    value={currentProfile.opponent?.multiplicativeBonuses?.cityBonuses?.[stat] ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) as 0 | 10 | 20;
                      const currentMultiplicative = currentProfile.opponent?.multiplicativeBonuses || createDefaultMultiplicativeBonuses();
                      const updatedMultiplicative: MultiplicativeBonuses = {
                        ...currentMultiplicative,
                        cityBonuses: {
                          ...currentMultiplicative.cityBonuses,
                          [stat]: value
                        }
                      };
                      setCurrentProfile({
                        ...currentProfile,
                        opponent: {
                          ...currentProfile.opponent,
                          heroLevels: currentProfile.opponent?.heroLevels || {},
                          basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                          expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                          multiplicativeBonuses: updatedMultiplicative
                        }
                      });
                    }}
                    className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                  >
                    <option value="0">0% (Disabled)</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </FormField>
              ))}
              {(['enemyAttackReduction', 'enemyDefenseReduction'] as const).map((stat) => (
                <FormField
                  key={stat}
                  label={stat === 'enemyAttackReduction' ? 'Enemy Attack Reduction City Bonus' : 'Enemy Defense Reduction City Bonus'}
                >
                  <select
                    aria-label={stat === 'enemyAttackReduction' ? 'Enemy Attack Reduction City Bonus' : 'Enemy Defense Reduction City Bonus'}
                    value={currentProfile.opponent?.multiplicativeBonuses?.cityBonuses?.[stat] ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) as 0 | 10 | 20;
                      const currentMultiplicative = currentProfile.opponent?.multiplicativeBonuses || createDefaultMultiplicativeBonuses();
                      const updatedMultiplicative: MultiplicativeBonuses = {
                        ...currentMultiplicative,
                        cityBonuses: {
                          ...currentMultiplicative.cityBonuses,
                          [stat]: value
                        }
                      };
                      setCurrentProfile({
                        ...currentProfile,
                        opponent: {
                          ...currentProfile.opponent,
                          heroLevels: currentProfile.opponent?.heroLevels || {},
                          basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                          expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                          multiplicativeBonuses: updatedMultiplicative
                        }
                      });
                    }}
                    className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                  >
                    <option value="0">0% (Disabled)</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </FormField>
              ))}
              <FormField label="Total Deployment Capacity City Bonus">
                <select
                  aria-label="Total Deployment Capacity City Bonus"
                  value={currentProfile.opponent?.multiplicativeBonuses?.cityBonuses?.deploymentCapacity ?? 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) as 0 | 10 | 20;
                    const currentMultiplicative = currentProfile.opponent?.multiplicativeBonuses || createDefaultMultiplicativeBonuses();
                    const updatedMultiplicative: MultiplicativeBonuses = {
                      ...currentMultiplicative,
                      cityBonuses: {
                        ...currentMultiplicative.cityBonuses,
                        deploymentCapacity: value
                      }
                    };
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        multiplicativeBonuses: updatedMultiplicative
                      }
                    });
                  }}
                  className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                >
                  <option value="0">0% (Disabled)</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </FormField>
            </div>
          </SectionCard>

          <SectionCard
            title="Capacity"
            description="Manual override inputs (optional). Leave at 0 to use calculated values from all sources below."
            collapsible
            defaultCollapsed
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-6">
              {(TROOP_TYPE_LIST as TroopType[]).map((troop) => {
                const options = getAllTroopDefinitionsForType(troop);
                const label = troop.charAt(0).toUpperCase() + troop.slice(1);
                return (
                  <FormField
                    key={troop}
                    label={`${label} Troop Level`}
                    description="Used for troop base stats in rally calculations"
                  >
                    <select
                      aria-label={`${label} Troop Level`}
                      value={currentProfile.opponent?.troopLevels?.[troop] ?? ''}
                      onChange={(e) => {
                        const value = e.target.value || undefined;
                        setCurrentProfile({
                          ...currentProfile,
                          opponent: {
                            ...currentProfile.opponent,
                            heroLevels: currentProfile.opponent?.heroLevels || {},
                            basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                            expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                            troopLevels: {
                              ...(currentProfile.opponent?.troopLevels || {}),
                              [troop]: value
                            }
                          }
                        });
                      }}
                      className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
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

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-6">
              <FormField
                label="Manual Deployment Capacity Override"
                description="Set to override calculated total (0 = use calculated)"
              >
                <input
                  type="number"
                  aria-label="Manual Deployment Capacity Override"
                  placeholder="Enter value"
                  value={currentProfile.opponent?.baseCapacity?.march || 0}
                  onChange={(e) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        baseCapacity: {
                          ...(currentProfile.opponent?.baseCapacity || { rally: 0, march: 0 }),
                          march: parseInt(e.target.value) || 0
                        }
                      }
                    });
                  }}
                  className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                />
              </FormField>

              <FormField
                label="Manual Rally Capacity Override"
                description="Set to override calculated total (0 = use calculated)"
              >
                <input
                  aria-label="Manual Rally Capacity Override"
                  type="number"
                  placeholder="Enter value"
                  value={currentProfile.opponent?.baseCapacity?.rally || 0}
                  onChange={(e) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        baseCapacity: {
                          ...(currentProfile.opponent?.baseCapacity || { rally: 0, march: 0 }),
                          rally: parseInt(e.target.value) || 0
                        }
                      }
                    });
                  }}
                  className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
                />
              </FormField>
            </div>

            <div className="border-t border-slate-700 dark:border-slate-700 pt-4 mt-4">
              <h4 className="mb-4 text-base font-semibold">Total Capacity</h4>
              {opponentCapacityReport ? (
                <CapacitySummaryGrid
                  deployment={opponentCapacityReport.deployment}
                  rally={opponentCapacityReport.rally}
                  showTemporary
                />
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-400">
                  Capacity data unavailable.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Additive Bonuses Summary"
            description="Total additive bonuses from all sources. These are added together before multiplicative bonuses are applied."
            collapsible
            defaultCollapsed
          >
            <SectionCard
              title="Manual Additive Override (optional)"
              description="Enter total additive % per troop/stat; leave collapsed to use calculated values."
              collapsible
              defaultCollapsed
            >
              <ManualAdditiveOverride
                overrides={currentProfile.opponent?.additiveBonuses?.manualOverrideTotals}
                onChange={handleOpponentManualOverrideChange}
              />
            </SectionCard>
            {TROOP_TYPE_LIST.map((troopType: TroopType) => {
              const troopKey: TroopType = troopType;
              const opponent = currentProfile.opponent;
              if (!opponent) return null;

              const expertBonuses = getExpertBonuses(opponent.expertSelections || defaultExpertSelections);
              const maxCharmLevel = getMaxCharmLevel();
              const charmBonuses = getChiefCharmBonuses(opponent.charmLevels || {
                Cap: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
                Watch: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
                Coat: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
                Pants: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
                Ring: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
                Weapon: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
              });
              // Calculate chief gear bonuses from selections if available, otherwise use stored values
              const calculatedChiefGearBonuses = opponent.chiefGearSelections
                ? getChiefGearBonuses(opponent.chiefGearSelections)
                : { attack: opponent.basicBonuses.chiefGear.attack || 0, defense: opponent.basicBonuses.chiefGear.defense || 0 };

              const opponentMode = currentProfile.rally.specialWidgetBonus?.opponent || 'defending';
              const leaders: Record<TroopType, RallyHero | null> | undefined =
                currentProfile.rally.opponentLeader ?? currentProfile.rally.leader;
              const matchingLeader = leaders?.[troopKey];
              let heroBonusesForTroopType = { attack: 0, defense: 0, lethality: 0, health: 0 };
              if (matchingLeader) {
                const rallyXpLevel = matchingLeader.xpLevel;
                const heroXpLevel = opponent.heroLevels?.[matchingLeader.heroName]?.xpLevel;
                const effectiveXpLevel = rallyXpLevel !== undefined ? rallyXpLevel : (heroXpLevel !== undefined ? heroXpLevel : 80);
                const leaderBonuses = extractLeaderBonuses(matchingLeader, opponentMode, effectiveXpLevel);
                heroBonusesForTroopType = {
                  attack: leaderBonuses.basic.attack,
                  defense: leaderBonuses.basic.defense,
                  lethality: leaderBonuses.basic.lethality,
                  health: leaderBonuses.basic.health
                };
              }

              const basic = calculateBasicBonus(opponent.basicBonuses, troopKey);
              const basicWithTroopSpecificHero = {
                attack: basic.attack - opponent.basicBonuses.hero.attack + heroBonusesForTroopType.attack,
                defense: basic.defense - opponent.basicBonuses.hero.defense + heroBonusesForTroopType.defense,
                lethality: basic.lethality - opponent.basicBonuses.hero.lethality + heroBonusesForTroopType.lethality,
                health: basic.health - opponent.basicBonuses.hero.health + heroBonusesForTroopType.health
              };

              const troopTypeBonuses = opponent.basicBonuses.combatTech.troopTypeBonus as Record<TroopType, Record<StatType, number>>;
              const daybreakIsland = opponent.basicBonuses.daybreakIsland;
              const charmBonusesByTroop = charmBonuses as Record<TroopType, { lethality: number; health: number }>;
              const heroGearByTroop = opponent.basicBonuses.heroGear as Record<TroopType, { attack: number; defense: number; lethality: number; health: number }>;
              const petRefinementByTroop = opponent.basicBonuses.petRefinement as Record<TroopType, { lethality: number; health: number }> & { troops: { attack: number; defense: number } };
              const warAcademyByTroop = opponent.basicBonuses.warAcademy as Record<TroopType, Record<StatType, number>>;

              const breakdown = {
                research: {
                  attack: (troopTypeBonuses[troopKey]?.attack || 0) + (opponent.basicBonuses.combatTech.totalTroopBonus.attack || 0),
                  defense: (troopTypeBonuses[troopKey]?.defense || 0) + (opponent.basicBonuses.combatTech.totalTroopBonus.defense || 0),
                  lethality: (troopTypeBonuses[troopKey]?.lethality || 0) + (opponent.basicBonuses.combatTech.totalTroopBonus.lethality || 0),
                  health: (troopTypeBonuses[troopKey]?.health || 0) + (opponent.basicBonuses.combatTech.totalTroopBonus.health || 0)
                },
                allianceTech: {
                  attack: Math.min(opponent.basicBonuses.allianceTech.attack || 0, 10),
                  defense: Math.min(opponent.basicBonuses.allianceTech.defense || 0, 10),
                  lethality: Math.min(opponent.basicBonuses.allianceTech.lethality || 0, 10),
                  health: Math.min(opponent.basicBonuses.allianceTech.health || 0, 10)
                },
                experts: expertBonuses,
                daybreakIsland: {
                  attack: (daybreakIsland[troopKey]?.attack || 0) + (daybreakIsland.troops?.attack || 0),
                  defense: (daybreakIsland[troopKey]?.defense || 0) + (daybreakIsland.troops?.defense || 0),
                  lethality: opponent.basicBonuses.daybreakIsland.troops?.lethality || 0,
                  health: opponent.basicBonuses.daybreakIsland.troops?.health || 0
                },
                pets: opponent.basicBonuses.pets,
                skins: opponent.basicBonuses.stackedSkins,
                hero: heroBonusesForTroopType,
                chiefGear: {
                  attack: calculatedChiefGearBonuses.attack,
                  defense: calculatedChiefGearBonuses.defense,
                  lethality: 0,
                  health: 0
                },
                charms: {
                  attack: 0,
                  defense: 0,
                  lethality: charmBonusesByTroop[troopKey]?.lethality || 0,
                  health: charmBonusesByTroop[troopKey]?.health || 0
                },
                heroGear: heroGearByTroop[troopKey] || { attack: 0, defense: 0, lethality: 0, health: 0 },
                allianceFacilities: {
                  attack: Math.min(opponent.basicBonuses.allianceFacilities.attack || 0, 13),
                  defense: Math.min(opponent.basicBonuses.allianceFacilities.defense || 0, 13),
                  lethality: 0,
                  health: 0
                },
                petRefinement: {
                  attack: petRefinementByTroop?.troops?.attack || 0,
                  defense: petRefinementByTroop?.troops?.defense || 0,
                  lethality: petRefinementByTroop?.[troopKey]?.lethality || 0,
                  health: petRefinementByTroop?.[troopKey]?.health || 0
                },
                warAcademy: warAcademyByTroop[troopKey] || { attack: 0, defense: 0, lethality: 0, health: 0 },
                specialHeroes: {
                  attack: (opponent.basicBonuses.specialHeroes.natalia ? 10 : 0),
                  defense: (opponent.basicBonuses.specialHeroes.natalia ? 10 : 0),
                  lethality: (opponent.basicBonuses.specialHeroes.jeronimo ? 15 : 0),
                  health: (opponent.basicBonuses.specialHeroes.jeronimo ? 15 : 0)
                },
                vipPrestige: opponent.basicBonuses.vipPrestige,
                globe: opponent.basicBonuses.globe,
                temporaryEvents: (opponent.additiveBonuses || createDefaultAdditiveBonuses()).temporaryEvents,
                supremePresident: (opponent.additiveBonuses || createDefaultAdditiveBonuses()).supremePresident,
                specialBuffs: (opponent.additiveBonuses || createDefaultAdditiveBonuses()).specialBuffs
              };

              const manualOverrideTotals = opponent.additiveBonuses?.manualOverrideTotals?.[troopKey];
              const manualOverrideActive =
                manualOverrideTotals &&
                Object.values(manualOverrideTotals).some(
                  (value) => value !== undefined && value !== null && !Number.isNaN(Number(value))
                );
              const manualAdditiveTotals = manualOverrideActive
                ? {
                  attack: Number(manualOverrideTotals?.attack ?? 0),
                  defense: Number(manualOverrideTotals?.defense ?? 0),
                  lethality: Number(manualOverrideTotals?.lethality ?? 0),
                  health: Number(manualOverrideTotals?.health ?? 0)
                }
                : null;

              const computedAdditiveTotals = {
                attack: breakdown.temporaryEvents.attack + breakdown.supremePresident.attack + breakdown.specialBuffs.attack,
                defense: breakdown.temporaryEvents.defense + breakdown.supremePresident.defense + breakdown.specialBuffs.defense,
                lethality: breakdown.temporaryEvents.lethality + breakdown.supremePresident.lethality + breakdown.specialBuffs.lethality,
                health: breakdown.temporaryEvents.health + breakdown.supremePresident.health + breakdown.specialBuffs.health
              };

              const calculateResearchValue = (stat: StatType) => {
                const researchTotal = opponent.basicBonuses.combatTech.totalTroopBonus[stat] || 0;
                const researchTroopTypeOnly = (troopTypeBonuses[troopKey]?.[stat] || 0) - researchTotal;
                return researchTroopTypeOnly + researchTotal;
              };

              const additiveTotals = manualAdditiveTotals ?? computedAdditiveTotals;

              const total = {
                attack:
                  calculateResearchValue('attack') +
                  breakdown.allianceTech.attack +
                  breakdown.experts.attack +
                  breakdown.daybreakIsland.attack +
                  breakdown.pets.attack +
                  breakdown.skins.attack +
                  breakdown.hero.attack +
                  breakdown.chiefGear.attack +
                  breakdown.charms.attack +
                  breakdown.heroGear.attack +
                  breakdown.allianceFacilities.attack +
                  breakdown.petRefinement.attack +
                  breakdown.warAcademy.attack +
                  breakdown.specialHeroes.attack +
                  breakdown.vipPrestige.attack +
                  breakdown.globe.attack +
                  additiveTotals.attack,
                defense:
                  calculateResearchValue('defense') +
                  breakdown.allianceTech.defense +
                  breakdown.experts.defense +
                  breakdown.daybreakIsland.defense +
                  breakdown.pets.defense +
                  breakdown.skins.defense +
                  breakdown.hero.defense +
                  breakdown.chiefGear.defense +
                  breakdown.charms.defense +
                  breakdown.heroGear.defense +
                  breakdown.allianceFacilities.defense +
                  breakdown.petRefinement.defense +
                  breakdown.warAcademy.defense +
                  breakdown.specialHeroes.defense +
                  breakdown.vipPrestige.defense +
                  breakdown.globe.defense +
                  additiveTotals.defense,
                lethality:
                  calculateResearchValue('lethality') +
                  breakdown.allianceTech.lethality +
                  breakdown.experts.lethality +
                  breakdown.daybreakIsland.lethality +
                  breakdown.pets.lethality +
                  breakdown.skins.lethality +
                  breakdown.hero.lethality +
                  breakdown.chiefGear.lethality +
                  breakdown.charms.lethality +
                  breakdown.heroGear.lethality +
                  breakdown.allianceFacilities.lethality +
                  breakdown.petRefinement.lethality +
                  breakdown.warAcademy.lethality +
                  breakdown.specialHeroes.lethality +
                  breakdown.vipPrestige.lethality +
                  breakdown.globe.lethality +
                  additiveTotals.lethality,
                health:
                  calculateResearchValue('health') +
                  breakdown.allianceTech.health +
                  breakdown.experts.health +
                  breakdown.daybreakIsland.health +
                  breakdown.pets.health +
                  breakdown.skins.health +
                  breakdown.hero.health +
                  breakdown.chiefGear.health +
                  breakdown.charms.health +
                  breakdown.heroGear.health +
                  breakdown.allianceFacilities.health +
                  breakdown.petRefinement.health +
                  breakdown.warAcademy.health +
                  breakdown.specialHeroes.health +
                  breakdown.vipPrestige.health +
                  breakdown.globe.health +
                  additiveTotals.health
              };

              return (
                <div key={troopType} className="mb-8 pb-8 border-b border-slate-700/50">
                  <h4 className="text-xl font-bold mb-4 capitalize">{troopType}</h4>

                  {manualOverrideActive && (
                    <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 [data-theme='light']:text-emerald-700">
                      Manual additive totals are applied for this troop type. Calculated breakdowns remain for reference.
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => (
                      <div key={stat} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 [data-theme='light']:bg-gray-100 [data-theme='light']:border-gray-300">
                        <div className="text-xs text-bonus-label mb-2 uppercase tracking-wide font-semibold">{stat}</div>
                        <div className="text-2xl font-bold text-bonus-total">
                          {total[stat] > 0 ? '+' : ''}{total[stat].toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => {
                      const researchTotal = opponent.basicBonuses.combatTech.totalTroopBonus[stat] || 0;
                      const researchTroopTypeOnly = (opponent.basicBonuses.combatTech.troopTypeBonus[troopType]?.[stat] || 0) - researchTotal;
                      const researchTotalValue = researchTroopTypeOnly + researchTotal;

                      const basicSum =
                        researchTotalValue +
                        breakdown.allianceTech[stat] +
                        breakdown.experts[stat] +
                        breakdown.daybreakIsland[stat] +
                        breakdown.pets[stat] +
                        breakdown.skins[stat] +
                        breakdown.hero[stat] +
                        breakdown.chiefGear[stat] +
                        breakdown.charms[stat] +
                        breakdown.heroGear[stat] +
                        breakdown.allianceFacilities[stat] +
                        breakdown.petRefinement[stat] +
                        breakdown.warAcademy[stat] +
                        breakdown.specialHeroes[stat] +
                        breakdown.vipPrestige[stat] +
                        breakdown.globe[stat];

                      const specialBuffsValue = breakdown.specialBuffs[stat];
                      let joinerAddValue = effectiveOpponentJoinerInfo?.additive[stat] || 0;
                      if (joinerAddValue > specialBuffsValue) {
                        joinerAddValue = specialBuffsValue;
                      }
                      const otherSpecialBuffs = specialBuffsValue - joinerAddValue;

                      const additiveTotalForStat = (manualAdditiveTotals ?? computedAdditiveTotals)[stat];
                      const referenceAdditiveTotal = computedAdditiveTotals[stat];
                      const manualOverrideValue = manualAdditiveTotals?.[stat];
                      const usingManualOverride = manualOverrideActive && manualOverrideValue !== undefined && manualOverrideValue !== null;

                      const basicItems = [
                        { label: 'Research', value: researchTotalValue, detail: researchTroopTypeOnly > 0 || researchTotal > 0 ? `(Troop Type: ${researchTroopTypeOnly > 0 ? '+' : ''}${researchTroopTypeOnly.toFixed(2)}%, Total: ${researchTotal > 0 ? '+' : ''}${researchTotal.toFixed(2)}%)` : null },
                        { label: 'Alliance Tech', value: breakdown.allianceTech[stat] },
                        { label: 'Experts', value: breakdown.experts[stat] },
                        { label: 'Daybreak Island', value: breakdown.daybreakIsland[stat] },
                        { label: 'Pets', value: breakdown.pets[stat] },
                        { label: 'Skins', value: breakdown.skins[stat] },
                        { label: 'Hero (Leader)', value: breakdown.hero[stat] },
                        { label: 'Chief Gear', value: breakdown.chiefGear[stat] },
                        { label: 'Charms', value: breakdown.charms[stat] },
                        { label: 'Hero Gear', value: breakdown.heroGear[stat] },
                        { label: 'Alliance Facilities', value: breakdown.allianceFacilities[stat] },
                        { label: 'Pet Refinement', value: breakdown.petRefinement[stat] },
                        { label: 'War Academy', value: breakdown.warAcademy[stat] },
                        { label: 'Special Heroes', value: breakdown.specialHeroes[stat] },
                        { label: 'VIP Prestige', value: breakdown.vipPrestige[stat] },
                        { label: 'Globe', value: breakdown.globe[stat] }
                      ];

                      type AdditiveItem = {
                        label: string;
                        value: number;
                        muted?: boolean;
                        highlight?: boolean;
                        alwaysShow?: boolean;
                      };

                      const baseAdditiveItems: AdditiveItem[] = [
                        { label: 'Temporary Events', value: breakdown.temporaryEvents[stat], muted: usingManualOverride },
                        { label: 'Supreme President', value: breakdown.supremePresident[stat], muted: usingManualOverride },
                        { label: 'Joiners (Special Buffs)', value: joinerAddValue, muted: usingManualOverride },
                        { label: 'Special Buffs (Other)', value: otherSpecialBuffs, muted: usingManualOverride }
                      ];

                      const additiveItems: AdditiveItem[] = usingManualOverride
                        ? [
                          { label: 'Manual Override', value: additiveTotalForStat, highlight: true, alwaysShow: true },
                          { label: 'Calculated Total (reference)', value: referenceAdditiveTotal, muted: true, alwaysShow: true },
                          ...baseAdditiveItems
                        ]
                        : baseAdditiveItems;

                      return (
                        <div key={stat} className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 [data-theme='light']:bg-gray-50 [data-theme='light']:border-gray-200">
                          <div className="text-lg font-semibold mb-4 capitalize text-bonus-stat-header">{stat}</div>

                          <div className="mb-4">
                            <div className="text-sm font-semibold text-bonus-section-header mb-2 pb-1 border-b border-slate-700/50 [data-theme='light']:border-gray-500">Basic Bonuses</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {basicItems.map((item) => (
                                item.value !== 0 ? (
                                  <div key={item.label} className="flex justify-between items-start py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                    <span className="text-bonus-label font-medium">{item.label}:</span>
                                    <div className="text-right">
                                      <span className="font-semibold text-bonus-value">
                                        {item.value > 0 ? '+' : ''}{item.value.toFixed(2)}%
                                      </span>
                                      {item.detail && (
                                        <div className="text-xs text-bonus-detail mt-0.5">{item.detail}</div>
                                      )}
                                    </div>
                                  </div>
                                ) : null
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-bonus-section-header mb-2 pb-1 border-b border-slate-700/50 [data-theme='light']:border-gray-500">Additive Bonuses</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {additiveItems.map((item) => {
                                const isZero = item.value === 0;
                                const showZeroState = isZero && !item.alwaysShow;
                                const containerClasses = [
                                  'flex justify-between items-center py-1.5 px-2 rounded transition-colors',
                                  item.highlight
                                    ? 'border border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_6px_rgba(16,185,129,0.25)]'
                                    : 'hover:bg-slate-800/40 [data-theme=\'light\']:hover:bg-gray-100',
                                  item.muted ? 'opacity-70' : ''
                                ].join(' ');
                                const valueClass = item.highlight
                                  ? 'font-semibold text-bonus-total'
                                  : 'font-semibold text-bonus-additive';

                                if (showZeroState) {
                                  return (
                                    <div key={item.label} className="flex justify-between items-center py-1.5 px-2 rounded opacity-60">
                                      <span className="text-bonus-zero">{item.label}:</span>
                                      <span className="text-bonus-zero-value">0.00%</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={item.label} className={containerClasses}>
                                    <span className="text-bonus-label font-medium">{item.label}:</span>
                                    <span className={valueClass}>
                                      {item.value > 0 ? '+' : ''}{item.value.toFixed(2)}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </SectionCard>

          <SectionCard
            title="Multiplicative Bonuses Summary"
            description="Total multiplicative bonuses from Pet Skills, City Bonuses, and Joiners. These are applied after additive bonuses."
            collapsible
            defaultCollapsed
          >
            <SectionCard
              title="Manual Multiplicative Override (optional)"
              description="Enter total multiplicative % per troop/stat; leave collapsed to use calculated values."
              collapsible
              defaultCollapsed
            >
              <ManualMultiplicativeOverride
                overrides={currentProfile.opponent?.multiplicativeBonuses?.manualOverrideTotals}
                onChange={handleOpponentManualMultiplicativeOverrideChange}
              />
            </SectionCard>
            {TROOP_TYPE_LIST.map((troopType) => {
              const opponent = currentProfile.opponent;
              if (!opponent) return null;

              // Calculate pet skills directly from petSkillSelections (same as pets-section.tsx)
              const petSkillSelections = opponent.petSkillSelections || {};
              const calculatedPetSkills = { attack: 0, defense: 0, lethality: 0, health: 0 };
              const calculatedPetDebuffs = { attack: 0, defense: 0, lethality: 0, health: 0 };

              const petContributions: Record<string, Record<string, number>> = {
                attack: {},
                defense: {},
                lethality: {},
                health: {}
              };

              const petDebuffContributions: Record<string, Record<string, number>> = {
                defense: {},
                health: {}
              };

              Object.entries(petSkillSelections).forEach(([petName, level]) => {
                const levelNum = typeof level === 'number' ? level : parseInt(String(level), 10);
                if (!levelNum || levelNum === 0 || isNaN(levelNum)) return;

                const pet = PETS_DATA[petName];
                if (!pet) return;

                const levelValue = pet.levels[levelNum.toString()];
                if (levelValue === undefined || levelValue === null) return;

                const stat = pet.stat.toLowerCase();
                const isDebuff = stat.includes('reduction');

                if (stat.includes('attack')) {
                  calculatedPetSkills.attack += levelValue;
                  petContributions.attack[petName] = (petContributions.attack[petName] || 0) + levelValue;
                } else if (stat.includes('defense') && !isDebuff) {
                  calculatedPetSkills.defense += levelValue;
                  petContributions.defense[petName] = (petContributions.defense[petName] || 0) + levelValue;
                } else if (stat.includes('lethality')) {
                  calculatedPetSkills.lethality += levelValue;
                  petContributions.lethality[petName] = (petContributions.lethality[petName] || 0) + levelValue;
                } else if (stat.includes('health') && !isDebuff) {
                  calculatedPetSkills.health += levelValue;
                  petContributions.health[petName] = (petContributions.health[petName] || 0) + levelValue;
                } else if (stat.includes('health') && isDebuff) {
                  calculatedPetDebuffs.health += levelValue;
                  petDebuffContributions.health[petName] = (petDebuffContributions.health[petName] || 0) + levelValue;
                } else if (stat.includes('defense') && isDebuff) {
                  calculatedPetDebuffs.defense += levelValue;
                  petDebuffContributions.defense[petName] = (petDebuffContributions.defense[petName] || 0) + levelValue;
                }
              });

              // Apply toggles
              const petSkillsEnabled = opponent.petSkillsEnabled !== false; // Default to true

              const petSkills = petSkillsEnabled ? calculatedPetSkills : { attack: 0, defense: 0, lethality: 0, health: 0 };
              const cityBonuses = opponent.multiplicativeBonuses?.cityBonuses || { attack: 0, defense: 0, lethality: 0, health: 0, enemyAttackReduction: 0, enemyDefenseReduction: 0, deploymentCapacity: 0 };
              const joinerMultiplicative = effectiveOpponentJoinerInfo?.multiplicative || { damage: 0, attack: 0, defense: 0, lethality: 0, health: 0, damageReduction: 0 };
              const manualOverrideTotals = opponent.multiplicativeBonuses?.manualOverrideTotals?.[troopType];
              const manualOverrideActive =
                manualOverrideTotals &&
                Object.values(manualOverrideTotals).some(
                  (value) => value !== undefined && value !== null && !Number.isNaN(Number(value))
                );
              const total = {
                attack: petSkills.attack + cityBonuses.attack + joinerMultiplicative.attack + joinerMultiplicative.damage,
                defense: petSkills.defense + cityBonuses.defense + joinerMultiplicative.defense,
                lethality: petSkills.lethality + cityBonuses.lethality + joinerMultiplicative.lethality,
                health: petSkills.health + cityBonuses.health + joinerMultiplicative.health
              };

              const manualTotals = manualOverrideActive
                ? {
                  attack: Number(manualOverrideTotals?.attack ?? 0),
                  defense: Number(manualOverrideTotals?.defense ?? 0),
                  lethality: Number(manualOverrideTotals?.lethality ?? 0),
                  health: Number(manualOverrideTotals?.health ?? 0)
                }
                : null;

              const displayTotals = manualTotals ?? total;

              const combatDebuffs = { ...calculatedPetDebuffs, ...(opponent.multiplicativeBonuses?.combatDebuffs || {}) };

              return (
                <div key={troopType} className="mb-8 pb-8 border-b border-slate-700/50 [data-theme='light']:border-gray-300">
                  <h4 className="text-xl font-bold mb-4 capitalize text-bonus-label">{troopType}</h4>

                  {manualOverrideActive && (
                    <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 [data-theme='light']:text-emerald-700">
                      Manual multiplicative totals are applied for this troop type. Calculated breakdowns remain for reference.
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => (
                      <div key={stat} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 [data-theme='light']:bg-gray-100 [data-theme='light']:border-gray-300">
                        <div className="text-xs text-bonus-label mb-2 uppercase tracking-wide font-semibold">{stat}</div>
                        <div className="text-2xl font-bold text-bonus-total">
                          {displayTotals[stat] > 0 ? '+' : ''}{displayTotals[stat].toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => {
                      const petsForStat = petSkillsEnabled ? Object.entries(petContributions[stat]).filter(([_, value]) => value > 0) : [];
                      return (
                        <div key={stat} className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 [data-theme='light']:bg-gray-50 [data-theme='light']:border-gray-200">
                          <div className="text-lg font-semibold mb-4 capitalize text-bonus-stat-header">{stat}</div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {petSkillsEnabled ? (
                              petsForStat.length > 0 ? (
                                petsForStat.map(([petName, value]) => (
                                  <div key={petName} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                    <span className="text-bonus-label font-medium">{petName}:</span>
                                    <span className="font-semibold text-bonus-value">
                                      {value > 0 ? '+' : ''}{value.toFixed(2)}%
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-bonus-zero py-1.5 px-2">No Pet Skills</div>
                              )
                            ) : (
                              <div className="text-bonus-zero py-1.5 px-2">Pet Skills Disabled</div>
                            )}
                            {petSkillsEnabled && petsForStat.length > 0 && (
                              <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                <span className="text-bonus-label font-semibold">Pet Skills Total:</span>
                                <span className="font-semibold text-bonus-value">
                                  {petSkills[stat] > 0 ? '+' : ''}{petSkills[stat].toFixed(2)}%
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                              <span className="text-bonus-label font-medium">City Bonuses:</span>
                              <span className="font-semibold text-bonus-value">
                                {cityBonuses[stat] > 0 ? '+' : ''}{cityBonuses[stat].toFixed(2)}%
                              </span>
                            </div>
                            {manualOverrideActive && (
                              <div className="flex justify-between items-center py-1.5 px-2 rounded border border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_6px_rgba(16,185,129,0.25)]">
                                <span className="text-bonus-label font-semibold">Manual Override:</span>
                                <span className="font-semibold text-bonus-total">
                                  {displayTotals[stat] > 0 ? '+' : ''}{displayTotals[stat].toFixed(2)}%
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                              <span className="text-bonus-label font-medium">
                                {manualOverrideActive ? 'Calculated Total (reference):' : 'Grand Total:'}
                              </span>
                              <span className={`font-semibold ${manualOverrideActive ? 'text-bonus-additive opacity-80' : 'text-bonus-total'}`}>
                                {total[stat] > 0 ? '+' : ''}{total[stat].toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t-2 border-slate-700/50 [data-theme='light']:border-gray-300">
                    <h4 className="text-lg font-semibold mb-4 text-bonus-section-header">Enemy Reduction Debuffs (Applied to Opponent)</h4>
                    <div className="space-y-4">
                      {(['defense', 'health'] as const).map((stat) => {
                        const petsForDebuff = Object.entries(petDebuffContributions[stat]).filter(([_, value]) => value > 0);
                        const cityDebuff = stat === 'defense'
                          ? (opponent.multiplicativeBonuses?.cityBonuses?.enemyDefenseReduction || 0)
                          : 0;
                        const totalDebuff = combatDebuffs[stat] + (stat === 'defense' ? cityDebuff : 0);

                        if (petsForDebuff.length === 0 && cityDebuff === 0) return null;

                        return (
                          <div key={stat} className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 [data-theme='light']:bg-gray-50 [data-theme='light']:border-gray-200">
                            <div className="text-lg font-semibold mb-4 capitalize text-bonus-stat-header">
                              Enemy {stat === 'defense' ? 'Defense' : 'Health'} Reduction
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {petsForDebuff.length > 0 && (
                                <>
                                  {petsForDebuff.map(([petName, value]) => (
                                    <div key={petName} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                      <span className="text-bonus-label font-medium">{petName}:</span>
                                      <span className="font-semibold text-bonus-value">
                                        {value > 0 ? '+' : ''}{value.toFixed(2)}%
                                      </span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                    <span className="text-bonus-label font-semibold">Pet Debuffs Total:</span>
                                    <span className="font-semibold text-bonus-value">
                                      {combatDebuffs[stat] > 0 ? '+' : ''}{combatDebuffs[stat].toFixed(2)}%
                                    </span>
                                  </div>
                                </>
                              )}
                              {stat === 'defense' && cityDebuff > 0 && (
                                <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                  <span className="text-bonus-label font-medium">City Bonuses:</span>
                                  <span className="font-semibold text-bonus-value">
                                    {cityDebuff > 0 ? '+' : ''}{cityDebuff.toFixed(2)}%
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                                <span className="text-bonus-label font-semibold">
                                  Total Enemy {stat === 'defense' ? 'Defense' : 'Health'} Reduction:
                                </span>
                                <span className="font-semibold text-bonus-total">
                                  {totalDebuff > 0 ? '+' : ''}{totalDebuff.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(opponent.multiplicativeBonuses?.cityBonuses?.enemyAttackReduction ?? 0) > 0 && (
                        <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 [data-theme='light']:bg-gray-50 [data-theme='light']:border-gray-200">
                          <div className="text-lg font-semibold mb-4 text-bonus-stat-header">Enemy Attack Reduction</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                              <span className="text-bonus-label font-medium">City Bonuses:</span>
                              <span className="font-semibold text-bonus-value">
                                {(opponent.multiplicativeBonuses?.cityBonuses?.enemyAttackReduction ?? 0) > 0 ? '+' : ''}{(opponent.multiplicativeBonuses?.cityBonuses?.enemyAttackReduction ?? 0).toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-slate-800/40 transition-colors [data-theme='light']:hover:bg-gray-100">
                              <span className="text-bonus-label font-semibold">Total Enemy Attack Reduction:</span>
                              <span className="font-semibold text-bonus-total">
                                {(opponent.multiplicativeBonuses?.cityBonuses?.enemyAttackReduction ?? 0) > 0 ? '+' : ''}{(opponent.multiplicativeBonuses?.cityBonuses?.enemyAttackReduction ?? 0).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </SectionCard>
        </div>
      )
      }

      {
        opponentSubTab === 'heroes' && (
          <div>
            <HeroSelector
              heroLevels={currentProfile.opponent?.heroLevels || {}}
              onHeroLevelsChange={(heroLevels: Record<string, HeroLevel>) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels,
                    basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
              basicBonuses={currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses()}
              onBasicBonusesChange={(bonuses: BasicBonuses) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: bonuses,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
              isOpponent
            />
          </div>
        )
      }

      {
        opponentSubTab === 'basic' && (
          <div>
            <h2>Opponent Basic Bonuses</h2>
            <DataSelectors
              basicBonuses={currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses()}
              onBasicBonusesChange={(bonuses: BasicBonuses) => {
                setCurrentProfile((prev) => prev ? {
                  ...prev,
                  opponent: {
                    ...prev.opponent,
                    heroLevels: prev.opponent?.heroLevels || {},
                    basicBonuses: bonuses,
                    expertSelections: prev.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                } : null);
              }}
              expertSelections={currentProfile.opponent?.expertSelections || defaultExpertSelections}
              onExpertSelectionsChange={(selections: ExpertSelections) => {
                setCurrentProfile((prev) => prev ? {
                  ...prev,
                  opponent: {
                    ...prev.opponent,
                    heroLevels: prev.opponent?.heroLevels || {},
                    basicBonuses: prev.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    expertSelections: selections
                  }
                } : null);
              }}
              additiveBonuses={currentProfile.opponent?.additiveBonuses || createDefaultAdditiveBonuses()}
              onAdditiveBonusesChange={(bonuses: AdditiveBonuses) => {
                setCurrentProfile((prev) => prev ? {
                  ...prev,
                  opponent: {
                    ...prev.opponent,
                    heroLevels: prev.opponent?.heroLevels || {},
                    basicBonuses: prev.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    expertSelections: prev.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                    additiveBonuses: {
                      ...bonuses,
                      manualOverrideTotals: prev.opponent?.additiveBonuses?.manualOverrideTotals
                    }
                  }
                } : null);
              }}
              multiplicativeBonuses={currentProfile.opponent?.multiplicativeBonuses || createDefaultMultiplicativeBonuses()}
              onMultiplicativeBonusesChange={(bonuses: MultiplicativeBonuses) => {
                setCurrentProfile((prev) => prev ? {
                  ...prev,
                  opponent: {
                    ...prev.opponent,
                    heroLevels: prev.opponent?.heroLevels || {},
                    basicBonuses: prev.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    expertSelections: prev.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                    multiplicativeBonuses: {
                      ...bonuses,
                      manualOverrideTotals: prev.opponent?.multiplicativeBonuses?.manualOverrideTotals
                    }
                  }
                } : null);
              }}
              rally={currentProfile.rally}
            />

            <div className="card mt-8">
              <h3>Additive Bonuses</h3>
              <AdditiveBonusesInput
                bonuses={currentProfile.opponent?.additiveBonuses || createDefaultAdditiveBonuses()}
                onBonusesChange={(bonuses: AdditiveBonuses) => {
                  setCurrentProfile((prev) => prev ? {
                    ...prev,
                    opponent: {
                      ...prev.opponent,
                      heroLevels: prev.opponent?.heroLevels || {},
                      basicBonuses: prev.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                      expertSelections: prev.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                      additiveBonuses: bonuses
                    }
                  } : null);
                }}
              />
            </div>

            <div className="card mt-8">
              <h3>Multiplicative Bonuses</h3>
              <MultiplicativeBonusesInput
                bonuses={currentProfile.opponent?.multiplicativeBonuses || createDefaultMultiplicativeBonuses()}
                onBonusesChange={(bonuses: MultiplicativeBonuses) => {
                  setCurrentProfile((prev) => prev ? {
                    ...prev,
                    opponent: {
                      ...prev.opponent,
                      heroLevels: prev.opponent?.heroLevels || {},
                      basicBonuses: prev.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                      expertSelections: prev.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                      multiplicativeBonuses: bonuses
                    }
                  } : null);
                }}
                petSkillSelections={currentProfile.opponent?.petSkillSelections}
                isOpponent={true}
              />
            </div>
          </div>
        )
      }

      {
        opponentSubTab === 'research' && (
          <div>
            <ResearchSection
              basicBonuses={currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses()}
              onBasicBonusesChange={(bonuses) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: bonuses,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
              warAcademySelections={currentProfile.opponent?.warAcademySelections}
              onWarAcademySelectionsChange={(selections) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    warAcademySelections: selections,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
            />
          </div>
        )
      }

      {
        opponentSubTab === 'chief' && (
          <div>
            <ChiefSection
              basicBonuses={currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses()}
              onBasicBonusesChange={(bonuses) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: bonuses,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
              chiefGearSelections={currentProfile.opponent?.chiefGearSelections}
              onChiefGearSelectionsChange={(selections) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    chiefGearSelections: selections,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
              charmLevels={currentProfile.opponent?.charmLevels}
              onCharmLevelsChange={(levels) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    charmLevels: levels,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
              commandCenterLevel={currentProfile.opponent?.commandCenterLevel}
              onCommandCenterLevelChange={(level) => {
                setCurrentProfile({
                  ...currentProfile,
                  opponent: {
                    ...currentProfile.opponent,
                    heroLevels: currentProfile.opponent?.heroLevels || {},
                    basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                    commandCenterLevel: level,
                    expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections()
                  }
                });
              }}
            />
          </div>
        )
      }

      {
        opponentSubTab === 'pets' && (
          <div>
            {(() => {
              const opponentMultiplicative =
                currentProfile.opponent?.multiplicativeBonuses || createDefaultMultiplicativeBonuses();
              const opponentPetSkills = currentProfile.opponent?.petSkillSelections;
              return (
                <PetsSection
                  basicBonuses={currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses()}
                  onBasicBonusesChange={(bonuses) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: bonuses,
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        colorTier: currentProfile.opponent?.colorTier
                      }
                    });
                  }}
                  multiplicativeBonuses={opponentMultiplicative}
                  onMultiplicativeBonusesChange={(bonuses) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        multiplicativeBonuses: bonuses,
                        colorTier: currentProfile.opponent?.colorTier
                      }
                    });
                  }}
                  capacity={currentProfile.opponent?.capacity || { rally: 0, march: 0 }}
                  onCapacityChange={(capacity) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        capacity
                      }
                    });
                  }}
                  petSkillSelections={opponentPetSkills}
                  onPetSkillSelectionsChange={(selections) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        petSkillSelections: selections,
                        multiplicativeBonuses: opponentMultiplicative,
                        colorTier: currentProfile.opponent?.colorTier
                      }
                    });
                  }}
                  isOpponent={true}
                  colorTier={currentProfile.opponent?.colorTier}
                  onColorTierChange={(colorTier) => {
                    setCurrentProfile({
                      ...currentProfile,
                      opponent: {
                        ...currentProfile.opponent,
                        heroLevels: currentProfile.opponent?.heroLevels || {},
                        basicBonuses: currentProfile.opponent?.basicBonuses || getDefaultOpponentBasicBonuses(),
                        expertSelections: currentProfile.opponent?.expertSelections || getDefaultOpponentExpertSelections(),
                        colorTier
                      }
                    });
                  }}
                />
              );
            })()}
          </div>
        )
      }
    </div >
  );
}

export default memo(OpponentTab);
