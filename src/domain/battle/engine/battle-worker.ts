/**
 * Battle Simulation Web Worker
 *
 * Offloads CPU-intensive Monte Carlo simulations to a background thread.
 * Receives UISimulationInput, runs simulateBattleFromUI, and posts back the result.
 */

import { simulateBattleFromUI, type UISimulationInput, type UISimulationOutput } from './adapter';

export interface WorkerRequest {
  id: string;
  input: UISimulationInput;
}

export interface WorkerResponse {
  id: string;
  result?: UISimulationOutput;
  error?: string;
  durationMs?: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, input } = event.data;
  const start = performance.now();

  try {
    const result = simulateBattleFromUI(input);
    const durationMs = Math.round(performance.now() - start);

    self.postMessage({
      id,
      result,
      durationMs,
    } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      id,
      error: err instanceof Error ? err.message : 'Unknown worker error',
      durationMs: Math.round(performance.now() - start),
    } satisfies WorkerResponse);
  }
};
