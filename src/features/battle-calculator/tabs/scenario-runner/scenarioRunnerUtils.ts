/**
 * Utilities for Scenario Runner: build rally config for a given player mix override and run simulation.
 */

import {
  ensureTroopCounts,
  hasTroops,
  normalizeTroopMix,
  sumCapacityCounts
} from '@/domain/battle/battle-calculator-helpers';
import { simulateBattleFromUI } from '@/domain/battle/engine/adapter';
import type { BattleConfig, BattleReport } from '@/domain/battle/engine/types';
import type { RallyConfig, RallySideConfig, SideBaseStats } from '@/domain/rally/combat-types';
import { buildConfigForSide, DEFAULT_TROOP_MIX, mixToCounts } from '@/domain/rally/rally-config';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { RallyConfiguration, TroopMixConfig, UserProfile } from '@/shared/types';

export const SCENARIO_MIX_PRESETS: TroopMixConfig[] = [
  { totalTroops: 0, infantryRatio: 60, lancerRatio: 40, marksmanRatio: 0 },
  { totalTroops: 0, infantryRatio: 50, lancerRatio: 10, marksmanRatio: 40 },
  { totalTroops: 0, infantryRatio: 50, lancerRatio: 0, marksmanRatio: 50 },
  { totalTroops: 0, infantryRatio: 40, lancerRatio: 30, marksmanRatio: 30 },
  { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
  { totalTroops: 0, infantryRatio: 100, lancerRatio: 0, marksmanRatio: 0 },
  { totalTroops: 0, infantryRatio: 0, lancerRatio: 100, marksmanRatio: 0 },
  { totalTroops: 0, infantryRatio: 0, lancerRatio: 0, marksmanRatio: 100 },
];

export interface ScenarioRunInput {
  profile: UserProfile;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
  playerCapacityReport: CapacityReport | null;
  opponentCapacityReport: CapacityReport | null;
  playerMixOverride: TroopMixConfig;
  battleConfig?: Partial<BattleConfig>;
}

export interface ScenarioRunResult {
  scenarioId: string;
  playerMix: TroopMixConfig;
  report?: BattleReport;
  summary: {
    winner: string;
    attackerWinRate?: number;
    /** When using multiple trials (Monte Carlo), fraction of runs where Player won (0–1). */
    playerWinRate?: number;
    attackerRemaining: Record<string, number>;
    defenderRemaining: Record<string, number>;
    casualties?: { attacker: Record<string, number>; defender: Record<string, number> };
    turns: number;
  };
  error?: string;
}

/**
 * Build RallyConfig for one scenario with the given player troop mix override.
 * Uses profile rally (leaders, joiners, opponent mix) and overrides only player troop mix.
 */
export function buildRallyConfigForScenario(input: ScenarioRunInput): RallyConfig {
  const {
    profile,
    playerBaseStats,
    opponentBaseStats,
    playerCapacityReport,
    opponentCapacityReport,
    playerMixOverride
  } = input;

  const rally = profile.rally;
  if (!rally) {
    throw new Error('Profile has no rally configuration');
  }

  const playerCapacityTotal = playerCapacityReport?.rally?.total ?? 0;
  const opponentCapacityTotal = opponentCapacityReport?.rally?.total ?? 0;

  const playerMixRaw = normalizeTroopMix({
    ...DEFAULT_TROOP_MIX,
    ...profile.rally?.troopMix?.player,
    ...playerMixOverride
  });
  const playerMixConfig: TroopMixConfig = {
    ...playerMixRaw,
    totalTroops: playerMixRaw.totalTroops > 0 ? playerMixRaw.totalTroops : playerCapacityTotal
  };

  const opponentMixRaw = normalizeTroopMix(profile.rally?.troopMix?.opponent ?? DEFAULT_TROOP_MIX);
  const opponentMixConfig: TroopMixConfig = {
    ...opponentMixRaw,
    totalTroops: opponentMixRaw.totalTroops > 0 ? opponentMixRaw.totalTroops : opponentCapacityTotal
  };

  const rallyWithPlayerMix: RallyConfiguration = {
    ...rally,
    troopMix: {
      ...rally.troopMix,
      player: playerMixConfig,
      opponent: opponentMixConfig
    }
  };

  const playerSide = buildConfigForSide(rallyWithPlayerMix, 'player', playerBaseStats);
  const opponentSide = buildConfigForSide(rallyWithPlayerMix, 'opponent', opponentBaseStats);

  const playerMixCounts = mixToCounts(playerMixConfig).counts;
  const opponentMixCounts = mixToCounts(opponentMixConfig).counts;
  const playerCapacityCounts = sumCapacityCounts(rally.capacity);

  const normalizedPlayerSide = ensureTroopCounts(
    playerSide,
    hasTroops(playerMixCounts) ? playerMixCounts : playerCapacityCounts
  );
  const normalizedOpponentSide = ensureTroopCounts(
    opponentSide,
    hasTroops(opponentMixCounts) ? opponentMixCounts : undefined
  );

  const playerIsAttacker = normalizedPlayerSide.role === 'attacker';
  const attackerSide: RallySideConfig = playerIsAttacker ? normalizedPlayerSide : normalizedOpponentSide;
  const defenderSide: RallySideConfig = playerIsAttacker ? normalizedOpponentSide : normalizedPlayerSide;

  return { attacker: attackerSide, defender: defenderSide };
}

/**
 * Run a single scenario and return result + summary.
 */
export function runSingleScenario(input: ScenarioRunInput): ScenarioRunResult {
  const { playerMixOverride, battleConfig } = input;
  const scenarioId = `inf${Math.round(playerMixOverride.infantryRatio)}_lanc${Math.round(playerMixOverride.lancerRatio)}_mark${Math.round(playerMixOverride.marksmanRatio)}`;

  try {
    const config = buildRallyConfigForScenario(input);
    const { report } = simulateBattleFromUI({
      config,
      battleConfig: {
        maxTurns: 1000,
        randomMode: 'expectedValue', // deterministic for fast batch
        ...battleConfig
      }
    });

    const playerIsAttacker = config.attacker.role === 'attacker';
    const winner =
      report.winner === 'draw'
        ? 'Draw'
        : report.winner === 'attacker'
          ? (playerIsAttacker ? 'Player' : 'Opponent')
          : playerIsAttacker ? 'Opponent' : 'Player';
    const summary = {
      winner,
      attackerWinRate: report.attackerWinRate,
      attackerRemaining: { ...report.attackerRemaining },
      defenderRemaining: { ...report.defenderRemaining },
      casualties: report.casualties
        ? {
          attacker: { ...report.casualties.attacker },
          defender: { ...report.casualties.defender }
        }
        : undefined,
      turns: report.turns?.length ?? report.totalTurns ?? 0
    };

    return { scenarioId, playerMix: playerMixOverride, report, summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      scenarioId,
      playerMix: playerMixOverride,
      summary: {
        winner: 'Error',
        attackerRemaining: {},
        defenderRemaining: {},
        turns: 0
      },
      error: message
    };
  }
}

/** Base RNG seed for multi-trial runs (reproducible across sessions). */
const TRIAL_BASE_SEED = 42;

/** Yield to the event loop so the UI stays responsive. */
function yieldToMain(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

/**
 * Run the same scenario multiple times with Monte Carlo (different RNG seeds).
 * Each run uses full battle simulation including hero skills and proc chances.
 * Yields periodically so the page stays responsive.
 * Returns aggregated result with majority winner and player win rate for ranking.
 */
export async function runSingleScenarioWithTrials(
  input: ScenarioRunInput,
  trials: number
): Promise<ScenarioRunResult> {
  const { playerMixOverride } = input;
  const scenarioId = `inf${Math.round(playerMixOverride.infantryRatio)}_lanc${Math.round(playerMixOverride.lancerRatio)}_mark${Math.round(playerMixOverride.marksmanRatio)}`;

  if (trials <= 0) {
    return runSingleScenario(input);
  }

  try {
    const config = buildRallyConfigForScenario(input);
    const playerIsAttacker = config.attacker.role === 'attacker';

    let playerWins = 0;
    let lastReport: BattleReport | undefined;

    for (let i = 0; i < trials; i++) {
      const { report } = simulateBattleFromUI({
        config,
        battleConfig: {
          ...input.battleConfig,
          maxTurns: input.battleConfig?.maxTurns ?? 1000,
          randomMode: 'monteCarlo',
          rngSeed: TRIAL_BASE_SEED + i
        }
      });
      lastReport = report;
      const winner =
        report.winner === 'draw'
          ? 'Draw'
          : report.winner === 'attacker'
            ? (playerIsAttacker ? 'Player' : 'Opponent')
            : playerIsAttacker ? 'Opponent' : 'Player';
      if (winner === 'Player') playerWins++;
      if ((i + 1) % 3 === 0) await yieldToMain();
    }

    const playerWinRate = playerWins / trials;
    const majorityWinner: string =
      playerWinRate > 0.5 ? 'Player' : playerWinRate < 0.5 ? 'Opponent' : 'Draw';

    return {
      scenarioId,
      playerMix: playerMixOverride,
      report: lastReport,
      summary: {
        winner: majorityWinner,
        playerWinRate,
        attackerWinRate: playerIsAttacker ? playerWinRate : 1 - playerWinRate,
        attackerRemaining: { ...(lastReport?.attackerRemaining ?? {}) } as Record<string, number>,
        defenderRemaining: { ...(lastReport?.defenderRemaining ?? {}) } as Record<string, number>,
        casualties: lastReport?.casualties
          ? {
            attacker: { ...lastReport.casualties.attacker },
            defender: { ...lastReport.casualties.defender }
          }
          : undefined,
        turns: lastReport?.turns?.length ?? lastReport?.totalTurns ?? 0
      }
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      scenarioId,
      playerMix: playerMixOverride,
      summary: {
        winner: 'Error',
        attackerRemaining: {},
        defenderRemaining: {},
        turns: 0
      },
      error: message
    };
  }
}

const CHUNK_SIZE = 8;

/**
 * Run multiple scenarios in chunks, calling onProgress after each chunk.
 */
export async function runScenarioBatch(
  inputs: ScenarioRunInput[],
  onProgress: (completed: number, total: number) => void
): Promise<ScenarioRunResult[]> {
  const results: ScenarioRunResult[] = [];

  for (let i = 0; i < inputs.length; i += CHUNK_SIZE) {
    const chunk = inputs.slice(i, i + CHUNK_SIZE);
    for (const input of chunk) {
      results.push(runSingleScenario(input));
    }
    onProgress(results.length, inputs.length);
    if (i + CHUNK_SIZE < inputs.length) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return results;
}
