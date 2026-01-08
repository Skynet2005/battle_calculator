import type { TroopMixConfig } from '@/shared/types';
import { normalizeRatios } from '@/domain/rally/mix-utils';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';

export function describeMixSkew(
  playerMix: TroopMixConfig,
  opponentMix: TroopMixConfig,
  winner: "player" | "opponent" | "stalemate"
): string | null {
  const p = normalizeRatios(playerMix, DEFAULT_TROOP_MIX);
  const o = normalizeRatios(opponentMix, DEFAULT_TROOP_MIX);

  const pickTop = (mix: TroopMixConfig) => {
    const entries: Array<["infantry" | "lancer" | "marksman", number]> = [
      ["infantry", mix.infantryRatio ?? 0],
      ["lancer", mix.lancerRatio ?? 0],
      ["marksman", mix.marksmanRatio ?? 0],
    ];
    return entries.sort((a, b) => b[1] - a[1])[0];
  };

  const [pTop, pTopVal] = pickTop(p);
  const [oTop, oTopVal] = pickTop(o);

  const delta = Math.abs(pTopVal - oTopVal);
  if (delta < 5) return null;

  const outcomeHint =
    winner === "stalemate"
      ? "Mixes are meaningfully different, but stats/skills kept it even."
      : winner === "player"
        ? "Player's mix likely aligned better into counters/skill profile."
        : "Opponent's mix likely aligned better into counters/skill profile.";

  return `Mix skew: Player is ${pTop}-heavy (${pTopVal.toFixed(1)}%) vs Opponent ${oTop}-heavy (${oTopVal.toFixed(1)}%). ${outcomeHint}`;
}

export function computeCounterMixRecommendation(playerMix: TroopMixConfig, opponentMix: TroopMixConfig): string {
  const o = normalizeRatios(opponentMix, DEFAULT_TROOP_MIX);
  const oppRatios = {
    infantry: o.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio,
    lancer: o.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio,
    marksman: o.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio,
  };

  const maxOpp = (Object.entries(oppRatios).sort((a, b) => b[1] - a[1])[0][0] ??
    "infantry") as keyof typeof oppRatios;

  const counter = maxOpp === "infantry" ? "marksman" : maxOpp === "marksman" ? "lancer" : "infantry";
  return `Counter-mix: opponent is ${maxOpp}-heavy → increase ${counter} by ~5–10% (and reduce your least effective lane).`;
}
