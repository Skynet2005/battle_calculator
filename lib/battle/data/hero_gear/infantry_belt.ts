// Infantry Belt Calculator for Hero Gear

import { getMasteryPower } from '../mastery-power-utils';

export type StackMode = "additive" | "multiplicative";

export interface IHResult {
  level: number;                       // 0..200
  baseIH: number;                      // Base Infantry Health from table (%)
  masteryForged: boolean;              // Whether mastery forging is applied
  masteryLevel: number;                // 0..20
  essenceLevel: number;                // 0..20
  masteryMultiplier: number;           // from table (e.g., 0.0..2.0)
  essenceMultiplier: number;           // from table (e.g., 0.0..2.0)
  effectiveMultiplier: number;         // (1 + m + e) or (1+m)*(1+e)
  totalIH: number;                     // baseIH * effectiveMultiplier (%)
  stacking: StackMode;
  infantry_health_pct: number;         // Total Infantry Health percentage for front end
  infantry_attack_pct: number;         // Infantry Attack Empowerment bonus (%)
  infantry_defense_pct: number;        // Infantry Defense Empowerment bonus (%)
  infantry_power: number;              // Infantry Power (placeholder for future implementation)
}

/**
 * Mastery/Essence multiplier table (level -> multiplier).
 * Matches your "Mastery | Multiplier" rows exactly.
 * 0→0.0, 1→0.1, ..., 20→2.0
 */
const ESSENCE_STONE_LEVEL = [
  0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
  1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
  2.0
];

/**
 * Belt (Mythical) — Infantry Health (%) by gear level.
 * Index = level (0..200), value = base IH% at that level (before mastery/essence multipliers).
 * Copied 1:1 from your Level→Stats table.
 */
const BELT_IH_BY_LEVEL = [
  3.80, 3.80, 4.26, 4.73, 5.20, 5.66, 6.13, 6.60, 7.06, 7.53,
  8.00, 8.46, 8.93, 9.40, 9.86, 10.33, 10.80, 11.26, 11.73, 12.20,
  12.66, 13.13, 13.60, 14.06, 14.53, 15.00, 15.46, 15.93, 16.40, 16.86,
  17.33, 17.80, 18.26, 18.73, 19.20, 19.66, 20.13, 20.60, 21.06, 21.53,
  22.00, 22.46, 22.93, 23.40, 23.86, 24.33, 24.80, 25.26, 25.73, 26.20,
  26.66, 27.13, 27.60, 28.06, 28.53, 29.00, 29.46, 29.93, 30.40, 30.86,
  31.33, 31.80, 32.26, 32.73, 33.20, 33.66, 34.13, 34.60, 35.06, 35.53,
  36.00, 36.46, 36.93, 37.40, 37.86, 38.33, 38.80, 39.26, 39.73, 40.20,
  40.66, 41.13, 41.60, 42.06, 42.53, 43.00, 43.46, 43.93, 44.40, 44.86,
  45.33, 45.80, 46.26, 46.73, 47.20, 47.66, 48.13, 48.60, 49.06, 49.53,
  50.00, 50.50, 51.00, 51.50, 52.00, 52.50, 53.00, 53.50, 54.00, 54.50,
  55.00, 55.50, 56.00, 56.50, 57.00, 57.50, 58.00, 58.50, 59.00, 59.50,
  60.00, 60.50, 61.00, 61.50, 62.00, 62.50, 63.00, 63.50, 64.00, 64.50,
  65.00, 65.50, 66.00, 66.50, 67.00, 67.50, 68.00, 68.50, 69.00, 69.50,
  70.00, 70.50, 71.00, 71.50, 72.00, 72.50, 73.00, 73.50, 74.00, 74.50,
  75.00, 75.50, 76.00, 76.50, 77.00, 77.50, 78.00, 78.50, 79.00, 79.50,
  80.00, 80.50, 81.00, 81.50, 82.00, 82.50, 83.00, 83.50, 84.00, 84.50,
  85.00, 85.50, 86.00, 86.50, 87.00, 87.50, 88.00, 88.50, 89.00, 89.50,
  90.00, 90.50, 91.00, 91.50, 92.00, 92.50, 93.00, 93.50, 94.00, 94.50,
  95.00, 95.50, 96.00, 96.50, 97.00, 97.50, 98.00, 98.50, 99.00, 99.50,
  100.00
];

