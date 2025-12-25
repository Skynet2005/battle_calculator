'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Hero, HeroGearSelections, SkillLevel, SkillLevelsByName } from '../../../../../lib/battle';
import { getAllHeroes, getHeroExpeditionSkills, getHeroGearPower } from '../../../../../lib/battle';
import type { HeroLevel } from '../../../../types';
import { DEFAULT_HERO_GEAR_SELECTIONS } from './HeroSelector.defaults';
import {
  getSkillLevelFromStarLevel,
  MAX_STAR_LEVEL,
  MAX_XP_LEVEL,
  toHeroClassKey,
  type ActiveSection,
  type HeroClassKey
} from './HeroSelector.utils';

export type ExpeditionSkill = ReturnType<typeof getHeroExpeditionSkills>[number];

export type HeroPowerComponents = {
  heroPower: number;
  weaponPower: number;
  gearPower: number;
  totalPower: number;
};

export interface UseHeroSelectorModelArgs {
  heroLevels: Record<string, HeroLevel>;
  onHeroLevelsChange: (heroLevels: Record<string, HeroLevel>) => void;

  heroGearSelections?: HeroGearSelections;
  isOpponent?: boolean;
}

export function useHeroSelectorModel({
  heroLevels,
  onHeroLevelsChange,
  heroGearSelections,
  isOpponent = false
}: UseHeroSelectorModelArgs) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('heroes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const allHeroes = useMemo(() => getAllHeroes(), []);

  const heroByName = useMemo(() => {
    const m = new Map<string, Hero>();
    for (const h of allHeroes) m.set(h['hero-name'], h);
    return m;
  }, [allHeroes]);

  const skillsByHeroName = useMemo(() => {
    const m = new Map<string, ExpeditionSkill[]>();
    for (const h of allHeroes) m.set(h['hero-name'], getHeroExpeditionSkills(h));
    return m;
  }, [allHeroes]);

  const heroClasses = useMemo(() => {
    const classes = new Set(allHeroes.map((h) => h['hero-class']));
    return Array.from(classes).sort();
  }, [allHeroes]);

  const safeGearSelections = heroGearSelections ?? DEFAULT_HERO_GEAR_SELECTIONS;

  // IMPORTANT WIN: compute gear power once for the whole selector, not per hero card
  const gearPowerData = useMemo(() => getHeroGearPower(safeGearSelections), [safeGearSelections]);

  const gearPowerByClass = useMemo(() => {
    return {
      infantry: gearPowerData.infantry.total,
      lancer: gearPowerData.lancer.total,
      marksman: gearPowerData.marksman.total
    } satisfies Record<HeroClassKey, number>;
  }, [gearPowerData]);

  const filteredHeroes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allHeroes.filter((hero) => {
      const matchesSearch = q.length === 0 || hero['hero-name'].toLowerCase().includes(q);
      const matchesClass = filterClass === 'all' || hero['hero-class'] === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [allHeroes, searchTerm, filterClass]);

  const sortedHeroes = useMemo(() => {
    return [...filteredHeroes].sort((a, b) => {
      if (b.generation !== a.generation) return b.generation - a.generation;
      return a['hero-name'].localeCompare(b['hero-name']);
    });
  }, [filteredHeroes]);

  const heroesByGeneration = useMemo(() => {
    const grouped: Record<number, Hero[]> = {};
    for (const hero of sortedHeroes) {
      const gen = hero.generation;
      (grouped[gen] ??= []).push(hero);
    }
    return grouped;
  }, [sortedHeroes]);

  const getHeroLevelData = useCallback(
    (heroName: string): HeroLevel => {
      const existing = heroLevels[heroName];
      const hero = heroByName.get(heroName);

      // Preserve your opponent default behavior
      if (isOpponent && !existing) {
        const skills = hero ? (skillsByHeroName.get(heroName) ?? []) : [];
        const skillLevels: SkillLevelsByName = {};
        for (const s of skills) skillLevels[s.name] = 5;

        return {
          starLevel: 30,
          xpLevel: 80,
          skillLevels,
          exclusiveWeaponLevel: hero?.['exclusive-weapon'] ? 10 : undefined
        };
      }

      const starLevel = existing?.starLevel ?? 0;
      const isOwned = starLevel > 0;

      return {
        starLevel,
        xpLevel: existing?.xpLevel ?? (isOwned ? 80 : 0),
        skillLevels: existing?.skillLevels ? { ...existing.skillLevels } : {},
        exclusiveWeaponLevel: existing?.exclusiveWeaponLevel ?? 10
      };
    },
    [heroLevels, heroByName, isOpponent, skillsByHeroName]
  );

  const updateHeroLevelRecord = useCallback(
    (heroName: string, updater: (current: HeroLevel) => HeroLevel) => {
      const current = getHeroLevelData(heroName);
      onHeroLevelsChange({
        ...heroLevels,
        [heroName]: updater(current)
      });
    },
    [getHeroLevelData, heroLevels, onHeroLevelsChange]
  );

  const updateHeroLevel = useCallback(
    (heroName: string, field: 'starLevel' | 'xpLevel', value: number) => {
      const current = getHeroLevelData(heroName);
      const isOwned = current.starLevel > 0;

      // Preserve your original sanitization semantics
      const sanitizedValue =
        field === 'starLevel'
          ? Math.max(0, Math.min(MAX_STAR_LEVEL, value))
          : Math.max(0, Math.min(MAX_XP_LEVEL, value || (isOwned ? 80 : 0)));

      updateHeroLevelRecord(heroName, (prev) => {
        const updated: HeroLevel = { ...prev, [field]: sanitizedValue };

        // Preserve: star change auto-updates expedition skills
        if (field === 'starLevel') {
          const hero = heroByName.get(heroName);
          if (hero) {
            const skills = skillsByHeroName.get(heroName) ?? getHeroExpeditionSkills(hero);
            const newSkillLevel = getSkillLevelFromStarLevel(sanitizedValue) as SkillLevel;

            const nextSkillLevels: SkillLevelsByName = { ...prev.skillLevels };
            for (const s of skills) nextSkillLevels[s.name] = newSkillLevel;
            updated.skillLevels = nextSkillLevels;
          }
        }

        return updated;
      });
    },
    [getHeroLevelData, heroByName, skillsByHeroName, updateHeroLevelRecord]
  );

  const updateHeroSkillLevel = useCallback(
    (heroName: string, skillName: string, value: number) => {
      const sanitizedValue = Math.max(1, Math.min(5, value || 1)) as SkillLevel;

      updateHeroLevelRecord(heroName, (current) => ({
        ...current,
        skillLevels: {
          ...current.skillLevels,
          [skillName]: sanitizedValue
        }
      }));
    },
    [updateHeroLevelRecord]
  );

  const updateHeroExclusiveWeaponLevel = useCallback(
    (heroName: string, value: number, maxLevel: number) => {
      // Preserve your original semantics (including value||10 behavior via the callers)
      const sanitizedValue = Math.max(0, Math.min(maxLevel, value));

      updateHeroLevelRecord(heroName, (current) => ({
        ...current,
        exclusiveWeaponLevel: sanitizedValue
      }));
    },
    [updateHeroLevelRecord]
  );

  const getSkillsForHero = useCallback(
    (hero: Hero): ExpeditionSkill[] => {
      return skillsByHeroName.get(hero['hero-name']) ?? getHeroExpeditionSkills(hero);
    },
    [skillsByHeroName]
  );

  const calculateHeroPowerComponents = useCallback(
    (hero: Hero, heroLevel: HeroLevel): HeroPowerComponents => {
      const starLevel = heroLevel.starLevel;
      const xpLevel = heroLevel.xpLevel;
      const skillLevels = heroLevel.skillLevels;
      const exclusiveWeaponLevel = heroLevel.exclusiveWeaponLevel ?? 10;

      const starPower = (starLevel / 30) * hero['max-star-power'];

      const skills = skillsByHeroName.get(hero['hero-name']) ?? getHeroExpeditionSkills(hero);
      const skillPowerPerSkill = hero['max-skill-power'] / Math.max(1, skills.length);

      let totalSkillPower = 0;
      for (const s of skills) {
        const lvl = skillLevels[s.name] ?? 5;
        totalSkillPower += (lvl / 5) * skillPowerPerSkill;
      }

      const effectiveLevel = Math.min(xpLevel, 80);
      const levelPower = (effectiveLevel / 80) * hero['max-level-power'];

      const heroPower = starPower + totalSkillPower + levelPower;

      let weaponPower = 0;
      const exclusiveWeapon = hero['exclusive-weapon'];
      if (exclusiveWeapon && exclusiveWeaponLevel > 0) {
        const weaponLevelData = exclusiveWeapon.levels.find((l) => l.level === exclusiveWeaponLevel);
        weaponPower = weaponLevelData?.power || 0;
      }

      const clsKey = toHeroClassKey(hero['hero-class']);
      const gearPower = clsKey ? gearPowerByClass[clsKey] : 0;

      const totalPower = heroPower + weaponPower + gearPower;

      return { heroPower, weaponPower, gearPower, totalPower };
    },
    [gearPowerByClass, skillsByHeroName]
  );

  return {
    // state
    activeSection,
    setActiveSection,
    searchTerm,
    setSearchTerm,
    filterClass,
    setFilterClass,

    // data
    heroClasses,
    sortedHeroes,
    heroesByGeneration,
    safeGearSelections,

    // hero state ops
    getHeroLevelData,
    updateHeroLevel,
    updateHeroSkillLevel,
    updateHeroExclusiveWeaponLevel,

    // cached hero helpers
    getSkillsForHero,

    // power
    calculateHeroPowerComponents
  };
}
