/**
 * Hero Gear Capacity Calculation Engine
 *
 * Calculates troop capacity based on hero gear bonuses using the formula:
 *   EffectiveCapacity = BaseCapacity * K * (TroopCount ^ alpha) * (1 + GearBonusPercent/100)
 *
 * Where:
 *   - BaseCapacity: The base troop capacity value
 *   - K: Calibration constant for scaling
 *   - alpha: Troop count exponent for non-linear scaling
 *   - GearBonusPercent: Combined hero gear bonus percentages
 */

import type { TroopType } from '../../../combat/types';
import { TROOP_TYPE_VALUES } from '../../../combat/types';

/**
 * Configuration for capacity calculation
 */
export interface CapacityCalculationConfig {
  /** Exponent for troop count in capacity formula (default 0.5) */
  troopCountExponentAlpha: number;
  /** Calibration constant K for scaling (default 1.0) */
  calibrationConstantK: number;
}

/**
 * Default capacity calculation configuration
 */
export const DEFAULT_CAPACITY_CONFIG: CapacityCalculationConfig = {
  troopCountExponentAlpha: 0.5,
  calibrationConstantK: 1.0,
};

/**
 * Hero gear bonuses for a single troop type
 */
export interface TroopGearBonuses {
  /** Lethality bonus percentage */
  lethality: number;
  /** Health bonus percentage */
  health: number;
  /** Attack bonus percentage */
  attack: number;
  /** Defense bonus percentage */
  defense: number;
}

/**
 * Hero gear bonuses for all troop types
 */
export interface HeroGearBonusesInput {
  infantry: TroopGearBonuses;
  lancer: TroopGearBonuses;
  marksman: TroopGearBonuses;
}

/**
 * Capacity result for a single troop type
 */
export interface TroopCapacityResult {
  /** Base capacity before gear bonuses */
  baseCapacity: number;
  /** Gear bonus multiplier (1 + total bonus / 100) */
  gearBonusMultiplier: number;
  /** Troop count scaling factor (troopCount ^ alpha) */
  countScalingFactor: number;
  /** Effective capacity after all calculations */
  effectiveCapacity: number;
  /** Breakdown of gear bonuses applied */
  gearBonusBreakdown: TroopGearBonuses;
}

/**
 * Complete capacity calculation result
 */
export interface CapacityCalculationResult {
  /** Configuration used for calculation */
  config: CapacityCalculationConfig;
  /** Results per troop type */
  byTroopType: Record<TroopType, TroopCapacityResult>;
  /** Total effective capacity across all troop types */
  totalEffectiveCapacity: number;
  /** Total base capacity across all troop types */
  totalBaseCapacity: number;
}

/**
 * Input parameters for capacity calculation
 */
export interface CapacityCalculationInput {
  /** Base capacity values per troop type */
  baseCapacities: Record<TroopType, number>;
  /** Troop counts per type (used for alpha exponent scaling) */
  troopCounts: Record<TroopType, number>;
  /** Hero gear bonuses per troop type */
  heroGearBonuses: HeroGearBonusesInput;
  /** Optional configuration override */
  config?: Partial<CapacityCalculationConfig>;
}

/**
 * Calculate the combined gear bonus percentage for a troop type.
 * Uses the sum of all stat bonuses weighted by their contribution to capacity.
 *
 * For capacity calculations, health and defense are primary contributors
 * as they affect troop survivability and effective deployment.
 *
 * @param bonuses The gear bonuses for a troop type
 * @returns Combined bonus percentage
 */
export function calculateCombinedGearBonus(bonuses: TroopGearBonuses): number {
  // Weight factors for each stat's contribution to capacity
  // Health and defense are weighted higher as they directly affect troop survivability
  const weights = {
    health: 0.35,
    defense: 0.35,
    attack: 0.15,
    lethality: 0.15,
  };

  const weightedSum =
    bonuses.health * weights.health +
    bonuses.defense * weights.defense +
    bonuses.attack * weights.attack +
    bonuses.lethality * weights.lethality;

  return weightedSum;
}

/**
 * Calculate capacity for a single troop type
 *
 * Formula: EffectiveCapacity = BaseCapacity * K * (TroopCount ^ alpha) * (1 + GearBonus/100)
 *
 * @param baseCapacity Base capacity value
 * @param troopCount Number of troops (for alpha scaling)
 * @param gearBonuses Gear bonuses for this troop type
 * @param config Calculation configuration
 * @returns Capacity result for this troop type
 */
export function calculateTroopCapacity(
  baseCapacity: number,
  troopCount: number,
  gearBonuses: TroopGearBonuses,
  config: CapacityCalculationConfig = DEFAULT_CAPACITY_CONFIG
): TroopCapacityResult {
  const { troopCountExponentAlpha, calibrationConstantK } = config;

  // Calculate combined gear bonus
  const combinedGearBonus = calculateCombinedGearBonus(gearBonuses);
  const gearBonusMultiplier = 1 + combinedGearBonus / 100;

  // Calculate troop count scaling factor
  // Use max(troopCount, 1) to avoid edge cases with 0 troops
  const effectiveTroopCount = Math.max(troopCount, 1);
  const countScalingFactor = Math.pow(effectiveTroopCount, troopCountExponentAlpha);

  // Calculate effective capacity
  const effectiveCapacity = baseCapacity * calibrationConstantK * countScalingFactor * gearBonusMultiplier;

  return {
    baseCapacity,
    gearBonusMultiplier,
    countScalingFactor,
    effectiveCapacity: Math.round(effectiveCapacity * 100) / 100, // Round to 2 decimal places
    gearBonusBreakdown: { ...gearBonuses },
  };
}

