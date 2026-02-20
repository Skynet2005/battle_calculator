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
  
  // Following Whiteout Survival model: calculate damage first, then apply mitigation
  // Base damage: (Atk_eff * Leth_eff) * N^alpha
  // This represents the raw attack power before mitigation
  const baseDamage = atkEff * lethEff * Math.pow(N, config.troopCountExponentAlpha);
  
  // Apply outgoing modifiers to base damage (NormalAttackDmg%, DamageDealt%, etc.)
  const outgoingMultiplier = productFromMagnitudes(outgoingModifiers);
  const totalOutgoingDamage = baseDamage * outgoingMultiplier * matchupMultiplier * actionMultiplier;
  
  // Mitigation model: M(Def_eff, HP_eff) = K / (K + Def_eff * HP_eff)
  // Scale K by HP to ensure proper scaling: K_effective = K * HP_base
  // This ensures mitigation scales correctly with HP values
  // For typical HP values in the thousands, we scale K proportionally
  const hpBase = Math.max(100, hpEff); // Use HP as base scale, minimum 100
  const kScaled = config.calibrationConstantK * hpBase;
  const mitigationDenominator = kScaled + (defEff * hpEff);
  const mitigation = kScaled / mitigationDenominator;
  
  // Apply incoming modifiers (damage reduction) to mitigated damage
  const incomingMultiplier = productFromMagnitudes(incomingModifiers);
  const damageAfterMitigation = totalOutgoingDamage * mitigation * incomingMultiplier;
  
  // Convert damage to casualties: DamageAfterMitigation / HP_perTroop
  // Each troop has HP_eff health points, so damage / HP = number of troops killed
  // This ensures that higher HP troops require more damage to kill
  const casualties = hpEff > 0 ? damageAfterMitigation / hpEff : damageAfterMitigation;
  
  // For v2 formula (HP excluded from denominator), use simpler mitigation: K / (K + Def)
  let finalKills = casualties;
  if (config.damageFormulaVersion === "v2") {
    const defBase = Math.max(100, defEff); // Scale K by Def for v2
    const kScaledV2 = config.calibrationConstantK * defBase;
    const mitigationV2 = kScaledV2 / (kScaledV2 + defEff);
    const damageAfterMitigationV2 = totalOutgoingDamage * mitigationV2 * incomingMultiplier;
    // For v2, casualties are directly the mitigated damage (HP not in denominator)
    finalKills = damageAfterMitigationV2;
  }

  // Ensure we don't exceed defender count and damage is non-negative
  finalKills = Math.max(0, Math.min(finalKills, defenderCount));

  return {
    k: config.calibrationConstantK,
    alpha: config.troopCountExponentAlpha,
    nTerm: Math.pow(N, config.troopCountExponentAlpha),
    numerator: atkEff * lethEff,
    denominator: config.damageFormulaVersion === "v2" ? defEff : defEff * hpEff,
    ratio: config.damageFormulaVersion === "v2" 
      ? (atkEff * lethEff) / defEff 
      : (atkEff * lethEff) / (defEff * hpEff),
    matchupMultiplier,
    actionMultiplier,
    rawFinal: finalKills,
    baseKills: casualties,
    outgoingMultiplier,
    incomingMultiplier,
    outgoingComponents: input.outgoingDetails ?? [],
    incomingComponents: input.incomingDetails ?? [],
    finalKills
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
