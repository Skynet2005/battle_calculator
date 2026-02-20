/**
 * Game data types
 */

import type { Hero } from '@/domain/battle/data/heroes/hero_types';

export interface GameData {
  heroes: Hero[];
  troopDefinitions: Record<string, {
    Power: number;
    Defense: number;
    Lethality: number;
    Attack: number;
    Health: number;
  }>;
  chiefGear: Record<string, unknown>;
  charms: Record<string, unknown>;
  research: Record<string, unknown>;
  warAcademy: Record<string, unknown>;
  experts: Record<string, unknown>;
}
