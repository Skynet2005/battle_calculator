/**
 * Rally-related types
 */

import type { TroopType } from './troops';
import type { TroopConfiguration, TroopMixConfig } from './troops';
import type { SkillLevelsByName } from '@/domain/battle/data/heroes/hero_types';

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
