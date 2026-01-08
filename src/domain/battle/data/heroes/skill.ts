import type { TroopStatLine } from "@/domain/rally/combat-types";
import type {
  NormalizedSkillEffect,
  TroopTarget
} from "./hero_types";

export interface AggregatedEffect {
  target: TroopTarget;
  stat: NormalizedSkillEffect["stat"];
  additive: number;
  multiplicative: number;
}

export interface EffectSummary {
  additive: Map<TroopTarget, Map<NormalizedSkillEffect["stat"], number>>;
  multiplicative: Map<TroopTarget, Map<NormalizedSkillEffect["stat"], number>>;
}

export function summarizeEffects(
  effects: NormalizedSkillEffect[]
): EffectSummary {
  const additive = new Map<TroopTarget, Map<NormalizedSkillEffect["stat"], number>>();
  const multiplicative = new Map<
    TroopTarget,
    Map<NormalizedSkillEffect["stat"], number>
  >();

  effects.forEach((effect) => {
    const bucket = effect.isMultiplicative ? multiplicative : additive;
    const targetBucket =
      bucket.get(effect.target) ??
      bucket.set(effect.target, new Map()).get(effect.target)!;
    targetBucket.set(effect.stat, (targetBucket.get(effect.stat) ?? 0) + effect.value);
  });

  return { additive, multiplicative };
}

export function applyEffectsToStats(
  base: TroopStatLine,
  summary: EffectSummary,
  target: TroopTarget
): TroopStatLine {
  const additive = summary.additive.get(target);
  const multiplicative = summary.multiplicative.get(target);

  return {
    attack: applyStat(base.attack, additive?.get("attack"), multiplicative?.get("attack")),
    defense: applyStat(base.defense, additive?.get("defense"), multiplicative?.get("defense")),
    health: applyStat(base.health, additive?.get("health"), multiplicative?.get("health")),
    lethality: applyStat(
      base.lethality,
      additive?.get("lethality"),
      multiplicative?.get("lethality")
    )
  };
}

function applyStat(
  baseValue: number,
  additive?: number,
  multiplicative?: number
): number {
  const add = additive ?? 0;
  const mult = multiplicative ?? 0;
  // stats in this project are stored as percentages, so to keep consistency we add directly.
  return (baseValue + add) * (1 + mult);
}
