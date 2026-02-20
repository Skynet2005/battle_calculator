/**
 * Unit tests for rally mix-utils
 */

import { describe, expect, it } from 'vitest';
import {
  normalizeRatios,
  computeCountsFromMix,
  applyRallyCapToTotal,
  type TroopMixConfig,
  type RallyTroopCounts,
} from '../mix-utils';

describe('normalizeRatios', () => {
  it('normalizes ratios to sum to 100', () => {
    const mix: TroopMixConfig = {
      totalTroops: 1000,
      infantryRatio: 50,
      lancerRatio: 50,
      marksmanRatio: 50,
    };
    const result = normalizeRatios(mix);
    expect(result.infantryRatio + result.lancerRatio + result.marksmanRatio).toBeCloseTo(100, 5);
  });

  it('uses fallback when all ratios are zero', () => {
    const mix: TroopMixConfig = {
      totalTroops: 1000,
      infantryRatio: 0,
      lancerRatio: 0,
      marksmanRatio: 0,
    };
    const fallback: TroopMixConfig = {
      totalTroops: 1000,
      infantryRatio: 33,
      lancerRatio: 33,
      marksmanRatio: 34,
    };
    const result = normalizeRatios(mix, fallback);
    expect(result.infantryRatio).toBe(33);
    expect(result.lancerRatio).toBe(33);
    expect(result.marksmanRatio).toBe(34);
  });
});

describe('computeCountsFromMix', () => {
  it('returns integer counts that sum to total', () => {
    const mix: TroopMixConfig = {
      totalTroops: 100,
      infantryRatio: 33.33,
      lancerRatio: 33.33,
      marksmanRatio: 33.34,
    };
    const counts = computeCountsFromMix(mix);
    expect(counts.infantry + counts.lancer + counts.marksman).toBe(100);
    expect(Number.isInteger(counts.infantry)).toBe(true);
    expect(Number.isInteger(counts.lancer)).toBe(true);
    expect(Number.isInteger(counts.marksman)).toBe(true);
  });

  it('handles equal 33/33/34 split', () => {
    const mix: TroopMixConfig = {
      totalTroops: 99,
      infantryRatio: 33.33,
      lancerRatio: 33.33,
      marksmanRatio: 33.34,
    };
    const counts = computeCountsFromMix(mix);
    expect(counts.infantry + counts.lancer + counts.marksman).toBe(99);
  });
});

describe('applyRallyCapToTotal', () => {
  it('returns total when cap is null or 0', () => {
    expect(applyRallyCapToTotal(1000, null)).toBe(1000);
    expect(applyRallyCapToTotal(1000, 0)).toBe(1000);
  });

  it('caps total when below cap', () => {
    expect(applyRallyCapToTotal(500, 300)).toBe(300);
  });

  it('returns total when already below cap', () => {
    expect(applyRallyCapToTotal(200, 300)).toBe(200);
  });
});
