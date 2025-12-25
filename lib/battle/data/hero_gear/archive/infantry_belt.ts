
import { getMasteryPower } from "../../mastery-power-utils";
import {
  clampInt,
  displayLevel,
  EmpowermentTier,
  empowermentTierFromPlus,
  GearProgress,
  LEGENDARY_1_100,
  MASTERY_FORGED_MULTIPLIER,
  MYTHIC_1_100,
  normalizeProgress,
  POWER_LEGENDARY_1_100,
  POWER_MYTHIC_1_100,
  round2,
  safeAt,
  unifiedPowerIndex
} from "../gear-tables";

export interface IHResult {
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

export const BELT_IH_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const BELT_IH_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const BELT_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const BELT_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

function sumBeltEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  if (tier >= 20) atk += 20;
  if (tier >= 60) def += 30;
  if (tier >= 100) atk += 50;
  return { atk, def };
}

export function calc_belt_infantry_ih_realistic(
  progress: GearProgress,
  mastery_forged: boolean,
  mastery_level: number = 0,
): IHResult {
  const warnings: string[] = [];

  const p = normalizeProgress(progress);

  const masteryLevel = mastery_forged ? clampInt(mastery_level, 0, 20) : 0;


  const masteryForgeMultiplier = mastery_forged
    ? (MASTERY_FORGED_MULTIPLIER[masteryLevel] ?? 0)
    : 0;

  const effectiveMultiplier = mastery_forged
    ? (1 + masteryForgeMultiplier)
    : 1;

  let baseIH: number;
  if (p.rarity === "mythic") {
    baseIH = safeAt(BELT_IH_BY_LEVEL, p.level - 1, "BELT_IH_BY_LEVEL", warnings);
  } else {
    baseIH = safeAt(BELT_IH_BY_PLUS, p.plus - 1, "BELT_IH_BY_PLUS", warnings);
  }

  const totalIH = round2(baseIH * effectiveMultiplier);

  const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
  const { atk: infantry_attack_pct, def: infantry_defense_pct } = sumBeltEmpowermentBonuses(empowermentTier);

  const powerIndex = unifiedPowerIndex(p);

  let infantry_power: number;
  if (mastery_forged && masteryLevel >= 10) {
    infantry_power = getMasteryPower("belt", powerIndex, masteryLevel, mastery_forged);
  } else {
    infantry_power = safeAt(BELT_POWER_BY_LEVEL, powerIndex, "BELT_POWER_BY_LEVEL", warnings);
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

