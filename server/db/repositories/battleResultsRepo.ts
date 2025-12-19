import type { BattleResultsViewModel } from '@/features/battle-results/viewmodel/types';
import type { BattleSimulationRequest } from '@/features/battle-setup/schemas/battle';
import { db } from '@/lib/db/db';
import { battleResults, battleSimulationLog } from '@/schema/battle_results';
import { desc, eq } from 'drizzle-orm';

/**
 * Repository for battle results persistence
 */

export interface BattleResultRecord {
  id: string;
  userId: string;
  createdAt: Date;
  inputHash: string;
  requestJson: BattleSimulationRequest;
  responseSummaryJson?: Partial<BattleResultsViewModel>;
  timelineJson?: unknown;
  metricsJson?: unknown;
  rationaleJson?: unknown;
  reportJson?: unknown;
}

/**
 * Save a battle result
 */
export async function saveResult(
  userId: string,
  inputHash: string,
  request: BattleSimulationRequest,
  response: {
    summary?: Partial<BattleResultsViewModel>;
    timeline?: unknown;
    metrics?: unknown;
    rationale?: unknown;
    report?: unknown;
  }
): Promise<string> {
  const [result] = await db
    .insert(battleResults)
    .values({
      userId,
      inputHash,
      requestJson: request as any,
      responseSummaryJson: response.summary as any,
      timelineJson: response.timeline as any,
      metricsJson: response.metrics as any,
      rationaleJson: response.rationale as any,
      reportJson: response.report as any,
    })
    .returning({ id: battleResults.id });

  return result.id;
}

/**
 * Get a battle result by ID
 */
export async function getResultById(resultId: string): Promise<BattleResultRecord | null> {
  const [result] = await db
    .select()
    .from(battleResults)
    .where(eq(battleResults.id, resultId))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    userId: result.userId,
    createdAt: result.createdAt,
    inputHash: result.inputHash,
    requestJson: result.requestJson as BattleSimulationRequest,
    responseSummaryJson: result.responseSummaryJson as Partial<BattleResultsViewModel>,
    timelineJson: result.timelineJson,
    metricsJson: result.metricsJson,
    rationaleJson: result.rationaleJson,
    reportJson: result.reportJson,
  };
}

/**
 * Get battle results for a user (most recent first)
 */
export async function getResultsByUserId(
  userId: string,
  limit: number = 50
): Promise<BattleResultRecord[]> {
  const results = await db
    .select()
    .from(battleResults)
    .where(eq(battleResults.userId, userId))
    .orderBy(desc(battleResults.createdAt))
    .limit(limit);

  return results.map((result) => ({
    id: result.id,
    userId: result.userId,
    createdAt: result.createdAt,
    inputHash: result.inputHash,
    requestJson: result.requestJson as BattleSimulationRequest,
    responseSummaryJson: result.responseSummaryJson as Partial<BattleResultsViewModel>,
    timelineJson: result.timelineJson,
    metricsJson: result.metricsJson,
    rationaleJson: result.rationaleJson,
    reportJson: result.reportJson,
  }));
}

/**
 * Log a simulation request (for audit/analytics)
 */
export async function logSimulation(params: {
  userId: string;
  inputHash: string;
  latencyMs?: number;
  cacheHit: boolean;
  errorMessage?: string;
  requestJson?: BattleSimulationRequest;
  responseJson?: unknown;
}): Promise<void> {
  await db.insert(battleSimulationLog).values({
    userId: params.userId,
    inputHash: params.inputHash,
    latencyMs: params.latencyMs,
    cacheHit: params.cacheHit,
    errorMessage: params.errorMessage,
    requestJson: params.requestJson as any,
    responseJson: params.responseJson as any,
  });
}
