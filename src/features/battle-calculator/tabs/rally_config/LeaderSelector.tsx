'use client';

import { getHeroExpeditionSkills, getHeroSkillLevelOptions, getHeroesByClassForSelect } from '@/domain/battle/data-selectors';
import type { Hero, SkillLevel, SkillLevelsByName } from '@/domain/battle/data/heroes/hero_types';
import type { RallyConfiguration, RallyHero, TroopType } from '@/shared/types';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface LeaderSelectorProps {
  type: TroopType;
  hero: RallyHero | null;
  availableHeroes: Hero[];
  onHeroChange: (hero: RallyHero | null) => void;
  heroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  isUsingPlayerHeroes?: boolean;
}

export function LeaderSelector({
  type,
  hero,
  availableHeroes,
  onHeroChange,
  heroLevels,
  isUsingPlayerHeroes = true,
}: LeaderSelectorProps) {
  const [selectedHeroName, setSelectedHeroName] = useState(hero?.heroName || '');
  const [starLevel, setStarLevel] = useState(hero?.starLevel || 0);
  const [generation, setGeneration] = useState(hero?.generation || 1);
  const [exclusiveWeaponLevel, setExclusiveWeaponLevel] = useState(hero?.exclusiveWeaponLevel);
  const [xpLevel, setXpLevel] = useState<number | undefined>(hero?.xpLevel);
  const [skillLevels, setSkillLevels] = useState<SkillLevelsByName>(hero?.skillLevels || {});
  const heroesByGeneration = useMemo(
    () =>
      (Array.from(
        availableHeroes.reduce((acc, h) => {
          const gen = h.generation;
          if (!acc.has(gen)) acc.set(gen, []);
          acc.get(gen)!.push(h);
          return acc;
        }, new Map<number, Hero[]>())
      ) as [number, Hero[]][])
        .sort((a, b) => a[0] - b[0])
        .map(([gen, heroes]) => ({
          gen,
          heroes: heroes.sort((a, b) => a['hero-name'].localeCompare(b['hero-name']))
        })),
    [availableHeroes]
  );

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
    const heroLevelsChanged = prevHeroLevelsRef.current !== heroLevels;
    const heroNameChanged = prevSelectedHeroNameRef.current !== selectedHeroName;

    if (!heroLevelsChanged && !heroNameChanged) {
      return;
    }

    prevHeroLevelsRef.current = heroLevels;
    prevSelectedHeroNameRef.current = selectedHeroName;

    if (selectedHeroName) {
      const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
      if (selectedHero) {
        const skills = getHeroExpeditionSkills(selectedHero);
        const newSkillLevels: SkillLevelsByName = {};

        const heroLevel = heroLevels?.[selectedHeroName];

        skills.forEach(skill => {
          if (heroLevel?.skillLevels && heroLevel.skillLevels[skill.name] !== undefined) {
            const configuredLevel = heroLevel.skillLevels[skill.name];
            if (configuredLevel > 0) {
              newSkillLevels[skill.name] = configuredLevel;
              return;
            }
          }

          if (skillLevels[skill.name] && skillLevels[skill.name] > 0) {
            newSkillLevels[skill.name] = skillLevels[skill.name];
            return;
          }

          const maxLevelOptions = getHeroSkillLevelOptions(skill.data, false);
          const maxLevel = maxLevelOptions.length > 0 ? maxLevelOptions[maxLevelOptions.length - 1] : 1;
          newSkillLevels[skill.name] = maxLevel as SkillLevel;
        });

        const skillLevelsChanged = JSON.stringify(newSkillLevels) !== JSON.stringify(skillLevels);
        if (skillLevelsChanged) {
          setSkillLevels(newSkillLevels);
        }

        if (heroLevel) {
          if (heroLevel.starLevel !== undefined && heroLevel.starLevel !== starLevel) {
            setStarLevel(heroLevel.starLevel);
          }
          if (heroLevel.exclusiveWeaponLevel !== undefined && heroLevel.exclusiveWeaponLevel !== exclusiveWeaponLevel) {
            setExclusiveWeaponLevel(heroLevel.exclusiveWeaponLevel);
          }
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
          xpLevel,
        };

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
          title="Hero"
          value={selectedHeroName}
          onChange={(e) => setSelectedHeroName(e.target.value)}
        >
          <option value="">Select {type} hero...</option>
          {heroesByGeneration.map(group => (
            <optgroup key={`leader-gen-${group.gen}`} label={`Generation ${group.gen}`}>
              {group.heroes.map(h => (
                <option key={h['hero-name']} value={h['hero-name']}>
                  {h['hero-name']} (Gen {h.generation})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {selectedHero && (
        <>
          <div className="space-y-4">
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

            <div className="grid gap-4 md:grid-cols-3 items-end">
              <div className="form-group">
                <label>Generation</label>
                <input title="Generation" type="text" value={selectedHero.generation} disabled />
              </div>
              <div className="form-group">
                <label>XP Level</label>
                <input
                  title="XP Level"
                  type="number"
                  min="0"
                  max="80"
                  value={xpLevel !== undefined ? xpLevel : (heroLevel?.xpLevel ?? '')}
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
              {selectedHero['exclusive-weapon'] ? (
                <div className="form-group">
                  <label>Exclusive Weapon Level</label>
                  <input
                    title="Exclusive Weapon Level"
                    type="number"
                    min="0"
                    max={selectedHero['exclusive-weapon'].levels.length}
                    value={exclusiveWeaponLevel || 0}
                    onChange={(e) => setExclusiveWeaponLevel(parseInt(e.target.value) || undefined)}
                  />
                </div>
              ) : (
                <div className="form-group invisible" aria-hidden="true">
                  <label>Exclusive Weapon Level</label>
                  <input type="number" />
                </div>
              )}
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <h5 className="text-base font-semibold mt-4">Expedition Skills</h5>
              <p className="text-sm text-gray-400 dark:text-gray-400 mb-2">
                <strong>All Rally Captain skills are active</strong> in rally battles. Configure skill levels below.
              </p>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3">
                {skills.map(skill => (
                  <div key={skill.name} className="form-group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm">{skill.name}</span>
                      {isUsingHeroLevels && heroLevel?.skillLevels?.[skill.name] && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-400">
                          (from {isUsingPlayerHeroes ? 'Player' : 'Opponent'})
                        </span>
                      )}
                    </div>
                    <select
                      title="Skill Level"
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Auto-selects the first hero of each type from heroLevels and populates their stats.
 * Only updates heroes that don't already have a selection.
 */
export function syncLeadersFromHeroLevels(
  heroLevels: Record<string, import('@/shared/types').HeroLevel> | undefined,
  heroesByClass: Record<TroopType, Hero[]>,
  onRallyChangeAction: (rally: RallyConfiguration) => void,
  currentRally: RallyConfiguration,
  isPlayer: boolean = true
) {
  if (!heroLevels) return;

  const existingLeaders = isPlayer
    ? (currentRally.playerLeader || currentRally.leader)
    : (currentRally.opponentLeader || currentRally.leader);

  const newLeaders: RallyConfiguration['leader'] = { ...existingLeaders };

  (['infantry', 'lancer', 'marksman'] as TroopType[]).forEach(type => {
    if (existingLeaders[type]) {
      return;
    }

    const availableHeroes = heroesByClass[type];
    const heroesInLevels = availableHeroes.filter(hero => heroLevels[hero['hero-name']]);

    if (heroesInLevels.length > 0) {
      const hero = heroesInLevels[0];
      const heroLevel = heroLevels[hero['hero-name']];
      const skills = getHeroExpeditionSkills(hero);
      const skillLevels: SkillLevelsByName = {};

      skills.forEach(skill => {
        const skillName = skill.name;
        const configuredLevel = heroLevel.skillLevels?.[skillName];
        if (configuredLevel) {
          skillLevels[skillName] = configuredLevel;
        } else {
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
        xpLevel: heroLevel.xpLevel,
      };
    }
  });

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
