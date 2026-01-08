import type { ActionComputationLog, BattleConfig, DamageInput } from "./types";

// Re-export DamageInput for backwards compatibility
export type { DamageInput } from "./types";

export function computeDamage(input: DamageInput, config: BattleConfig): ActionComputationLog {
  const {
    attackerStats,
    defenderStats,
    attackerCount,
    defenderCount,
    matchupMultiplier,
    actionMultiplier,
    outgoingModifiers,
    incomingModifiers
  } = input;

  if (attackerCount <= 0 || defenderCount <= 0) {
    return emptyDamage();
  }

  const atkEff = Math.max(0, attackerStats.attack);
  const lethEff = Math.max(0, attackerStats.lethality);
  const defEff = Math.max(1, defenderStats.defense);
  const hpEff = Math.max(1, defenderStats.health);

  const N = Math.max(attackerCount, 1);
  const numerator = atkEff * lethEff;
  const denominator = defEff * hpEff;
  const ratio = denominator === 0 ? 0 : numerator / denominator;
  const nTerm = Math.pow(N, config.troopCountExponentAlpha);
  const baseKills = config.calibrationConstantK * nTerm * ratio * matchupMultiplier * actionMultiplier;

  const outgoingMultiplier = productFromMagnitudes(outgoingModifiers);
  const incomingMultiplier = productFromMagnitudes(incomingModifiers);

  const rawFinal = baseKills * outgoingMultiplier * incomingMultiplier;
  const finalKills = Math.max(0, rawFinal);

  return {
    k: config.calibrationConstantK,
    alpha: config.troopCountExponentAlpha,
    nTerm,
    numerator,
    denominator,
    ratio,
    matchupMultiplier,
    actionMultiplier,
    rawFinal,
    baseKills,
    outgoingMultiplier,
    incomingMultiplier,
    outgoingComponents: input.outgoingDetails ?? [],
    incomingComponents: input.incomingDetails ?? [],
    finalKills: Math.min(finalKills, defenderCount)
  };
}

export function productFromMagnitudes(values: number[]): number {
  // Values are already grouped by type and summed (additive same type)
  // Now multiply across different types (multiplicative)
  const result = values.reduce((acc, value) => {
    const multiplier = 1 + value;
    // Clamp to prevent negative or zero multipliers
    return acc * Math.max(0.01, multiplier);
  }, 1);
  return Math.max(0.01, result);
}

export function emptyDamage(): ActionComputationLog {
  return {
    k: 0,
    alpha: 0,
    nTerm: 0,
    numerator: 0,
    denominator: 0,
    ratio: 0,
    matchupMultiplier: 1,
    actionMultiplier: 1,
    rawFinal: 0,
    baseKills: 0,
    outgoingMultiplier: 1,
    incomingMultiplier: 1,
    outgoingComponents: [],
    incomingComponents: [],
    finalKills: 0
  };
}
