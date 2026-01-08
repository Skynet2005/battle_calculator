/**
 * Hero-related types
 */

import type { SkillLevelsByName } from '@/domain/battle/data/heroes/hero_types';

export interface HeroLevel {
  starLevel: number; // 0-30 (5 snowflake stars × 6 segments)
  xpLevel: number; // 0-80 (0 for unowned heroes, 1-80 for owned heroes)
  skillLevels: SkillLevelsByName; // skill name -> level (1-5)
  exclusiveWeaponLevel?: number; // optional, depends on hero
}
