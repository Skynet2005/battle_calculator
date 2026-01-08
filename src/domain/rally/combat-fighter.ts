import type {
  RallySideConfig,
  SideCombatSummary,
  TroopCounts,
  TroopType
} from "./combat-types";

export interface FighterSnapshot {
  name: string;
  role: "attacker" | "defender";
  summary: SideCombatSummary;
  troopCounts: TroopCounts;
}

export function buildFighterSnapshot(
  name: string,
  side: RallySideConfig,
  opponent: RallySideConfig
): FighterSnapshot {
  const summary: SideCombatSummary = {
    troopStats: side.baseStats,
    damageDealtMultiplier: 1,
    damageTakenMultiplier: 1,
    controlSummary: {},
    dotSummary: undefined,
    debugEffects: []
  };
  return {
    name,
    role: side.role,
    summary,
    troopCounts: cloneTroopCounts(side.troopCounts)
  };
}

export function cloneTroopCounts(counts: TroopCounts): TroopCounts {
  return {
    infantry: sanitizeCount(counts.infantry),
    lancer: sanitizeCount(counts.lancer),
    marksman: sanitizeCount(counts.marksman)
  };
}

export function totalTroops(counts: TroopCounts): number {
  return counts.infantry + counts.lancer + counts.marksman;
}

export function updateTroopCounts(
  counts: TroopCounts,
  deltas: Partial<Record<TroopType, number>>
): TroopCounts {
  return {
    infantry: Math.max(0, counts.infantry + (deltas.infantry ?? 0)),
    lancer: Math.max(0, counts.lancer + (deltas.lancer ?? 0)),
    marksman: Math.max(0, counts.marksman + (deltas.marksman ?? 0))
  };
}

function sanitizeCount(value?: number): number {
  if (!value || Number.isNaN(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}
