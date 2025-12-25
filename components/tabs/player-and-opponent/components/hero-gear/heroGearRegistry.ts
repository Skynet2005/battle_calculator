import type { GearComputed, GearPiece, GearSelection, HeroGearRegistry, TroopType } from "@/components/tabs/player-and-opponent/components/hero-gear/HeroGearSelectorPanel";
import { calc_belt_infantry_ih_realistic } from "@/lib/battle/data/hero_gear/infantry_belt";
import { calc_boot_infantry_il } from "@/lib/battle/data/hero_gear/infantry_boot";
import { calc_glove_infantry_ih } from "@/lib/battle/data/hero_gear/infantry_glove";
import { calcGogglesInfantryIL } from "@/lib/battle/data/hero_gear/infantry_goggles";
import { calcBeltLancerLH } from "@/lib/battle/data/hero_gear/lancer_belt";
import { calc_boot_lancer_ll } from "@/lib/battle/data/hero_gear/lancer_boot";
import { calc_glove_lancer_lh } from "@/lib/battle/data/hero_gear/lancer_glove";
import { calcGogglesLancerLL } from "@/lib/battle/data/hero_gear/lancer_goggles";
import { calcBeltMarksmanMH } from "@/lib/battle/data/hero_gear/marksman_belt";
import { calc_boot_marksman_ml } from "@/lib/battle/data/hero_gear/marksman_boot";
import { calc_glove_marksman_mh } from "@/lib/battle/data/hero_gear/marksman_glove";
import { calcGogglesMarksmanML } from "@/lib/battle/data/hero_gear/marksman_goggles";

// ============================================================================
// Utility Functions
// ============================================================================

function cleanWarnings(warnings: string[]): string[] {
  return warnings.filter(
    (w) =>
      !w.includes("Legendary base IH uses Mythic Lv.100 base because no BELT_IH_BY_PLUS") &&
      !w.includes("Legendary base IL uses Mythic Lv.100 base because no BOOT_IL_BY_PLUS") &&
      !w.includes("Legendary base LH uses Mythic Lv.100 base because no BELT_LH_BY_PLUS") &&
      !w.includes("Legendary base MH uses Mythic Lv.100 base because no BELT_MH_BY_PLUS")
  );
}

function normalizeTier(tier: number): 0 | 20 | 60 | 100 {
  if (tier >= 100) return 100;
  if (tier >= 60) return 60;
  if (tier >= 20) return 20;
  return 0;
}

function healthLabel(troop: TroopType): string {
  return `${troop[0].toUpperCase()}${troop.slice(1)} Health`;
}

function lethalityLabel(troop: TroopType): string {
  return `${troop[0].toUpperCase()}${troop.slice(1)} Lethality`;
}

// ============================================================================
// Computed Result Builders
// ============================================================================

function makeHealthComputed(
  displayLevel: string,
  empowermentTier: number,
  baseStat: number,
  totalStat: number,
  atk: number,
  def: number,
  hp: number,
  power: number,
  warnings: string[],
  label: string,
  masteryForgeMultiplier: number
): GearComputed {
  return {
    displayLevel,
    empowermentTier: empowermentTier as any,
    baseMainStatPct: baseStat,
    masteryForgeMultiplier,
    totalMainStatPct: totalStat,
    mainStatLabel: label,
    attackPct: atk,
    defensePct: def,
    healthPct: hp,
    power,
    warnings: cleanWarnings(warnings)
  };
}

function makeLethalityComputed(
  displayLevel: string,
  empowermentTier: number,
  baseStat: number,
  totalStat: number,
  atk: number,
  def: number,
  power: number,
  warnings: string[],
  label: string,
  masteryForgeMultiplier: number
): GearComputed {
  return {
    displayLevel,
    empowermentTier: empowermentTier as any,
    baseMainStatPct: baseStat,
    masteryForgeMultiplier,
    totalMainStatPct: totalStat,
    mainStatLabel: label,
    attackPct: atk,
    defensePct: def,
    healthPct: 0, // Lethality pieces do not add HP directly
    power,
    warnings: cleanWarnings(warnings)
  };
}

// ============================================================================
// Hero Gear Registry
// ============================================================================

