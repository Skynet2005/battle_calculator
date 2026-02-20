/**
 * Simulation batch runner for the combat engine.
 *
 * Designed as a standalone module that runs a batch of Monte Carlo simulations
 * and aggregates results. Can be used synchronously in the main thread or
 * wrapped in a Web Worker for parallel execution.
 *
 * Usage (synchronous):
 *   const result = runSimulationBatch(params, config, 0, 100, (p) => console.log(p));
 *
 * Usage (Web Worker - future):
 *   self.onmessage = (e) => { ... runSimulationBatch(...) ... self.postMessage(result); }
 */

import { TROOP_TYPES } from './bonuses';
import { simulateBattle } from './engine';
import type {
  BattleConfig,
  BattleReport,
  SimulateParams,
  TroopCounts,
  TroopType,
} from './types';
import { DEFAULT_BATTLE_CONFIG } from './types';

// ============================================================================
// Types
// ============================================================================

/** Progress callback for tracking simulation advancement */
export interface BatchProgress {
  /** Number of simulations completed so far in this batch */
  completed: number;
  /** Total simulations in this batch */
  total: number;
  /** Percentage complete (0-100) */
  percent: number;
}

/** Aggregated statistics from a batch of simulations */
export interface BatchAggregation {
  /** Number of simulations run in this batch */
  simulations: number;
  /** Number of attacker wins */
  attackerWins: number;
  /** Number of defender wins */
  defenderWins: number;
  /** Number of draws */
  draws: number;
  /** Per-simulation kill counts (defender kills by attacker) */
  killsPerSim: number[];
  /** Per-simulation attacker remaining troops */
  attackerRemainingPerSim: TroopCounts[];
  /** Per-simulation defender remaining troops */
  defenderRemainingPerSim: TroopCounts[];
  /** The last BattleReport produced (used as representative report) */
  lastReport: BattleReport;
}

/** Final merged result after combining one or more batches */
export interface BatchResult {
  /** The representative battle report with Monte Carlo stats merged in */
  report: BattleReport;
  /** Total simulations across all merged batches */
  totalSimulations: number;
  /** Attacker win rate (0-100) */
  attackerWinRate: number;
  /** Draw rate (0-100) */
  drawRate: number;
  /** Standard deviation of kills */
  killsStdDev: number;
  /** 95% confidence interval for kills */
  killsConfidenceInterval: [number, number];
}

// ============================================================================
// Constants
// ============================================================================

const PROGRESS_INTERVAL = 10;

// ============================================================================
// Core batch runner
// ============================================================================

/**
 * Run a batch of deterministic simulations with incrementing RNG seeds.
 *
 * @param params - The battle simulation parameters (attacker/defender composition)
 * @param config - Partial battle config overrides (merged with defaults)
 * @param startIdx - Starting seed offset for this batch (allows splitting across workers)
 * @param count - Number of simulations to run in this batch
 * @param onProgress - Optional callback fired every PROGRESS_INTERVAL simulations
 * @returns Aggregated statistics for this batch
 */
export function runSimulationBatch(
  params: SimulateParams,
  config: Partial<BattleConfig> | undefined,
  startIdx: number,
  count: number,
  onProgress?: (progress: BatchProgress) => void
): BatchAggregation {
  const mergedConfig: BattleConfig = { ...DEFAULT_BATTLE_CONFIG, ...config };
  const baseSeed = mergedConfig.rngSeed ?? 1;

  let attackerWins = 0;
  let defenderWins = 0;
  let draws = 0;
  let lastReport: BattleReport | null = null;

  const killsPerSim: number[] = [];
  const attackerRemainingPerSim: TroopCounts[] = [];
  const defenderRemainingPerSim: TroopCounts[] = [];

  const defenderInitialTotal =
    params.defender.troops.Infantry +
    params.defender.troops.Lancer +
    params.defender.troops.Marksman;

  for (let i = 0; i < count; i += 1) {
    const seedIdx = startIdx + i;
    const singleRunConfig: Partial<BattleConfig> = {
      ...config,
      rngSeed: baseSeed + seedIdx,
      randomMode: 'monteCarlo',
      simulations: 1,
    };

    const outcome = simulateBattle({ ...params, config: singleRunConfig });
    const report = outcome.report;
    lastReport = report;

    // Compute kills from remaining troops
    const remaining =
      report.defenderRemaining ??
      report.turns[report.turns.length - 1]?.defenderTroops;
    const remainingTotal = remaining
      ? remaining.Infantry + remaining.Lancer + remaining.Marksman
      : 0;
    const kills = Math.max(0, defenderInitialTotal - remainingTotal);
    killsPerSim.push(kills);

    if (report.attackerRemaining) {
      attackerRemainingPerSim.push({ ...report.attackerRemaining });
    }
    if (report.defenderRemaining) {
      defenderRemainingPerSim.push({ ...report.defenderRemaining });
    }

    if (report.winner === 'attacker') {
      attackerWins += 1;
    } else if (report.winner === 'defender') {
      defenderWins += 1;
    } else {
      draws += 1;
    }

    // Fire progress callback periodically
    if (onProgress && ((i + 1) % PROGRESS_INTERVAL === 0 || i === count - 1)) {
      onProgress({
        completed: i + 1,
        total: count,
        percent: Math.round(((i + 1) / count) * 100),
      });
    }
  }

  if (!lastReport) {
    throw new Error('Simulation batch produced no results');
  }

  return {
    simulations: count,
    attackerWins,
    defenderWins,
    draws,
    killsPerSim,
    attackerRemainingPerSim,
    defenderRemainingPerSim,
    lastReport,
  };
}

