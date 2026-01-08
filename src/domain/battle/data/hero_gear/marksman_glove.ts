import { calcGearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";
import type { GearProgress } from "./gear-tables";

export interface MGResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: 0 | 20 | 40 | 60 | 80 | 100;

  baseMH: number;
  masteryForged: boolean;
  masteryLevel: number;
  masteryForgeMultiplier: number;
  effectiveMultiplier: number;
  totalMH: number;

  marksman_health_pct: number;
  marksman_attack_pct: number;
  marksman_defense_pct: number;
  marksman_power: number;

  warnings: string[];
}

export function calc_glove_marksman_mh(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): MGResult {
  const r = calcGearPiece(p, mastery_forged, masteryLevel, GEAR_PIECE_SPECS.glove);

  return {
    progress: r.progress,
    displayLevel: r.displayLevel,
    empowermentTier: r.empowermentTier,

    baseMH: r.basePrimary,
    masteryForged: r.masteryForged,
    masteryLevel: r.masteryLevel,
    masteryForgeMultiplier: r.masteryForgeMultiplier,
    effectiveMultiplier: r.effectiveMultiplier,
    totalMH: r.totalPrimary,

    marksman_health_pct: r.primary_pct,
    marksman_attack_pct: r.attack_pct,
    marksman_defense_pct: r.defense_pct,
    marksman_power: r.power,

    warnings: r.warnings,
  };
}