/**
 * Belt (Mythical) - Power by gear level.
 * Index = level (0..200), value = power at that level.
 * Data from hero_gear.xlsx
 */
const BELT_POWER_BY_LEVEL: number[] = [
  2900.0, 2900.0, 3325.0, 3775.0, 4225.0, 4700.0, 5175.0, 5675.0, 6200.0, 6750.0,
  7325.0, 7900.0, 8500.0, 9125.0, 9775.0, 10425.0, 11125.0, 11825.0, 12575.0, 13325.0,
  14125.0, 14925.0, 15775.0, 16625.0, 17525.0, 18450.0, 19400.0, 20400.0, 21425.0, 22475.0,
  23550.0, 24675.0, 25825.0, 27000.0, 28225.0, 29500.0, 30800.0, 32150.0, 33525.0, 34950.0,
  36425.0, 37950.0, 39525.0, 41125.0, 42775.0, 44500.0, 46250.0, 48075.0, 49925.0, 51850.0,
  53825.0, 55875.0, 57975.0, 60125.0, 62350.0, 64625.0, 67000.0, 69400.0, 71900.0, 74475.0,
  77100.0, 79825.0, 82600.0, 85475.0, 88425.0, 91475.0, 94600.0, 97800.0, 101100.0, 104500.0,
  108000.0, 111575.0, 115275.0, 119050.0, 122950.0, 126950.0, 131075.0, 135300.0, 139650.0, 144100.0,
  148700.0, 153425.0, 158250.0, 163225.0, 168350.0, 173600.0, 179000.0, 184525.0, 190225.0, 196075.0,
  202075.0, 208225.0, 214550.0, 221050.0, 227725.0, 234575.0, 241625.0, 248825.0, 256250.0, 263850.0,
  271675.0, 559000.0, 574650.0, 590300.0, 605950.0, 621600.0, 637250.0, 652900.0, 668550.0, 684200.0,
  699850.0, 715500.0, 731150.0, 746800.0, 762450.0, 778100.0, 793750.0, 809400.0, 825050.0, 840700.0,
  1046826.0, 1062476.0, 1078126.0, 1093776.0, 1109426.0, 1125076.0, 1140726.0, 1156376.0, 1172026.0, 1187676.0,
  1203326.0, 1218976.0, 1234626.0, 1250276.0, 1265926.0, 1281576.0, 1297226.0, 1312876.0, 1328526.0, 1344176.0,
  1367633.0, 1391089.0, 1414545.0, 1438002.0, 1461458.0, 1484915.0, 1508371.0, 1531827.0, 1555284.0, 1578740.0,
  1602197.0, 1625653.0, 1649109.0, 1672566.0, 1696022.0, 1719479.0, 1742935.0, 1766391.0, 1789848.0, 1813304.0,
  1836761.0, 1860217.0, 1883673.0, 1907130.0, 1930586.0, 1954043.0, 1977499.0, 2000955.0, 2024412.0, 2047868.0,
  2071325.0, 2094781.0, 2118237.0, 2141694.0, 2165150.0, 2188607.0, 2212063.0, 2235519.0, 2258976.0, 2282432.0,
  2305889.0, 2329345.0, 2352801.0, 2376258.0, 2399714.0, 2423171.0, 2446627.0, 2470083.0, 2493540.0, 2516996.0,
  2540453.0, 2563909.0, 2587365.0, 2610822.0, 2634278.0, 2657735.0, 2681191.0, 2704647.0, 2728104.0, 2751560.0,
  2775017.0
];