// ============================================================================
// Aggregation helpers
// ============================================================================

/**
 * Merge multiple batch aggregations into a single result.
 * Useful when splitting work across multiple workers.
 */
export function mergeBatches(batches: BatchAggregation[]): BatchAggregation {
  if (batches.length === 0) {
    throw new Error('Cannot merge zero batches');
  }
  if (batches.length === 1) {
    return batches[0];
  }

  const merged: BatchAggregation = {
    simulations: 0,
    attackerWins: 0,
    defenderWins: 0,
    draws: 0,
    killsPerSim: [],
    attackerRemainingPerSim: [],
    defenderRemainingPerSim: [],
    lastReport: batches[batches.length - 1].lastReport,
  };

  for (const batch of batches) {
    merged.simulations += batch.simulations;
    merged.attackerWins += batch.attackerWins;
    merged.defenderWins += batch.defenderWins;
    merged.draws += batch.draws;
    merged.killsPerSim.push(...batch.killsPerSim);
    merged.attackerRemainingPerSim.push(...batch.attackerRemainingPerSim);
    merged.defenderRemainingPerSim.push(...batch.defenderRemainingPerSim);
  }

  return merged;
}

/**
 * Compute final statistics from an aggregation and produce a BatchResult.
 */
export function finalizeBatch(agg: BatchAggregation): BatchResult {
  const { simulations, attackerWins, draws, killsPerSim, lastReport } = agg;

  const meanKills =
    killsPerSim.reduce((sum, v) => sum + v, 0) / simulations;
  const variance =
    killsPerSim.reduce((sum, v) => sum + (v - meanKills) ** 2, 0) / simulations;
  const stdDev = Math.sqrt(variance);
  const z95 = 1.96;
  const marginOfError = (z95 * stdDev) / Math.sqrt(simulations);
  const confidenceInterval: [number, number] = [
    Math.max(0, meanKills - marginOfError),
    meanKills + marginOfError,
  ];

  const attackerWinRate =
    simulations > 0 ? (attackerWins / simulations) * 100 : 0;
  const drawRate = simulations > 0 ? (draws / simulations) * 100 : 0;

  const troopDist = (arr: TroopCounts[]) => {
    if (arr.length === 0) {
      const z: TroopCounts = { Infantry: 0, Lancer: 0, Marksman: 0 };
      return { min: z, max: z, mean: z };
    }
    const min: TroopCounts = { Infantry: Infinity, Lancer: Infinity, Marksman: Infinity };
    const max: TroopCounts = { Infantry: -Infinity, Lancer: -Infinity, Marksman: -Infinity };
    const sum: TroopCounts = { Infantry: 0, Lancer: 0, Marksman: 0 };
    for (const c of arr) {
      for (const t of TROOP_TYPES) {
        min[t] = Math.min(min[t], c[t]);
        max[t] = Math.max(max[t], c[t]);
        sum[t] += c[t];
      }
    }
    const mean: TroopCounts = {
      Infantry: Math.round(sum.Infantry / arr.length),
      Lancer: Math.round(sum.Lancer / arr.length),
      Marksman: Math.round(sum.Marksman / arr.length),
    };
    return { min, max, mean };
  };

  const report: BattleReport = {
    ...lastReport,
    simulationsRun: simulations,
    meanFinalKills: {
      baseKills: meanKills,
      outgoingMultiplier: 1,
      incomingMultiplier: 1,
      finalKills: meanKills,
    },
    attackerWinRate,
    drawRate,
    killsStdDev: stdDev,
    killsConfidenceInterval: confidenceInterval,
    remainingDistribution: {
      attacker: troopDist(agg.attackerRemainingPerSim),
      defender: troopDist(agg.defenderRemainingPerSim),
    },
  };

  return {
    report,
    totalSimulations: simulations,
    attackerWinRate,
    drawRate,
    killsStdDev: stdDev,
    killsConfidenceInterval: confidenceInterval,
  };
}

// ============================================================================
// Convenience: run full simulation with progress
// ============================================================================

/**
 * Run a full Monte Carlo simulation set with progress tracking.
 * This is the main entry point for UI-driven simulations.
 */
export function runFullSimulation(
  params: SimulateParams,
  config?: Partial<BattleConfig>,
  onProgress?: (progress: BatchProgress) => void
): BatchResult {
  const mergedConfig: BattleConfig = { ...DEFAULT_BATTLE_CONFIG, ...config };
  const totalSims = Math.max(1, mergedConfig.simulations ?? 200);

  const agg = runSimulationBatch(params, config, 0, totalSims, onProgress);
  return finalizeBatch(agg);
}
