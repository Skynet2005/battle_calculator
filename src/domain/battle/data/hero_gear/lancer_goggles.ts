import { calcGearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";
import type { GearProgress } from "./gear-tables";

export interface LLResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: 0 | 20 | 40 | 60 | 80 | 100;

  baseLL: number;
  masteryForged: boolean;
  masteryLevel: number;
  masteryForgeMultiplier: number;
  effectiveMultiplier: number;
  totalLL: number;

  lancer_lethality_pct: number;
  lancer_attack_pct: number;
  lancer_defense_pct: number;
  lancer_power: number;

  warnings: string[];
}

export function calcGogglesLancerLL(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): LLResult {
  const r = calcGearPiece(p, mastery_forged, masteryLevel, GEAR_PIECE_SPECS.goggles);

  return {
    progress: r.progress,
    displayLevel: r.displayLevel,
    empowermentTier: r.empowermentTier,

    baseLL: r.basePrimary,
    masteryForged: r.masteryForged,
    masteryLevel: r.masteryLevel,
    masteryForgeMultiplier: r.masteryForgeMultiplier,
    effectiveMultiplier: r.effectiveMultiplier,
    totalLL: r.totalPrimary,

    lancer_lethality_pct: r.primary_pct,
    lancer_attack_pct: r.attack_pct,
    lancer_defense_pct: r.defense_pct,
    lancer_power: r.power,

    warnings: r.warnings,
  };
}
