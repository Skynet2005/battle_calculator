import { calcGearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";
import type { GearProgress } from "./gear-tables";

export interface ILResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: 0 | 20 | 40 | 60 | 80 | 100;

  baseIL: number;
  masteryForged: boolean;
  masteryLevel: number;
  masteryForgeMultiplier: number;
  effectiveMultiplier: number;
  totalIL: number;

  infantry_lethality_pct: number;
  infantry_attack_pct: number;
  infantry_defense_pct: number;
  infantry_power: number;

  warnings: string[];
}

export function calc_boot_infantry_il(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): ILResult {
  const r = calcGearPiece(p, mastery_forged, masteryLevel, GEAR_PIECE_SPECS.boot);

  return {
    progress: r.progress,
    displayLevel: r.displayLevel,
    empowermentTier: r.empowermentTier,

    baseIL: r.basePrimary,
    masteryForged: r.masteryForged,
    masteryLevel: r.masteryLevel,
    masteryForgeMultiplier: r.masteryForgeMultiplier,
    effectiveMultiplier: r.effectiveMultiplier,
    totalIL: r.totalPrimary,

    infantry_lethality_pct: r.primary_pct,
    infantry_attack_pct: r.attack_pct,
    infantry_defense_pct: r.defense_pct,
    infantry_power: r.power,

    warnings: r.warnings,
  };
}
