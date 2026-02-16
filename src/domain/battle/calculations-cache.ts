/**
 * Memoization utilities for battle calculations
 *
 * Provides caching for expensive calculation functions to improve performance.
 * Uses a simple LRU-style cache with size limits to prevent memory leaks.
 */

import type {
  AdditiveBonuses,
  BasicBonuses,
  FinalStats,
  MultiplicativeBonuses,
  TroopType,
} from './calculations';

// Cache configuration
const MAX_CACHE_SIZE = 200;
const CACHE_CLEANUP_THRESHOLD = 250; // Clean up when cache exceeds this size

/**
 * Simple cache implementation with size limits
 */
class CalculationCache<K, V> {
  private cache = new Map<K, V>();
  private accessOrder: K[] = [];

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing entry
      this.cache.set(key, value);
      // Move to end
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    } else {
      // Add new entry
      this.cache.set(key, value);
      this.accessOrder.push(key);

      // Clean up if cache is too large
      if (this.cache.size > CACHE_CLEANUP_THRESHOLD) {
        this.cleanup();
      }
    }
  }

  private cleanup(): void {
    // Remove oldest entries (from the beginning)
    const toRemove = this.cache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Create a stable cache key from calculation inputs
 */
function createFinalStatsCacheKey(
  basicBonuses: BasicBonuses,
  additiveBonuses: AdditiveBonuses,
  selfMultipliers: MultiplicativeBonuses,
  troopType: TroopType,
  enemyMultipliers?: MultiplicativeBonuses
): string {
  // Create a deterministic key from the inputs
  // Using JSON.stringify with sorted keys for consistency
  const keyParts = [
    JSON.stringify(basicBonuses),
    JSON.stringify(additiveBonuses),
    JSON.stringify(selfMultipliers),
    troopType,
    enemyMultipliers ? JSON.stringify(enemyMultipliers) : 'no-enemy',
  ];
  return keyParts.join('|');
}

/**
 * Create a cache key for damage calculations
 */
function createDamageCacheKey(
  troopCount: number,
  attackPercent: number,
  lethalityPercent: number,
  enemyDefensePercent: number,
  hiddenFactor: number,
  damageUp: number,
  damageReduction: number
): string {
  // Round values to reduce cache key variations from floating point precision
  return `${Math.round(troopCount)}|${Math.round(attackPercent * 100) / 100}|${Math.round(lethalityPercent * 100) / 100}|${Math.round(enemyDefensePercent * 100) / 100}|${hiddenFactor}|${Math.round(damageUp * 100) / 100}|${Math.round(damageReduction * 100) / 100}`;
}

// Cache instances
const finalStatsCache = new CalculationCache<string, FinalStats>();
const damageCache = new CalculationCache<string, number>();

/**
 * Memoized version of calculateFinalStats
 *
 * @param calculateFinalStatsFn - The original calculateFinalStats function
 * @param basicBonuses - Basic bonuses
 * @param additiveBonuses - Additive bonuses
 * @param selfMultipliers - Self multipliers
 * @param troopType - Troop type
 * @param enemyMultipliers - Optional enemy multipliers
 * @returns Cached or newly calculated final stats
 */
export function memoizedCalculateFinalStats(
  calculateFinalStatsFn: (
    basicBonuses: BasicBonuses,
    additiveBonuses: AdditiveBonuses,
    selfMultipliers: MultiplicativeBonuses,
    troopType: TroopType,
    enemyMultipliers?: MultiplicativeBonuses
  ) => FinalStats,
  basicBonuses: BasicBonuses,
  additiveBonuses: AdditiveBonuses,
  selfMultipliers: MultiplicativeBonuses,
  troopType: TroopType,
  enemyMultipliers?: MultiplicativeBonuses
): FinalStats {
  const cacheKey = createFinalStatsCacheKey(
    basicBonuses,
    additiveBonuses,
    selfMultipliers,
    troopType,
    enemyMultipliers
  );

  const cached = finalStatsCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = calculateFinalStatsFn(
    basicBonuses,
    additiveBonuses,
    selfMultipliers,
    troopType,
    enemyMultipliers
  );

  finalStatsCache.set(cacheKey, result);
  return result;
}

/**
 * Memoized version of calculateDamage
 *
 * @param calculateDamageFn - The original calculateDamage function
 * @param troopCount - Troop count
 * @param attackPercent - Attack percentage
 * @param lethalityPercent - Lethality percentage
 * @param enemyDefensePercent - Enemy defense percentage
 * @param hiddenFactor - Hidden factor
 * @param damageUp - Damage up percentage
 * @param damageReduction - Damage reduction percentage
 * @returns Cached or newly calculated damage
 */
export function memoizedCalculateDamage(
  calculateDamageFn: (
    troopCount: number,
    attackPercent: number,
    lethalityPercent: number,
    enemyDefensePercent: number,
    hiddenFactor: number,
    mods: { attackerDamageUpPct: number; defenderDamageReductionPct: number }
  ) => number,
  troopCount: number,
  attackPercent: number,
  lethalityPercent: number,
  enemyDefensePercent: number,
  hiddenFactor: number,
  damageUp: number,
  damageReduction: number
): number {
  const cacheKey = createDamageCacheKey(
    troopCount,
    attackPercent,
    lethalityPercent,
    enemyDefensePercent,
    hiddenFactor,
    damageUp,
    damageReduction
  );

  const cached = damageCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = calculateDamageFn(
    troopCount,
    attackPercent,
    lethalityPercent,
    enemyDefensePercent,
    hiddenFactor,
    { attackerDamageUpPct: damageUp, defenderDamageReductionPct: damageReduction }
  );

  damageCache.set(cacheKey, result);
  return result;
}

/**
 * Clear all calculation caches
 * Useful for testing or when memory needs to be freed
 */
export function clearCalculationCaches(): void {
  finalStatsCache.clear();
  damageCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  finalStatsCacheSize: number;
  damageCacheSize: number;
} {
  return {
    finalStatsCacheSize: finalStatsCache.size,
    damageCacheSize: damageCache.size,
  };
}
