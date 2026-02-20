/**
 * Unit tests for the damage computation module.
 */

import { describe, expect, it } from 'vitest';
import { computeDamage, productFromMagnitudes, emptyDamage } from '../engine/damage';
import type { DamageInput, BattleConfig } from '../engine/types';
import { DEFAULT_BATTLE_CONFIG } from '../engine/types';

const baseConfig: BattleConfig = { ...DEFAULT_BATTLE_CONFIG, randomMode: 'expectedValue' };

function makeDamageInput(overrides: Partial<DamageInput> = {}): DamageInput {
  return {
    attackerType: 'Infantry',
    defenderType: 'Lancer',
    attackerStats: { attack: 100, defense: 50, health: 80, lethality: 60 },
    defenderStats: { attack: 50, defense: 100, health: 100, lethality: 30 },
    attackerCount: 100,
    defenderCount: 100,
    matchupMultiplier: 1,
    actionMultiplier: 1,
    outgoingModifiers: [],
    incomingModifiers: [],
    ...overrides,
  };
}

describe('computeDamage', () => {
  it('returns zero damage when attacker count is 0', () => {
    const result = computeDamage(makeDamageInput({ attackerCount: 0 }), baseConfig);
    expect(result.finalKills).toBe(0);
    expect(result.baseKills).toBe(0);
  });

  it('returns zero damage when defender count is 0', () => {
    const result = computeDamage(makeDamageInput({ defenderCount: 0 }), baseConfig);
    expect(result.finalKills).toBe(0);
  });

  it('computes positive damage with valid inputs', () => {
    const result = computeDamage(makeDamageInput(), baseConfig);
    expect(result.finalKills).toBeGreaterThan(0);
    expect(result.baseKills).toBeGreaterThan(0);
  });

  it('caps finalKills at defenderCount', () => {
    const input = makeDamageInput({
      attackerStats: { attack: 10000, defense: 50, health: 50, lethality: 10000 },
      defenderStats: { attack: 1, defense: 1, health: 1, lethality: 1 },
      attackerCount: 10000,
      defenderCount: 5,
    });
    const result = computeDamage(input, baseConfig);
    expect(result.finalKills).toBeLessThanOrEqual(5);
  });

  it('applies matchup multiplier correctly', () => {
    const base = computeDamage(makeDamageInput({ matchupMultiplier: 1 }), baseConfig);
    const doubled = computeDamage(makeDamageInput({ matchupMultiplier: 2 }), baseConfig);
    expect(doubled.baseKills).toBeCloseTo(base.baseKills * 2, 5);
  });

  it('applies action multiplier correctly', () => {
    const base = computeDamage(makeDamageInput({ actionMultiplier: 1 }), baseConfig);
    const tripled = computeDamage(makeDamageInput({ actionMultiplier: 3 }), baseConfig);
    expect(tripled.baseKills).toBeCloseTo(base.baseKills * 3, 5);
  });

  it('applies outgoing modifiers multiplicatively', () => {
    const base = computeDamage(makeDamageInput(), baseConfig);
    const withMod = computeDamage(
      makeDamageInput({ outgoingModifiers: [0.25] }),
      baseConfig
    );
    expect(withMod.finalKills).toBeGreaterThan(base.finalKills);
    expect(withMod.outgoingMultiplier).toBeCloseTo(1.25, 5);
  });

  it('applies incoming modifiers multiplicatively', () => {
    const withReduction = computeDamage(
      makeDamageInput({ incomingModifiers: [-0.5] }),
      baseConfig
    );
    expect(withReduction.incomingMultiplier).toBeCloseTo(0.5, 5);
  });

  it('respects calibration constant K', () => {
    const k1 = computeDamage(makeDamageInput(), { ...baseConfig, calibrationConstantK: 1 });
    const k2 = computeDamage(makeDamageInput(), { ...baseConfig, calibrationConstantK: 2 });
    expect(k2.baseKills).toBeCloseTo(k1.baseKills * 2, 5);
  });

  it('uses troopCountExponentAlpha for troop count scaling', () => {
    const alpha05 = computeDamage(makeDamageInput(), { ...baseConfig, troopCountExponentAlpha: 0.5 });
    const alpha1 = computeDamage(makeDamageInput(), { ...baseConfig, troopCountExponentAlpha: 1.0 });
    expect(alpha1.nTerm).toBeGreaterThan(alpha05.nTerm);
  });
});

describe('productFromMagnitudes', () => {
  it('returns 1 for empty array', () => {
    expect(productFromMagnitudes([])).toBe(1);
  });

  it('computes product correctly for positive magnitudes', () => {
    expect(productFromMagnitudes([0.25, 0.50])).toBeCloseTo(1.25 * 1.50, 5);
  });

  it('clamps negative multipliers to prevent zero or negative', () => {
    const result = productFromMagnitudes([-2]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('emptyDamage', () => {
  it('returns all zero damage values', () => {
    const result = emptyDamage();
    expect(result.finalKills).toBe(0);
    expect(result.baseKills).toBe(0);
    expect(result.outgoingMultiplier).toBe(1);
    expect(result.incomingMultiplier).toBe(1);
  });
});
