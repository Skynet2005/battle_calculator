import { getMasteryPower } from "../mastery-power-utils";
import {
  clampInt,
  displayLevel,
  EmpowermentTier,
  empowermentTierFromPlus,
  GearProgress,
  LEGENDARY_1_100,
  MASTERY_FORGED_MULTIPLIER,
  MYTHIC_1_100,
  POWER_LEGENDARY_1_100,
  POWER_MYTHIC_1_100,
  normalizeProgress,
  round2,
  safeAt,
} from "./gear-tables";

export type GearPiece = "goggles" | "glove" | "boot" | "belt";
export type PrimaryStat = "lethality" | "health";

/**
 * Two empowerment “shapes” you already have:
 * - ATK_DEF_ATK: +atk @20, +def @60, +atk @100  (belt + goggles)
 * - DEF_ATK_DEF: +def @20, +atk @60, +def @100  (boot + glove)
 */
export type EmpowermentPattern = "ATK_DEF_ATK" | "DEF_ATK_DEF";

export interface GearPieceSpec {
  piece: GearPiece;
  primary: PrimaryStat;
  empowermentPattern: EmpowermentPattern;

  // These are shared in your current code, but leaving as fields makes the core reusable.
  baseMythicTable?: readonly number[];
  baseLegendaryTable?: readonly number[];
  powerMythicTable?: readonly number[];
  powerLegendaryTable?: readonly number[];
}

export interface GearPieceResult {
  progress: GearProgress;
  displayLevel: string;
  empowermentTier: EmpowermentTier;

  basePrimary: number;
  masteryForged: boolean;
  masteryLevel: number;
  masteryForgeMultiplier: number;
  effectiveMultiplier: number;
  totalPrimary: number;

  // normalized outputs (no troop prefix)
  primary: PrimaryStat;
  primary_pct: number; // == totalPrimary
  attack_pct: number;
  defense_pct: number;
  power: number;

  warnings: string[];
}

function sumEmpowermentBonuses(
  tier: EmpowermentTier,
  pattern: EmpowermentPattern,
): { atk: number; def: number } {
  let atk = 0;
  let def = 0;

  if (pattern === "ATK_DEF_ATK") {
    if (tier >= 20) atk += 20;
    if (tier >= 60) def += 30;
    if (tier >= 100) atk += 50;
  } else {
    if (tier >= 20) def += 20;
    if (tier >= 60) atk += 30;
    if (tier >= 100) def += 50;
  }

  return { atk, def };
}

/**
 * Keep the mastery index behavior consistent with what you were *trying* to do:
 * - Mythic Lv.1..100 => 1..100
 * - Legendary +1..+100 => 101..200
 *
 * (This index is for getMasteryPower; your table lookups should remain 0-based per rarity.)
 */
function masteryIndex1Based(p: GearProgress): number {
  return p.rarity === "mythic" ? p.level : 100 + p.plus;
}

function baseIndex0Based(p: GearProgress): number {
  return p.rarity === "mythic" ? p.level - 1 : p.plus - 1;
}

export function calcGearPiece(
  progress: GearProgress,
  masteryForged: boolean,
  masteryLevel: number,
  spec: GearPieceSpec,
): GearPieceResult {
  const warnings: string[] = [];

  const p = normalizeProgress(progress);

  const mLvl = masteryForged ? clampInt(masteryLevel, 0, 20) : 0;

  const masteryForgeMultiplier = masteryForged
    ? safeAt(MASTERY_FORGED_MULTIPLIER, mLvl, "MASTERY_FORGED_MULTIPLIER", warnings)
    : 0;

  const effectiveMultiplier = masteryForged ? (1 + masteryForgeMultiplier) : 1;

  const baseMythic = spec.baseMythicTable ?? MYTHIC_1_100;
  const baseLegendary = spec.baseLegendaryTable ?? LEGENDARY_1_100;

  const idx0 = baseIndex0Based(p);

  const basePrimary =
    p.rarity === "mythic"
      ? safeAt(baseMythic, idx0, `${spec.piece}:baseMythic`, warnings)
      : safeAt(baseLegendary, idx0, `${spec.piece}:baseLegendary`, warnings);

  const totalPrimary = round2(basePrimary * effectiveMultiplier);

  const empowermentTier: EmpowermentTier =
    p.rarity === "legendary" ? empowermentTierFromPlus(p.plus) : 0;

  const { atk: attack_pct, def: defense_pct } = sumEmpowermentBonuses(
    empowermentTier,
    spec.empowermentPattern,
  );

  const powerMythic = spec.powerMythicTable ?? POWER_MYTHIC_1_100;
  const powerLegendary = spec.powerLegendaryTable ?? POWER_LEGENDARY_1_100;

  const power =
    masteryForged && mLvl >= 10
      ? getMasteryPower(spec.piece, masteryIndex1Based(p), mLvl, masteryForged)
      : (p.rarity === "mythic"
          ? safeAt(powerMythic, idx0, `${spec.piece}:powerMythic`, warnings)
          : safeAt(powerLegendary, idx0, `${spec.piece}:powerLegendary`, warnings));

  return {
    progress: p,
    displayLevel: displayLevel(p),
    empowermentTier,

    basePrimary,
    masteryForged,
    masteryLevel: mLvl,
    masteryForgeMultiplier,
    effectiveMultiplier,
    totalPrimary,

    primary: spec.primary,
    primary_pct: totalPrimary,
    attack_pct,
    defense_pct,
    power,

    warnings,
  };
}
