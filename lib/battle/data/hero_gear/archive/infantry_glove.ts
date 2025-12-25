import { getMasteryPower } from "../../mastery-power-utils";
import {
  displayLevel,
  EmpowermentTier,
  empowermentTierFromPlus,
  GearProgress,
  LEGENDARY_1_100,
  MASTERY_FORGED_MULTIPLIER,
  MYTHIC_1_100,
  POWER_LEGENDARY_1_100,
  POWER_MYTHIC_1_100,
  round2,
  safeAt,
  unifiedPowerIndex
} from "../gear-tables";

export interface IGResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: EmpowermentTier;

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

export const GLOVE_IH_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const GLOVE_IH_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const GLOVE_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const GLOVE_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

function sumGloveEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  if (tier >= 20) def += 20;
  if (tier >= 60) atk += 30;
  if (tier >= 100) def += 50;
  return { atk, def };
}

export function calc_glove_infantry_ih(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): IGResult {
  const warnings: string[] = [];

  const clampedMasteryLevel = Math.max(0, Math.min(20, Math.floor(masteryLevel)));

  const masteryForgeMultiplier = mastery_forged
    ? safeAt(MASTERY_FORGED_MULTIPLIER, clampedMasteryLevel, "MASTERY_FORGED_MULTIPLIER", warnings)
    : 0;

  const effectiveMultiplier = mastery_forged
    ? (1 + masteryForgeMultiplier)
    : 1;

  let baseIH: number;
  if (p.rarity === "mythic") {
    baseIH = safeAt(GLOVE_IH_BY_LEVEL, p.level - 1, "GLOVE_IH_BY_LEVEL", warnings);
  } else {
    baseIH = safeAt(GLOVE_IH_BY_PLUS, p.plus - 1, "GLOVE_IH_BY_PLUS", warnings);
  }

  const totalIH = round2(baseIH * effectiveMultiplier);

  const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
  const { atk: infantry_attack_pct, def: infantry_defense_pct } = sumGloveEmpowermentBonuses(empowermentTier);

  const powerIndex = unifiedPowerIndex(p);

  let infantry_power: number;
  if (mastery_forged && masteryLevel >= 10) {
    infantry_power = getMasteryPower("glove", powerIndex, masteryLevel, mastery_forged);
  } else {
    infantry_power = safeAt(GLOVE_POWER_BY_LEVEL, powerIndex, "GLOVE_POWER_BY_LEVEL", warnings);
  }

  return {
    progress: p,
    displayLevel: displayLevel(p),
    empowermentTier,

    baseIH,
    masteryForged: mastery_forged,
    masteryLevel,
    masteryForgeMultiplier,
    effectiveMultiplier,
    totalIH,

    infantry_health_pct: totalIH,
    infantry_attack_pct,
    infantry_defense_pct,
    infantry_power,

    warnings
  };
}
