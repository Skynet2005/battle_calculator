import { STAT_TROOP_TYPES } from '../battle/calculations';

/** Re-export for rally/mix usage. Source of truth: STAT_TROOP_TYPES in battle/calculations. */
export const TROOP_TYPES = STAT_TROOP_TYPES;
export type TroopType = (typeof TROOP_TYPES)[number];

export type RallyTroopCounts = Record<TroopType, number>;

export type TroopMixConfig = {
  totalTroops: number;
  infantryRatio: number;  // percent (0..100)
  lancerRatio: number;
  marksmanRatio: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const toInt = (v: number) => (Number.isFinite(v) ? Math.trunc(v) : 0);
const nonNegInt = (v: number) => Math.max(0, toInt(v));

export function applyRallyCapToTotal(totalTroops: number, cap?: number | null) {
  const t = nonNegInt(totalTroops);
  if (!cap || cap <= 0) return t;
  return Math.min(t, nonNegInt(cap));
}

export function normalizeRatios(mix: TroopMixConfig, fallback?: TroopMixConfig): TroopMixConfig {
  const inf = clamp(Number(mix.infantryRatio ?? 0), 0, 100);
  const lan = clamp(Number(mix.lancerRatio ?? 0), 0, 100);
  const mar = clamp(Number(mix.marksmanRatio ?? 0), 0, 100);
  const sum = inf + lan + mar;

  if (sum <= 0.000001) {
    // if user zeroed everything, fall back to default ratios (or 33/33/34)
    const fb = fallback ?? { totalTroops: mix.totalTroops, infantryRatio: 33, lancerRatio: 33, marksmanRatio: 34 };
    return { ...mix, infantryRatio: fb.infantryRatio, lancerRatio: fb.lancerRatio, marksmanRatio: fb.marksmanRatio };
  }

  const scale = 100 / sum;
  return {
    ...mix,
    infantryRatio: inf * scale,
    lancerRatio: lan * scale,
    marksmanRatio: mar * scale
  };
}

/**
 * When editing one ratio, keep total=100 by proportionally scaling the other two.
 * This feels "natural" in UI.
 */
export function setRatioKeeping100(
  mix: TroopMixConfig,
  type: TroopType,
  nextValue: number,
  fallback?: TroopMixConfig
): TroopMixConfig {
  const v = clamp(Number(nextValue), 0, 100);
  const aKey = `${type}Ratio` as const;

  // pull old values
  const old = normalizeRatios(mix, fallback);
  const oldInf = old.infantryRatio;
  const oldLan = old.lancerRatio;
  const oldMar = old.marksmanRatio;

  // set edited
  let inf = oldInf, lan = oldLan, mar = oldMar;
  if (aKey === 'infantryRatio') inf = v;
  if (aKey === 'lancerRatio') lan = v;
  if (aKey === 'marksmanRatio') mar = v;

  // distribute remainder across the other two proportionally
  const remainder = 100 - v;
  const others =
    type === 'infantry' ? [{ k: 'lancer', val: lan }, { k: 'marksman', val: mar }] :
    type === 'lancer' ? [{ k: 'infantry', val: inf }, { k: 'marksman', val: mar }] :
    [{ k: 'infantry', val: inf }, { k: 'lancer', val: lan }];

  const sumOthers = others[0].val + others[1].val;

  const o0 = sumOthers > 0 ? remainder * (others[0].val / sumOthers) : remainder / 2;
  const o1 = remainder - o0;

  if (type === 'infantry') { lan = o0; mar = o1; }
  if (type === 'lancer') { inf = o0; mar = o1; }
  if (type === 'marksman') { inf = o0; lan = o1; }

  return normalizeRatios({ ...mix, infantryRatio: inf, lancerRatio: lan, marksmanRatio: mar }, fallback);
}

/**
 * Deterministic rounding: counts sum EXACTLY to totalTroops.
 * We floor each bucket and then distribute remainder to largest fractional parts.
 */
export function computeCountsFromMix(mix: TroopMixConfig): RallyTroopCounts {
  const total = nonNegInt(mix.totalTroops ?? 0);
  if (total === 0) return { infantry: 0, lancer: 0, marksman: 0 };

  const norm = normalizeRatios(mix);
  const raw = [
    { t: 'infantry' as const, x: (norm.infantryRatio / 100) * total },
    { t: 'lancer' as const, x: (norm.lancerRatio / 100) * total },
    { t: 'marksman' as const, x: (norm.marksmanRatio / 100) * total }
  ];

  const floors = raw.map(r => ({ ...r, f: Math.floor(r.x), frac: r.x - Math.floor(r.x) }));
  const used = floors.reduce((s, r) => s + r.f, 0);
  let rem = total - used;

  floors.sort((a, b) => b.frac - a.frac); // largest fractional first
  for (let i = 0; i < floors.length && rem > 0; i++) {
    floors[i].f += 1;
    rem -= 1;
  }

  const out: RallyTroopCounts = { infantry: 0, lancer: 0, marksman: 0 };
  floors.forEach(r => { out[r.t] = r.f; });
  return out;
}

export function countsToMix(counts: RallyTroopCounts): TroopMixConfig {
  const inf = nonNegInt(counts.infantry);
  const lan = nonNegInt(counts.lancer);
  const mar = nonNegInt(counts.marksman);
  const total = inf + lan + mar;

  if (total === 0) {
    return { totalTroops: 0, infantryRatio: 33, lancerRatio: 33, marksmanRatio: 34 };
  }

  return normalizeRatios({
    totalTroops: total,
    infantryRatio: (inf / total) * 100,
    lancerRatio: (lan / total) * 100,
    marksmanRatio: (mar / total) * 100
  });
}

/**
 * If count-mode totals exceed cap, scale them down proportionally (mechanically accurate).
 */
export function clampCountsToCap(counts: RallyTroopCounts, cap?: number | null): RallyTroopCounts {
  const c = nonNegInt(cap ?? 0);
  const total = nonNegInt(counts.infantry) + nonNegInt(counts.lancer) + nonNegInt(counts.marksman);
  if (!c || c <= 0 || total <= c) return {
    infantry: nonNegInt(counts.infantry),
    lancer: nonNegInt(counts.lancer),
    marksman: nonNegInt(counts.marksman)
  };
  const scale = c / total;
  const scaled = {
    infantry: Math.floor(nonNegInt(counts.infantry) * scale),
    lancer: Math.floor(nonNegInt(counts.lancer) * scale),
    marksman: Math.floor(nonNegInt(counts.marksman) * scale)
  };
  // fix rounding remainder via computeCountsFromMix on a ratio mix
  return computeCountsFromMix(countsToMix({ ...scaled }));
}
