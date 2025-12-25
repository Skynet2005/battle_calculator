/**
 * Hero Gear Bonus Extractor
 * Calculates bonuses from hero gear (goggles, glove, boot, belt) for each troop type
 */

import { GearProgress } from "../gear-tables";
import { calc_belt_infantry_ih_realistic } from "../infantry_belt";
import { calc_boot_infantry_il } from "../infantry_boot";
import { calcGogglesInfantryIL } from "../infantry_goggles";
import { calcBeltLancerLH } from "../lancer_belt";
import { calc_boot_lancer_ll } from "../lancer_boot";
import { calc_glove_lancer_lh } from "../lancer_glove";
import { calcGogglesLancerLL } from "../lancer_goggles";
import { calcBeltMarksmanMH } from "../marksman_belt";
import { calc_boot_marksman_ml } from "../marksman_boot";
import { calc_glove_marksman_mh } from "../marksman_glove";
import { calcGogglesMarksmanML } from "../marksman_goggles";
import { calc_glove_infantry_ih } from "../infantry_glove";

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
  stacking: "additive"
};

function buildParams(cfg?: HeroGearConfig | null): BuiltParams {
  const src = cfg ?? DEFAULT_CFG;
  const level = Math.max(1, Math.min(200, Math.floor(src.level)));
  const progress =
    level <= 100
      ? ({ rarity: "mythic", level } as const)
      : ({ rarity: "legendary", plus: Math.max(1, Math.min(100, level - 100)) } as const);

  const masteryForged = !!src.masteryForged;
  const masteryLevel = masteryForged ? Math.max(0, Math.min(20, Math.floor(src.masteryLevel))) : 0;
  return { progress, masteryForged, masteryLevel };
}

/**
 * Extract hero gear bonuses for all troop types
 */
