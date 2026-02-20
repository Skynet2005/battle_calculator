/**
 * Unit tests for battle calculator helper functions.
 */

import { describe, expect, it } from 'vitest';
import {
  createEmptyPetSkillSelections,
  createEmptyBaseStats,
  normalizeAdditiveBonuses,
  normalizeMultiplicativeBonuses,
  createDefaultAdditiveBonuses,
  createDefaultMultiplicativeBonuses,
  ensureTroopCounts,
  sumCapacityCounts,
  normalizeTroopMix,
  hasTroops,
  sanitizeMix,
} from '../battle-calculator-helpers';

describe('createEmptyPetSkillSelections', () => {
  it('returns an empty object', () => {
    const result = createEmptyPetSkillSelections();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});

describe('createEmptyBaseStats', () => {
  it('returns zero stats for all troop types', () => {
    const stats = createEmptyBaseStats();
    expect(stats.infantry).toEqual({ attack: 0, defense: 0, health: 0, lethality: 0 });
    expect(stats.lancer).toEqual({ attack: 0, defense: 0, health: 0, lethality: 0 });
    expect(stats.marksman).toEqual({ attack: 0, defense: 0, health: 0, lethality: 0 });
  });
});

describe('normalizeAdditiveBonuses', () => {
  it('returns defaults when input is undefined', () => {
    const result = normalizeAdditiveBonuses(undefined);
    expect(result.temporaryEvents).toBeDefined();
    expect(result.supremePresident).toBeDefined();
    expect(result.specialBuffs).toBeDefined();
  });

  it('preserves existing values', () => {
    const input = {
      temporaryEvents: { attack: 10, defense: 5, lethality: 3, health: 2 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };
    const result = normalizeAdditiveBonuses(input);
    expect(result.temporaryEvents.attack).toBe(10);
  });
});

describe('normalizeMultiplicativeBonuses', () => {
  it('returns defaults when input is undefined', () => {
    const result = normalizeMultiplicativeBonuses(undefined);
    expect(result.castleBuffs).toBeDefined();
    expect(result.eventBuffs).toBeDefined();
    expect(result.cityBonuses).toBeDefined();
  });
});

describe('createDefaultAdditiveBonuses', () => {
  it('returns all-zero additive bonuses', () => {
    const result = createDefaultAdditiveBonuses();
    expect(result.temporaryEvents.attack).toBe(0);
    expect(result.supremePresident.attack).toBe(0);
    expect(result.specialBuffs.attack).toBe(0);
  });
});

describe('createDefaultMultiplicativeBonuses', () => {
  it('returns all-zero multiplicative bonuses', () => {
    const result = createDefaultMultiplicativeBonuses();
    expect(result.castleBuffs.attack).toBe(0);
    expect(result.cityBonuses.enemyAttackReduction).toBe(0);
  });
});

describe('ensureTroopCounts', () => {
  it('returns side unchanged when it already has troops', () => {
    const side = {
      role: 'attacker' as const,
      baseStats: createEmptyBaseStats(),
      heroes: { infantry: null, lancer: null, marksman: null },
      joiners: [],
      troopCounts: { infantry: 10, lancer: 20, marksman: 30 },
      totalTroops: 60,
    };
    const result = ensureTroopCounts(side);
    expect(result.troopCounts).toEqual({ infantry: 10, lancer: 20, marksman: 30 });
  });

  it('uses fallback counts when side has no troops', () => {
    const side = {
      role: 'attacker' as const,
      baseStats: createEmptyBaseStats(),
      heroes: { infantry: null, lancer: null, marksman: null },
      joiners: [],
      troopCounts: { infantry: 0, lancer: 0, marksman: 0 },
      totalTroops: 0,
    };
    const fallback = { infantry: 5, lancer: 5, marksman: 5 };
    const result = ensureTroopCounts(side, fallback);
    expect(result.troopCounts).toEqual(fallback);
  });
});

describe('sumCapacityCounts', () => {
  it('sums capacity arrays correctly', () => {
    const capacity = {
      infantry: [{ count: 10 }, { count: 5 }],
      lancer: [{ count: 20 }],
      marksman: [{ count: 30 }],
    };
    const result = sumCapacityCounts(capacity);
    expect(result.infantry).toBe(15);
    expect(result.lancer).toBe(20);
    expect(result.marksman).toBe(30);
  });

  it('returns 0 for empty arrays', () => {
    const capacity = {
      infantry: [] as { count: number }[],
      lancer: [] as { count: number }[],
      marksman: [] as { count: number }[],
    };
    const result = sumCapacityCounts(capacity);
    expect(result.infantry).toBe(0);
    expect(result.lancer).toBe(0);
    expect(result.marksman).toBe(0);
  });
});

describe('normalizeTroopMix', () => {
  it('normalizes ratios to sum to ~100', () => {
    const mix = { totalTroops: 100, infantryRatio: 50, lancerRatio: 30, marksmanRatio: 20 };
    const result = normalizeTroopMix(mix);
    const total = result.infantryRatio + result.lancerRatio + result.marksmanRatio;
    expect(total).toBeCloseTo(100, 0);
  });
});

describe('hasTroops', () => {
  it('returns true when any troop count > 0', () => {
    expect(hasTroops({ infantry: 1, lancer: 0, marksman: 0 })).toBe(true);
  });

  it('returns false when all counts are 0', () => {
    expect(hasTroops({ infantry: 0, lancer: 0, marksman: 0 })).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(hasTroops(null)).toBe(false);
    expect(hasTroops(undefined)).toBe(false);
  });
});

describe('sanitizeMix', () => {
  it('ensures totalTroops is non-negative', () => {
    const mix = { totalTroops: -5, infantryRatio: 33, lancerRatio: 33, marksmanRatio: 34 };
    const result = sanitizeMix(mix);
    expect(result.totalTroops).toBeGreaterThanOrEqual(0);
  });

  it('ensures ratios are non-negative', () => {
    const mix = { totalTroops: 100, infantryRatio: -10, lancerRatio: 60, marksmanRatio: 50 };
    const result = sanitizeMix(mix);
    expect(result.infantryRatio).toBeGreaterThanOrEqual(0);
  });
});
