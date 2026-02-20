/**
 * Shared skill value helpers used by hero-skill-converter and rally-bonus-extractor.
 */

import type { HeroSkillLevelPercent, SkillLevel, SkillLevelKey } from './hero_types';

/**
 * Extract value from skill property at a specific level
 */
export function extractSkillValue(
  skillProperty: number | HeroSkillLevelPercent | undefined,
  level: SkillLevel
): number {
  if (!skillProperty) return 0;

  if (typeof skillProperty === 'number') {
    return skillProperty;
  }

  const levelValue =
    skillProperty[level.toString() as SkillLevelKey] ??
    skillProperty['1'];
  if (typeof levelValue === 'number') {
    return levelValue;
  }

  return 0;
}

/**
 * Get the maximum skill level available for a skill property
 */
export function getMaxSkillLevel(skillProperty: number | HeroSkillLevelPercent | undefined): SkillLevel {
  if (!skillProperty) return 1;

  if (typeof skillProperty === 'number') {
    return 1; // Flat value, no levels
  }

  const levelKeys = Object.keys(skillProperty)
    .filter((k) => !isNaN(parseInt(k)))
    .map((k) => parseInt(k))
    .sort((a, b) => b - a);

  return (levelKeys.length > 0 ? levelKeys[0] : 1) as SkillLevel;
}
