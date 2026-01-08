/**
 * Profile-related types
 */

import type { HeroLevel } from './heroes';
import type { RallyConfiguration } from './rally';
import type { ExpertSelections, HeroGearSelections } from '@/domain/battle';
import type { AdditiveBonuses, BasicBonuses, FinalStats, MultiplicativeBonuses } from '@/domain/battle/calculations';

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  // Hero Levels (star level and XP level for each hero)
  heroLevels: Record<string, HeroLevel>; // hero name -> { starLevel, xpLevel }

  // Basic Bonuses
  basicBonuses: BasicBonuses;

  // Additive Bonuses
  additiveBonuses: AdditiveBonuses;

  // Multiplicative Bonuses
  multiplicativeBonuses: MultiplicativeBonuses;

  // Rally Configuration
  rally: RallyConfiguration;

  // Expert Selections
  expertSelections: ExpertSelections;

  // Hero Gear Selections
  heroGearSelections?: HeroGearSelections;

  // Opponent Configuration (for Rally Config only)
  opponent?: {
    heroLevels: Record<string, HeroLevel>;
    basicBonuses: BasicBonuses;
    expertSelections: ExpertSelections;
    chiefGearSelections?: Record<string, { tier: string; stars: number; step?: number }>;
    charmLevels?: Record<string, number[]>;
    commandCenterLevel?: string;
    colorTier?: 'grey' | 'green' | 'blue' | 'purple' | 'gold';
    additiveBonuses?: AdditiveBonuses;
    multiplicativeBonuses?: MultiplicativeBonuses;
    warAcademySelections?: Record<string, number>; // tech key -> level
    baseCapacity?: {
      rally: number; // Base Rally/Deployment Capacity
      march: number; // Base March Capacity
    };
    troopLevels?: {
      infantry?: string;
      lancer?: string;
      marksman?: string;
    };
    capacity?: {
      rally: number; // Rally Capacity bonus from pets
      march: number; // Squad/March Capacity bonus from pets
    };
    petSkillSelections?: Record<string, number>;
    petSkillsEnabled?: boolean; // Enable/disable pet skills in calculations
    cityBonusLevel?: 0 | 10 | 20; // City bonus level (0%, 10%, or 20%)
  };

  // Calculated stats (cached)
  calculatedStats?: {
    infantry: FinalStats;
    lancer: FinalStats;
    marksman: FinalStats;
  };

  // Capacity bonuses from pet skills
  capacity?: {
    rally: number; // Rally Capacity bonus from Rhino pet skill
    march: number; // Squad/March Capacity bonus from Snow Ape pet skill
  };

  troopLevels?: {
    infantry?: string;
    lancer?: string;
    marksman?: string;
  };

  // Base city capacities (user input)
  baseCapacity?: {
    rally: number; // Base Rally/Deployment Capacity
    march: number; // Base March Capacity
  };

  // Pet skill level selections (pet name -> level)
  petSkillSelections?: Record<string, number>;

  // Toggle settings for bonus calculations
  petSkillsEnabled?: boolean; // Enable/disable pet skills in calculations
  cityBonusLevel?: 0 | 10 | 20; // City bonus level (0%, 10%, or 20%)

  // Chief Gear and Charm selections
  chiefGearSelections?: Record<string, { tier: string; stars: number; step?: number }>;
  charmLevels?: Record<string, number[]>; // gear piece -> [level1, level2, level3]

  // War Academy selections (tech key -> level)
  warAcademySelections?: Record<string, number>; // "TechName-troopType" -> level

  // Command Center building level
  commandCenterLevel?: string; // "1", "2", ..., "30", "FC1", ..., "FC10"
}
