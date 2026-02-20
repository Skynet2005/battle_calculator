/**
 * Unit tests for the bonuses aggregation module.
 */

import { describe, expect, it } from 'vitest';
import {
  aggregateAdditive,
  applySpecialFormula,
  aggregateSpecial,
  computeEffectiveStats,
  enforceStacking,
  normalizeModifiers,
  zeroStats,
  cloneStats,
} from '../engine/bonuses';
import type { AdditiveBonuses, SpecialBonuses, TroopStats, TroopType, DamageModifier } from '../engine/types';

const baseStats: Record<TroopType, TroopStats> = {
  Infantry: { attack: 100, defense: 80, health: 120, lethality: 60 },
  Lancer: { attack: 90, defense: 90, health: 110, lethality: 70 },
  Marksman: { attack: 110, defense: 70, health: 100, lethality: 80 },
};

describe('zeroStats', () => {
  it('returns all-zero stats', () => {
    const stats = zeroStats();
    expect(stats.attack).toBe(0);
    expect(stats.defense).toBe(0);
    expect(stats.health).toBe(0);
    expect(stats.lethality).toBe(0);
  });

  it('returns a new object each time', () => {
    const a = zeroStats();
    const b = zeroStats();
    expect(a).not.toBe(b);
  });
});

describe('cloneStats', () => {
  it('clones provided stats', () => {
    const original: TroopStats = { attack: 10, defense: 20, health: 30, lethality: 40 };
    const cloned = cloneStats(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('defaults undefined stats to 0', () => {
    const partial = cloneStats({ attack: 5 });
    expect(partial.attack).toBe(5);
    expect(partial.defense).toBe(0);
    expect(partial.health).toBe(0);
    expect(partial.lethality).toBe(0);
  });

  it('handles undefined input', () => {
    const result = cloneStats(undefined);
    expect(result).toEqual({ attack: 0, defense: 0, health: 0, lethality: 0 });
  });
});

describe('aggregateAdditive', () => {
  it('sums All bonuses with troop-specific bonuses', () => {
    const additive: AdditiveBonuses = {
      All: { attack: 10 },
      Infantry: { attack: 5, defense: 3 },
    };
    const result = aggregateAdditive(additive);
    expect(result.Infantry.attack).toBe(15);
    expect(result.Infantry.defense).toBe(3);
    expect(result.Lancer.attack).toBe(10);
    expect(result.Marksman.attack).toBe(10);
  });

  it('handles empty bonuses', () => {
    const result = aggregateAdditive({});
    expect(result.Infantry).toEqual({ attack: 0, defense: 0, health: 0, lethality: 0 });
  });
});

describe('applySpecialFormula', () => {
  it('applies Whiteout Survival formula: base + special + (base * special / 100)', () => {
    expect(applySpecialFormula(100, 20)).toBe(100 + 20 + (100 * 20) / 100);
  });

  it('returns base when special is 0', () => {
    expect(applySpecialFormula(50, 0)).toBe(50);
  });

  it('returns special when base is 0', () => {
    expect(applySpecialFormula(0, 30)).toBe(30);
  });
});

describe('aggregateSpecial', () => {
  it('applies special formula on top of base stats', () => {
    const base: Record<TroopType, TroopStats> = {
      Infantry: { attack: 100, defense: 0, health: 0, lethality: 0 },
      Lancer: { attack: 0, defense: 0, health: 0, lethality: 0 },
      Marksman: { attack: 0, defense: 0, health: 0, lethality: 0 },
    };
    const special: SpecialBonuses = {
      All: { attack: 20 },
    };
    const result = aggregateSpecial(base, special);
    expect(result.Infantry.attack).toBe(applySpecialFormula(100, 20));
  });
});

describe('computeEffectiveStats', () => {
  it('computes final effective stats with all layers', () => {
    const additive: AdditiveBonuses = { All: { attack: 10 } };
    const special: SpecialBonuses = { All: { attack: 5 } };
    const result = computeEffectiveStats(baseStats, additive, special);

    expect(result.Infantry.final.attack).toBeGreaterThan(0);
    expect(result.Infantry.additive.attack).toBe(10);
  });

  it('returns base stats scaled when no bonuses', () => {
    const result = computeEffectiveStats(baseStats, {}, {});
    expect(result.Infantry.final.attack).toBe(baseStats.Infantry.attack);
  });
});

describe('enforceStacking', () => {
  it('keeps strongest modifier per stacking key', () => {
    const items = [
      { stackingKey: 'dmg', magnitude: 0.10 },
      { stackingKey: 'dmg', magnitude: 0.25 },
      { stackingKey: 'def', magnitude: 0.15 },
    ];
    const result = enforceStacking(items);
    expect(result).toHaveLength(2);
    expect(result.find(i => i.stackingKey === 'dmg')?.magnitude).toBe(0.25);
    expect(result.find(i => i.stackingKey === 'def')?.magnitude).toBe(0.15);
  });

  it('keeps items without stacking keys', () => {
    const items = [
      { magnitude: 0.10 },
      { magnitude: 0.20 },
    ];
    const result = enforceStacking(items);
    expect(result).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(enforceStacking([])).toEqual([]);
  });
});

describe('normalizeModifiers', () => {
  it('returns all modifiers in permissive mode', () => {
    const mods: DamageModifier[] = [
      { id: 'a', source: 'x', subject: 'outgoing', appliesTo: 'All', durationTurns: 0, chance: 1, stackingKey: 'dmg', magnitude: 0.1 },
      { id: 'b', source: 'y', subject: 'outgoing', appliesTo: 'All', durationTurns: 0, chance: 1, stackingKey: 'dmg', magnitude: 0.2 },
    ];
    const result = normalizeModifiers(mods, 'permissive');
    expect(result).toHaveLength(2);
  });

  it('enforces stacking in strict mode', () => {
    const mods: DamageModifier[] = [
      { id: 'a', source: 'x', subject: 'outgoing', appliesTo: 'All', durationTurns: 0, chance: 1, stackingKey: 'dmg', magnitude: 0.1 },
      { id: 'b', source: 'y', subject: 'outgoing', appliesTo: 'All', durationTurns: 0, chance: 1, stackingKey: 'dmg', magnitude: 0.2 },
    ];
    const result = normalizeModifiers(mods, 'strict');
    expect(result).toHaveLength(1);
    expect(result[0].magnitude).toBe(0.2);
  });
});
