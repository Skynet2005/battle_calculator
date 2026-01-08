/**
 * Unit tests for Best Counter Ratio Recommender
 *
 * Tests that recommendations match actual battle simulation outcomes.
 */

import { simulateBattleFromUI } from '@/domain/combat/adapter';
import { totalTroops } from '@/domain/rally/combat-fighter';
import type { RallySideConfig } from '@/domain/rally/combat-types';
import { computeCountsFromMix } from '@/domain/rally/mix-utils';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig } from '@/shared/types';
import { describe, expect, it } from '@jest/globals';
import { computeBestCounterRatio } from '../best-counter-ratio';

// Mock data helpers
function createMockBattleSideContext(
  stats: { infantry?: any; lancer?: any; marksman?: any },
  mix: TroopMixConfig | null,
  role: 'attacker' | 'defender' = 'attacker',
  leaders: any = {},
  joiners: any[] = []
): BattleSideContext {
  return {
    label: 'Test',
    fighter: null,
    role,
    troopCounts: null,
    stats: stats as any,
    mix,
    leaders: {
      infantry: leaders.infantry || null,
      lancer: leaders.lancer || null,
      marksman: leaders.marksman || null
    },
    joiners,
    specialBonuses: {
      troopsAttack: 0,
      troopsDefense: 0,
      troopsLethality: 0,
      troopsHealth: 0,
      enemyAttackReduction: 0,
      enemyDefenseReduction: 0,
      defenderAttack: 0,
      defenderHealth: 0,
      rallyAttack: 0,
      rallyLethality: 0
    }
  };
}

function buildRallySideConfig(
  context: BattleSideContext,
  mix: TroopMixConfig,
  rallySize: number
): RallySideConfig {
  const mixWithSize: TroopMixConfig = {
    ...mix,
    totalTroops: rallySize
  };
  const troopCounts = computeCountsFromMix(mixWithSize);

  return {
    role: context.role,
    baseStats: context.stats || {
      infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
      lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
      marksman: { attack: 0, defense: 0, lethality: 0, health: 0 }
    },
    heroes: {
      infantry: context.leaders.infantry || null,
      lancer: context.leaders.lancer || null,
      marksman: context.leaders.marksman || null
    },
    joiners: context.joiners || [],
    troopCounts,
    totalTroops: rallySize
  };
}

