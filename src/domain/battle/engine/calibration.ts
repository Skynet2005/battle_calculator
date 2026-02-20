/**
 * Calibration system for fitting damage formula constants (K and alpha)
 * from real battle data samples.
 *
 * Uses least-squares regression to minimize the difference between
 * predicted and observed kills.
 */

import type { CalibrationSample, BattleConfig } from "./types";
import { DEFAULT_BATTLE_CONFIG } from "./types";
import { computeDamage } from "./damage";

export interface CalibrationResult {
  k: number;
  alpha: number;
  mse: number;
  r2: number;
  sampleCount: number;
}

/**
 * Predict kills for a sample using given K and alpha values.
 */
function predictKills(sample: CalibrationSample, k: number, alpha: number): number {
  const config: BattleConfig = {
    ...DEFAULT_BATTLE_CONFIG,
    calibrationConstantK: k,
    troopCountExponentAlpha: alpha,
  };
  const result = computeDamage(sample.input, config);
  return result.finalKills;
}

/**
 * Compute mean squared error between predicted and observed kills.
 */
function computeMSE(samples: CalibrationSample[], k: number, alpha: number): number {
  if (samples.length === 0) return Infinity;
  const totalError = samples.reduce((sum, sample) => {
    const predicted = predictKills(sample, k, alpha);
    const diff = predicted - sample.observedKills;
    return sum + diff * diff;
  }, 0);
  return totalError / samples.length;
}

/**
 * Compute R-squared (coefficient of determination) for the fit.
 */
function computeR2(samples: CalibrationSample[], k: number, alpha: number): number {
  if (samples.length < 2) return 0;
  const mean = samples.reduce((s, sample) => s + sample.observedKills, 0) / samples.length;
  const ssTotal = samples.reduce((s, sample) => {
    const diff = sample.observedKills - mean;
    return s + diff * diff;
  }, 0);
  if (ssTotal === 0) return 1;
  const ssResidual = samples.reduce((s, sample) => {
    const predicted = predictKills(sample, k, alpha);
    const diff = sample.observedKills - predicted;
    return s + diff * diff;
  }, 0);
  return 1 - ssResidual / ssTotal;
}

/**
 * Fit calibration constants K and alpha from real battle data using
 * grid search with iterative refinement.
 *
 * This approach is simple, robust, and works well for a 2-parameter search space.
 */
export function fitCalibrationConstants(
  samples: CalibrationSample[],
  options?: { kRange?: [number, number]; alphaRange?: [number, number]; iterations?: number }
): CalibrationResult {
  if (samples.length === 0) {
    return { k: 1.0, alpha: 0.5, mse: Infinity, r2: 0, sampleCount: 0 };
  }

  let kMin = options?.kRange?.[0] ?? 0.01;
  let kMax = options?.kRange?.[1] ?? 10.0;
  let aMin = options?.alphaRange?.[0] ?? 0.1;
  let aMax = options?.alphaRange?.[1] ?? 1.5;
  const iterations = options?.iterations ?? 4;
  const gridSize = 20;

  let bestK = 1.0;
  let bestAlpha = 0.5;
  let bestMSE = Infinity;

  for (let iter = 0; iter < iterations; iter++) {
    const kStep = (kMax - kMin) / gridSize;
    const aStep = (aMax - aMin) / gridSize;

    for (let ki = 0; ki <= gridSize; ki++) {
      for (let ai = 0; ai <= gridSize; ai++) {
        const k = kMin + ki * kStep;
        const alpha = aMin + ai * aStep;
        const mse = computeMSE(samples, k, alpha);
        if (mse < bestMSE) {
          bestMSE = mse;
          bestK = k;
          bestAlpha = alpha;
        }
      }
    }

    // Narrow the search window around the best point
    const kMargin = (kMax - kMin) / 4;
    const aMargin = (aMax - aMin) / 4;
    kMin = Math.max(0.001, bestK - kMargin);
    kMax = bestK + kMargin;
    aMin = Math.max(0.01, bestAlpha - aMargin);
    aMax = bestAlpha + aMargin;
  }

  return {
    k: Number(bestK.toFixed(6)),
    alpha: Number(bestAlpha.toFixed(6)),
    mse: bestMSE,
    r2: computeR2(samples, bestK, bestAlpha),
    sampleCount: samples.length,
  };
}

/**
 * Evaluate the accuracy of given K and alpha values against samples.
 */
export function evaluateCalibration(
  samples: CalibrationSample[],
  k: number,
  alpha: number
): { mse: number; r2: number } {
  return {
    mse: computeMSE(samples, k, alpha),
    r2: computeR2(samples, k, alpha),
  };
}
