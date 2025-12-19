'use client';

import { buildConfigForSide, DEFAULT_TROOP_MIX } from '@/lib/rally/rally-config';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Hero, SkillLevel, SkillLevelsByName } from '../../../lib/battle';
import { getHeroByName } from '../../../lib/battle';
import { getAllHeroesForSelect, getHeroesByClassForSelect, getHeroExpeditionSkills, getHeroSkillLevelOptions, getTroopDefinitionOptions } from '../../../lib/battle/data-selectors';
import type { RallySideConfig, SideBaseStats, SideCombatSummary, TroopStatLine } from '../../../lib/rally/combat-types';
import type { FireCrystalLevel, RallyConfiguration, RallyHero, TroopConfiguration, TroopMixConfig, TroopTier, TroopType } from '../../types';
import { SectionCard } from '../../ui';

interface RallyConfigurationProps {
  rally: RallyConfiguration;
  onRallyChangeAction: (rally: RallyConfiguration) => void;
  playerHeroLevels?: Record<string, import('../../types').HeroLevel>;
  opponentHeroLevels?: Record<string, import('../../types').HeroLevel>;
  isUsingPlayerHeroes?: boolean; // Track which source is being used
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
}

export default function RallyConfigurationComponent({
  rally,
  onRallyChangeAction,
  playerHeroLevels,
  opponentHeroLevels,
  playerBaseStats,
  opponentBaseStats,
}: RallyConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'leaders' | 'joiners'>('leaders');
  const [rallyMode, setRallyMode] = useState<'player' | 'opponent'>(
    rally.usePlayerHeroes === false ? 'opponent' : 'player'
  );
  const heroes = getHeroesByClassForSelect();
  const isUsingPlayerHeroes = rallyMode === 'player';
  const playerJoiners = rally.playerJoiners || rally.joiners || [];
  const opponentJoiners = rally.opponentJoiners || [];

  const playerSideConfig = useMemo<RallySideConfig>(
    () => buildConfigForSide(rally, 'player', playerBaseStats),
    [rally, playerBaseStats]
  );
  const opponentSideConfig = useMemo<RallySideConfig>(
    () => buildConfigForSide(rally, 'opponent', opponentBaseStats),
    [rally, opponentBaseStats]
  );
  const rallySummary = useMemo(() => {
    const makeSummary = (side: RallySideConfig): SideCombatSummary => ({
      troopStats: side.baseStats as Record<TroopType, TroopStatLine>,
      damageDealtMultiplier: 1,
      damageTakenMultiplier: 1,
      controlSummary: {},
      dotSummary: undefined,
      debugEffects: []
    });
    return {
      attacker: playerSideConfig.role === 'attacker' ? makeSummary(playerSideConfig) : makeSummary(opponentSideConfig),
      defender: playerSideConfig.role === 'attacker' ? makeSummary(opponentSideConfig) : makeSummary(playerSideConfig)
    };
  }, [playerSideConfig, opponentSideConfig]);

  const playerSummary = playerSideConfig.role === 'attacker'
    ? rallySummary.attacker
    : rallySummary.defender;
  const opponentSummary = playerSideConfig.role === 'attacker'
    ? rallySummary.defender
    : rallySummary.attacker;

  const updateLeader = (type: TroopType, hero: RallyHero | null) => {
    // Store leader selections separately for Player and Opponent
    if (rallyMode === 'player') {
      onRallyChangeAction({
        ...rally,
        leader: {
          ...rally.leader,
          [type]: hero,
        },
        playerLeader: {
          ...(rally.playerLeader || rally.leader),
          [type]: hero,
        },
      });
    } else {
      onRallyChangeAction({
        ...rally,
        leader: {
          ...rally.leader,
          [type]: hero,
        },
        opponentLeader: {
          ...(rally.opponentLeader || rally.leader),
          [type]: hero,
        },
      });
    }
  };

  const updateJoiner = (index: number, hero: RallyHero | null) => {
    // Get the appropriate joiners array based on current mode
    const currentJoiners = rallyMode === 'player'
      ? [...playerJoiners]
      : [...opponentJoiners];

    if (hero) {
      currentJoiners[index] = hero;
    } else {
      currentJoiners.splice(index, 1);
    }

    const updatedJoiners = currentJoiners.slice(0, 4); // Max 4 joiners

    if (rallyMode === 'player') {
      onRallyChangeAction({
        ...rally,
        playerJoiners: updatedJoiners,
        // Keep legacy joiners for backward compatibility
        joiners: updatedJoiners,
      });
    } else {
      onRallyChangeAction({
        ...rally,
        opponentJoiners: updatedJoiners,
      });
    }
  };

  const addJoiner = () => {
    // Get the appropriate joiners array based on current mode
    const currentJoiners = rallyMode === 'player'
      ? playerJoiners
      : opponentJoiners;

    if (currentJoiners.length >= 4) return;
    updateJoiner(currentJoiners.length, {
      heroName: '',
      heroClass: 'infantry',
      starLevel: 0,
      generation: 1,
      skillLevels: {},
      xpLevel: undefined, // Will be initialized from heroLevels when hero is selected
    });
  };

  const updateTroopCapacity = (type: TroopType, index: number, config: TroopConfiguration | null) => {
    const capacity = [...rally.capacity[type]];
    if (config) {
      capacity[index] = config;
    } else {
      capacity.splice(index, 1);
    }
    onRallyChangeAction({
      ...rally,
      capacity: {
        ...rally.capacity,
        [type]: capacity,
      },
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionCard
        title="Rally Configuration"
        collapsible={false}
      >

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'leaders' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaders')}
          >
            Leaders (3)
          </button>
          <button
            className={`tab ${activeTab === 'joiners' ? 'active' : ''}`}
            onClick={() => setActiveTab('joiners')}
          >
            Joiners ({(() => {
              const playerCount = rally.playerJoiners?.length || rally.joiners?.length || 0;
              const opponentCount = rally.opponentJoiners?.length || 0;
              return playerCount + opponentCount > 0 ? `${playerCount + opponentCount}/8` : '0/8';
            })()})
          </button>
        </div>

        {/* Leaders Tab */}
        {activeTab === 'leaders' && (
          <div className="tab-content active">
            <h3>Rally Leaders</h3>
            <p className="section-description">
              Select one hero for each troop type (Infantry, Lancer, Marksman). In Rally Battles, <strong>all Rally Captain Hero Skills are active</strong>.
              When a hero is selected, their skill levels, star levels, and power levels are automatically pulled from the Player/Opponent Heroes section if configured there.
            </p>

            {/* Player/Opponent Tabs */}
            <div className="tabs mb-6">
              <button
                className={`tab ${rallyMode === 'player' ? 'active' : ''}`}
                onClick={() => {
                  setRallyMode('player');
                  onRallyChangeAction({
                    ...rally,
                    usePlayerHeroes: true,
                  });
                  // Only sync if playerLeader doesn't exist yet (first time switching to player)
                  if (!rally.playerLeader) {
                    syncLeadersFromHeroLevels(playerHeroLevels, heroes, onRallyChangeAction, rally, true);
                  }
                }}
              >
                Player
              </button>
              <button
                className={`tab ${rallyMode === 'opponent' ? 'active' : ''}`}
                onClick={() => {
                  setRallyMode('opponent');
                  onRallyChangeAction({
                    ...rally,
                    usePlayerHeroes: false,
                  });
                  // Only sync if opponentLeader doesn't exist yet (first time switching to opponent)
                  if (!rally.opponentLeader) {
                    syncLeadersFromHeroLevels(opponentHeroLevels, heroes, onRallyChangeAction, rally, false);
                  }
                }}
              >
                Opponent
              </button>
            </div>

            {/* Attacking/Defending Mode Selector - Shows current side's mode */}
            <div className="form-group mb-6">
              <label>Special Widget Bonus Mode ({rallyMode === 'player' ? 'Player' : 'Opponent'})</label>
              <select
                value={rally.specialWidgetBonus?.[rallyMode] || 'attacking'}
                onChange={(e) => {
                  const newMode = e.target.value as 'attacking' | 'defending';
                  onRallyChangeAction({
                    ...rally,
                    specialWidgetBonus: {
                      player: rally.specialWidgetBonus?.player || 'attacking',
                      opponent: rally.specialWidgetBonus?.opponent || 'defending',
                      [rallyMode]: newMode,
                    },
                  });
                }}
              >
                <option value="attacking">Attacking (Rally Buff)</option>
                <option value="defending">Defending (Defender Skill)</option>
              </select>
              <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                Mode is auto-detected from hero expedition skill descriptions. If a skill description contains &quot;Defender&quot;, it&rsquo;s defensive. If it contains &quot;Rally&quot;, it&rsquo;s attacking.
                {rally.specialWidgetBonus && (
                  <span className="block mt-1">
                    <strong>Player:</strong> {rally.specialWidgetBonus.player === 'attacking' ? 'Attacking' : 'Defending'} |
                    <strong> Opponent:</strong> {rally.specialWidgetBonus.opponent === 'attacking' ? 'Attacking' : 'Defending'}
                  </span>
                )}
              </p>
            </div>

            {(['infantry', 'lancer', 'marksman'] as TroopType[]).map(type => {
              // Get the correct leader for the current mode
              const currentLeader = rallyMode === 'player'
                ? (rally.playerLeader?.[type] ?? rally.leader[type])
                : (rally.opponentLeader?.[type] ?? rally.leader[type]);

              return (
                <LeaderSelector
                  key={type}
                  type={type}
                  hero={currentLeader}
                  availableHeroes={heroes[type]}
                  onHeroChange={(hero) => {
                    updateLeader(type, hero);
                    // Auto-detect widget mode from hero expedition skills for current side
                    if (hero) {
                      const heroData = heroes[type].find(h => h['hero-name'] === hero.heroName);
                      if (heroData) {
                        const skills = getHeroExpeditionSkills(heroData);
                        let detectedMode: 'attacking' | 'defending' = rally.specialWidgetBonus?.[rallyMode] || 'attacking';
                        for (const skill of skills) {
                          const desc = skill.description?.toLowerCase() || '';
                          if (desc.includes('defender')) {
                            detectedMode = 'defending';
                            break;
                          } else if (desc.includes('rally')) {
                            detectedMode = 'attacking';
                            break;
                          }
                        }
                        const currentMode = rally.specialWidgetBonus?.[rallyMode];
                        if (detectedMode !== currentMode) {
                          onRallyChangeAction({
                            ...rally,
                            leader: {
                              ...rally.leader,
                              [type]: hero,
                            },
                            specialWidgetBonus: {
                              player: rally.specialWidgetBonus?.player || 'attacking',
                              opponent: rally.specialWidgetBonus?.opponent || 'defending',
                              [rallyMode]: detectedMode,
                            },
                          });
                        }
                      }
                    }
                  }}
                  heroLevels={isUsingPlayerHeroes ? playerHeroLevels : opponentHeroLevels}
                  isUsingPlayerHeroes={isUsingPlayerHeroes}
                />
              );
            })}
          </div>
        )}

        {/* Joiners Tab */}
        {activeTab === 'joiners' && (
          <div className="tab-content active">
            <div className="mb-4">
              <h3>Rally Joiners</h3>
              <p className="section-description">
                Up to 4 joiners per side. Only the <strong>first 4 joiners</strong> contribute bonuses. Each joiner uses their <strong>first expedition skill</strong> at its <strong>highest available skill level</strong>.
              </p>
            </div>

            {/* Player/Opponent Tabs */}
            <div className="tabs mb-6">
              <button
                className={`tab ${rallyMode === 'player' ? 'active' : ''}`}
                onClick={() => {
                  setRallyMode('player');
                }}
              >
                Player
              </button>
              <button
                className={`tab ${rallyMode === 'opponent' ? 'active' : ''}`}
                onClick={() => {
                  setRallyMode('opponent');
                }}
              >
                Opponent
              </button>
            </div>

            {(() => {
              // Get the appropriate joiners array based on current mode
              const currentJoiners = rallyMode === 'player'
                ? playerJoiners
                : opponentJoiners;

              return (
                <>
                  {currentJoiners.length < 4 && (
                    <button className="button mb-4" onClick={addJoiner}>
                      + Add Joiner
                    </button>
                  )}

                  {currentJoiners.map((joiner, index) => (
                    <JoinerSelector
                      key={index}
                      joiner={joiner}
                      availableHeroes={getAllHeroesForSelect()}
                      onJoinerChange={(hero) => updateJoiner(index, hero)}
                      onRemove={() => updateJoiner(index, null)}
                      heroLevels={isUsingPlayerHeroes ? playerHeroLevels : opponentHeroLevels}
                      isUsingPlayerHeroes={isUsingPlayerHeroes}
                    />
                  ))}

                  {currentJoiners.length === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-400 py-8">
                      No joiners added yet. Click &quot;+ Add Joiner&quot; to add one.
                    </div>
                  )}

                  {/* Joiner Math Breakdown */}
                  {currentJoiners.length > 0 && (
                    <JoinerMathBreakdown joiners={currentJoiners} />
                  )}
                </>
              );
            })()}
          </div>
        )}

      </SectionCard>

      <SectionCard
        title="Rally Combat Summary"
        description="Summary of rally combat configuration showing player and opponent side stats."
        collapsible
        defaultCollapsed={false}
      >
        {!rallySummary && (
          <div className="text-sm text-gray-400 dark:text-gray-400 mt-4">
            Unable to build summary yet. Ensure both Player and Opponent base stats are configured.
          </div>
        )}
        {rallySummary && (
          <div className="grid gap-4 lg:grid-cols-2 mt-4">
            <SideSummaryCard
              title="Player"
              role={playerSideConfig.role}
              summary={playerSummary}
            />
            <SideSummaryCard
              title="Opponent"
              role={opponentSideConfig.role}
              summary={opponentSummary}
            />
          </div>
        )}
      </SectionCard>
    </div >
  );
}

// Helper function to sync leaders from hero levels
// This auto-selects the first hero of each type from the heroLevels and populates their stats
// Only updates heroes that don't already have a selection
function syncLeadersFromHeroLevels(
  heroLevels: Record<string, import('../../types').HeroLevel> | undefined,
  heroesByClass: Record<TroopType, Hero[]>,
  onRallyChangeAction: (rally: RallyConfiguration) => void,
  currentRally: RallyConfiguration,
  isPlayer: boolean = true
) {
  if (!heroLevels) return;

  // Get existing leaders for this side, or use current leader as fallback
  const existingLeaders = isPlayer
    ? (currentRally.playerLeader || currentRally.leader)
    : (currentRally.opponentLeader || currentRally.leader);

  const newLeaders: RallyConfiguration['leader'] = { ...existingLeaders };

  (['infantry', 'lancer', 'marksman'] as TroopType[]).forEach(type => {
    // Only sync if this type doesn't already have a hero selected
    if (existingLeaders[type]) {
      return; // Keep existing selection
    }

    // Find heroes of this type that are in heroLevels
    const availableHeroes = heroesByClass[type];
    const heroesInLevels = availableHeroes.filter(hero => heroLevels[hero['hero-name']]);

    // Use the first hero found
    if (heroesInLevels.length > 0) {
      const hero = heroesInLevels[0]; // Use first hero of this type
      const heroLevel = heroLevels[hero['hero-name']];
      const skills = getHeroExpeditionSkills(hero);
      const skillLevels: SkillLevelsByName = {};

      // Use skill levels from heroLevels, or default to max available
      skills.forEach(skill => {
        const skillName = skill.name;
        const configuredLevel = heroLevel.skillLevels?.[skillName];
        if (configuredLevel) {
          skillLevels[skillName] = configuredLevel;
        } else {
          // Get max level for this skill
          const maxLevelOptions = getHeroSkillLevelOptions(skill.data, false);
          const maxLevel = maxLevelOptions.length > 0 ? maxLevelOptions[maxLevelOptions.length - 1] : 1;
          skillLevels[skillName] = maxLevel as SkillLevel;
        }
      });

      newLeaders[type] = {
        heroName: hero['hero-name'],
        heroClass: type,
        starLevel: heroLevel.starLevel || 0,
        generation: hero.generation,
        exclusiveWeaponLevel: heroLevel.exclusiveWeaponLevel,
        skillLevels,
        xpLevel: heroLevel.xpLevel, // Include XP level when syncing from heroLevels
      };
    }
  });

  // Store leaders separately for Player and Opponent
  if (isPlayer) {
    onRallyChangeAction({
      ...currentRally,
      leader: newLeaders,
      playerLeader: newLeaders,
    });
  } else {
    onRallyChangeAction({
      ...currentRally,
      leader: newLeaders,
      opponentLeader: newLeaders,
    });
  }
}

function LeaderSelector({
  type,
  hero,
  availableHeroes,
  onHeroChange,
  heroLevels,
  isUsingPlayerHeroes = true,
}: {
  type: TroopType;
  hero: RallyHero | null;
  availableHeroes: Hero[];
  onHeroChange: (hero: RallyHero | null) => void;
  heroLevels?: Record<string, import('../../types').HeroLevel>;
  isUsingPlayerHeroes?: boolean;
}) {
  const [selectedHeroName, setSelectedHeroName] = useState(hero?.heroName || '');
  const [starLevel, setStarLevel] = useState(hero?.starLevel || 0);
  const [generation, setGeneration] = useState(hero?.generation || 1);
  const [exclusiveWeaponLevel, setExclusiveWeaponLevel] = useState(hero?.exclusiveWeaponLevel);
  const [xpLevel, setXpLevel] = useState<number | undefined>(hero?.xpLevel);
  const [skillLevels, setSkillLevels] = useState<SkillLevelsByName>(hero?.skillLevels || {});

  // Use refs to track previous values and prevent infinite loops
  const prevHeroLevelsRef = useRef(heroLevels);
  const prevSelectedHeroNameRef = useRef(selectedHeroName);
  const prevHeroRef = useRef(hero);

  const STAR_COUNT = 5;
  const SEGMENTS_PER_STAR = 6;
  const MAX_STAR_LEVEL = STAR_COUNT * SEGMENTS_PER_STAR;

  // Sync selectedHeroName, starLevel, xpLevel, and skillLevels when hero prop changes from outside
  useEffect(() => {
    if (hero?.heroName !== selectedHeroName) {
      setSelectedHeroName(hero?.heroName || '');
      if (hero) {
        setStarLevel(hero.starLevel || 0);
        setExclusiveWeaponLevel(hero.exclusiveWeaponLevel);
        setXpLevel(hero.xpLevel);
        setSkillLevels(hero.skillLevels || {});
      } else {
        setSelectedHeroName('');
        setStarLevel(0);
        setExclusiveWeaponLevel(undefined);
        setXpLevel(undefined);
        setSkillLevels({});
      }
    }
  }, [hero?.heroName, hero?.starLevel, hero?.skillLevels, hero?.exclusiveWeaponLevel, hero?.xpLevel]);

  // Sync skill levels, star level, and exclusive weapon from heroLevels when hero or heroLevels change
  useEffect(() => {
    // Only run if heroLevels actually changed or selectedHeroName changed
    const heroLevelsChanged = prevHeroLevelsRef.current !== heroLevels;
    const heroNameChanged = prevSelectedHeroNameRef.current !== selectedHeroName;

    if (!heroLevelsChanged && !heroNameChanged) {
      return; // Skip if nothing relevant changed
    }

    // Update refs
    prevHeroLevelsRef.current = heroLevels;
    prevSelectedHeroNameRef.current = selectedHeroName;

    if (selectedHeroName) {
      const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
      if (selectedHero) {
        const skills = getHeroExpeditionSkills(selectedHero);
        const newSkillLevels: SkillLevelsByName = {};

        // Priority: heroLevels from Player/Opponent section > existing skillLevels > max available level
        const heroLevel = heroLevels?.[selectedHeroName];

        skills.forEach(skill => {
          // First, try to get from heroLevels (Player/Opponent Hero section)
          if (heroLevel?.skillLevels && heroLevel.skillLevels[skill.name] !== undefined) {
            const configuredLevel = heroLevel.skillLevels[skill.name];
            if (configuredLevel > 0) {
              newSkillLevels[skill.name] = configuredLevel;
              return; // Skip to next skill
            }
          }

          // Second, try existing skillLevels from state
          if (skillLevels[skill.name] && skillLevels[skill.name] > 0) {
            newSkillLevels[skill.name] = skillLevels[skill.name];
            return; // Skip to next skill
          }

          // Last resort: get max available level
          const maxLevelOptions = getHeroSkillLevelOptions(skill.data, false);
          const maxLevel = maxLevelOptions.length > 0 ? maxLevelOptions[maxLevelOptions.length - 1] : 1;
          newSkillLevels[skill.name] = maxLevel as SkillLevel;
        });

        // Only update if skillLevels actually changed to avoid infinite loops
        const skillLevelsChanged = JSON.stringify(newSkillLevels) !== JSON.stringify(skillLevels);
        if (skillLevelsChanged) {
          setSkillLevels(newSkillLevels);
        }

        // Auto-update star level, XP level, and exclusive weapon level from heroLevels if available
        // Only update if not already set in RallyHero (to preserve manual changes)
        if (heroLevel) {
          if (heroLevel.starLevel !== undefined && heroLevel.starLevel !== starLevel) {
            setStarLevel(heroLevel.starLevel);
          }
          if (heroLevel.exclusiveWeaponLevel !== undefined && heroLevel.exclusiveWeaponLevel !== exclusiveWeaponLevel) {
            setExclusiveWeaponLevel(heroLevel.exclusiveWeaponLevel);
          }
          // Initialize XP level from heroLevels if not already set in RallyHero
          if (heroLevel.xpLevel !== undefined && xpLevel === undefined) {
            setXpLevel(heroLevel.xpLevel);
          }
        }
      }
    }
  }, [selectedHeroName, heroLevels, availableHeroes]);

  // Track previous hero to avoid unnecessary onHeroChange calls
  const prevHeroForChangeRef = useRef<RallyHero | null>(hero);

  useEffect(() => {
    if (selectedHeroName) {
      const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
      if (selectedHero) {
        const currentHero: RallyHero = {
          heroName: selectedHeroName,
          heroClass: type,
          starLevel,
          generation: selectedHero.generation,
          exclusiveWeaponLevel,
          skillLevels,
          xpLevel, // Include XP level in RallyHero
        };

        // Only call onHeroChange if the hero data actually changed
        const prevHero = prevHeroForChangeRef.current;
        const heroChanged =
          !prevHero ||
          prevHero.heroName !== currentHero.heroName ||
          prevHero.starLevel !== currentHero.starLevel ||
          prevHero.generation !== currentHero.generation ||
          prevHero.exclusiveWeaponLevel !== currentHero.exclusiveWeaponLevel ||
          prevHero.xpLevel !== currentHero.xpLevel ||
          JSON.stringify(prevHero.skillLevels) !== JSON.stringify(currentHero.skillLevels);

        if (heroChanged) {
          prevHeroForChangeRef.current = currentHero;
          onHeroChange(currentHero);
        }
      }
    } else {
      if (prevHeroForChangeRef.current) {
        prevHeroForChangeRef.current = null;
        onHeroChange(null);
      }
    }
  }, [selectedHeroName, starLevel, generation, exclusiveWeaponLevel, xpLevel, skillLevels, type, availableHeroes, onHeroChange]);

  const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
  const skills = selectedHero ? getHeroExpeditionSkills(selectedHero) : [];
  const heroLevel = selectedHeroName ? heroLevels?.[selectedHeroName] : undefined;
  const isUsingHeroLevels = !!heroLevel;

  return (
    <div className="card info-card mb-4">
      <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Leader</h4>
      {isUsingHeroLevels && (
        <div className="callout callout-success text-sm">
          ✓ Stats automatically pulled from {isUsingPlayerHeroes ? 'Player' : 'Opponent'} Heroes section
          {heroLevel && (
            <div className="text-xs mt-1 opacity-80">
              Star Level: {heroLevel.starLevel} | XP Level: {heroLevel.xpLevel}
              {heroLevel.exclusiveWeaponLevel && ` | Exclusive Weapon: ${heroLevel.exclusiveWeaponLevel}`}
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label>Hero</label>
        <select
          value={selectedHeroName}
          onChange={(e) => setSelectedHeroName(e.target.value)}
        >
          <option value="">Select {type} hero...</option>
          {availableHeroes.map(h => (
            <option key={h['hero-name']} value={h['hero-name']}>
              {h['hero-name']} (Gen {h.generation})
            </option>
          ))}
        </select>
      </div>

      {selectedHero && (
        <>
          <div className="grid gap-4">
            <div className="form-group">
              <label>Star Level</label>
              <div className="star-level-input">
                {Array.from({ length: STAR_COUNT }, (_, starIdx) => {
                  const starBase = starIdx * SEGMENTS_PER_STAR;
                  return (
                    <div key={`star-${starIdx}`} className="hex-star" role="group" aria-label={`Star ${starIdx + 1}`}>
                      <svg viewBox="0 0 120 120" aria-hidden="true">
                        {Array.from({ length: SEGMENTS_PER_STAR }, (_, segmentIdx) => {
                          const level = starBase + segmentIdx + 1;
                          const isActive = starLevel >= level;
                          return (
                            <path
                              key={level}
                              d="M60 8 L72 32 L60 56 L48 32 Z"
                              transform={`rotate(${-segmentIdx * 60} 60 60)`}
                              className={`hex-segment ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                const newStarLevel = Math.max(0, Math.min(MAX_STAR_LEVEL, level));
                                setStarLevel(newStarLevel);
                              }}
                              aria-label={`Set star level to ${level}`}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="star-reset"
                  onClick={() => setStarLevel(0)}
                  aria-label="Reset star level"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Generation</label>
              <input type="text" value={selectedHero.generation} disabled />
            </div>
            <div className="form-group">
              <label>XP Level</label>
              <input
                type="number"
                min="0"
                max="80"
                value={xpLevel !== undefined ? xpLevel : (heroLevel?.xpLevel ?? 80)}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setXpLevel(isNaN(value) ? undefined : Math.max(0, Math.min(80, value)));
                }}
              />
              {heroLevel && xpLevel === undefined && (
                <p className="text-xs text-gray-400 mt-1">
                  Using {heroLevel.xpLevel} from {isUsingPlayerHeroes ? 'Player' : 'Opponent'} Heroes section
                </p>
              )}
            </div>
            {selectedHero['exclusive-weapon'] && (
              <div className="form-group">
                <label>Exclusive Weapon Level</label>
                <input
                  type="number"
                  min="0"
                  max={selectedHero['exclusive-weapon'].levels.length}
                  value={exclusiveWeaponLevel || 0}
                  onChange={(e) => setExclusiveWeaponLevel(parseInt(e.target.value) || undefined)}
                />
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div>
              <h5 className="text-base font-semibold mt-4">Expedition Skills</h5>
              <p className="text-sm text-gray-400 dark:text-gray-400 mb-2">
                <strong>All Rally Captain skills are active</strong> in rally battles. Configure skill levels below.
              </p>
              {skills.map(skill => (
                <div key={skill.name} className="form-group">
                  <label>
                    {skill.name}
                    {isUsingHeroLevels && heroLevel?.skillLevels?.[skill.name] && (
                      <span className="text-xs text-gray-400 dark:text-gray-400 ml-2">
                        (from {isUsingPlayerHeroes ? 'Player' : 'Opponent'} config)
                      </span>
                    )}
                  </label>
                  <select
                    value={skillLevels[skill.name] || 1}
                    onChange={(e) => {
                      const parsedLevel = Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) as SkillLevel;
                      setSkillLevels({
                        ...skillLevels,
                        [skill.name]: parsedLevel,
                      });
                    }}
                  >
                    {getHeroSkillLevelOptions(skill.data, false).map(level => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JoinerSelector({ joiner, availableHeroes, onJoinerChange, onRemove, heroLevels, isUsingPlayerHeroes = true }: {
  joiner: RallyHero;
  availableHeroes: Hero[];
  onJoinerChange: (hero: RallyHero) => void;
  onRemove: () => void;
  heroLevels?: Record<string, import('../../types').HeroLevel>;
  isUsingPlayerHeroes?: boolean;
}) {
  const [selectedHeroName, setSelectedHeroName] = useState(joiner.heroName || '');
  const [starLevel, setStarLevel] = useState(joiner.starLevel || 0);
  const [xpLevel, setXpLevel] = useState<number | undefined>(joiner.xpLevel);

  const STAR_COUNT = 5;
  const SEGMENTS_PER_STAR = 6;
  const MAX_STAR_LEVEL = STAR_COUNT * SEGMENTS_PER_STAR;

  // Use refs to track previous values and prevent infinite loops
  const prevHeroLevelsRef = useRef(heroLevels);
  const prevSelectedHeroNameRef = useRef(selectedHeroName);
  const prevJoinerRef = useRef<RallyHero>(joiner);
  const prevJoinerPropRef = useRef(joiner);

  // Sync selectedHeroName, starLevel, and xpLevel when joiner prop changes from outside
  // Use deep comparison to detect actual changes and prevent infinite loops
  useEffect(() => {
    const prevJoiner = prevJoinerPropRef.current;

    // Check if joiner actually changed using deep comparison
    const joinerChanged =
      prevJoiner.heroName !== joiner.heroName ||
      prevJoiner.starLevel !== joiner.starLevel ||
      prevJoiner.xpLevel !== joiner.xpLevel ||
      prevJoiner.generation !== joiner.generation ||
      JSON.stringify(prevJoiner.skillLevels) !== JSON.stringify(joiner.skillLevels);

    if (!joinerChanged) {
      return; // Skip if joiner prop didn't actually change
    }

    // Update ref
    prevJoinerPropRef.current = joiner;

    // Only sync if the joiner prop values are different from current state
    if (joiner.heroName !== selectedHeroName) {
      setSelectedHeroName(joiner.heroName || '');
      // When hero name changes, reset star level and XP level to allow heroLevels sync to work
      if (joiner.heroName) {
        setStarLevel(joiner.starLevel || 0);
        setXpLevel(joiner.xpLevel);
      } else {
        setStarLevel(0);
        setXpLevel(undefined);
      }
    } else if (joiner.heroName === selectedHeroName && selectedHeroName) {
      // Only sync star level and XP level if they're different AND not 0/undefined (to preserve heroLevels sync)
      // This prevents overriding the heroLevels sync when a hero is first selected
      // Only update if the joiner prop has a non-zero value (meaning it was manually set)
      if (joiner.starLevel !== undefined && joiner.starLevel !== starLevel && joiner.starLevel > 0) {
        setStarLevel(joiner.starLevel);
      }
      if (joiner.xpLevel !== undefined && joiner.xpLevel !== xpLevel) {
        setXpLevel(joiner.xpLevel);
      }
    }
    // Only depend on joiner prop - don't include state variables to prevent infinite loops
  }, [joiner]);

  // Sync star level and XP level from heroLevels when hero is selected or heroLevels change
  // Only initialize if not already set in RallyHero (to preserve manual changes)
  useEffect(() => {
    // Only run if heroLevels actually changed or selectedHeroName changed
    const heroLevelsChanged = prevHeroLevelsRef.current !== heroLevels;
    const heroNameChanged = prevSelectedHeroNameRef.current !== selectedHeroName;
    const prevHeroName = prevSelectedHeroNameRef.current;

    if (!heroLevelsChanged && !heroNameChanged) {
      return; // Skip if nothing relevant changed
    }

    // Update refs
    prevHeroLevelsRef.current = heroLevels;
    prevSelectedHeroNameRef.current = selectedHeroName;

    if (selectedHeroName && heroLevels?.[selectedHeroName]) {
      const heroLevel = heroLevels[selectedHeroName];

      // Always initialize star level from heroLevels if starLevel is 0 (uninitialized)
      // This ensures it syncs when a hero is first selected
      if (heroLevel.starLevel !== undefined && starLevel === 0) {
        setStarLevel(heroLevel.starLevel);
      }

      // Always initialize XP level from heroLevels if xpLevel is undefined (uninitialized)
      if (heroLevel.xpLevel !== undefined && xpLevel === undefined) {
        setXpLevel(heroLevel.xpLevel);
      }
    } else if (!selectedHeroName) {
      // Reset star level and XP level when no hero is selected
      if (starLevel !== 0) setStarLevel(0);
      if (xpLevel !== undefined) setXpLevel(undefined);
    }
  }, [selectedHeroName, heroLevels, starLevel, xpLevel]);

  // Track previous joiner to avoid unnecessary onJoinerChange calls
  useEffect(() => {
    if (selectedHeroName) {
      const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
      if (selectedHero) {
        const skills = getHeroExpeditionSkills(selectedHero);
        const skillLevels: SkillLevelsByName = {};
        skills.forEach(skill => {
          skillLevels[skill.name] = 1; // Joiners only get level 1
        });

        // Get star level and XP level: prefer from heroLevels if available, otherwise use current state
        // This ensures we always use the most up-to-date values
        const effectiveStarLevel = (heroLevels?.[selectedHeroName]?.starLevel !== undefined && starLevel === 0)
          ? heroLevels[selectedHeroName].starLevel
          : starLevel;

        // If xpLevel is undefined, use heroLevels if available
        const effectiveXpLevel = (heroLevels?.[selectedHeroName]?.xpLevel !== undefined && xpLevel === undefined)
          ? heroLevels[selectedHeroName].xpLevel
          : xpLevel;

        const currentJoiner: RallyHero = {
          heroName: selectedHeroName,
          heroClass: selectedHero['hero-class'] as TroopType,
          starLevel: effectiveStarLevel,
          generation: selectedHero.generation,
          skillLevels,
          xpLevel: effectiveXpLevel, // Include XP level in RallyHero
        };

        // Only call onJoinerChange if the joiner data actually changed
        const prevJoiner = prevJoinerRef.current;
        const joinerChanged =
          !prevJoiner ||
          prevJoiner.heroName !== currentJoiner.heroName ||
          prevJoiner.starLevel !== currentJoiner.starLevel ||
          prevJoiner.generation !== currentJoiner.generation ||
          prevJoiner.xpLevel !== currentJoiner.xpLevel ||
          JSON.stringify(prevJoiner.skillLevels) !== JSON.stringify(currentJoiner.skillLevels);

        if (joinerChanged) {
          prevJoinerRef.current = currentJoiner;
          onJoinerChange(currentJoiner);
        }
      }
    } else {
      // If no hero selected, clear the previous joiner ref
      if (prevJoinerRef.current) {
        prevJoinerRef.current = {
          heroName: '',
          heroClass: 'infantry',
          starLevel: 0,
          generation: 1,
          skillLevels: {},
        };
      }
    }
  }, [selectedHeroName, starLevel, xpLevel, heroLevels, availableHeroes]);

  const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
  const heroLevel = selectedHeroName ? heroLevels?.[selectedHeroName] : undefined;
  const isUsingHeroLevels = !!heroLevel;

  return (
    <div className="card mb-4 bg-slate-700/50 dark:bg-slate-700/50">
      <div className="flex justify-between items-center mb-2">
        <h4>Joiner {selectedHeroName || 'New'}</h4>
        <button className="button bg-red-600 hover:bg-red-700 px-4 py-2" onClick={onRemove}>
          Remove
        </button>
      </div>

      {isUsingHeroLevels && (
        <div className="callout callout-success text-sm mb-2">
          ✓ Stats automatically pulled from {isUsingPlayerHeroes ? 'Player' : 'Opponent'} Heroes section
          {heroLevel && (
            <div className="text-xs mt-1 opacity-80">
              Star Level: {heroLevel.starLevel} | XP Level: {heroLevel.xpLevel}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-4 items-end">
          <div className="form-group md:col-span-2">
            <label>Hero</label>
            <select
              value={selectedHeroName}
              onChange={(e) => setSelectedHeroName(e.target.value)}
            >
              <option value="">Select hero...</option>
              {availableHeroes.map(h => (
                <option key={h['hero-name']} value={h['hero-name']}>
                  {h['hero-name']} ({h['hero-class']}, Gen {h.generation})
                </option>
              ))}
            </select>
          </div>
          {selectedHero && (
            <>
              <div className="form-group">
                <label>Generation</label>
                <input type="text" value={selectedHero.generation} disabled />
              </div>
              <div className="form-group">
                <label>XP Level</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={xpLevel !== undefined ? xpLevel : (heroLevel?.xpLevel ?? 80)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setXpLevel(isNaN(value) ? undefined : Math.max(0, Math.min(80, value)));
                  }}
                />
                {heroLevel && xpLevel === undefined && (
                  <p className="text-xs text-gray-400 mt-1">
                    Using {heroLevel.xpLevel} from {isUsingPlayerHeroes ? 'Player' : 'Opponent'} Heroes section
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {selectedHero && (
          <>
            <div className="form-group">
              <label>Star Level</label>
              <div className="star-level-input">
                {Array.from({ length: STAR_COUNT }, (_, starIdx) => {
                  const starBase = starIdx * SEGMENTS_PER_STAR;
                  return (
                    <div key={`star-${starIdx}`} className="hex-star" role="group" aria-label={`Star ${starIdx + 1}`}>
                      <svg viewBox="0 0 120 120" aria-hidden="true">
                        {Array.from({ length: SEGMENTS_PER_STAR }, (_, segmentIdx) => {
                          const level = starBase + segmentIdx + 1;
                          const isActive = starLevel >= level;
                          return (
                            <path
                              key={level}
                              d="M60 8 L72 32 L60 56 L48 32 Z"
                              transform={`rotate(${-segmentIdx * 60} 60 60)`}
                              className={`hex-segment ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                const newStarLevel = Math.max(0, Math.min(MAX_STAR_LEVEL, level));
                                setStarLevel(newStarLevel);
                              }}
                              aria-label={`Set star level to ${level}`}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="star-reset"
                  onClick={() => setStarLevel(0)}
                  aria-label="Reset star level"
                >
                  Reset
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedHero && (
        <div className="text-sm text-gray-400 dark:text-gray-400 mt-2">
          This joiner will use their <strong>first expedition skill</strong> at its <strong>highest available level</strong>.
        </div>
      )}
    </div>
  );
}

function TroopCapacitySelector({ type, configurations, onConfigurationsChange }: {
  type: TroopType;
  configurations: TroopConfiguration[];
  onConfigurationsChange: (configs: TroopConfiguration[]) => void;
}) {
  const addConfiguration = () => {
    onConfigurationsChange([
      ...configurations,
      {
        type,
        tier: 'normal',
        fireCrystalLevel: 10,
        count: 0,
      },
    ]);
  };

  const updateConfiguration = (index: number, config: TroopConfiguration | null) => {
    const newConfigs = [...configurations];
    if (config) {
      newConfigs[index] = config;
    } else {
      newConfigs.splice(index, 1);
    }
    onConfigurationsChange(newConfigs);
  };

  const getTotalPower = () => {
    return configurations.reduce((total, config) => {
      const troopDef = getTroopDefinitionOptions(config.type, config.tier, config.fireCrystalLevel);
      if (troopDef) {
        return total + troopDef.Power * config.count;
      }
      return total;
    }, 0);
  };

  const getTotalCount = () => {
    return configurations.reduce((total, config) => total + config.count, 0);
  };

  return (
    <div className="card info-card mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Troops</h4>
        <button className="button" onClick={addConfiguration}>
          + Add Group
        </button>
      </div>

      {configurations.map((config, index) => (
        <TroopConfigEditor
          key={index}
          config={config}
          onConfigChange={(newConfig) => updateConfiguration(index, newConfig)}
          onRemove={() => updateConfiguration(index, null)}
        />
      ))}

      {configurations.length > 0 && (
        <div className="callout callout-muted text-sm mt-4 flex flex-wrap gap-2">
          <span><strong>Total {type}:</strong> {getTotalCount().toLocaleString()} troops</span>
          <span>|</span>
          <span><strong>Total Power:</strong> {getTotalPower().toLocaleString()}</span>
        </div>
      )}

      {configurations.length === 0 && (
        <div className="text-center py-4 text-gray-400 dark:text-gray-400">
          No {type} troops configured. Click &quot;+ Add Group&quot; to add.
        </div>
      )}
    </div>
  );
}

function TroopConfigEditor({ config, onConfigChange, onRemove }: {
  config: TroopConfiguration;
  onConfigChange: (config: TroopConfiguration) => void;
  onRemove: () => void;
}) {
  const troopDef = getTroopDefinitionOptions(config.type, config.tier, config.fireCrystalLevel);
  const totalPower = troopDef ? troopDef.Power * config.count : 0;

  return (
    <div className="card info-card bg-white/95 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 mb-3">
      <div className="flex justify-between items-center mb-3">
        <strong>
          {config.tier === 'helios' ? 'Helios ' : ''}{config.type} FC{config.fireCrystalLevel}
        </strong>
        <button className="button bg-red-600 hover:bg-red-700 px-3 py-1 text-sm" onClick={onRemove}>
          Remove
        </button>
      </div>

      <div className="grid">
        <div className="form-group">
          <label>Tier</label>
          <select
            value={config.tier}
            onChange={(e) => onConfigChange({ ...config, tier: e.target.value as TroopTier })}
          >
            <option value="normal">Normal</option>
            <option value="helios">Helios</option>
          </select>
        </div>
        <div className="form-group">
          <label>Fire Crystal Level</label>
          <select
            value={config.fireCrystalLevel}
            onChange={(e) => onConfigChange({ ...config, fireCrystalLevel: parseInt(e.target.value) as FireCrystalLevel })}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>FC{level}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Troop Count</label>
          <input
            type="number"
            min="0"
            value={config.count}
            onChange={(e) => onConfigChange({ ...config, count: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {troopDef && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          <div>
            Base Stats: ATK {troopDef.Attack} | DEF {troopDef.Defense} | LETH {troopDef.Lethality} | HP {troopDef.Health}
          </div>
          <div>
            <strong>Group Power:</strong> {totalPower.toLocaleString()} ({troopDef.Power} × {config.count.toLocaleString()})
          </div>
        </div>
      )}
    </div>
  );
}

function JoinerMathBreakdown({ joiners }: { joiners: RallyHero[] }) {
  const breakdown = useMemo(() => {
    const firstFourJoiners = joiners.slice(0, 4);
    const details: Array<{
      heroName: string;
      skillName: string;
      maxLevel: number;
      skillType: string | null;
      bonusValue: number;
      reason?: string;
    }> = [];

    // Group bonuses by type for stacking calculation
    const bonusesByType: Record<string, number[]> = {
      damage: [],
      attack: [],
      defense: [],
      health: [],
      lethality: [],
      damageReduction: [],
    };

    // Helper function to categorize skill type
    const categorizeSkillType = (skillData: any): string | null => {
      const keys = Object.keys(skillData).map(key => key.toLowerCase());
      const damageIncreaseKeywords = [
        'damage_dealt_increase',
        'damage_boost',
        'damage_percentage',
        'damage_increase',
        'additional_damage',
        'skill_damage_increase',
        'skill_damage_up',
        'normal_attack_damage_up',
        'target_damage_taken_increase',
        'target_damage_taken_up',
        'target_damage_taken_up_percentage',
        'all_troops_damage_up',
        'dot_percentage',
        'damage_per_turn',
        'defense_reduction'
      ];
      const damageReductionKeywords = [
        'damage_reduction',
        'damage_taken_reduction',
        'damage_taken_decrease',
        'damage_received_reduction',
        'damage_resistance',
        'damage_taken',
        'damage_received',
        'damage_from_attacks_reduction',
        'damage_from_skills_reduction',
        'enemy_damage_dealt_reduction',
        'enemy_attack_reduction',
        'lethality_reduction',
      ];

      if (keys.some(k => damageIncreaseKeywords.some(keyword => k.includes(keyword)))) {
        return 'damage';
      }
      if (keys.some(k => damageReductionKeywords.some(keyword => k.includes(keyword)))) {
        return 'damageReduction';
      }
      if (keys.some(k => k.includes('attack_increase') || k.includes('attack_bonus'))) return 'attack';
      if (keys.some(k => k.includes('defense_increase') || k.includes('defense_bonus'))) return 'defense';
      if (keys.some(k => k.includes('health_increase') || k.includes('health_bonus'))) return 'health';
      if (keys.some(k => k.includes('lethality_increase') || k.includes('lethality_bonus'))) return 'lethality';
      return null;
    };

    // Helper function to extract bonus values per type (supports mixed stats like Philly)
    const extractBonusValues = (skillData: any, maxLevel: number): Record<string, number> => {
      const result: Record<string, number> = {
        damage: 0,
        attack: 0,
        defense: 0,
        health: 0,
        lethality: 0,
        damageReduction: 0,
      };

      const addValue = (type: keyof typeof result, amount: number) => {
        result[type] += amount;
      };

      Object.keys(skillData).forEach(key => {
        if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;
        const value = skillData[key];
        const numericValue = (() => {
          if (typeof value === 'object' && value !== null) {
            const levelValue = value[maxLevel.toString()] || value['1'];
            return typeof levelValue === 'number' ? levelValue : 0;
          }
          if (typeof value === 'number') {
            return value;
          }
          return 0;
        })();
        if (numericValue === 0) return;

        const pct = numericValue * 100;
        const lower = key.toLowerCase();

        const isDamageIncrease =
          lower.includes('damage_increase') ||
          lower.includes('damage_dealt_increase') ||
          lower.includes('damage_boost') ||
          lower.includes('damage_percentage') ||
          lower.includes('additional_damage') ||
          lower.includes('skill_damage_increase') ||
          lower.includes('skill_damage_up') ||
          lower.includes('normal_attack_damage_up') ||
          lower.includes('target_damage_taken_increase') ||
          lower.includes('target_damage_taken_up') ||
          lower.includes('all_troops_damage_up') ||
          lower.includes('dot_percentage') ||
          lower.includes('damage_per_turn') ||
          lower.includes('defense_reduction');
        if (isDamageIncrease) {
          addValue('damage', pct);
        }
        if (lower.includes('attack_up')) {
          addValue('attack', pct);
        }
        if (lower.includes('defense_up')) {
          addValue('defense', pct);
        }
        if (lower.includes('health_up')) {
          addValue('health', pct);
        }
        if (lower.includes('lethality_increase')) {
          addValue('lethality', pct);
        }
        if (
          lower.includes('damage_up') ||
          lower.includes('extra_damage_up') ||
          lower.includes('normal_attack_damage_up') ||
          lower.includes('skill_damage_up') ||
          lower.includes('enemy_damage_taken_up')
        ) {
          addValue('damage', pct);
        }
        if (
          lower.includes('damage_taken_down') ||
          lower.includes('damage_reduction') ||
          lower.includes('damage_received_reduction') ||
          lower.includes('damage_resistance') ||
          lower.includes('damage_from_attacks_reduction') ||
          lower.includes('damage_from_skills_reduction') ||
          lower.includes('damage_taken_decrease') ||
          lower.includes('enemy_damage_down') ||
          lower.includes('enemy_attack_down') ||
          lower.includes('enemy_attack_reduction') ||
          lower.includes('lethality_reduction')
        ) {
          addValue('damageReduction', pct);
        }
      });

      return result;
    };

    const extractControlChance = (skillData: any, maxLevel: number): number => {
      let chance = 0;
      Object.keys(skillData).forEach(key => {
        const lower = key.toLowerCase();
        const value = skillData[key];
        const numericValue = (() => {
          if (typeof value === 'object' && value !== null) {
            const levelValue = value[maxLevel.toString()] || value['1'];
            return typeof levelValue === 'number' ? levelValue : 0;
          }
          if (typeof value === 'number') return value;
          return 0;
        })();
        if (numericValue === 0) return;
        if (lower.includes('immobilize') || lower.includes('stun')) {
          chance += numericValue * 100;
        }
      });
      return chance;
    };

    firstFourJoiners.forEach((joiner) => {
      if (!joiner.heroName) return;

      const hero = getHeroByName(joiner.heroName);
      if (!hero) return;

      const skills = getHeroExpeditionSkills(hero);
      if (skills.length === 0) return;

      const firstSkill = skills[0];
      const skillData = firstSkill.data;
      if (!skillData) return;

      // Find the maximum skill level
      let maxLevel = 1;
      Object.keys(skillData).forEach(key => {
        if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;
        const value = skillData[key];
        if (typeof value === 'object' && value !== null) {
          const levelKeys = Object.keys(value)
            .filter(k => !isNaN(parseInt(k)))
            .map(k => parseInt(k))
            .sort((a, b) => b - a);
          if (levelKeys.length > 0 && levelKeys[0] > maxLevel) {
            maxLevel = levelKeys[0];
          }
        }
      });

      // Categorize skill type (with fallback for damage reduction/increase keys)
      let skillType = categorizeSkillType(skillData);
      if (!skillType) {
        const keys = Object.keys(skillData).map((k) => k.toLowerCase());
        const hasDamageReduction = keys.some((k) =>
          k.includes('damage_reduction') ||
          k.includes('damage_taken') ||
          k.includes('damage_received') ||
          k.includes('damage_from_attacks_reduction') ||
          k.includes('damage_from_skills_reduction') ||
          k.includes('damage_resistance') ||
          k.includes('enemy_damage_dealt_reduction') ||
          k.includes('enemy_attack_reduction') ||
          k.includes('lethality_reduction')
        );
        const hasDamageIncrease = keys.some((k) =>
          k.includes('damage_dealt_increase') ||
          k.includes('damage_boost') ||
          k.includes('damage_percentage') ||
          k.includes('damage_increase') ||
          k.includes('additional_damage') ||
          k.includes('skill_damage_increase') ||
          k.includes('target_damage_taken_increase') ||
          k.includes('dot_percentage') ||
          k.includes('damage_per_turn') ||
          k.includes('defense_reduction')
        );
        if (hasDamageReduction) {
          skillType = 'damageReduction';
        } else if (hasDamageIncrease) {
          skillType = 'damage';
        }
      }

      const bonusValues = extractBonusValues(skillData, maxLevel);
      const contributionEntries = Object.entries(bonusValues).filter(([, v]) => v > 0) as Array<[keyof typeof bonusValues, number]>;
      if (contributionEntries.length === 0) {
        const controlChance = extractControlChance(skillData, maxLevel);
        if (controlChance > 0) {
          details.push({
            heroName: joiner.heroName,
            skillName: (skillData['skill-name'] as string) || firstSkill.name,
            maxLevel,
            skillType: 'Control',
            bonusValue: controlChance,
            reason: `Control: Stun/immobilize chance +${controlChance.toFixed(2)}% (informational; not included in ATK/DMG stacking).`,
          });
          return;
        }

        details.push({
          heroName: joiner.heroName,
          skillName: (skillData['skill-name'] as string) || firstSkill.name,
          maxLevel,
          skillType,
          bonusValue: 0,
          reason: 'Skill does not grant a percentage-based attack/defense/health/lethality/damage bonus.',
        });
        return;
      }

      contributionEntries.forEach(([type, value]) => {
        bonusesByType[type].push(value);
      });

      const formatTypeLabel = (type?: string | null) => {
        if (!type) return 'Unknown';
        if (type === 'damageReduction') return 'Damage Reduction';
        if (type === 'multi') return 'Multi';
        return type.charAt(0).toUpperCase() + type.slice(1);
      };

      const summary = contributionEntries
        .map(([type, value]) => `${formatTypeLabel(type)} +${value.toFixed(2)}%`)
        .join(' | ');
      const typeLabel = contributionEntries.length === 1 ? formatTypeLabel(contributionEntries[0][0]) : summary;

      details.push({
        heroName: joiner.heroName,
        skillName: (skillData['skill-name'] as string) || firstSkill.name,
        maxLevel,
        skillType: typeLabel,
        bonusValue: contributionEntries.reduce((sum, [, v]) => sum + v, 0),
        reason: summary
      });
    });

    // Calculate totals by type (same types add together)
    const totalsByType: Record<string, number> = {};
    Object.keys(bonusesByType).forEach(type => {
      if (bonusesByType[type].length > 0) {
        totalsByType[type] = bonusesByType[type].reduce((sum, val) => sum + val, 0);
      }
    });

    return { details, totalsByType, bonusesByType };
  }, [joiners]);

  const formatSkillTypeLabel = (type?: string | null) => {
    if (!type) return 'Unknown';
    if (type === 'damageReduction') return 'Damage Reduction';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (breakdown.details.length === 0) {
    return null;
  }

  return (
    <div className="card info-card mt-6">
      <h4>Joiner Bonus Calculations</h4>
      <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
        Showing calculations for the first {breakdown.details.length} joiner(s). Each uses their first expedition skill at maximum level.
      </p>

      <div className="callout callout-success text-sm space-y-2">
        <strong>Stacking Rules:</strong>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Same Skill Type → Additive:</strong> If two joiners have the same type (e.g., both +DMG), their bonuses add together (10% + 25% = 35%)</li>
          <li><strong>Different Skill Types → Multiplicative:</strong> If joiners have different types (e.g., +DMG and +ATK), they multiply (Base × 1.25 × 1.10)</li>
        </ul>
      </div>

      {breakdown.details.map((detail, index) => (
        <div key={index} className="card info-card bg-slate-900/40 dark:bg-slate-900/40 border border-white/10 mb-4">
          <div className="font-bold mb-2">
            Joiner {index + 1}: {detail.heroName}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-400 mb-2">
            Skill: <strong>{detail.skillName}</strong> (Level {detail.maxLevel})
          </div>
          {detail.bonusValue > 0 ? (
            <div className="text-sm">
              <div className="ml-4">
                Type: <strong>{formatSkillTypeLabel(detail.skillType)}</strong> | Bonus: <strong>+{detail.bonusValue.toFixed(2)}%</strong>
              </div>
            </div>
          ) : (
            <div className="text-sm text-amber-200 dark:text-amber-200 ml-4">
              {detail.reason || 'This skill does not provide a measurable combat bonus for rallies.'}
            </div>
          )}
        </div>
      ))}

      <div className="card info-card border-2 border-blue-500/40 mt-6 space-y-3">
        <div className="font-bold">Stacking Calculation:</div>
        <div className="text-sm space-y-2">
          {Object.entries(breakdown.totalsByType).map(([type, total]) => {
            const bonuses = breakdown.bonusesByType[type] || [];
            const typeLabel = type === 'damageReduction'
              ? 'Damage Reduction'
              : type.charAt(0).toUpperCase() + type.slice(1);

            if (bonuses.length === 1) {
              return (
                <div key={type} className="ml-4 mb-1">
                  <strong>{typeLabel}:</strong> +{Number(total).toFixed(2)}% (single joiner)
                </div>
              );
            } else {
              return (
                <div key={type} className="ml-4 mb-1">
                  <strong>{typeLabel}:</strong> {bonuses.map((b, i) => `${Number(b).toFixed(2)}%`).join(' + ')} = <strong>+{Number(total).toFixed(2)}%</strong> (additive stacking)
                </div>
              );
            }
          })}
        </div>
        {Object.keys(breakdown.totalsByType).length > 1 && (
          <div className="callout callout-info text-sm space-y-2">
            <strong>Different Types Multiply:</strong> Since you have {Object.keys(breakdown.totalsByType).length} different skill types, they will multiply together in the final calculation.
            <div className="font-mono text-xs space-y-2">
              <div>Final = Base × {Object.entries(breakdown.totalsByType).map(([type, total]) =>
                `(1 + ${Number(total).toFixed(2)}%)`
              ).join(' × ')}</div>
              <div>
                Final = 1 × {Object.entries(breakdown.totalsByType).map(([type, total]) => {
                  const multiplier = 1 + (Number(total) / 100);
                  return `${multiplier.toFixed(4)}`;
                }).join(' × ')}
              </div>
              <div className="font-bold text-blue-200">
                Final = {(() => {
                  const base = 1;
                  const final = Object.values(breakdown.totalsByType).reduce((acc, total) => {
                    return acc * (1 + Number(total) / 100);
                  }, base);
                  return `${final.toFixed(4)} (${(final * 100).toFixed(2)}%)`;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMultiplier(multiplier: number) {
  const percent = (multiplier - 1) * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}% (${multiplier.toFixed(3)}×)`;
}

function formatStat(value: number) {
  return `${value.toFixed(2)}%`;
}

function SideSummaryCard({
  title,
  role,
  summary,
}: {
  title: string;
  role: 'attacker' | 'defender';
  summary: SideCombatSummary | null;
}) {
  return (
    <div className="card info-card">
      <div className="flex justify-between items-center mb-4">
        <h4 className="m-0">{title}</h4>
        <span className="badge">{role === 'attacker' ? 'Attacker' : 'Defender'}</span>
      </div>
      {!summary && (
        <p className="text-sm text-gray-400 dark:text-gray-400">
          No combat data available yet.
        </p>
      )}
      {summary && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Troop</th>
                  <th>Attack</th>
                  <th>Defense</th>
                  <th>Health</th>
                  <th>Lethality</th>
                </tr>
              </thead>
              <tbody>
                {(['infantry', 'lancer', 'marksman'] as TroopType[]).map((troop) => (
                  <tr key={troop}>
                    <td className="font-semibold capitalize">{troop}</td>
                    <td>{formatStat(summary.troopStats[troop].attack)}</td>
                    <td>{formatStat(summary.troopStats[troop].defense)}</td>
                    <td>{formatStat(summary.troopStats[troop].health)}</td>
                    <td>{formatStat(summary.troopStats[troop].lethality)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div><strong>Damage Dealt:</strong> {formatMultiplier(summary.damageDealtMultiplier)}</div>
            <div><strong>Damage Taken:</strong> {formatMultiplier(summary.damageTakenMultiplier)}</div>
            {summary.controlSummary.immobilizeChance !== undefined && (
              <div><strong>Control:</strong> {summary.controlSummary.immobilizeChance.toFixed(2)}%</div>
            )}
            {summary.controlSummary.otherControlNotes && (
              <div className="text-xs text-gray-400 dark:text-gray-400">{summary.controlSummary.otherControlNotes}</div>
            )}
            {summary.dotSummary?.hasDot && (
              <div><strong>Damage Over Time:</strong> {summary.dotSummary.approxMagnitude?.toFixed(2) ?? '—'}%</div>
            )}
          </div>
          {summary.debugEffects.length > 0 && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-blue-400">View applied effects ({summary.debugEffects.length})</summary>
              <ul className="mt-2 space-y-1">
                {summary.debugEffects.map((effect, idx) => (
                  <li key={`${effect.sourceName}-${idx}`}>
                    {effect.sourceName}: {effect.target} {effect.stat} {effect.isMultiplicative ? '×' : '+'}{(effect.value * 100).toFixed(2)}%
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function TroopMixEditor({
  title,
  mix,
  onMixChange,
}: {
  title: string;
  mix: TroopMixConfig;
  onMixChange: (mix: TroopMixConfig) => void;
}) {
  const safeMix = { ...DEFAULT_TROOP_MIX, ...mix };
  const ratioSum = safeMix.infantryRatio + safeMix.lancerRatio + safeMix.marksmanRatio;

  const handleChange = (field: keyof TroopMixConfig, value: number) => {
    const sanitized = Math.max(0, isNaN(value) ? 0 : value);
    onMixChange({
      ...safeMix,
      [field]: sanitized,
    });
  };

  return (
    <div className="card info-card">
      <h4>{title}</h4>
      <div className="grid gap-4">
        <div className="form-group">
          <label>Total Troops</label>
          <input
            type="number"
            min="0"
            value={safeMix.totalTroops}
            onChange={(e) => handleChange('totalTroops', parseInt(e.target.value, 10) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Infantry %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={safeMix.infantryRatio}
            onChange={(e) => handleChange('infantryRatio', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Lancer %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={safeMix.lancerRatio}
            onChange={(e) => handleChange('lancerRatio', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Marksman %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={safeMix.marksmanRatio}
            onChange={(e) => handleChange('marksmanRatio', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      {Math.abs(ratioSum - 100) > 0.5 && (
        <p className="text-xs text-amber-400 mt-2">
          Ratios currently total {ratioSum.toFixed(2)}%. Adjust so they reach 100% for accurate weighting.
        </p>
      )}
    </div>
  );
}

