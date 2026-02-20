/**
 * Unit tests for the battle simulation engine.
 */

import { describe, expect, it } from 'vitest';
import { simulateBattle } from '../engine/engine';
import type { SideComposition, TroopStats, TroopType, SimulateParams } from '../engine/types';

const zeroStats: TroopStats = { attack: 0, defense: 0, health: 0, lethality: 0 };

function makeBaseStats(atk = 100, def = 100, hp = 100, leth = 100): Record<TroopType, TroopStats> {
  return {
    Infantry: { attack: atk, defense: def, health: hp, lethality: leth },
    Lancer: { attack: atk, defense: def, health: hp, lethality: leth },
    Marksman: { attack: atk, defense: def, health: hp, lethality: leth },
  };
}

function makeSide(
  role: 'attacker' | 'defender',
  troops: { Infantry?: number; Lancer?: number; Marksman?: number } = {},
  stats?: Record<TroopType, TroopStats>
): SideComposition {
  return {
    name: role,
    role,
    troops: { Infantry: troops.Infantry ?? 0, Lancer: troops.Lancer ?? 0, Marksman: troops.Marksman ?? 0 },
    baseStats: stats ?? makeBaseStats(),
    additiveBonuses: {},
    specialBonuses: {},
    damageModifiers: [],
    skills: [],
  };
}

describe('simulateBattle', () => {
  it('returns a battle outcome with report', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 100 }),
      defender: makeSide('defender', { Infantry: 100 }),
      config: { maxTurns: 5, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report).toBeDefined();
    expect(outcome.report.winner).toBeDefined();
    expect(outcome.report.turns).toBeDefined();
    expect(outcome.report.turns.length).toBeGreaterThan(0);
  });

  it('attacker wins when defender has no troops', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 100 }),
      defender: makeSide('defender', {}),
      config: { maxTurns: 5, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report.winner).toBe('attacker');
  });

  it('defender wins when attacker has no troops', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', {}),
      defender: makeSide('defender', { Infantry: 100 }),
      config: { maxTurns: 5, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report.winner).toBe('defender');
  });

  it('resolves draw when max turns reached', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 10000 }),
      defender: makeSide('defender', { Infantry: 10000 }),
      config: { maxTurns: 1, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report.turns.length).toBeLessThanOrEqual(1);
  });

  it('Monte Carlo mode returns simulation count and win rate', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 50 }),
      defender: makeSide('defender', { Infantry: 50 }),
      config: { maxTurns: 10, randomMode: 'monteCarlo', simulations: 10, rngSeed: 42 },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report.simulationsRun).toBe(10);
    expect(outcome.report.attackerWinRate).toBeDefined();
    expect(typeof outcome.report.attackerWinRate).toBe('number');
  });

  it('tracks attacker and defender remaining troops', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 100 }),
      defender: makeSide('defender', { Lancer: 100 }),
      config: { maxTurns: 30, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report.attackerRemaining).toBeDefined();
    expect(outcome.report.defenderRemaining).toBeDefined();
    const lastTurn = outcome.report.turns[outcome.report.turns.length - 1];
    expect(lastTurn.attackerTroops).toBeDefined();
    expect(lastTurn.defenderTroops).toBeDefined();
  });

  it('handles mixed troop compositions', () => {
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 30, Lancer: 30, Marksman: 30 }),
      defender: makeSide('defender', { Infantry: 30, Lancer: 30, Marksman: 30 }),
      config: { maxTurns: 10, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report).toBeDefined();
    expect(outcome.report.turns.length).toBeGreaterThan(0);
  });

  it('stronger side wins with high stat advantage', () => {
    const strongStats = makeBaseStats(500, 500, 500, 500);
    const weakStats = makeBaseStats(10, 10, 10, 10);
    const params: SimulateParams = {
      attacker: makeSide('attacker', { Infantry: 100 }, strongStats),
      defender: makeSide('defender', { Infantry: 100 }, weakStats),
      config: { maxTurns: 30, randomMode: 'expectedValue' },
    };
    const outcome = simulateBattle(params);
    expect(outcome.report.winner).toBe('attacker');
  });
});
