'use client';

import type { HeroLevel } from '@/components/types';
import { getHeroExpeditionSkills } from '../../data-selectors';
import { getAllHeroes } from './hero-extractor';
import type { SkillLevel, SkillLevelsByName } from './hero_types';

function getMaxLevelFromSkillData(data: Record<string, unknown>): SkillLevel {
  const numericLevels = Object.keys(data)
    .map((key) => parseInt(key, 10))
    .filter((n) => !Number.isNaN(n));
  if (numericLevels.length === 0) return 5;
  return clampSkillLevel(Math.max(...numericLevels));
}

export function buildMaxHeroLevels(): Record<string, HeroLevel> {
  const heroes = getAllHeroes();
  const levels: Record<string, HeroLevel> = {};

  heroes.forEach((hero) => {
    const skills = getHeroExpeditionSkills(hero);
    const skillLevels: SkillLevelsByName = {};

    skills.forEach((skill) => {
      const data = (skill as any).data || {};
      const maxLevel = getMaxLevelFromSkillData(data);
      const skillName = (skill as any)['skill-name'] || (skill as any).name || 'skill';
      skillLevels[skillName] = maxLevel;
    });

    levels[hero['hero-name']] = {
      starLevel: 30,
      xpLevel: 80,
      skillLevels,
      exclusiveWeaponLevel: hero['exclusive-weapon'] ? 10 : undefined
    };
  });

  return levels;
}

function clampSkillLevel(value: number): SkillLevel {
  const clamped = Math.max(1, Math.min(5, Math.floor(value)));
  return clamped as SkillLevel;
}

