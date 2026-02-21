/**
 * Unit tests for simulateBattleFromUI (combat adapter)
 */

import { describe, expect, it } from 'vitest';
import type { RallyConfig, RallySideConfig, SideBaseStats } from '../../rally/combat-types';
import { simulateBattleFromUI } from '../engine/adapter';

const emptyBaseStats: SideBaseStats = {
  infantry: { attack: 0, defense: 0, health: 0, lethality: 0 },
  lancer: { attack: 0, defense: 0, health: 0, lethality: 0 },
  marksman: { attack: 0, defense: 0, health: 0, lethality: 0 },
};

function minimalSide(role: 'attacker' | 'defender', troopCounts: { infantry: number; lancer: number; marksman: number }): RallySideConfig {
  const total = troopCounts.infantry + troopCounts.lancer + troopCounts.marksman;
  return {
    role,
    baseStats: emptyBaseStats,
    heroes: { infantry: null, lancer: null, marksman: null },
    joiners: [],
    troopCounts,
    totalTroops: total,
  };
}

describe('simulateBattleFromUI', () => {
  it('throws when both sides have no troops', () => {
    const config: RallyConfig = {
      attacker: minimalSide('attacker', { infantry: 0, lancer: 0, marksman: 0 }),
      defender: minimalSide('defender', { infantry: 0, lancer: 0, marksman: 0 }),
    };
    expect(() => simulateBattleFromUI({ config })).toThrow('Cannot simulate battle: both sides have no troops.');
  });

  it('throws when maxTurns is zero', () => {
    const config: RallyConfig = {
      attacker: minimalSide('attacker', { infantry: 1, lancer: 0, marksman: 0 }),
      defender: minimalSide('defender', { infantry: 0, lancer: 0, marksman: 0 }),
    };
    expect(() => simulateBattleFromUI({ config, battleConfig: { maxTurns: 0 } })).toThrow(
      'Cannot simulate battle: max turns must be greater than 0.'
    );
  });

  it('returns report and legacy fight when at least one side has troops', () => {
    const config: RallyConfig = {
      attacker: minimalSide('attacker', { infantry: 10, lancer: 0, marksman: 0 }),
      defender: minimalSide('defender', { infantry: 0, lancer: 0, marksman: 0 }),
    };
    const result = simulateBattleFromUI({ config, battleConfig: { maxTurns: 5, randomMode: 'expectedValue' } });
    expect(result.report).toBeDefined();
    expect(result.report.turns).toBeDefined();
    expect(Array.isArray(result.report.turns)).toBe(true);
    expect(result.report.winner).toBeDefined();
    expect(result.legacyFight).toBeDefined();
    expect(result.legacyFight.rounds).toBeDefined();
    expect(result.legacyFight.attackerWon).toBeDefined();
    expect(result.legacyFight.defenderWon).toBeDefined();
  });

  it('reproduces same outcome with same rngSeed (golden / reproducibility)', () => {
    const config: RallyConfig = {
      attacker: minimalSide('attacker', { infantry: 50, lancer: 25, marksman: 25 }),
      defender: minimalSide('defender', { infantry: 50, lancer: 25, marksman: 25 }),
    };
    const run = (seed: number) =>
      simulateBattleFromUI({
        config,
        battleConfig: { maxTurns: 100, randomMode: 'monteCarlo', simulations: 1, rngSeed: seed },
      });
    const a = run(42);
    const b = run(42);
    expect(a.report.winner).toBe(b.report.winner);
    expect(a.report.attackerRemaining).toEqual(b.report.attackerRemaining);
    expect(a.report.defenderRemaining).toEqual(b.report.defenderRemaining);
  });
});