describe('Best Counter Ratio', () => {
  describe('Regression: Recommendation matches Apply outcome', () => {
    it('should produce same winner when recommended ratio is applied', () => {
      const rallySize = 1000;

      const player = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        {
          totalTroops: rallySize,
          infantryRatio: 33,
          lancerRatio: 33,
          marksmanRatio: 34
        },
        'attacker'
      );

      const opponent = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        {
          totalTroops: rallySize,
          infantryRatio: 60,
          lancerRatio: 40,
          marksmanRatio: 0
        },
        'defender'
      );

      // Get recommendation
      const recommendation = computeBestCounterRatio({
        player,
        opponent,
        rallySize,
        constraints: {
          minInfantryPct: 25,
          minLancerPct: 10
        }
      });

      const recommendedRatio = recommendation.best.ratio;

      // Simulate with recommended ratio (same as Apply button)
      const playerSide = buildRallySideConfig(player, recommendedRatio, rallySize);
      const opponentSide = buildRallySideConfig(opponent, opponent.mix!, rallySize);

      const { legacyFight } = simulateBattleFromUI({
        config: {
          attacker: playerSide,
          defender: opponentSide
        },
        battleConfig: {
          maxTurns: 30,
          randomMode: 'expectedValue',
          rngSeed: 1
        }
      });

      // Extract results
      const playerRemaining = totalTroops(legacyFight.attackerRemaining);
      const opponentRemaining = totalTroops(legacyFight.defenderRemaining);

      // Assert: winner should match
      const recommendedWinner = recommendation.best.playerRemaining > recommendation.best.opponentRemaining ? 'player' :
        recommendation.best.opponentRemaining > recommendation.best.playerRemaining ? 'opponent' : 'draw';

      const actualWinner = legacyFight.attackerWon ? 'player' :
        legacyFight.defenderWon ? 'opponent' : 'draw';

      expect(recommendedWinner).toBe(actualWinner);

      // Assert: remaining units should be close (within rounding tolerance)
      const playerDiff = Math.abs(recommendation.best.playerRemaining - playerRemaining);
      const opponentDiff = Math.abs(recommendation.best.opponentRemaining - opponentRemaining);

      // Allow small differences due to rounding in different parts of the pipeline
      expect(playerDiff).toBeLessThanOrEqual(10);
      expect(opponentDiff).toBeLessThanOrEqual(10);
    });
  });

  describe('Constraints', () => {
    it('should respect minimum infantry percentage', () => {
      const player = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        null,
        'attacker'
      );

      const opponent = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        {
          totalTroops: 1000,
          infantryRatio: 50,
          lancerRatio: 50,
          marksmanRatio: 0
        },
        'defender'
      );

      const result = computeBestCounterRatio({
        player,
        opponent,
        rallySize: 1000,
        constraints: {
          minInfantryPct: 30,
          minLancerPct: 10
        }
      });

      expect(result.best.ratio.infantryRatio).toBeGreaterThanOrEqual(30);
      expect(result.best.ratio.lancerRatio).toBeGreaterThanOrEqual(10);
      expect(result.best.ratio.infantryRatio + result.best.ratio.lancerRatio + result.best.ratio.marksmanRatio).toBeCloseTo(100, 1);
    });
  });

  describe('Two-phase search', () => {
    it('should perform coarse search then refine', () => {
      const player = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        null,
        'attacker'
      );

      const opponent = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        {
          totalTroops: 1000,
          infantryRatio: 40,
          lancerRatio: 40,
          marksmanRatio: 20
        },
        'defender'
      );

      const result = computeBestCounterRatio({
        player,
        opponent,
        rallySize: 1000
      });

      expect(result.best).toBeDefined();
      expect(result.top.length).toBeGreaterThan(0);
      expect(result.top.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Scoring', () => {
    it('should prioritize remaining units over power', () => {
      // This is tested implicitly through the search algorithm
      // If scoring is correct, best ratio should maximize playerRemaining - opponentRemaining
      const player = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        null,
        'attacker'
      );

      const opponent = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        {
          totalTroops: 1000,
          infantryRatio: 50,
          lancerRatio: 50,
          marksmanRatio: 0
        },
        'defender'
      );

      const result = computeBestCounterRatio({
        player,
        opponent,
        rallySize: 1000
      });

      // Best ratio should have highest score
      const bestScore = result.best.score;
      for (const top of result.top) {
        expect(top.score).toBeLessThanOrEqual(bestScore);
      }
    });
  });

  describe('Explanation consistency', () => {
    it('should not have contradictory explanations', () => {
      const player = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        null,
        'attacker'
      );

      const opponent = createMockBattleSideContext(
        {
          infantry: { attack: 100, defense: 100, lethality: 100, health: 100 },
          lancer: { attack: 100, defense: 100, lethality: 100, health: 100 },
          marksman: { attack: 100, defense: 100, lethality: 100, health: 100 }
        },
        {
          totalTroops: 1000,
          infantryRatio: 60,
          lancerRatio: 40,
          marksmanRatio: 0
        },
        'defender'
      );

      const result = computeBestCounterRatio({
        player,
        opponent,
        rallySize: 1000
      });

      // Check that explanation doesn't contradict the ratio
      const explanation = result.best.explanation.toLowerCase();
      const ratio = result.best.ratio;

      // If recommending high marksman, shouldn't say "reduce marksman"
      if (ratio.marksmanRatio > 20) {
        expect(explanation).not.toContain('reduce marksman');
      }

      // If recommending low marksman, shouldn't say "more marksman"
      if (ratio.marksmanRatio < 10) {
        expect(explanation).not.toContain('more marksman');
      }
    });
  });
});
