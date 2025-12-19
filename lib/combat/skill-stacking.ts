/**
 * Skill Stacking Rules Implementation
 *
 * Implements the stacking rules:
 * - Same skill type → Additive (sum percentages)
 * - Different skill types → Multiplicative (multiply effects)
 */

import type { DamageModifier } from "./types";

/**
 * Categorize a modifier by its effect type for stacking purposes
 *
 * Key principle: Same effect type (e.g., "damage up") should be additive,
 * different effect types should be multiplicative.
 */
export function categorizeModifierType(modifier: DamageModifier): string {
  const source = modifier.source.toLowerCase();
  const id = modifier.id.toLowerCase();
  const combined = `${source} ${id}`.toLowerCase();

  // Check for damage increases first (most common)
  if (combined.includes('damage_up') || combined.includes('damage_increase') ||
    combined.includes('extra_damage') || combined.includes('damage_dealt') ||
    (combined.includes('damage') && combined.includes('up') && !combined.includes('taken') && !combined.includes('down'))) {
    return 'damage';
  }

  // Check for damage reductions (defensive)
  if (combined.includes('damage_taken_down') || combined.includes('damage_reduction') ||
    combined.includes('damage_received') ||
    (combined.includes('damage') && combined.includes('taken') && combined.includes('down'))) {
    return 'damageReduction';
  }

  // Enemy damage down (debuff)
  if (combined.includes('enemy_damage_down') ||
    (combined.includes('enemy') && combined.includes('damage') && combined.includes('down'))) {
    return 'enemyDamageDown';
  }

  // Attack modifiers
  if (combined.includes('attack_up') || combined.includes('attack_increase') ||
    (combined.includes('attack') && combined.includes('up') && !combined.includes('damage'))) {
    return 'attack';
  }

  // Enemy attack reduction
  if (combined.includes('enemy_attack_down') ||
    (combined.includes('enemy') && combined.includes('attack') && combined.includes('down'))) {
    return 'enemyAttackReduction';
  }

  // Defense modifiers
  if (combined.includes('defense_up') || combined.includes('defense_increase')) {
    return 'defense';
  }

  // Health modifiers
  if (combined.includes('health_up') || combined.includes('health_increase')) {
    return 'health';
  }

  // Lethality modifiers
  if (combined.includes('lethality_up') || combined.includes('lethality_increase')) {
    return 'lethality';
  }

  // Lethality reduction
  if (combined.includes('lethality_reduction') || combined.includes('lethality_down')) {
    return 'lethalityReduction';
  }

  // Enemy damage taken up (vulnerability debuff)
  if (combined.includes('enemy_damage_taken_up') || combined.includes('target_damage_taken_up')) {
    return 'enemyDamageTakenUp';
  }

  // Default: use a base type based on subject and scope
  // This ensures modifiers with same subject/scope stack additively
  return `${modifier.subject}_${modifier.scope || 'Any'}`;
}

/**
 * Apply stacking rules to modifiers:
 * - Same type: Additive (sum magnitudes)
 * - Different types: Multiplicative (each type becomes a multiplier)
 */
export function applyStackingRules(modifiers: DamageModifier[]): number[] {
  // Group modifiers by type
  const modifiersByType = new Map<string, number[]>();

  modifiers.forEach(mod => {
    const type = categorizeModifierType(mod);
    if (!modifiersByType.has(type)) {
      modifiersByType.set(type, []);
    }
    modifiersByType.get(type)!.push(mod.magnitude);
  });

  // Sum magnitudes within same type, then convert to multipliers
  const multipliers: number[] = [];

  modifiersByType.forEach((magnitudes, type) => {
    // Sum magnitudes for same type (additive)
    const sum = magnitudes.reduce((acc, mag) => acc + mag, 0);
    // Clamp to prevent negative multipliers
    const clampedSum = Math.max(-0.99, sum); // Allow up to 99% reduction
    multipliers.push(clampedSum);
  });

  return multipliers;
}

/**
 * Compute final multiplier from modifiers using stacking rules
 */
export function computeFinalMultiplier(modifiers: DamageModifier[]): number {
  const multipliers = applyStackingRules(modifiers);

  // Multiply all type multipliers together
  const result = multipliers.reduce((acc, mag) => acc * (1 + mag), 1);

  // Clamp to prevent negative or zero multipliers
  return Math.max(0.01, result);
}
