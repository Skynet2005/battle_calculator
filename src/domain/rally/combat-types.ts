import type { TroopType as BaseTroopType } from "@/shared/types";
import type { HeroSelection, NormalizedSkillEffect, TroopStatLine } from "../battle";

export type TroopType = BaseTroopType;

export type { TroopStatLine };

export type SideBaseStats = Record<TroopType, TroopStatLine>;

export type TroopCounts = Record<TroopType, number>;

export interface RallySideConfig {
  role: "attacker" | "defender";
  baseStats: SideBaseStats;
  heroes: Record<TroopType, HeroSelection | null>;
  joiners: HeroSelection[];
  troopCounts: TroopCounts;
  totalTroops: number;
}

export interface RallyConfig {
  attacker: RallySideConfig;
  defender: RallySideConfig;
}

export interface SideCombatSummary {
  troopStats: Record<TroopType, TroopStatLine>;
  damageDealtMultiplier: number;
  damageTakenMultiplier: number;
  controlSummary: {
    immobilizeChance?: number;
    otherControlNotes?: string;
  };
  dotSummary?: {
    hasDot: boolean;
    approxMagnitude?: number;
  };
  debugEffects: NormalizedSkillEffect[];
}

export interface RallySummary {
  attacker: SideCombatSummary;
  defender: SideCombatSummary;
}
