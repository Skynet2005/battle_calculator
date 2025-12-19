/**
 * Core types for the Expedition Battle Calculator
 */

import type { ExpertSelections, Hero, HeroGearSelections, SkillLevelsByName } from '../lib/battle';
import type { AdditiveBonuses, BasicBonuses, FinalStats, MultiplicativeBonuses } from '../lib/battle/calculations';

export type TroopType = 'infantry' | 'lancer' | 'marksman';
export type FireCrystalLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type TroopTier = 'normal' | 'helios';

export interface TroopConfiguration {
  type: TroopType;
  tier: TroopTier;
  fireCrystalLevel: FireCrystalLevel;
  count: number;
}

export interface RallyHero {
  heroName: string;
  heroClass: TroopType;
  starLevel: number;
  generation: number;
  exclusiveWeaponLevel?: number;
  skillLevels: SkillLevelsByName; // skill name -> level
  xpLevel?: number; // Optional XP level (0-80). If not set, will use from heroLevels
}

export interface RallyConfiguration {
  leader: {
    infantry: RallyHero | null;
    lancer: RallyHero | null;
    marksman: RallyHero | null;
  };
  // Separate leader selections for Player and Opponent
  playerLeader?: {
    infantry: RallyHero | null;
    lancer: RallyHero | null;
    marksman: RallyHero | null;
  };
  opponentLeader?: {
    infantry: RallyHero | null;
    lancer: RallyHero | null;
    marksman: RallyHero | null;
  };
  joiners?: RallyHero[]; // Legacy: kept for backward compatibility
  playerJoiners?: RallyHero[]; // Max 4, only skill level 1
  opponentJoiners?: RallyHero[]; // Max 4, only skill level 1
  capacity: {
    infantry: TroopConfiguration[];
    lancer: TroopConfiguration[];
    marksman: TroopConfiguration[];
  };
  troopMix?: {
    player: TroopMixConfig;
    opponent: TroopMixConfig;
  };
  // Special Widget Bonus configuration (separate for player and opponent)
  specialWidgetBonus?: {
    player: 'attacking' | 'defending';
    opponent: 'attacking' | 'defending';
  };
  // Rally battle configuration
  usePlayerHeroes?: boolean; // If true, use player heroes; if false, use opponent heroes
}

export interface HeroLevel {
  starLevel: number; // 0-30 (5 snowflake stars × 6 segments)
  xpLevel: number; // 0-80 (0 for unowned heroes, 1-80 for owned heroes)
  skillLevels: SkillLevelsByName; // skill name -> level (1-5)
  exclusiveWeaponLevel?: number; // optional, depends on hero
}

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

export interface GameData {
  heroes: Hero[];
  troopDefinitions: Record<string, {
    Power: number;
    Defense: number;
    Lethality: number;
    Attack: number;
    Health: number;
  }>;
  chiefGear: any;
  charms: any;
  research: any;
  warAcademy: any;
  experts: any;
}

export interface TroopMixConfig {
  totalTroops: number;
  infantryRatio: number;
  lancerRatio: number;
  marksmanRatio: number;
}

