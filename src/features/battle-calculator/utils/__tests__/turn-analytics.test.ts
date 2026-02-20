/**
 * Unit tests for turn-analytics (casualty series, totalCounts, diffCounts, maxType).
 */

import { describe, expect, it } from 'vitest';
import {
  buildCasualtySeries,
  totalCounts,
  diffCounts,
  maxType,
  computeCasualtiesByType,
} from '../turn-analytics';
import type { CombatTroopCounts, TurnLog } from '@/domain/battle/engine/types';

function minimalTurn(overrides: Partial<TurnLog>): TurnLog {
  return {
    turn: 1,
    buffsApplied: [],
    buffsExpired: [],
    actions: [],
    attackerTroops: { Infantry: 0, Lancer: 0, Marksman: 0 },
    defenderTroops: { Infantry: 0, Lancer: 0, Marksman: 0 },
    ...overrides,
  };
}

describe('turn-analytics', () => {
  describe('totalCounts', () => {
    it('returns 0 for undefined', () => {
      expect(totalCounts(undefined)).toBe(0);
    });
    it('sums Infantry, Lancer, Marksman', () => {
      expect(totalCounts({ Infantry: 10, Lancer: 20, Marksman: 30 })).toBe(60);
    });
    it('treats missing keys as 0', () => {
      expect(totalCounts({ Infantry: 5 })).toBe(5);
    });
  });

  describe('diffCounts', () => {
    it('returns per-type losses (before - after, clamped to 0)', () => {
      const before: CombatTroopCounts = { Infantry: 100, Lancer: 50, Marksman: 25 };
      const after: CombatTroopCounts = { Infantry: 80, Lancer: 50, Marksman: 10 };
      expect(diffCounts(before, after)).toEqual({
        Infantry: 20,
        Lancer: 0,
        Marksman: 15,
      });
    });
    it('handles undefined before/after', () => {
      expect(diffCounts(undefined, { Infantry: 10, Lancer: 0, Marksman: 0 })).toEqual({
        Infantry: 0,
        Lancer: 0,
        Marksman: 0,
      });
    });
  });

  describe('maxType', () => {
    it('returns type with highest count', () => {
      expect(maxType({ Infantry: 10, Lancer: 50, Marksman: 30 })).toBe('Lancer');
    });
    it('returns null when all zero', () => {
      expect(maxType({ Infantry: 0, Lancer: 0, Marksman: 0 })).toBe(null);
    });
    it('returns one of the types when tied', () => {
      const key = maxType({ Infantry: 10, Lancer: 10, Marksman: 10 });
      expect(['Infantry', 'Lancer', 'Marksman']).toContain(key);
    });
  });

  describe('buildCasualtySeries', () => {
    it('returns empty array for empty turns', () => {
      expect(buildCasualtySeries([])).toEqual([]);
    });
    it('builds one entry per turn with losses and remaining', () => {
      const turns: TurnLog[] = [
        minimalTurn({
          turn: 1,
          startAttackerTroops: { Infantry: 100, Lancer: 0, Marksman: 0 },
          startDefenderTroops: { Infantry: 50, Lancer: 0, Marksman: 0 },
          attackerTroops: { Infantry: 90, Lancer: 0, Marksman: 0 },
          defenderTroops: { Infantry: 40, Lancer: 0, Marksman: 0 },
        }),
      ];
      const series = buildCasualtySeries(turns);
      expect(series).toHaveLength(1);
      expect(series[0]).toMatchObject({
        turn: 1,
        attackerLosses: 10,
        defenderLosses: 10,
        attackerLossesByType: { Infantry: 10, Lancer: 0, Marksman: 0 },
        defenderLossesByType: { Infantry: 10, Lancer: 0, Marksman: 0 },
        attackerRemaining: { Infantry: 90, Lancer: 0, Marksman: 0 },
        defenderRemaining: { Infantry: 40, Lancer: 0, Marksman: 0 },
      });
    });
  });

  describe('computeCasualtiesByType', () => {
    it('returns player and opponent casualties by type when player is attacker', () => {
      const report = {
        turns: [
          {
            startAttackerTroops: { Infantry: 100, Lancer: 0, Marksman: 0 },
            startDefenderTroops: { Infantry: 50, Lancer: 0, Marksman: 0 },
          },
        ],
        attacker: { troops: { Infantry: 60, Lancer: 0, Marksman: 0 } },
        defender: { troops: { Infantry: 20, Lancer: 0, Marksman: 0 } },
        attackerRemaining: { Infantry: 60, Lancer: 0, Marksman: 0 },
        defenderRemaining: { Infantry: 20, Lancer: 0, Marksman: 0 },
      } as Parameters<typeof computeCasualtiesByType>[0];
      const { playerCasualtiesByType, opponentCasualtiesByType } = computeCasualtiesByType(report, true);
      expect(playerCasualtiesByType.Infantry).toBe(40);
      expect(opponentCasualtiesByType.Infantry).toBe(30);
    });
  });
});
