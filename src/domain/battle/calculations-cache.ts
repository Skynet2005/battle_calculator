/**
 * Memoization utilities for battle calculations
 *
 * Provides caching for expensive calculation functions to improve performance.
 * Uses an LRU cache implemented with Map (insertion order) and size limits.
 */

import type {
  AdditiveBonuses,
  BasicBonuses,
  FinalStats,
  MultiplicativeBonuses,
  TroopType,
} from './calculations';

// Cache configuration (increased for heavy repeated calculations)
const MAX_CACHE_SIZE = 500;
const CACHE_CLEANUP_THRESHOLD = 600;

/**
 * Recursively stringify an object with sorted keys for stable cache keys.
 */
function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const pairs = keys.map((k) => JSON.stringify(k) + ':' + stableStringify((value as Record<string, unknown>)[k]));
  return '{' + pairs.join(',') + '}';
}

/**
 * LRU cache using Map. Insertion order is used; on get we delete+set to move to end.
 * Eviction removes oldest (first) entries when over threshold.
 */
class CalculationCache<K, V> {
  private cache = new Map<K, V>();
  private hits = 0;
  private misses = 0;

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    this.misses++;
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > CACHE_CLEANUP_THRESHOLD) {
      this.cleanup();
    }
  }

  getStats(): { size: number; hits: number; misses: number; hitRate: number; missRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
    };
  }

  private cleanup(): void {
    const toRemove = this.cache.size - MAX_CACHE_SIZE;
    const keysToDelete: K[] = [];
    for (const key of this.cache.keys()) {
      if (keysToDelete.length >= toRemove) break;
      keysToDelete.push(key);
    }
    keysToDelete.forEach((k) => this.cache.delete(k));
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Create a stable cache key from calculation inputs (sorted keys for consistency).
 */
function createFinalStatsCacheKey(
  basicBonuses: BasicBonuses,
  additiveBonuses: AdditiveBonuses,
  selfMultipliers: MultiplicativeBonuses,
  troopType: TroopType,
  enemyMultipliers?: MultiplicativeBonuses
): string {
  const keyParts = [
    stableStringify(basicBonuses),
    stableStringify(additiveBonuses),
    stableStringify(selfMultipliers),
    troopType,
    enemyMultipliers ? stableStringify(enemyMultipliers) : 'no-enemy',
  ];
  return keyParts.join('|');
}

const finalStatsCache = new CalculationCache<string, FinalStats>();

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
 * Clear all calculation caches
 * Useful for testing or when memory needs to be freed
 */
export function clearCalculationCaches(): void {
  finalStatsCache.clear();
}

/**
 * Get cache statistics for monitoring (size and hit/miss rates).
 */
export function getCacheStats(): {
  finalStatsCacheSize: number;
  hitRate: number;
  missRate: number;
  hits: number;
  misses: number;
} {
  const stats = finalStatsCache.getStats();
  return {
    finalStatsCacheSize: stats.size,
    hitRate: stats.hitRate,
    missRate: stats.missRate,
    hits: stats.hits,
    misses: stats.misses,
  };
}
