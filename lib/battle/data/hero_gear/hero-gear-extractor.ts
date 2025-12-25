import { calcGearPiece, type GearPiece } from "./gear-piece-core";
import { GEAR_PIECE_SPECS } from "./gear-piece-specs";
import type { GearProgress } from "./gear-tables";

type Troop = "infantry" | "lancer" | "marksman";

const PIECES: readonly GearPiece[] = ["goggles", "glove", "boot", "belt"] as const;

// ============================================================================
// Types
// ============================================================================

export interface HeroGearConfig {
  level: number; // 1-200
  masteryForged: boolean;
  masteryLevel: number; // 0-20
  empowermentLevel: number; // legacy, ignored in realistic calculators
  stacking: "additive" | "multiplicative"; // legacy, ignored in realistic calculators
}

export interface HeroGearSelections {
  infantry: {
    goggles: HeroGearConfig;
    glove: HeroGearConfig;
    boot: HeroGearConfig;
    belt: HeroGearConfig;
  };
  lancer: {
    goggles: HeroGearConfig;
    glove: HeroGearConfig;
    boot: HeroGearConfig;
    belt: HeroGearConfig;
  };
  marksman: {
    goggles: HeroGearConfig;
    glove: HeroGearConfig;
    boot: HeroGearConfig;
    belt: HeroGearConfig;
  };
}

type BuiltParams = {
  progress: GearProgress;
  masteryForged: boolean;
  masteryLevel: number;
};

const DEFAULT_CFG: HeroGearConfig = {
  level: 1,
  masteryForged: false,
  masteryLevel: 0,
  empowermentLevel: 0,
  stacking: "additive",
};

function buildParams(cfg?: HeroGearConfig | null): BuiltParams {
  const src = cfg ?? DEFAULT_CFG;
  const level = Math.max(1, Math.min(200, Math.floor(src.level)));
  const progress: GearProgress =
    level <= 100
      ? { rarity: "mythic", level }
      : { rarity: "legendary", plus: Math.max(1, Math.min(100, level - 100)) };

  const masteryForged = !!src.masteryForged;
  const masteryLevel = masteryForged ? Math.max(0, Math.min(20, Math.floor(src.masteryLevel))) : 0;
  return { progress, masteryForged, masteryLevel };
}

// ============================================================================
// Bonus and Power Calculation Functions
// ============================================================================

function sumBonusesForTroop(troopSel: HeroGearSelections[Troop]) {
  // totals in your current "final shape"
  let lethality = 0;
  let health = 0;
  let attack = 0;
  let defense = 0;

  for (const piece of PIECES) {
    const { progress, masteryForged, masteryLevel } = buildParams(troopSel[piece]);
    const spec = GEAR_PIECE_SPECS[piece];
    const r = calcGearPiece(progress, masteryForged, masteryLevel, spec);

    if (r.primary === "lethality") lethality += r.primary_pct;
    else health += r.primary_pct;

    attack += r.attack_pct;
    defense += r.defense_pct;
  }

  return { lethality, health, attack, defense };
}

function sumPowerForTroop(troopSel: HeroGearSelections[Troop]) {
  const perPiece: Record<GearPiece, number> = {
    goggles: 0,
    glove: 0,
    boot: 0,
    belt: 0,
  };

  for (const piece of PIECES) {
    const { progress, masteryForged, masteryLevel } = buildParams(troopSel[piece]);
    const spec = GEAR_PIECE_SPECS[piece];
    const r = calcGearPiece(progress, masteryForged, masteryLevel, spec);
    perPiece[piece] = r.power;
  }

  const total = perPiece.goggles + perPiece.glove + perPiece.boot + perPiece.belt;
  return { total, ...perPiece };
}

/**
 * Extract hero gear bonuses for all troop types
 */
export function getHeroGearBonuses(selections: HeroGearSelections): {
  infantry: { lethality: number; health: number; attack: number; defense: number };
  lancer: { lethality: number; health: number; attack: number; defense: number };
  marksman: { lethality: number; health: number; attack: number; defense: number };
} {
  return {
    infantry: sumBonusesForTroop(selections.infantry),
    lancer: sumBonusesForTroop(selections.lancer),
    marksman: sumBonusesForTroop(selections.marksman),
  };
}

/**
 * Extract hero gear power for all troop types and individual pieces
 */
export function getHeroGearPower(selections: HeroGearSelections): {
  infantry: { total: number; goggles: number; glove: number; boot: number; belt: number };
  lancer: { total: number; goggles: number; glove: number; boot: number; belt: number };
  marksman: { total: number; goggles: number; glove: number; boot: number; belt: number };
} {
  return {
    infantry: sumPowerForTroop(selections.infantry),
    lancer: sumPowerForTroop(selections.lancer),
    marksman: sumPowerForTroop(selections.marksman),
  };
}
