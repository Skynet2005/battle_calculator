'use client';

/**
 * useSimulationWorker
 *
 * Hook that runs battle simulations in a Web Worker to avoid blocking the UI.
 * Falls back to synchronous execution if Web Workers are unavailable.
 * Includes debouncing to avoid re-running on every keystroke.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UISimulationInput, UISimulationOutput } from '@/domain/battle/engine/adapter';
import { simulateBattleFromUI } from '@/domain/battle/engine/adapter';
import type { WorkerRequest, WorkerResponse } from '@/domain/battle/engine/battle-worker';

interface SimulationState {
  result: UISimulationOutput | null;
  isRunning: boolean;
  error: string | null;
  durationMs: number | null;
}

interface UseSimulationWorkerOptions {
  debounceMs?: number;
  enabled?: boolean;
}

export function useSimulationWorker(
  input: UISimulationInput | null,
  options: UseSimulationWorkerOptions = {}
): SimulationState {
  const { debounceMs = 300, enabled = true } = options;

  const [state, setState] = useState<SimulationState>({
    result: null,
    isRunning: false,
    error: null,
    durationMs: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const worker = new Worker(
        new URL('@/domain/battle/engine/battle-worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, result, error, durationMs } = event.data;
        const expectedId = `sim-${requestIdRef.current}`;

        // Ignore stale responses
        if (id !== expectedId) return;

        setState({
          result: result ?? null,
          isRunning: false,
          error: error ?? null,
          durationMs: durationMs ?? null,
        });
      };

      worker.onerror = (err) => {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: `Worker error: ${err.message}`,
        }));
      };

      workerRef.current = worker;
    } catch {
      // Web Workers not supported -- will fallback to sync
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Run simulation when input changes
  const runSimulation = useCallback(
    (simInput: UISimulationInput) => {
      requestIdRef.current++;
      const id = `sim-${requestIdRef.current}`;

      if (workerRef.current) {
        setState((prev) => ({ ...prev, isRunning: true, error: null }));
        workerRef.current.postMessage({ id, input: simInput } satisfies WorkerRequest);
      } else {
        // Fallback: synchronous execution
        setState((prev) => ({ ...prev, isRunning: true, error: null }));
        try {
          const start = performance.now();
          const result = simulateBattleFromUI(simInput);
          const durationMs = Math.round(performance.now() - start);
          setState({ result, isRunning: false, error: null, durationMs });
        } catch (err) {
          setState({
            result: null,
            isRunning: false,
            error: err instanceof Error ? err.message : 'Simulation failed',
            durationMs: null,
          });
        }
      }
    },
    []
  );

  // Debounced trigger
  useEffect(() => {
    if (!enabled || !input) {
      setState({ result: null, isRunning: false, error: null, durationMs: null });
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSimulation(input);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, enabled, debounceMs, runSimulation]);

  return state;
}