function clamp(n: number, min_val: number, max_val: number): number {
  return Math.min(Math.max(Math.floor(n), min_val), max_val);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Core calculator.
 * - If masteryForged=false, ignores mastery/essence and returns base.
 * - If masteryForged=true, applies both mastery and essence multipliers.
 * - stacking="additive": total = base * (1 + mastery + essence)
 * - stacking="multiplicative": total = base * (1 + mastery) * (1 + essence)
 * - Adds Infantry Attack and Defense Empowerment bonuses based on empowerment_level:
 *   - +20 Empowerment (unlocks at level 120): +20% Infantry Attack
 *   - +40 Empowerment (unlocks at level 140): No expedition bonus
 *   - +60 Empowerment (unlocks at level 160): +30% Infantry Defense
 *   - +80 Empowerment (unlocks at level 180): No expedition bonus
 *   - +100 Empowerment (unlocks at level 200): +50% Infantry Attack (stacks with +20)
 */
export function calc_belt_infantry_ih(
  level: number,
  mastery_forged: boolean,
  mastery_level: number = 0,
  essence_level: number = 0,
  stacking: StackMode = "additive",
  empowerment_level: number = 0
): IHResult {
  const lvl = clamp(level, 0, 200);
  const base_ih = BELT_IH_BY_LEVEL[lvl];

  const m_lvl = mastery_forged ? clamp(mastery_level, 0, 20) : 0;
  const e_lvl = mastery_forged ? clamp(essence_level, 0, 20) : 0;

  const m_mul = ESSENCE_STONE_LEVEL[m_lvl];
  const e_mul = ESSENCE_STONE_LEVEL[e_lvl];

  let effective_multiplier: number;
  if (stacking === "additive") {
    effective_multiplier = 1 + m_mul + e_mul;
  } else {  // multiplicative
    effective_multiplier = (1 + m_mul) * (1 + e_mul);
  }

  const total_ih = round2(base_ih * effective_multiplier);

  // Calculate infantry_health_pct for front end
  const infantry_health_pct = total_ih;

  // Calculate Infantry Attack and Defense Empowerment bonuses based on level
  let infantry_attack_pct = 0.0;
  let infantry_defense_pct = 0.0;

  // Power calculation: If mastery forged (level 10+), use mastery power as total. Otherwise use base power.
  let infantry_power: number;
  if (mastery_forged && m_lvl >= 10) {
    // Use mastery power as the total power (M10-M20_Power columns from Excel)
    infantry_power = getMasteryPower('belt', lvl, m_lvl, mastery_forged);
  } else {
    // Use base power when not mastery forged or mastery level < 10
    infantry_power = BELT_POWER_BY_LEVEL[lvl];
  }

  // Calculate Infantry Attack and Defense Empowerment bonuses
  // Empowerment bonuses are strictly additive and based on empowerment_level parameter
  // Empowerment unlocks: +20 (level 120+), +40 (level 140+), +60 (level 160+), +80 (level 180+), +100 (level 200+)
  // Empowerment bonuses apply based on selected empowerment_level
  // Goggles & Belt: +20 → +20% Attack, +60 → +30% Defense, +100 → +50% Attack
  if (empowerment_level >= 20) {
    infantry_attack_pct += 20.0;
  }
  // +40: No expedition bonus (gear enhancement only)
  if (empowerment_level >= 60) {
    infantry_defense_pct += 30.0;
  }
  // +80: No expedition bonus (gear enhancement only)
  if (empowerment_level >= 100) {
    infantry_attack_pct += 50.0;
  }

  return {
    level: lvl,
    baseIH: base_ih,
    masteryForged: mastery_forged,
    masteryLevel: m_lvl,
    essenceLevel: e_lvl,
    masteryMultiplier: m_mul,
    essenceMultiplier: e_mul,
    effectiveMultiplier: effective_multiplier,
    totalIH: total_ih,
    stacking: stacking,
    infantry_health_pct: infantry_health_pct,
    infantry_attack_pct: infantry_attack_pct,
    infantry_defense_pct: infantry_defense_pct,
    infantry_power: infantry_power
  };
}
