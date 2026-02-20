import type { CapacityBreakdown, CapacityReport, SpecialBonusSummary, TroopMixConfig } from '@/shared/types';
import type { HeroSelection } from '@/domain/battle';
import type { FighterSnapshot } from '@/domain/rally/combat-fighter';
import type { TroopCounts as RallyTroopCounts, SideBaseStats } from '@/domain/rally/combat-types';

export const TROOP_TYPES = ['infantry', 'lancer', 'marksman'] as const;
export type TroopType = (typeof TROOP_TYPES)[number];

export type { CapacityBreakdown, CapacityReport, SpecialBonusSummary } from '@/shared/types';

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

export type MixTroopCounts = RallyTroopCounts;