export function getHeroGearBonuses(selections: HeroGearSelections): {
  infantry: { lethality: number; health: number; attack: number; defense: number };
  lancer: { lethality: number; health: number; attack: number; defense: number };
  marksman: { lethality: number; health: number; attack: number; defense: number };
} {
  // Infantry
  const infGoggles = buildParams(selections?.infantry?.goggles);
  const infGlove = buildParams(selections?.infantry?.glove);
  const infBoot = buildParams(selections?.infantry?.boot);
  const infBelt = buildParams(selections?.infantry?.belt);

  const infantryGoggles = calcGogglesInfantryIL(infGoggles.progress, infGoggles.masteryForged, infGoggles.masteryLevel);
  const infantryGlove = calc_glove_infantry_ih(infGlove.progress, infGlove.masteryForged, infGlove.masteryLevel);
  const infantryBoot = calc_boot_infantry_il(infBoot.progress, infBoot.masteryForged, infBoot.masteryLevel);
  const infantryBelt = calc_belt_infantry_ih_realistic(infBelt.progress, infBelt.masteryForged, infBelt.masteryLevel);

  // Lancer
  const lanGoggles = buildParams(selections?.lancer?.goggles);
  const lanGlove = buildParams(selections?.lancer?.glove);
  const lanBoot = buildParams(selections?.lancer?.boot);
  const lanBelt = buildParams(selections?.lancer?.belt);

  const lancerGoggles = calcGogglesLancerLL(lanGoggles.progress, lanGoggles.masteryForged, lanGoggles.masteryLevel);
  const lancerGlove = calc_glove_lancer_lh(lanGlove.progress, lanGlove.masteryForged, lanGlove.masteryLevel);
  const lancerBoot = calc_boot_lancer_ll(lanBoot.progress, lanBoot.masteryForged, lanBoot.masteryLevel);
  const lancerBelt = calcBeltLancerLH(lanBelt.progress, lanBelt.masteryForged, lanBelt.masteryLevel);

  // Marksman
  const marGoggles = buildParams(selections?.marksman?.goggles);
  const marGlove = buildParams(selections?.marksman?.glove);
  const marBoot = buildParams(selections?.marksman?.boot);
  const marBelt = buildParams(selections?.marksman?.belt);

  const marksmanGoggles = calcGogglesMarksmanML(marGoggles.progress, marGoggles.masteryForged, marGoggles.masteryLevel);
  const marksmanGlove = calc_glove_marksman_mh(marGlove.progress, marGlove.masteryForged, marGlove.masteryLevel);
  const marksmanBoot = calc_boot_marksman_ml(marBoot.progress, marBoot.masteryForged, marBoot.masteryLevel);
  const marksmanBelt = calcBeltMarksmanMH(marBelt.progress, marBelt.masteryForged, marBelt.masteryLevel);

  return {
    infantry: {
      lethality: (infantryGoggles.infantry_lethality_pct || 0) + (infantryBoot.infantry_lethality_pct || 0),
      health: (infantryGlove.infantry_health_pct || 0) + (infantryBelt.infantry_health_pct || 0),
      attack:
        (infantryGoggles.infantry_attack_pct || 0) +
        (infantryGlove.infantry_attack_pct || 0) +
        (infantryBoot.infantry_attack_pct || 0) +
        (infantryBelt.infantry_attack_pct || 0),
      defense:
        (infantryGoggles.infantry_defense_pct || 0) +
        (infantryGlove.infantry_defense_pct || 0) +
        (infantryBoot.infantry_defense_pct || 0) +
        (infantryBelt.infantry_defense_pct || 0)
    },
    lancer: {
      lethality: (lancerGoggles.lancer_lethality_pct || 0) + (lancerBoot.lancer_lethality_pct || 0),
      health: (lancerGlove.lancer_health_pct || 0) + (lancerBelt.lancer_health_pct || 0),
      attack:
        (lancerGoggles.lancer_attack_pct || 0) +
        (lancerGlove.lancer_attack_pct || 0) +
        (lancerBoot.lancer_attack_pct || 0) +
        (lancerBelt.lancer_attack_pct || 0),
      defense:
        (lancerGoggles.lancer_defense_pct || 0) +
        (lancerGlove.lancer_defense_pct || 0) +
        (lancerBoot.lancer_defense_pct || 0) +
        (lancerBelt.lancer_defense_pct || 0)
    },
    marksman: {
      lethality: (marksmanGoggles.marksman_lethality_pct || 0) + (marksmanBoot.marksman_lethality_pct || 0),
      health: (marksmanGlove.marksman_health_pct || 0) + (marksmanBelt.marksman_health_pct || 0),
      attack:
        (marksmanGoggles.marksman_attack_pct || 0) +
        (marksmanGlove.marksman_attack_pct || 0) +
        (marksmanBoot.marksman_attack_pct || 0) +
        (marksmanBelt.marksman_attack_pct || 0),
      defense:
        (marksmanGoggles.marksman_defense_pct || 0) +
        (marksmanGlove.marksman_defense_pct || 0) +
        (marksmanBoot.marksman_defense_pct || 0) +
        (marksmanBelt.marksman_defense_pct || 0)
    }
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
  // Infantry
  const infGoggles = buildParams(selections?.infantry?.goggles);
  const infGlove = buildParams(selections?.infantry?.glove);
  const infBoot = buildParams(selections?.infantry?.boot);
  const infBelt = buildParams(selections?.infantry?.belt);

  const infantryGoggles = calcGogglesInfantryIL(infGoggles.progress, infGoggles.masteryForged, infGoggles.masteryLevel);
  const infantryGlove = calc_glove_infantry_ih(infGlove.progress, infGlove.masteryForged, infGlove.masteryLevel);
  const infantryBoot = calc_boot_infantry_il(infBoot.progress, infBoot.masteryForged, infBoot.masteryLevel);
  const infantryBelt = calc_belt_infantry_ih_realistic(infBelt.progress, infBelt.masteryForged, infBelt.masteryLevel);

  // Lancer
  const lanGoggles = buildParams(selections?.lancer?.goggles);
  const lanGlove = buildParams(selections?.lancer?.glove);
  const lanBoot = buildParams(selections?.lancer?.boot);
  const lanBelt = buildParams(selections?.lancer?.belt);

  const lancerGoggles = calcGogglesLancerLL(lanGoggles.progress, lanGoggles.masteryForged, lanGoggles.masteryLevel);
  const lancerGlove = calc_glove_lancer_lh(lanGlove.progress, lanGlove.masteryForged, lanGlove.masteryLevel);
  const lancerBoot = calc_boot_lancer_ll(lanBoot.progress, lanBoot.masteryForged, lanBoot.masteryLevel);
  const lancerBelt = calcBeltLancerLH(lanBelt.progress, lanBelt.masteryForged, lanBelt.masteryLevel);

  // Marksman
  const marGoggles = buildParams(selections?.marksman?.goggles);
  const marGlove = buildParams(selections?.marksman?.glove);
  const marBoot = buildParams(selections?.marksman?.boot);
  const marBelt = buildParams(selections?.marksman?.belt);

  const marksmanGoggles = calcGogglesMarksmanML(marGoggles.progress, marGoggles.masteryForged, marGoggles.masteryLevel);
  const marksmanGlove = calc_glove_marksman_mh(marGlove.progress, marGlove.masteryForged, marGlove.masteryLevel);
  const marksmanBoot = calc_boot_marksman_ml(marBoot.progress, marBoot.masteryForged, marBoot.masteryLevel);
  const marksmanBelt = calcBeltMarksmanMH(marBelt.progress, marBelt.masteryForged, marBelt.masteryLevel);

  return {
    infantry: {
      goggles: infantryGoggles.infantry_power || 0,
      glove: infantryGlove.infantry_power || 0,
      boot: infantryBoot.infantry_power || 0,
      belt: infantryBelt.infantry_power || 0,
      total:
        (infantryGoggles.infantry_power || 0) +
        (infantryGlove.infantry_power || 0) +
        (infantryBoot.infantry_power || 0) +
        (infantryBelt.infantry_power || 0)
    },
    lancer: {
      goggles: lancerGoggles.lancer_power || 0,
      glove: lancerGlove.lancer_power || 0,
      boot: lancerBoot.lancer_power || 0,
      belt: lancerBelt.lancer_power || 0,
      total:
        (lancerGoggles.lancer_power || 0) +
        (lancerGlove.lancer_power || 0) +
        (lancerBoot.lancer_power || 0) +
        (lancerBelt.lancer_power || 0)
    },
    marksman: {
      goggles: marksmanGoggles.marksman_power || 0,
      glove: marksmanGlove.marksman_power || 0,
      boot: marksmanBoot.marksman_power || 0,
      belt: marksmanBelt.marksman_power || 0,
      total:
        (marksmanGoggles.marksman_power || 0) +
        (marksmanGlove.marksman_power || 0) +
        (marksmanBoot.marksman_power || 0) +
        (marksmanBelt.marksman_power || 0)
    }
  };
}


