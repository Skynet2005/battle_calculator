import type { GearProgress } from "./gear-tables";
import { calcGearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";

export function calcGogglesInfantryIL(p: GearProgress, mastery_forged: boolean, masteryLevel = 0) {
  const r = calcGearPiece(p, mastery_forged, masteryLevel, GEAR_PIECE_SPECS.goggles);

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
