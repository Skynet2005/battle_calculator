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

export interface ILResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: EmpowermentTier;

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

export const GOGGLES_IL_BY_LEVEL: readonly number[] = MYTHIC_1_100;
export const GOGGLES_IL_BY_PLUS: readonly number[] = LEGENDARY_1_100;
export const GOGGLES_POWER_BY_LEVEL: readonly number[] = POWER_MYTHIC_1_100;
export const GOGGLES_POWER_BY_PLUS: readonly number[] = POWER_LEGENDARY_1_100;

function sumGogglesEmpowermentBonuses(tier: EmpowermentTier): { atk: number; def: number } {
  let atk = 0;
  let def = 0;
  if (tier >= 20) atk += 20.0;
  if (tier >= 60) def += 30.0;
  if (tier >= 100) atk += 50.0;
  return { atk, def };
}

export function calcGogglesInfantryIL(
  p: GearProgress,
  mastery_forged: boolean,
  masteryLevel: number = 0,
): ILResult {
  const warnings: string[] = [];

  const masteryLevel_clamped = Math.max(0, Math.min(20, Math.floor(masteryLevel)));

  const masteryForgeMultiplier = mastery_forged
    ? safeAt(MASTERY_FORGED_MULTIPLIER, masteryLevel_clamped, "MASTERY_FORGED_MULTIPLIER", warnings)
    : 0;

  const effectiveMultiplier = mastery_forged
    ? (1 + masteryForgeMultiplier)
    : 1;

  let baseIL: number;
  if (p.rarity === "mythic") {
    baseIL = safeAt(GOGGLES_IL_BY_LEVEL, p.level - 1, "GOGGLES_IL_BY_LEVEL", warnings);
  } else {
    baseIL = safeAt(GOGGLES_IL_BY_PLUS, p.plus - 1, "GOGGLES_IL_BY_PLUS", warnings);
  }

  const totalIL = round2(baseIL * effectiveMultiplier);

  const empowermentTier: EmpowermentTier = p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;
  const { atk: infantry_attack_pct, def: infantry_defense_pct } = sumGogglesEmpowermentBonuses(empowermentTier);

  const powerIndex = unifiedPowerIndex(p);

  let infantry_power: number;
  if (mastery_forged && masteryLevel >= 10) {
    infantry_power = getMasteryPower("goggles", powerIndex, masteryLevel, mastery_forged);
  } else {
    infantry_power = safeAt(GOGGLES_POWER_BY_LEVEL, powerIndex, "GOGGLES_POWER_BY_LEVEL", warnings);
  }

  return {
    progress: p,
    displayLevel: displayLevel(p),
    empowermentTier,

    baseIL,
    masteryForged: mastery_forged,
    masteryLevel,
    masteryForgeMultiplier,
    effectiveMultiplier,
    totalIL,

    infantry_lethality_pct: totalIL,
    infantry_attack_pct,
    infantry_defense_pct,
    infantry_power,

    warnings
  };
}
