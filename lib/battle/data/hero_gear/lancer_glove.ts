import { calcGearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";
import type { GearProgress } from "./gear-tables";

export interface LGResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: 0 | 20 | 40 | 60 | 80 | 100;

  baseLH: number;
  masteryForged: boolean;
  masteryLevel: number;
  masteryForgeMultiplier: number;
  effectiveMultiplier: number;
  totalLH: number;

  lancer_health_pct: number;
  lancer_attack_pct: number;
  lancer_defense_pct: number;
  lancer_power: number;

  warnings: string[];
}

export function calc_glove_lancer_lh(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): LGResult {
  const r = calcGearPiece(p, mastery_forged, masteryLevel, GEAR_PIECE_SPECS.glove);

  return {
    progress: r.progress,
    displayLevel: r.displayLevel,
    empowermentTier: r.empowermentTier,

    baseLH: r.basePrimary,
    masteryForged: r.masteryForged,
    masteryLevel: r.masteryLevel,
    masteryForgeMultiplier: r.masteryForgeMultiplier,
    effectiveMultiplier: r.effectiveMultiplier,
    totalLH: r.totalPrimary,

    lancer_health_pct: r.primary_pct,
    lancer_attack_pct: r.attack_pct,
    lancer_defense_pct: r.defense_pct,
    lancer_power: r.power,

    warnings: r.warnings,
  };
}
