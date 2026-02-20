/**
 * Best Counter Ratio Recommender
 *
 * Uses the REAL battle simulation engine to find optimal player troop ratios.
 * No separate damage model - calls the same simulation function as the UI.
 */

import { simulateBattleFromUI } from '@/domain/battle/engine/adapter';
import { totalTroops } from '@/domain/rally/combat-fighter';
import type { RallySideConfig } from '@/domain/rally/combat-types';
import { computeCountsFromMix } from '@/domain/rally/mix-utils';
import type { BattleSideContext, TroopType } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig } from '@/shared/types';

// ============================================================================
// TYPES
// ============================================================================

export interface CounterRatioInput {
  player: BattleSideContext;
  opponent: BattleSideContext;
  rallySize: number;
  constraints?: {
    minInfantryPct?: number;  // default 25
    minLancerPct?: number;    // default 10
  };
}

interface SimulationResult {
  playerRemaining: number;
  opponentRemaining: number;
  playerRemainingPower: number;
  opponentRemainingPower: number;
  turns: number;
  winner: 'player' | 'opponent' | 'draw';
  playerLosses: number;
}

export interface CounterRatioResult {
  best: {
    ratio: TroopMixConfig;
    score: number;
    playerRemaining: number;
    opponentRemaining: number;
    turns: number;
    explanation: string;
  };
  top: Array<{
    ratio: TroopMixConfig;
    score: number;
    playerRemaining: number;
    opponentRemaining: number;
    explanation: string;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_TURNS = 30;
const DEFAULT_MIN_INFANTRY_PCT = 25;
const DEFAULT_MIN_LANCER_PCT = 10;

// Base power per troop type (for scoring tie-breakers)
const BASE_POWER: Record<TroopType, number> = {
  infantry: 100,
  lancer: 100,
  marksman: 100
};

// ============================================================================
// SIMULATION WRAPPER
// ============================================================================

/**
 * Simulate a battle with a candidate player ratio using the REAL engine
 */
function simulateCandidateRatio(
  player: BattleSideContext,
  opponent: BattleSideContext,
  candidateMix: TroopMixConfig,
  rallySize: number
): SimulationResult {
  // Build player side with candidate mix
  const playerSide = buildRallySideConfig(player, candidateMix, rallySize);

  // Build opponent side (use existing mix from opponent context)
  const opponentMix = opponent.mix;
  if (!opponentMix) {
    throw new Error('Opponent mix is required for simulation');
  }
  const opponentSide = buildRallySideConfig(opponent, opponentMix, rallySize);

  // Determine roles
  const playerIsAttacker = player.role === 'attacker';
  const attackerSide = playerIsAttacker ? playerSide : opponentSide;
  const defenderSide = playerIsAttacker ? opponentSide : playerSide;

  // Run simulation (deterministic expected value mode)
  const { legacyFight } = simulateBattleFromUI({
    config: {
      attacker: attackerSide,
      defender: defenderSide
    },
    battleConfig: {
      maxTurns: DEFAULT_MAX_TURNS,
      randomMode: 'expectedValue',  // Deterministic, no RNG
      rngSeed: 1  // Fixed seed for reproducibility
    }
  });

  // Extract results
  const playerInitial = totalTroops(playerSide.troopCounts);
  const opponentInitial = totalTroops(opponentSide.troopCounts);

  const playerRemaining = playerIsAttacker
    ? totalTroops(legacyFight.attackerRemaining)
    : totalTroops(legacyFight.defenderRemaining);

  const opponentRemaining = playerIsAttacker
    ? totalTroops(legacyFight.defenderRemaining)
    : totalTroops(legacyFight.attackerRemaining);

  const playerLosses = playerInitial - playerRemaining;
  const opponentLosses = opponentInitial - opponentRemaining;

  // Calculate remaining power (need to map correctly based on who is attacker)
  const playerRemainingCounts = playerIsAttacker
    ? legacyFight.attackerRemaining
    : legacyFight.defenderRemaining;

  const opponentRemainingCounts = playerIsAttacker
    ? legacyFight.defenderRemaining
    : legacyFight.attackerRemaining;

  const playerRemainingPower =
    playerRemainingCounts.infantry * BASE_POWER.infantry +
    playerRemainingCounts.lancer * BASE_POWER.lancer +
    playerRemainingCounts.marksman * BASE_POWER.marksman;

  const opponentRemainingPower =
    opponentRemainingCounts.infantry * BASE_POWER.infantry +
    opponentRemainingCounts.lancer * BASE_POWER.lancer +
    opponentRemainingCounts.marksman * BASE_POWER.marksman;

  // Determine winner
  let winner: 'player' | 'opponent' | 'draw';
  if (playerIsAttacker) {
    if (legacyFight.attackerWon) {
      winner = 'player';
    } else if (legacyFight.defenderWon) {
      winner = 'opponent';
    } else {
      winner = playerRemaining > opponentRemaining ? 'player' :
        opponentRemaining > playerRemaining ? 'opponent' : 'draw';
    }
  } else {
    if (legacyFight.defenderWon) {
      winner = 'player';
    } else if (legacyFight.attackerWon) {
      winner = 'opponent';
    } else {
      winner = playerRemaining > opponentRemaining ? 'player' :
        opponentRemaining > playerRemaining ? 'opponent' : 'draw';
    }
  }

  return {
    playerRemaining,
    opponentRemaining,
    playerRemainingPower,
    opponentRemainingPower,
    turns: legacyFight.rounds.length,
    winner,
    playerLosses
  };
}

/**
 * Build RallySideConfig from BattleSideContext + mix
 */
function buildRallySideConfig(
  context: BattleSideContext,
  mix: TroopMixConfig,
  rallySize: number
): RallySideConfig {
  // Ensure mix uses rally size
  const mixWithSize: TroopMixConfig = {
    ...mix,
    totalTroops: rallySize
  };

  // Convert mix to counts
  const troopCounts = computeCountsFromMix(mixWithSize);

  // Build RallySideConfig
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

// ============================================================================
// RATIO SEARCH
// ============================================================================

/**
 * Generate candidate ratios with constraints
 */
function generateCandidateRatios(
  stepSize: number,
  minInfantryPct: number,
  minLancerPct: number
): TroopMixConfig[] {
  const candidates: TroopMixConfig[] = [];

  for (let infPct = minInfantryPct; infPct <= 100 - minLancerPct; infPct += stepSize) {
    for (let lncPct = minLancerPct; lncPct <= 100 - infPct; lncPct += stepSize) {
      const mksPct = 100 - infPct - lncPct;

      if (mksPct < 0) continue;

      candidates.push({
        totalTroops: 0,  // Will be set later
        infantryRatio: infPct,
        lancerRatio: lncPct,
        marksmanRatio: mksPct
      });
    }
  }

  return candidates;
}

/**
 * Score a simulation result
 * Primary: maximize (playerRemaining - opponentRemaining)
 * Tie-breakers: maximize power difference, then minimize player losses
 */
function scoreResult(result: SimulationResult): number {
  // Primary score: unit difference (weighted heavily)
  const unitDiff = result.playerRemaining - result.opponentRemaining;

  // Tie-breaker 1: power difference
  const powerDiff = result.playerRemainingPower - result.opponentRemainingPower;

  // Tie-breaker 2: minimize losses (negative because lower is better)
  const lossPenalty = -result.playerLosses * 0.01;

  // Combine: unit diff * 10000 (primary), power diff * 1, loss penalty
  return unitDiff * 10000 + powerDiff + lossPenalty;
}

/**
 * Generate explanation for a ratio result
 */
function generateExplanation(
  result: SimulationResult,
  ratio: TroopMixConfig,
  opponentRatio: TroopMixConfig
): string {
  const reasons: string[] = [];

  // Outcome
  if (result.winner === 'player') {
    reasons.push('Player wins');
  } else if (result.winner === 'opponent') {
    reasons.push('Opponent wins');
  } else {
    reasons.push('Draw');
  }

  // Ratio analysis (avoid contradictions)
  const infDiff = ratio.infantryRatio - opponentRatio.infantryRatio;
  const lncDiff = ratio.lancerRatio - opponentRatio.lancerRatio;
  const mksDiff = ratio.marksmanRatio - opponentRatio.marksmanRatio;

  if (infDiff > 15) {
    reasons.push('Higher infantry to survive longer');
  } else if (infDiff < -15) {
    reasons.push('Lower infantry to invest in other types');
  }

  if (lncDiff > 15) {
    reasons.push('More lancers to counter marksman');
  } else if (lncDiff < -15) {
    reasons.push('Fewer lancers to focus elsewhere');
  }

  if (opponentRatio.marksmanRatio < 5 && ratio.marksmanRatio > 15) {
    reasons.push('Opponent has minimal marksman; reduce marksman investment');
  } else if (mksDiff > 15) {
    reasons.push('More marksman to counter infantry');
  } else if (mksDiff < -15) {
    reasons.push('Fewer marksman to strengthen frontline');
  }

  // Performance indicators
  if (result.playerRemaining > result.opponentRemaining * 1.5) {
    reasons.push('Strong advantage in remaining units');
  } else if (result.opponentRemaining > result.playerRemaining * 1.5) {
    reasons.push('Opponent has significant advantage');
  }

  return reasons.join('. ') || 'Balanced composition';
}

/**
 * Cache for best counter ratio results
 * Uses input hash to cache results and prevent redundant calculations
 */
const ratioCache = new Map<string, CounterRatioResult>();
const MAX_CACHE_SIZE = 50;

/**
 * Create a cache key from the input
 */
function createCacheKey(input: CounterRatioInput): string {
  // Create a deterministic key from the input
  // Round values to reduce cache key variations
  const keyParts = [
    JSON.stringify(input.player.stats),
    JSON.stringify(input.opponent.stats),
    JSON.stringify(input.opponent.mix),
    input.rallySize,
    input.constraints?.minInfantryPct ?? DEFAULT_MIN_INFANTRY_PCT,
    input.constraints?.minLancerPct ?? DEFAULT_MIN_LANCER_PCT,
  ];
  return keyParts.join('|');
}

/**
 * Find best counter ratios using two-phase search
 * Results are cached to improve performance for repeated calculations.
 */
export function computeBestCounterRatio(input: CounterRatioInput): CounterRatioResult {
  const { player, opponent, rallySize, constraints } = input;

  if (!player.stats || !opponent.stats || !opponent.mix) {
    throw new Error('Player and opponent stats and opponent mix are required');
  }

  // Check cache first
  const cacheKey = createCacheKey(input);
  const cached = ratioCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // TypeScript guard: opponent.mix is now known to be non-null
  const opponentMix = opponent.mix;

  const minInfantryPct = constraints?.minInfantryPct ?? DEFAULT_MIN_INFANTRY_PCT;
  const minLancerPct = constraints?.minLancerPct ?? DEFAULT_MIN_LANCER_PCT;

  // Phase 1: Coarse grid search (2-5% steps)
  const coarseStepSize = 5;
  const coarseCandidates = generateCandidateRatios(coarseStepSize, minInfantryPct, minLancerPct);

  const coarseResults: Array<{
    ratio: TroopMixConfig;
    result: SimulationResult;
    score: number;
  }> = [];

  for (const candidate of coarseCandidates) {
    try {
      const result = simulateCandidateRatio(player, opponent, candidate, rallySize);
      const score = scoreResult(result);
      coarseResults.push({ ratio: candidate, result, score });
    } catch (error) {
      // Log warning in development only
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.warn('Simulation failed for ratio:', candidate, error);
      }
      // Continue with other candidates
    }
  }

  // Sort and get top N for refinement
  coarseResults.sort((a, b) => b.score - a.score);
  const topN = Math.min(5, coarseResults.length);
  const topCandidates = coarseResults.slice(0, topN);

  // Phase 2: Refinement around top candidates (1% steps)
  const refinedResults: Array<{
    ratio: TroopMixConfig;
    result: SimulationResult;
    score: number;
  }> = [];

  for (const topCandidate of topCandidates) {
    // Search in ±10% window around top candidate
    const infCenter = topCandidate.ratio.infantryRatio;
    const lncCenter = topCandidate.ratio.lancerRatio;

    const infMin = Math.max(minInfantryPct, infCenter - 10);
    const infMax = Math.min(100 - minLancerPct, infCenter + 10);
    const lncMin = Math.max(minLancerPct, lncCenter - 10);
    const lncMax = Math.min(100 - minInfantryPct, lncCenter + 10);

    for (let infPct = infMin; infPct <= infMax; infPct += 1) {
      for (let lncPct = lncMin; lncPct <= lncMax && lncPct <= 100 - infPct; lncPct += 1) {
        const mksPct = 100 - infPct - lncPct;
        if (mksPct < 0) continue;

        const refinedRatio: TroopMixConfig = {
          totalTroops: 0,
          infantryRatio: infPct,
          lancerRatio: lncPct,
          marksmanRatio: mksPct
        };

        try {
          const result = simulateCandidateRatio(player, opponent, refinedRatio, rallySize);
          const score = scoreResult(result);
          refinedResults.push({ ratio: refinedRatio, result, score });
        } catch (error) {
          // Skip failed simulations
        }
      }
    }
  }

  // Combine coarse and refined results, sort by score
  const allResults = [...coarseResults, ...refinedResults];
  allResults.sort((a, b) => b.score - a.score);

  // Get top 3 (deduplicate similar ratios)
  const top3: typeof allResults = [];
  const seen = new Set<string>();

  for (const candidate of allResults) {
    const key = `${Math.round(candidate.ratio.infantryRatio)}-${Math.round(candidate.ratio.lancerRatio)}-${Math.round(candidate.ratio.marksmanRatio)}`;
    if (!seen.has(key) && top3.length < 3) {
      seen.add(key);
      top3.push(candidate);
    }
  }

  if (top3.length === 0) {
    throw new Error('No valid ratios found');
  }

  const best = top3[0];

  const result: CounterRatioResult = {
    best: {
      ratio: { ...best.ratio, totalTroops: rallySize },
      score: best.score,
      playerRemaining: best.result.playerRemaining,
      opponentRemaining: best.result.opponentRemaining,
      turns: best.result.turns,
      explanation: generateExplanation(best.result, best.ratio, opponentMix)
    },
    top: top3.map(c => ({
      ratio: { ...c.ratio, totalTroops: rallySize },
      score: c.score,
      playerRemaining: c.result.playerRemaining,
      opponentRemaining: c.result.opponentRemaining,
      explanation: generateExplanation(c.result, c.ratio, opponentMix)
    }))
  };

  // Cache the result
  if (ratioCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (simple FIFO)
    const firstKey = ratioCache.keys().next().value;
    if (firstKey !== undefined) {
      ratioCache.delete(firstKey);
    }
  }
  ratioCache.set(cacheKey, result);

  return result;
}