export const heroGearRegistry: HeroGearRegistry = {
  infantry: {
    belt: (sel: GearSelection) => {
      const r = calc_belt_infantry_ih_realistic(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeHealthComputed(
        r.displayLevel,
        tier,
        r.baseIH,
        r.totalIH,
        r.infantry_attack_pct,
        r.infantry_defense_pct,
        r.infantry_health_pct,
        r.infantry_power,
        r.warnings,
        healthLabel("infantry"),
        r.masteryForgeMultiplier
      );
    },
    boots: (sel: GearSelection) => {
      const r = calc_boot_infantry_il(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeLethalityComputed(
        r.displayLevel,
        tier,
        r.baseIL,
        r.totalIL,
        r.infantry_attack_pct,
        r.infantry_defense_pct,
        r.infantry_power,
        r.warnings,
        lethalityLabel("infantry"),
        r.masteryForgeMultiplier
      );
    },
    gloves: (sel: GearSelection) => {
      const r = calc_glove_infantry_ih(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeHealthComputed(
        r.displayLevel,
        tier,
        r.baseIH,
        r.totalIH,
        r.infantry_attack_pct,
        r.infantry_defense_pct,
        r.infantry_health_pct,
        r.infantry_power,
        r.warnings,
        healthLabel("infantry"),
        r.masteryForgeMultiplier
      );
    },
    goggles: (sel: GearSelection) => {
      const r = calcGogglesInfantryIL(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeLethalityComputed(
        r.displayLevel,
        tier,
        r.baseIL,
        r.totalIL,
        r.infantry_attack_pct,
        r.infantry_defense_pct,
        r.infantry_power,
        r.warnings,
        lethalityLabel("infantry"),
        r.masteryForgeMultiplier
      );
    }
  },
  lancer: {
    belt: (sel: GearSelection) => {
      const r = calcBeltLancerLH(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeHealthComputed(
        r.displayLevel,
        tier,
        r.baseLH,
        r.totalLH,
        r.lancer_attack_pct,
        r.lancer_defense_pct,
        r.lancer_health_pct,
        r.lancer_power,
        r.warnings,
        healthLabel("lancer"),
        r.masteryForgeMultiplier
      );
    },
    boots: (sel: GearSelection) => {
      const r = calc_boot_lancer_ll(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeLethalityComputed(
        r.displayLevel,
        tier,
        r.baseLL,
        r.totalLL,
        r.lancer_attack_pct,
        r.lancer_defense_pct,
        r.lancer_power,
        r.warnings,
        lethalityLabel("lancer"),
        r.masteryForgeMultiplier
      );
    },
    gloves: (sel: GearSelection) => {
      const r = calc_glove_lancer_lh(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeHealthComputed(
        r.displayLevel,
        tier,
        r.baseLH,
        r.totalLH,
        r.lancer_attack_pct,
        r.lancer_defense_pct,
        r.lancer_health_pct,
        r.lancer_power,
        r.warnings,
        healthLabel("lancer"),
        r.masteryForgeMultiplier
      );
    },
    goggles: (sel: GearSelection) => {
      const r = calcGogglesLancerLL(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeLethalityComputed(
        r.displayLevel,
        tier,
        r.baseLL,
        r.totalLL,
        r.lancer_attack_pct,
        r.lancer_defense_pct,
        r.lancer_power,
        r.warnings,
        lethalityLabel("lancer"),
        r.masteryForgeMultiplier
      );
    }
  },
  marksman: {
    belt: (sel: GearSelection) => {
      const r = calcBeltMarksmanMH(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeHealthComputed(
        r.displayLevel,
        tier,
        r.baseMH,
        r.totalMH,
        r.marksman_attack_pct,
        r.marksman_defense_pct,
        r.marksman_health_pct,
        r.marksman_power,
        r.warnings,
        healthLabel("marksman"),
        r.masteryForgeMultiplier
      );
    },
    boots: (sel: GearSelection) => {
      const r = calc_boot_marksman_ml(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeLethalityComputed(
        r.displayLevel,
        tier,
        r.baseML,
        r.totalML,
        r.marksman_attack_pct,
        r.marksman_defense_pct,
        r.marksman_power,
        r.warnings,
        lethalityLabel("marksman"),
        r.masteryForgeMultiplier
      );
    },
    gloves: (sel: GearSelection) => {
      const r = calc_glove_marksman_mh(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeHealthComputed(
        r.displayLevel,
        tier,
        r.baseMH,
        r.totalMH,
        r.marksman_attack_pct,
        r.marksman_defense_pct,
        r.marksman_health_pct,
        r.marksman_power,
        r.warnings,
        healthLabel("marksman"),
        r.masteryForgeMultiplier
      );
    },
    goggles: (sel: GearSelection) => {
      const r = calcGogglesMarksmanML(sel.progress, sel.masteryForged, sel.masteryLevel);
      const tier = normalizeTier(r.empowermentTier);
      return makeLethalityComputed(
        r.displayLevel,
        tier,
        r.baseML,
        r.totalML,
        r.marksman_attack_pct,
        r.marksman_defense_pct,
        r.marksman_power,
        r.warnings,
        lethalityLabel("marksman"),
        r.masteryForgeMultiplier
      );
    }
  }
};

// ============================================================================
// Public API
// ============================================================================

export function getHeroGearCalculator(troop: TroopType, piece: GearPiece) {
  return heroGearRegistry[troop][piece];
}
