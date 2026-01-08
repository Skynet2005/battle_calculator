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
  chiefGear: any;
  charms: any;
  research: any;
  warAcademy: any;
  experts: any;
}