/**
 * Calculate capacity for all troop types
 *
 * @param input Calculation input parameters
 * @returns Complete capacity calculation result
 */
export function calculateCapacity(input: CapacityCalculationInput): CapacityCalculationResult {
  const config: CapacityCalculationConfig = {
    ...DEFAULT_CAPACITY_CONFIG,
    ...input.config,
  };

  const byTroopType = {} as Record<TroopType, TroopCapacityResult>;
  let totalEffectiveCapacity = 0;
  let totalBaseCapacity = 0;

  for (const troopType of TROOP_TYPE_VALUES) {
    const troopTypeLower = troopType.toLowerCase() as keyof HeroGearBonusesInput;

    const result = calculateTroopCapacity(
      input.baseCapacities[troopType],
      input.troopCounts[troopType],
      input.heroGearBonuses[troopTypeLower],
      config
    );

    byTroopType[troopType] = result;
    totalEffectiveCapacity += result.effectiveCapacity;
    totalBaseCapacity += result.baseCapacity;
  }

  return {
    config,
    byTroopType,
    totalEffectiveCapacity: Math.round(totalEffectiveCapacity * 100) / 100,
    totalBaseCapacity,
  };
}

/**
 * Calculate capacity using simplified inputs
 * Convenience function when you have uniform base capacity across troop types
 *
 * @param baseCapacity Uniform base capacity for all troop types
 * @param troopCounts Troop counts per type
 * @param heroGearBonuses Hero gear bonuses per troop type
 * @param config Optional configuration
 * @returns Complete capacity calculation result
 */
export function calculateCapacitySimple(
  baseCapacity: number,
  troopCounts: Record<TroopType, number>,
  heroGearBonuses: HeroGearBonusesInput,
  config?: Partial<CapacityCalculationConfig>
): CapacityCalculationResult {
  return calculateCapacity({
    baseCapacities: {
      Infantry: baseCapacity,
      Lancer: baseCapacity,
      Marksman: baseCapacity,
    },
    troopCounts,
    heroGearBonuses,
    config,
  });
}

/**
 * Get the effective capacity multiplier from gear bonuses alone
 * Useful for displaying the gear bonus impact without troop count scaling
 *
 * @param heroGearBonuses Hero gear bonuses per troop type
 * @returns Multipliers per troop type
 */
export function getGearCapacityMultipliers(
  heroGearBonuses: HeroGearBonusesInput
): Record<TroopType, number> {
  const result = {} as Record<TroopType, number>;

  for (const troopType of TROOP_TYPE_VALUES) {
    const troopTypeLower = troopType.toLowerCase() as keyof HeroGearBonusesInput;
    const combinedBonus = calculateCombinedGearBonus(heroGearBonuses[troopTypeLower]);
    result[troopType] = 1 + combinedBonus / 100;
  }

  return result;
}

/**
 * Create zero gear bonuses (no bonuses applied)
 * Useful as a default or for testing
 */
export function createZeroGearBonuses(): HeroGearBonusesInput {
  const zeroBonuses: TroopGearBonuses = {
    lethality: 0,
    health: 0,
    attack: 0,
    defense: 0,
  };

  return {
    infantry: { ...zeroBonuses },
    lancer: { ...zeroBonuses },
    marksman: { ...zeroBonuses },
  };
}

/**
 * Validate capacity calculation input
 * Throws an error if input is invalid
 *
 * @param input Input to validate
 */
export function validateCapacityInput(input: CapacityCalculationInput): void {
  // Validate base capacities
  for (const troopType of TROOP_TYPE_VALUES) {
    if (typeof input.baseCapacities[troopType] !== 'number' || input.baseCapacities[troopType] < 0) {
      throw new Error(`Invalid base capacity for ${troopType}: must be a non-negative number`);
    }
  }

  // Validate troop counts
  for (const troopType of TROOP_TYPE_VALUES) {
    if (typeof input.troopCounts[troopType] !== 'number' || input.troopCounts[troopType] < 0) {
      throw new Error(`Invalid troop count for ${troopType}: must be a non-negative number`);
    }
  }

  // Validate config if provided
  if (input.config) {
    if (input.config.troopCountExponentAlpha !== undefined) {
      if (typeof input.config.troopCountExponentAlpha !== 'number' ||
          input.config.troopCountExponentAlpha < 0 ||
          input.config.troopCountExponentAlpha > 2) {
        throw new Error('Invalid troopCountExponentAlpha: must be a number between 0 and 2');
      }
    }
    if (input.config.calibrationConstantK !== undefined) {
      if (typeof input.config.calibrationConstantK !== 'number' ||
          input.config.calibrationConstantK <= 0) {
        throw new Error('Invalid calibrationConstantK: must be a positive number');
      }
    }
  }
}
