/**
 * Hero Gear Bonus Extractor
 * Calculates bonuses from hero gear (goggles, glove, boot, belt) for each troop type
 */

import { calc_belt_infantry_ih } from './infantry_belt';
import { calc_boot_infantry_il } from './infantry_boot';
import { calc_glove_infantry_ih } from './infantry_glove';
import { calcGogglesInfantryIL } from './infantry_goggles';
import { calcBeltLancerLH } from './lancer_belt';
import { calc_boot_lancer_ll } from './lancer_boot';
import { calc_glove_lancer_lh } from './lancer_glove';
import { calcGogglesLancerLL } from './lancer_goggles';
import { calcBeltMarksmanMH } from './marksman_belt';
import { calc_boot_marksman_ml } from './marksman_boot';
import { calc_glove_marksman_mh } from './marksman_glove';
import { calcGogglesMarksmanML } from './marksman_goggles';

export interface HeroGearConfig {
  level: number; // 1-200
  masteryForged: boolean;
  masteryLevel: number; // 0-20
  essenceLevel: number; // 0-20
  empowermentLevel: number; // 0, 20, 40, 60, 80, 100 (unlocked based on gear level)
  stacking: 'additive' | 'multiplicative';
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

/**
 * Extract hero gear bonuses for all troop types
 */
export function getHeroGearBonuses(selections: HeroGearSelections): {
  infantry: { lethality: number; health: number; attack: number; defense: number };
  lancer: { lethality: number; health: number; attack: number; defense: number };
  marksman: { lethality: number; health: number; attack: number; defense: number };
} {
  // Infantry
  const infantryGoggles = calcGogglesInfantryIL(
    selections.infantry.goggles.level,
    selections.infantry.goggles.masteryForged,
    selections.infantry.goggles.masteryLevel,
    selections.infantry.goggles.essenceLevel,
    selections.infantry.goggles.stacking,
    selections.infantry.goggles.empowermentLevel
  );
  const infantryGlove = calc_glove_infantry_ih(
    selections.infantry.glove.level,
    selections.infantry.glove.masteryForged,
    selections.infantry.glove.masteryLevel,
    selections.infantry.glove.essenceLevel,
    selections.infantry.glove.stacking,
    selections.infantry.glove.empowermentLevel
  );
  const infantryBoot = calc_boot_infantry_il(
    selections.infantry.boot.level,
    selections.infantry.boot.masteryForged,
    selections.infantry.boot.masteryLevel,
    selections.infantry.boot.essenceLevel,
    selections.infantry.boot.stacking,
    selections.infantry.boot.empowermentLevel
  );
  const infantryBelt = calc_belt_infantry_ih(
    selections.infantry.belt.level,
    selections.infantry.belt.masteryForged,
    selections.infantry.belt.masteryLevel,
    selections.infantry.belt.essenceLevel,
    selections.infantry.belt.stacking,
    selections.infantry.belt.empowermentLevel
  );

  // Lancer
  const lancerGoggles = calcGogglesLancerLL(
    selections.lancer.goggles.level,
    selections.lancer.goggles.masteryForged,
    selections.lancer.goggles.masteryLevel,
    selections.lancer.goggles.essenceLevel,
    selections.lancer.goggles.stacking,
    selections.lancer.goggles.empowermentLevel
  );
  const lancerGlove = calc_glove_lancer_lh(
    selections.lancer.glove.level,
    selections.lancer.glove.masteryForged,
    selections.lancer.glove.masteryLevel,
    selections.lancer.glove.essenceLevel,
    selections.lancer.glove.stacking,
    selections.lancer.glove.empowermentLevel
  );
  const lancerBoot = calc_boot_lancer_ll(
    selections.lancer.boot.level,
    selections.lancer.boot.masteryForged,
    selections.lancer.boot.masteryLevel,
    selections.lancer.boot.essenceLevel,
    selections.lancer.boot.stacking,
    selections.lancer.boot.empowermentLevel
  );
  const lancerBelt = calcBeltLancerLH(
    selections.lancer.belt.level,
    selections.lancer.belt.masteryForged,
    selections.lancer.belt.masteryLevel,
    selections.lancer.belt.essenceLevel,
    selections.lancer.belt.stacking,
    selections.lancer.belt.empowermentLevel
  );

  // Marksman
  const marksmanGoggles = calcGogglesMarksmanML(
    selections.marksman.goggles.level,
    selections.marksman.goggles.masteryForged,
    selections.marksman.goggles.masteryLevel,
    selections.marksman.goggles.essenceLevel,
    selections.marksman.goggles.stacking,
    selections.marksman.goggles.empowermentLevel
  );
  const marksmanGlove = calc_glove_marksman_mh(
    selections.marksman.glove.level,
    selections.marksman.glove.masteryForged,
    selections.marksman.glove.masteryLevel,
    selections.marksman.glove.essenceLevel,
    selections.marksman.glove.stacking,
    selections.marksman.glove.empowermentLevel
  );
  const marksmanBoot = calc_boot_marksman_ml(
    selections.marksman.boot.level,
    selections.marksman.boot.masteryForged,
    selections.marksman.boot.masteryLevel,
    selections.marksman.boot.essenceLevel,
    selections.marksman.boot.stacking,
    selections.marksman.boot.empowermentLevel
  );
  const marksmanBelt = calcBeltMarksmanMH(
    selections.marksman.belt.level,
    selections.marksman.belt.masteryForged,
    selections.marksman.belt.masteryLevel,
    selections.marksman.belt.essenceLevel,
    selections.marksman.belt.stacking,
    selections.marksman.belt.empowermentLevel
  );

  return {
    infantry: {
      // Lethality: Only from Goggles and Boots
      lethality: (infantryGoggles.infantry_lethality_pct || 0) + (infantryBoot.infantry_lethality_pct || 0),
      // Health: ONLY from Gloves and Belts (goggles and boots do NOT contribute to health)
      health: (infantryGlove.infantry_health_pct || 0) + (infantryBelt.infantry_health_pct || 0),
      // Attack: From all pieces (empowerment bonuses)
      attack: (infantryGoggles.infantry_attack_pct || 0) + (infantryGlove.infantry_attack_pct || 0) +
        (infantryBoot.infantry_attack_pct || 0) + (infantryBelt.infantry_attack_pct || 0),
      // Defense: From all pieces (empowerment bonuses)
      defense: (infantryGoggles.infantry_defense_pct || 0) + (infantryGlove.infantry_defense_pct || 0) +
        (infantryBoot.infantry_defense_pct || 0) + (infantryBelt.infantry_defense_pct || 0),
    },
    lancer: {
      // Lethality: Only from Goggles and Boots
      lethality: (lancerGoggles.lancer_lethality_pct || 0) + (lancerBoot.lancer_lethality_pct || 0),
      // Health: ONLY from Gloves and Belts (goggles and boots do NOT contribute to health)
      health: (lancerGlove.lancer_health_pct || 0) + (lancerBelt.lancer_health_pct || 0),
      // Attack: From all pieces (empowerment bonuses)
      attack: (lancerGoggles.lancer_attack_pct || 0) + (lancerGlove.lancer_attack_pct || 0) +
        (lancerBoot.lancer_attack_pct || 0) + (lancerBelt.lancer_attack_pct || 0),
      // Defense: From all pieces (empowerment bonuses)
      defense: (lancerGoggles.lancer_defense_pct || 0) + (lancerGlove.lancer_defense_pct || 0) +
        (lancerBoot.lancer_defense_pct || 0) + (lancerBelt.lancer_defense_pct || 0),
    },
    marksman: {
      // Lethality: Only from Goggles and Boots
      lethality: (marksmanGoggles.marksman_lethality_pct || 0) + (marksmanBoot.marksman_lethality_pct || 0),
      // Health: ONLY from Gloves and Belts (goggles and boots do NOT contribute to health)
      health: (marksmanGlove.marksman_health_pct || 0) + (marksmanBelt.marksman_health_pct || 0),
      // Attack: From all pieces (empowerment bonuses)
      attack: (marksmanGoggles.marksman_attack_pct || 0) + (marksmanGlove.marksman_attack_pct || 0) +
        (marksmanBoot.marksman_attack_pct || 0) + (marksmanBelt.marksman_attack_pct || 0),
      // Defense: From all pieces (empowerment bonuses)
      defense: (marksmanGoggles.marksman_defense_pct || 0) + (marksmanGlove.marksman_defense_pct || 0) +
        (marksmanBoot.marksman_defense_pct || 0) + (marksmanBelt.marksman_defense_pct || 0),
    },
  };
}

/**
 * Extract hero gear power for all troop types and individual pieces
 */
export function getHeroGearPower(selections: HeroGearSelections): {
  infantry: {
    total: number;
    goggles: number;
    glove: number;
    boot: number;
    belt: number;
  };
  lancer: {
    total: number;
    goggles: number;
    glove: number;
    boot: number;
    belt: number;
  };
  marksman: {
    total: number;
    goggles: number;
    glove: number;
    boot: number;
    belt: number;
  };
} {
  // Infantry
  const infantryGoggles = calcGogglesInfantryIL(
    selections.infantry.goggles.level,
    selections.infantry.goggles.masteryForged,
    selections.infantry.goggles.masteryLevel,
    selections.infantry.goggles.essenceLevel,
    selections.infantry.goggles.stacking,
    selections.infantry.goggles.empowermentLevel
  );
  const infantryGlove = calc_glove_infantry_ih(
    selections.infantry.glove.level,
    selections.infantry.glove.masteryForged,
    selections.infantry.glove.masteryLevel,
    selections.infantry.glove.essenceLevel,
    selections.infantry.glove.stacking,
    selections.infantry.glove.empowermentLevel
  );
  const infantryBoot = calc_boot_infantry_il(
    selections.infantry.boot.level,
    selections.infantry.boot.masteryForged,
    selections.infantry.boot.masteryLevel,
    selections.infantry.boot.essenceLevel,
    selections.infantry.boot.stacking,
    selections.infantry.boot.empowermentLevel
  );
  const infantryBelt = calc_belt_infantry_ih(
    selections.infantry.belt.level,
    selections.infantry.belt.masteryForged,
    selections.infantry.belt.masteryLevel,
    selections.infantry.belt.essenceLevel,
    selections.infantry.belt.stacking,
    selections.infantry.belt.empowermentLevel
  );

  // Lancer
  const lancerGoggles = calcGogglesLancerLL(
    selections.lancer.goggles.level,
    selections.lancer.goggles.masteryForged,
    selections.lancer.goggles.masteryLevel,
    selections.lancer.goggles.essenceLevel,
    selections.lancer.goggles.stacking,
    selections.lancer.goggles.empowermentLevel
  );
  const lancerGlove = calc_glove_lancer_lh(
    selections.lancer.glove.level,
    selections.lancer.glove.masteryForged,
    selections.lancer.glove.masteryLevel,
    selections.lancer.glove.essenceLevel,
    selections.lancer.glove.stacking,
    selections.lancer.glove.empowermentLevel
  );
  const lancerBoot = calc_boot_lancer_ll(
    selections.lancer.boot.level,
    selections.lancer.boot.masteryForged,
    selections.lancer.boot.masteryLevel,
    selections.lancer.boot.essenceLevel,
    selections.lancer.boot.stacking,
    selections.lancer.boot.empowermentLevel
  );
  const lancerBelt = calcBeltLancerLH(
    selections.lancer.belt.level,
    selections.lancer.belt.masteryForged,
    selections.lancer.belt.masteryLevel,
    selections.lancer.belt.essenceLevel,
    selections.lancer.belt.stacking,
    selections.lancer.belt.empowermentLevel
  );

  // Marksman
  const marksmanGoggles = calcGogglesMarksmanML(
    selections.marksman.goggles.level,
    selections.marksman.goggles.masteryForged,
    selections.marksman.goggles.masteryLevel,
    selections.marksman.goggles.essenceLevel,
    selections.marksman.goggles.stacking,
    selections.marksman.goggles.empowermentLevel
  );
  const marksmanGlove = calc_glove_marksman_mh(
    selections.marksman.glove.level,
    selections.marksman.glove.masteryForged,
    selections.marksman.glove.masteryLevel,
    selections.marksman.glove.essenceLevel,
    selections.marksman.glove.stacking,
    selections.marksman.glove.empowermentLevel
  );
  const marksmanBoot = calc_boot_marksman_ml(
    selections.marksman.boot.level,
    selections.marksman.boot.masteryForged,
    selections.marksman.boot.masteryLevel,
    selections.marksman.boot.essenceLevel,
    selections.marksman.boot.stacking,
    selections.marksman.boot.empowermentLevel
  );
  const marksmanBelt = calcBeltMarksmanMH(
    selections.marksman.belt.level,
    selections.marksman.belt.masteryForged,
    selections.marksman.belt.masteryLevel,
    selections.marksman.belt.essenceLevel,
    selections.marksman.belt.stacking,
    selections.marksman.belt.empowermentLevel
  );

  return {
    infantry: {
      goggles: infantryGoggles.infantry_power || 0,
      glove: infantryGlove.infantry_power || 0,
      boot: infantryBoot.infantry_power || 0,
      belt: infantryBelt.infantry_power || 0,
      total: (infantryGoggles.infantry_power || 0) + (infantryGlove.infantry_power || 0) +
        (infantryBoot.infantry_power || 0) + (infantryBelt.infantry_power || 0),
    },
    lancer: {
      goggles: lancerGoggles.lancer_power || 0,
      glove: lancerGlove.lancer_power || 0,
      boot: lancerBoot.lancer_power || 0,
      belt: lancerBelt.lancer_power || 0,
      total: (lancerGoggles.lancer_power || 0) + (lancerGlove.lancer_power || 0) +
        (lancerBoot.lancer_power || 0) + (lancerBelt.lancer_power || 0),
    },
    marksman: {
      goggles: marksmanGoggles.marksman_power || 0,
      glove: marksmanGlove.marksman_power || 0,
      boot: marksmanBoot.marksman_power || 0,
      belt: marksmanBelt.marksman_power || 0,
      total: (marksmanGoggles.marksman_power || 0) + (marksmanGlove.marksman_power || 0) +
        (marksmanBoot.marksman_power || 0) + (marksmanBelt.marksman_power || 0),
    },
  };
}

