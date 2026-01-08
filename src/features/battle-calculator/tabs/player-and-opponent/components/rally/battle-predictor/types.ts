import type { TroopMixConfig } from '@/shared/types';
import type { HeroSelection } from '@/domain/battle';
import type { FighterSnapshot } from '@/domain/rally/combat-fighter';
import type { TroopCounts as RallyTroopCounts, SideBaseStats } from '@/domain/rally/combat-types';

export const TROOP_TYPES = ['infantry', 'lancer', 'marksman'] as const;
export type TroopType = (typeof TROOP_TYPES)[number];

export interface SpecialBonusSummary {
  troopsAttack: number;
  troopsDefense: number;
  troopsLethality: number;
  troopsHealth: number;
  enemyAttackReduction: number;
  enemyDefenseReduction: number;
  defenderAttack: number;
  defenderHealth: number;
  rallyAttack: number;
  rallyLethality: number;
  breakdown?: {
    pet: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    city: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    combat: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    special: Record<'attack' | 'defense' | 'lethality' | 'health', number>;
    joiner: Record<'attack' | 'defense' | 'lethality' | 'health', number> & { damageReduction?: number; names: string[] };
    enemyAttack: { city: number; combat: number; joiner: number; pet?: number; manual?: number };
    enemyDefense: { city: number; combat: number; joiner: number; pet?: number; manual?: number };
  };
}

export interface BattleSideContext {
  label: string;
  fighter: FighterSnapshot | null;
  role: 'attacker' | 'defender';
  troopCounts: RallyTroopCounts | null;
  stats: SideBaseStats | null;
  mix: TroopMixConfig | null;
  leaders: Partial<Record<TroopType, HeroSelection | null>>;
  joiners: HeroSelection[];
  joinerAdditive?: {
    attack: number;
    defense: number;
    lethality: number;
    health: number;
    names: string[];
  };
  specialBonuses: SpecialBonusSummary | null;
}

export interface CapacityBreakdown {
  total: number;
  base: number;
  temporary: number;
  manualOverride: boolean;
  breakdown: Array<{ label: string; value: number }>;
  temporaryBreakdown: Array<{ label: string; value: number }>;
}

export interface CapacityReport {
  deployment: CapacityBreakdown;
  rally: CapacityBreakdown;
}

export type MixTroopCounts = RallyTroopCounts;
