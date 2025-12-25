import { calcGearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";
import type { GearProgress } from "./gear-tables";

export interface IGResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: 0 | 20 | 40 | 60 | 80 | 100;

  baseIH: number;
  masteryForged: boolean;
  masteryLevel: number;
  masteryForgeMultiplier: number;
  effectiveMultiplier: number;
  totalIH: number;

  infantry_health_pct: number;
  infantry_attack_pct: number;
  infantry_defense_pct: number;
  infantry_power: number;

  warnings: string[];
}

export function calc_glove_infantry_ih(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): IGResult {
  const r = calcGearPiece(p, mastery_forged, masteryLevel, GEAR_PIECE_SPECS.glove);

  return {
    progress: r.progress,
    displayLevel: r.displayLevel,
    empowermentTier: r.empowermentTier,

    baseIH: r.basePrimary,
    masteryForged: r.masteryForged,
    masteryLevel: r.masteryLevel,
    masteryForgeMultiplier: r.masteryForgeMultiplier,
    effectiveMultiplier: r.effectiveMultiplier,
    totalIH: r.totalPrimary,

    infantry_health_pct: r.primary_pct,
    infantry_attack_pct: r.attack_pct,
    infantry_defense_pct: r.defense_pct,
    infantry_power: r.power,

    warnings: r.warnings,
  };
}
