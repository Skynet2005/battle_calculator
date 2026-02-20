'use client';

import { getHeroExpeditionSkills, getHeroSkillLevelOptions } from '@/domain/battle/data-selectors';
import type { Hero, SkillLevel, SkillLevelsByName } from '@/domain/battle/data/heroes/hero_types';
import type { RallyHero, TroopType } from '@/shared/types';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface JoinerSelectorProps {
  joiner: RallyHero;
  availableHeroes: Hero[];
  onJoinerChange: (hero: RallyHero) => void;
  onRemove: () => void;
  heroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  isUsingPlayerHeroes?: boolean;
}

export function JoinerSelector({
  joiner,
  availableHeroes,
  onJoinerChange,
  onRemove,
  heroLevels,
  isUsingPlayerHeroes = true,
}: JoinerSelectorProps) {
  const [selectedHeroName, setSelectedHeroName] = useState(joiner.heroName || '');
  const [starLevel, setStarLevel] = useState(joiner.starLevel || 0);
  const [xpLevel, setXpLevel] = useState<number | undefined>(joiner.xpLevel);
  const [skillLevels, setSkillLevels] = useState<SkillLevelsByName>(joiner.skillLevels || {});
  const [hasManualSkillSelection, setHasManualSkillSelection] = useState(false);
  const heroesByGeneration = useMemo(
    () =>
      (Array.from(
        availableHeroes.reduce((acc, hero) => {
          const gen = hero.generation;
          if (!acc.has(gen)) acc.set(gen, []);
          acc.get(gen)!.push(hero);
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

  const STAR_COUNT = 5;
  const SEGMENTS_PER_STAR = 6;
  const MAX_STAR_LEVEL = STAR_COUNT * SEGMENTS_PER_STAR;

  const prevHeroLevelsRef = useRef(heroLevels);
  const prevSelectedHeroNameRef = useRef(selectedHeroName);
  const prevJoinerRef = useRef<RallyHero>(joiner);
  const prevJoinerPropRef = useRef(joiner);

  // Sync selectedHeroName, starLevel, and xpLevel when joiner prop changes from outside
  useEffect(() => {
    const prevJoiner = prevJoinerPropRef.current;

    const joinerChanged =
      prevJoiner.heroName !== joiner.heroName ||
      prevJoiner.starLevel !== joiner.starLevel ||
      prevJoiner.xpLevel !== joiner.xpLevel ||
      prevJoiner.generation !== joiner.generation ||
      JSON.stringify(prevJoiner.skillLevels) !== JSON.stringify(joiner.skillLevels);

    if (!joinerChanged) {
      return;
    }

    prevJoinerPropRef.current = joiner;

    if (joiner.heroName !== selectedHeroName) {
      setSelectedHeroName(joiner.heroName || '');
      if (joiner.heroName) {
        setStarLevel(joiner.starLevel || 0);
        setXpLevel(joiner.xpLevel);
      } else {
        setStarLevel(0);
        setXpLevel(undefined);
      }
    } else if (joiner.heroName === selectedHeroName && selectedHeroName) {
      if (joiner.starLevel !== undefined && joiner.starLevel !== starLevel && joiner.starLevel > 0) {
        setStarLevel(joiner.starLevel);
      }
      if (joiner.xpLevel !== undefined && joiner.xpLevel !== xpLevel) {
        setXpLevel(joiner.xpLevel);
      }
    }
  }, [joiner]);

  // Sync star level and XP level from heroLevels when hero is selected or heroLevels change
  useEffect(() => {
    const heroLevelsChanged = prevHeroLevelsRef.current !== heroLevels;
    const heroNameChanged = prevSelectedHeroNameRef.current !== selectedHeroName;

    if (!heroLevelsChanged && !heroNameChanged) {
      return;
    }

    prevHeroLevelsRef.current = heroLevels;
    prevSelectedHeroNameRef.current = selectedHeroName;

    if (selectedHeroName && heroLevels?.[selectedHeroName]) {
      const heroLevel = heroLevels[selectedHeroName];

      if (heroLevel.starLevel !== undefined && starLevel === 0) {
        setStarLevel(heroLevel.starLevel);
      }

      if (heroLevel.xpLevel !== undefined && xpLevel === undefined) {
        setXpLevel(heroLevel.xpLevel);
      }
    } else if (!selectedHeroName) {
      if (starLevel !== 0) setStarLevel(0);
      if (xpLevel !== undefined) setXpLevel(undefined);
    }
  }, [selectedHeroName, heroLevels, starLevel, xpLevel]);

  // Sync skill levels from heroLevels when available
  useEffect(() => {
    if (hasManualSkillSelection) return;
    if (selectedHeroName) {
      const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
      const skills = selectedHero ? getHeroExpeditionSkills(selectedHero) : [];
      if (skills.length === 0) return;
      const merged: SkillLevelsByName = { ...skillLevels };
      skills.forEach((skill) => {
        const fromHeroLevels = heroLevels?.[selectedHeroName]?.skillLevels?.[skill.name];
        const opts = getHeroSkillLevelOptions(skill.data, false);
        const maxLevel = opts.length > 0 ? (opts[opts.length - 1] as SkillLevel) : 1;
        if (fromHeroLevels !== undefined) {
          merged[skill.name] = fromHeroLevels as SkillLevel;
        } else if (merged[skill.name] === undefined) {
          merged[skill.name] = maxLevel as SkillLevel;
        }
      });
      const changed = JSON.stringify(merged) !== JSON.stringify(skillLevels);
      if (changed) {
        setSkillLevels(merged);
      }
    }
  }, [selectedHeroName, heroLevels, availableHeroes, skillLevels, hasManualSkillSelection]);

  // Track previous joiner to avoid unnecessary onJoinerChange calls
  useEffect(() => {
    if (selectedHeroName) {
      const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
      if (selectedHero) {
        const skills = getHeroExpeditionSkills(selectedHero);
        const newSkillLevels: SkillLevelsByName = {};
        skills.forEach(skill => {
          const fromHeroLevels = heroLevels?.[selectedHeroName]?.skillLevels?.[skill.name];
          const existing = skillLevels[skill.name];
          const opts = getHeroSkillLevelOptions(skill.data, false);
          const maxLevel = opts.length > 0 ? (opts[opts.length - 1] as SkillLevel) : 1;
          newSkillLevels[skill.name] = (fromHeroLevels ?? existing ?? maxLevel) as SkillLevel;
        });

        const effectiveStarLevel = (heroLevels?.[selectedHeroName]?.starLevel !== undefined && starLevel === 0)
          ? heroLevels[selectedHeroName].starLevel
          : starLevel;

        const effectiveXpLevel = (heroLevels?.[selectedHeroName]?.xpLevel !== undefined && xpLevel === undefined)
          ? heroLevels[selectedHeroName].xpLevel
          : xpLevel;

        const currentJoiner: RallyHero = {
          heroName: selectedHeroName,
          heroClass: selectedHero['hero-class'] as TroopType,
          starLevel: effectiveStarLevel,
          generation: selectedHero.generation,
          skillLevels: newSkillLevels,
          xpLevel: effectiveXpLevel,
        };

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
  }, [selectedHeroName, starLevel, xpLevel, heroLevels, availableHeroes, skillLevels]);

  const selectedHero = availableHeroes.find(h => h['hero-name'] === selectedHeroName);
  const heroLevel = selectedHeroName ? heroLevels?.[selectedHeroName] : undefined;
  const isUsingHeroLevels = !!heroLevel;
  const firstSkill = selectedHero ? getHeroExpeditionSkills(selectedHero)[0] : null;
  const maxLevelForFirstSkill = firstSkill
    ? (() => {
      const opts = getHeroSkillLevelOptions(firstSkill.data, false);
      return opts.length > 0 ? (opts[opts.length - 1] as SkillLevel) : 1;
    })()
    : 1;

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
              title="Hero"
              value={selectedHeroName}
              onChange={(e) => setSelectedHeroName(e.target.value)}
            >
              <option value="">Select hero...</option>
              {heroesByGeneration.map(group => (
                <optgroup key={`gen-${group.gen}`} label={`Generation ${group.gen}`}>
                  {group.heroes.map(h => (
                    <option key={h['hero-name']} value={h['hero-name']}>
                      {h['hero-name']} ({h['hero-class']}, Gen {h.generation})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {selectedHero ? (
            <>
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
          ) : (
            <>
              <div className="form-group invisible" aria-hidden="true">
                <label>Generation</label>
                <input type="text" value="" readOnly />
              </div>
              <div className="form-group invisible" aria-hidden="true">
                <label>XP Level</label>
                <input type="number" value="" readOnly />
              </div>
            </>
          )}
        </div>

        {selectedHero && (
          <>
            <div className="grid gap-4 md:grid-cols-2 items-start">
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

              {firstSkill ? (
                <div className="form-group">
                  <label className="flex items-center justify-between gap-2">
                    <span>{firstSkill.name}</span>
                    {isUsingHeroLevels && heroLevel?.skillLevels?.[firstSkill.name] && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-400">
                        (from {isUsingPlayerHeroes ? 'Player' : 'Opponent'})
                      </span>
                    )}
                  </label>
                  <select
                    title="Skill Level"
                    value={skillLevels[firstSkill.name] ?? heroLevel?.skillLevels?.[firstSkill.name] ?? maxLevelForFirstSkill}
                    onChange={(e) => {
                      const parsedLevel = Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) as SkillLevel;
                      const nextSkillLevels = {
                        ...skillLevels,
                        [firstSkill.name]: parsedLevel
                      };
                      setSkillLevels(nextSkillLevels);
                      setHasManualSkillSelection(true);
                      onJoinerChange({
                        ...joiner,
                        heroName: selectedHeroName,
                        xpLevel,
                        starLevel,
                        generation: selectedHero.generation,
                        skillLevels: nextSkillLevels
                      });
                    }}
                  >
                    {getHeroSkillLevelOptions(firstSkill.data, false).map(level => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group invisible" aria-hidden="true">
                  <label>Skill Level</label>
                  <input type="number" value="" readOnly />
                </div>
              )}
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
