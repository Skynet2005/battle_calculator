'use client';

import { useMemo, useState } from 'react';
import type {
  Hero, HeroGearSelections, SkillLevel,
  SkillLevelsByName
} from '../../lib/battle';
import { getAllHeroes, getHeroExpeditionSkills, getHeroGearPower } from '../../lib/battle';
import type { BasicBonuses } from '../../lib/battle/calculations';
import { createDefaultHeroGearSelections } from '../../lib/profile-storage';
import type { HeroLevel } from '../types';
import HeroGearSelector from './HeroGearSelector';

interface HeroSelectorProps {
  heroLevels: Record<string, HeroLevel>;
  onHeroLevelsChange: (heroLevels: Record<string, HeroLevel>) => void;
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  heroGearSelections?: HeroGearSelections;
  onHeroGearSelectionsChange?: (selections: HeroGearSelections) => void;
  isOpponent?: boolean; // If true, use max defaults for dropdowns
}

const defaultHeroGearSelections = createDefaultHeroGearSelections();

export default function HeroSelector({
  heroLevels,
  onHeroLevelsChange,
  basicBonuses,
  onBasicBonusesChange,
  heroGearSelections,
  onHeroGearSelectionsChange,
  isOpponent = false,
}: HeroSelectorProps) {
  const [activeSection, setActiveSection] = useState<'heroes' | 'heroGear'>('heroes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const allHeroes = useMemo(() => getAllHeroes(), []);

  // Filter heroes
  const filteredHeroes = useMemo(() => {
    return allHeroes.filter(hero => {
      const matchesSearch = hero['hero-name'].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = filterClass === 'all' || hero['hero-class'] === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [allHeroes, searchTerm, filterClass]);

  // Get unique classes
  const heroClasses = useMemo(() => {
    const classes = new Set(allHeroes.map(h => h['hero-class']));
    return Array.from(classes).sort();
  }, [allHeroes]);

  const STAR_COUNT = 5;
  const SEGMENTS_PER_STAR = 6;
  const MAX_STAR_LEVEL = STAR_COUNT * SEGMENTS_PER_STAR;

  const getHeroLevelData = (heroName: string): HeroLevel => {
    const existing = heroLevels[heroName];
    if (isOpponent && !existing) {
      // For opponent, use max defaults
      const heroes = getAllHeroes();
      const hero = heroes.find(h => h['hero-name'] === heroName);
      const skills = hero ? getHeroExpeditionSkills(hero) : [];
      const skillLevels: SkillLevelsByName = {};
      skills.forEach(skill => {
        skillLevels[skill.name] = 5;
      });
      return {
        starLevel: 30, // Max star level
        xpLevel: 80, // Max XP level
        skillLevels,
        exclusiveWeaponLevel: hero?.['exclusive-weapon'] ? 10 : undefined,
      };
    }
    const starLevel = existing?.starLevel ?? 0;
    const isOwned = starLevel > 0;
    return {
      starLevel,
      xpLevel: existing?.xpLevel ?? (isOwned ? 80 : 0),
      skillLevels: existing?.skillLevels ? { ...existing.skillLevels } : {},
      exclusiveWeaponLevel: existing?.exclusiveWeaponLevel ?? 10,
    };
  };

  const updateHeroLevelRecord = (
    heroName: string,
    updater: (current: HeroLevel) => HeroLevel
  ) => {
    const current = getHeroLevelData(heroName);
    onHeroLevelsChange({
      ...heroLevels,
      [heroName]: updater(current),
    });
  };

  // Calculate skill level based on star level
  // 0-5 segments (0 complete stars) → level 1
  // 6-11 segments (1 complete star) → level 2
  // 12-17 segments (2 complete stars) → level 3
  // 18-23 segments (3 complete stars) → level 4
  // 24+ segments (4+ complete stars) → level 5
  const getSkillLevelFromStarLevel = (starLevel: number): SkillLevel => {
    const completeStars = Math.floor(starLevel / SEGMENTS_PER_STAR);
    return Math.min(5, Math.max(1, completeStars + 1)) as SkillLevel;
  };

  const updateHeroLevel = (
    heroName: string,
    field: 'starLevel' | 'xpLevel',
    value: number
  ) => {
    const current = getHeroLevelData(heroName);
    const isOwned = current.starLevel > 0;
    const sanitizedValue =
      field === 'starLevel'
        ? Math.max(0, Math.min(MAX_STAR_LEVEL, value))
        : field === 'xpLevel'
          ? Math.max(0, Math.min(80, value || (isOwned ? 80 : 0)))
          : value;

    updateHeroLevelRecord(heroName, current => {
      const updated: HeroLevel = {
        ...current,
        [field]: sanitizedValue,
      };

      // If star level changed, automatically update all skill levels
      if (field === 'starLevel') {
        const newSkillLevel = getSkillLevelFromStarLevel(sanitizedValue);
        const hero = allHeroes.find(h => h['hero-name'] === heroName);
        if (hero) {
          const skills = getHeroExpeditionSkills(hero);
          const updatedSkillLevels: SkillLevelsByName = { ...current.skillLevels };
          skills.forEach(skill => {
            updatedSkillLevels[skill.name] = newSkillLevel;
          });
          updated.skillLevels = updatedSkillLevels;
        }
      }

      return updated;
    });
  };

  const updateHeroSkillLevel = (
    heroName: string,
    skillName: string,
    value: number
  ) => {
    const sanitizedValue = Math.max(1, Math.min(5, value || 1)) as SkillLevel;
    updateHeroLevelRecord(heroName, current => ({
      ...current,
      skillLevels: {
        ...current.skillLevels,
        [skillName]: sanitizedValue,
      },
    }));
  };

  const updateHeroExclusiveWeaponLevel = (
    heroName: string,
    value: number,
    maxLevel: number
  ) => {
    const sanitizedValue = Math.max(0, Math.min(maxLevel, value || 10));
    updateHeroLevelRecord(heroName, current => ({
      ...current,
      exclusiveWeaponLevel: sanitizedValue,
    }));
  };

  // Calculate power components for a hero
  const calculateHeroPowerComponents = (hero: Hero, heroLevel: HeroLevel): {
    heroPower: number;
    weaponPower: number;
    gearPower: number;
    totalPower: number;
  } => {
    const starLevel = heroLevel.starLevel;
    const xpLevel = heroLevel.xpLevel;
    const skillLevels = heroLevel.skillLevels;
    const exclusiveWeaponLevel = heroLevel.exclusiveWeaponLevel ?? 10;

    // Star power: divided equally across 30 levels (0-30)
    const starPower = (starLevel / 30) * hero['max-star-power'];

    // Skill power: divided equally across 5 levels (1-5) for each skill
    const skills = getHeroExpeditionSkills(hero);
    const skillPowerPerSkill = hero['max-skill-power'] / Math.max(1, skills.length);
    let totalSkillPower = 0;
    skills.forEach(skill => {
      const skillLevel = skillLevels[skill.name] ?? 5;
      totalSkillPower += (skillLevel / 5) * skillPowerPerSkill;
    });

    // Level power: divided equally across 80 levels (1-80)
    // Cap XP level at 80 for power calculation
    const effectiveLevel = Math.min(xpLevel, 80);
    const levelPower = (effectiveLevel / 80) * hero['max-level-power'];

    // Hero power (star + skill + level)
    const heroPower = starPower + totalSkillPower + levelPower;

    // Exclusive weapon power: get power from the current weapon level
    let weaponPower = 0;
    if (hero['exclusive-weapon'] && exclusiveWeaponLevel > 0) {
      const weaponLevelData = hero['exclusive-weapon'].levels.find(
        l => l.level === exclusiveWeaponLevel
      );
      if (weaponLevelData) {
        weaponPower = weaponLevelData.power || 0;
      }
    }

    // Hero gear power: get power for the hero's troop type
    let gearPower = 0;
    const safeGearSelections = heroGearSelections || defaultHeroGearSelections;
    const gearPowerData = getHeroGearPower(safeGearSelections);
    const heroClass = hero['hero-class'].toLowerCase();
    if (heroClass === 'infantry') {
      gearPower = gearPowerData.infantry.total;
    } else if (heroClass === 'lancer') {
      gearPower = gearPowerData.lancer.total;
    } else if (heroClass === 'marksman') {
      gearPower = gearPowerData.marksman.total;
    }

    const totalPower = heroPower + weaponPower + gearPower;

    return { heroPower, weaponPower, gearPower, totalPower };
  };

  // Sort heroes by generation (newest to oldest), then by name
  const sortedHeroes = useMemo(() => {
    return [...filteredHeroes].sort((a, b) => {
      // First sort by generation (descending - newest first)
      if (b.generation !== a.generation) {
        return b.generation - a.generation;
      }
      // Then sort by name alphabetically
      return a['hero-name'].localeCompare(b['hero-name']);
    });
  }, [filteredHeroes]);

  // Group heroes by generation for display
  const heroesByGeneration = useMemo(() => {
    const grouped: Record<number, Hero[]> = {};
    sortedHeroes.forEach(hero => {
      const gen = hero.generation;
      if (!grouped[gen]) {
        grouped[gen] = [];
      }
      grouped[gen].push(hero);
    });
    return grouped;
  }, [sortedHeroes]);

  return (
    <div>
      <div className="tabs mb-4">
        <button
          className={`tab ${activeSection === 'heroes' ? 'active' : ''}`}
          onClick={() => setActiveSection('heroes')}
        >
          Heroes
        </button>
        <button
          className={`tab ${activeSection === 'heroGear' ? 'active' : ''}`}
          onClick={() => setActiveSection('heroGear')}
        >
          Hero Gear
        </button>
      </div>

      {activeSection === 'heroes' && (
        <div>
          <h3>Hero Levels</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
            Set the star level and XP level for each hero. These values are used for hero-related calculations.
          </p>

          {/* Search and Filter */}
          <div className="grid mb-4">
            <div className="form-group">
              <label>Search Heroes</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Filter by Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {heroClasses.map(heroClass => (
                  <option key={heroClass} value={heroClass}>
                    {heroClass.charAt(0).toUpperCase() + heroClass.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Heroes List - Sorted by Generation (Newest to Oldest) */}
          {Object.entries(heroesByGeneration)
            .sort(([genA], [genB]) => Number(genB) - Number(genA)) // Sort generations descending
            .map(([generation, heroes]) => (
              <div key={generation} className="mb-8">
                <h4 className="mb-4 text-lg font-semibold">
                  Generation {generation} ({heroes.length} {heroes.length === 1 ? 'Hero' : 'Heroes'})
                </h4>
                <div className="flex flex-col gap-3 mb-6">
                  {heroes.map(hero => {
                    const heroLevel = getHeroLevelData(hero['hero-name']);
                    const skills = getHeroExpeditionSkills(hero);
                    const exclusiveWeapon = hero['exclusive-weapon'];
                    const maxWeaponLevel = exclusiveWeapon?.levels?.length || 0;
                    const isOwned = heroLevel.starLevel > 0;
                    return (
                      <div
                        key={hero['hero-name']}
                        className={`card bg-slate-700/50 dark:bg-slate-700/50 p-4 flex flex-row items-start gap-6 w-full ${!isOwned ? 'opacity-50' : ''
                          }`}
                      >
                        <div className="min-w-[150px] shrink-0">
                          <div className="font-bold mb-1 text-base">
                            {hero['hero-name']}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-400 capitalize mb-2">
                            {hero['hero-class']}
                          </div>
                          {(() => {
                            const powerComponents = calculateHeroPowerComponents(hero, heroLevel);
                            return (
                              <div className="text-xs text-gray-300 dark:text-gray-300 flex flex-col gap-1">
                                <div>
                                  Hero Power: {Math.round(powerComponents.heroPower).toLocaleString()}
                                </div>
                                <div>
                                  Weapon Power: {Math.round(powerComponents.weaponPower).toLocaleString()}
                                </div>
                                <div>
                                  Gear Power: {Math.round(powerComponents.gearPower).toLocaleString()}
                                </div>
                                <div className="mt-1 pt-1 border-t border-white/10 font-semibold text-sm text-white">
                                  Total Power: {Math.round(powerComponents.totalPower).toLocaleString()}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex flex-col gap-4 flex-1">
                          {/* Star Level and XP Level - Side by Side */}
                          <div className="flex gap-5 items-start flex-wrap">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-300 dark:text-gray-300">Star Level</span>
                              <div className="star-level-input">
                                {Array.from({ length: STAR_COUNT }, (_, starIdx) => {
                                  const starBase = starIdx * SEGMENTS_PER_STAR;
                                  return (
                                    <div key={`star-${starIdx}`} className="hex-star" role="group" aria-label={`Star ${starIdx + 1}`}>
                                      <svg viewBox="0 0 120 120" aria-hidden="true">
                                        {Array.from({ length: SEGMENTS_PER_STAR }, (_, segmentIdx) => {
                                          const level = starBase + segmentIdx + 1;
                                          const isActive = heroLevel.starLevel >= level;
                                          return (
                                            <path
                                              key={level}
                                              d="M60 8 L72 32 L60 56 L48 32 Z"
                                              transform={`rotate(${-segmentIdx * 60} 60 60)`}
                                              className={`hex-segment ${isActive ? 'active' : ''}`}
                                              onClick={() => updateHeroLevel(hero['hero-name'], 'starLevel', level)}
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
                                  onClick={() => updateHeroLevel(hero['hero-name'], 'starLevel', 0)}
                                  aria-label="Reset star level"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                            <div className="form-group flex-1 min-w-[150px]">
                              <label className="text-sm text-gray-300 dark:text-gray-300 mb-1 block">XP Level</label>
                              <input
                                type="number"
                                min="0"
                                max="80"
                                value={heroLevel.xpLevel}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateHeroLevel(hero['hero-name'], 'xpLevel', 0);
                                  } else {
                                    const numValue = parseInt(value, 10);
                                    if (!isNaN(numValue)) {
                                      updateHeroLevel(hero['hero-name'], 'xpLevel', numValue);
                                    }
                                  }
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Skills - Below Star/XP */}
                          {skills.length > 0 && (
                            <div className="hero-skill-list">
                              {skills.map(skill => {
                                const currentSkillLevel = heroLevel.skillLevels[skill.name] ?? 5;
                                return (
                                  <div key={skill.name} className="hero-skill-row">
                                    <div>
                                      <div className="hero-skill-name">{skill.name}</div>
                                      {skill.description && (
                                        <div className="hero-skill-description">{skill.description}</div>
                                      )}
                                    </div>
                                    <div className="form-group mb-0">
                                      <label className="text-xs text-gray-400 dark:text-gray-400 mb-1 block">
                                        Level
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={currentSkillLevel}
                                        onChange={(e) =>
                                          updateHeroSkillLevel(
                                            hero['hero-name'],
                                            skill.name,
                                            parseInt(e.target.value) || currentSkillLevel
                                          )
                                        }
                                        className="w-20"
                                        disabled={!isOwned}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Exclusive Weapon - Below Skills */}
                          {exclusiveWeapon && (() => {
                            const currentWeaponLevel = heroLevel.exclusiveWeaponLevel ?? 0;
                            const weaponLevelData = exclusiveWeapon.levels.find(l => l.level === currentWeaponLevel);
                            const expeditionSkill = weaponLevelData?.skills?.expedition;
                            const weaponDescription = expeditionSkill?.description ||
                              (currentWeaponLevel === 0 ? 'No weapon equipped' : 'No skill at this level');
                            const weaponPower = weaponLevelData?.power || 0;

                            return (
                              <div className="hero-weapon-row">
                                <div>
                                  <div className="hero-skill-name">{exclusiveWeapon.name} (Level {currentWeaponLevel || 0})</div>
                                  {weaponDescription && (
                                    <div className="hero-skill-description">{weaponDescription}</div>
                                  )}
                                  {currentWeaponLevel > 0 && weaponPower > 0 && (
                                    <div className="hero-skill-description text-xs font-bold text-white mt-1">
                                      Power: {weaponPower.toLocaleString()}
                                    </div>
                                  )}
                                  {currentWeaponLevel > 0 && (
                                    <div className="hero-skill-description text-[0.7rem] mt-1">
                                      Max Level: {maxWeaponLevel}
                                    </div>
                                  )}
                                </div>
                                <div className="form-group mb-0">
                                  <label className="text-xs text-gray-400 dark:text-gray-400 mb-1 block">
                                    Level
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxWeaponLevel}
                                    value={currentWeaponLevel}
                                    onChange={(e) =>
                                      updateHeroExclusiveWeaponLevel(
                                        hero['hero-name'],
                                        parseInt(e.target.value) || 10,
                                        maxWeaponLevel
                                      )
                                    }
                                    className="w-20"
                                    disabled={!isOwned}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {sortedHeroes.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-400">
              No heroes found matching your search criteria.
            </div>
          )}
        </div>
      )}

      {activeSection === 'heroGear' && (
        <HeroGearSelector
          basicBonuses={basicBonuses}
          onBasicBonusesChange={onBasicBonusesChange}
          heroGearSelections={heroGearSelections || defaultHeroGearSelections}
          onHeroGearSelectionsChange={onHeroGearSelectionsChange}
        />
      )}
    </div>
  );
}

