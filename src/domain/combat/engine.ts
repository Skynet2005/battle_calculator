import { aggregateAdditive, applySpecialFormula, computeEffectiveStats, TROOP_TYPES } from "./bonuses";
import { computeDamage } from "./damage";
import { categorizeModifierType } from "./skill-stacking";
import {
  filterModifiersForAction,
  initSkillRuntime,
  makeRng,
  triggerSkills
} from "./skills";
import { pickTarget } from "./targeting";
import type {
  ActiveModifier,
  ActiveStatBuff,
  BattleConfig,
  BattleOutcome,
  BattleReport,
  BattleRole,
  BattleType,
  DamageModifier,
  ModifierComponentLog,
  SimulateParams,
  SkillEffect,
  SkillTrigger,
  StatComputationDetail,
  TroopCounts,
  TroopStats,
  TroopType,
  TurnLog
} from "./types";
import { DEFAULT_BATTLE_CONFIG } from "./types";

const DEFAULT_CASUALTY_MODEL = {
  apply: (kills: number, battleType: BattleType) => {
    if (battleType === "Garrison" || battleType === "BearTrap") {
      const wounded = Math.round(kills * 0.6);
      const dead = Math.max(0, kills - wounded);
      return { dead, wounded };
    }
    return { dead: kills, wounded: 0 };
  }
};

// Re-export SimulateParams for backwards compatibility
export type { SimulateParams } from "./types";

export function simulateBattle(params: SimulateParams): BattleOutcome {
  const config: BattleConfig = { ...DEFAULT_BATTLE_CONFIG, ...params.config };
  if (config.randomMode === "monteCarlo") {
    return runMonteCarlo(params, config);
  }
  return { report: runDeterministic(params, config) };
}

function runMonteCarlo(params: SimulateParams, config: BattleConfig): BattleOutcome {
  const simulations = config.simulations ?? 200;
  let aggregateKills = 0;
  let aggregateOutgoing = 0;
  let aggregateIncoming = 0;

  // Track wins/losses/draws for win rate calculation
  let attackerWins = 0;
  let defenderWins = 0;
  let draws = 0;

  let lastReport: BattleReport | null = null;
  const baseSeed = config.rngSeed ?? 1;

  for (let i = 0; i < simulations; i += 1) {
    const seeded = { ...config, rngSeed: baseSeed + i, randomMode: "monteCarlo" as const };
    const report = runDeterministic(params, seeded);
    lastReport = report;
    const lastTurn = report.turns[report.turns.length - 1];
    const kills = Math.max(0, params.defender.troops.Marksman + params.defender.troops.Infantry + params.defender.troops.Lancer - (lastTurn?.defenderTroops?.Marksman ?? 0) - (lastTurn?.defenderTroops?.Infantry ?? 0) - (lastTurn?.defenderTroops?.Lancer ?? 0));
    aggregateKills += kills;
    aggregateOutgoing += report.turns.reduce((sum, t) => sum + t.actions.reduce((s, a) => s + a.components.outgoingMultiplier, 0), 0);
    aggregateIncoming += report.turns.reduce((sum, t) => sum + t.actions.reduce((s, a) => s + a.components.incomingMultiplier, 0), 0);

    // Track winner for win rate calculation
    if (report.winner === 'attacker') {
      attackerWins += 1;
    } else if (report.winner === 'defender') {
      defenderWins += 1;
    } else {
      draws += 1;
    }
  }

  if (!lastReport) {
    throw new Error("Simulation failed to produce report");
  }

  const meanFinalKills: BattleReport["meanFinalKills"] = {
    baseKills: aggregateKills / simulations,
    outgoingMultiplier: aggregateOutgoing / simulations,
    incomingMultiplier: aggregateIncoming / simulations,
    finalKills: aggregateKills / simulations
  };

  // Calculate win rate (as percentage)
  const attackerWinRate = simulations > 0 ? (attackerWins / simulations) * 100 : 0;
  const drawRate = simulations > 0 ? (draws / simulations) * 100 : 0;

  return {
    report: {
      ...lastReport,
      simulationsRun: simulations,
      meanFinalKills,
      attackerWinRate,
      drawRate
    }
  };
}

function runDeterministic(params: SimulateParams, config: BattleConfig): BattleReport {
  const { attacker, defender } = params;
  const rng = makeRng(config.rngSeed ?? 1);
  const attackerStats = computeEffectiveStats(attacker.baseStats, attacker.additiveBonuses, attacker.specialBonuses);
  const defenderStats = computeEffectiveStats(defender.baseStats, defender.additiveBonuses, defender.specialBonuses);

  const attackerAdditiveBase = aggregateAdditive(attacker.additiveBonuses);
  const defenderAdditiveBase = aggregateAdditive(defender.additiveBonuses);

  const attackerTroops: TroopCounts = { ...attacker.troops };
  const defenderTroops: TroopCounts = { ...defender.troops };

  const attackerSkillRuntime = initSkillRuntime(attacker.skills);
  const defenderSkillRuntime = initSkillRuntime(defender.skills);

  const attackerModifiers: ActiveModifier[] = [];
  const defenderModifiers: ActiveModifier[] = [];
  const attackerBuffs: ActiveStatBuff[] = [];
  const defenderBuffs: ActiveStatBuff[] = [];

  const turns: TurnLog[] = [];

  // Track scheduled effects for "after every N turns" skills
  const scheduledEffectsQueue: Array<{
    effect: SkillEffect;
    applyOnTurn: number;
    modifiers: ActiveModifier[];
    buffs: ActiveStatBuff[];
    side: "attacker" | "defender";
  }> = [];

  for (let turn = 1; turn <= config.maxTurns; turn += 1) {
    const buffsApplied: TurnLog["buffsApplied"] = [];
    const buffsExpired: TurnLog["buffsExpired"] = [];
    const actions: TurnLog["actions"] = [];

    expireEffects(attackerModifiers, attackerBuffs, buffsExpired, turn);
    expireEffects(defenderModifiers, defenderBuffs, buffsExpired, turn);

    // Apply scheduled effects from "after every N turns" skills
    const toApply = scheduledEffectsQueue.filter(e => e.applyOnTurn === turn);
    scheduledEffectsQueue.splice(0, scheduledEffectsQueue.length, ...scheduledEffectsQueue.filter(e => e.applyOnTurn !== turn));

    toApply.forEach(({ modifiers, buffs, side }) => {
      if (side === "attacker") {
        modifiers.forEach(mod => {
          attackerModifiers.push(mod);
          buffsApplied.push({
            turn,
            source: mod.source,
            stackingKey: mod.modifier.stackingKey,
            appliedTo: mod.modifier.appliesTo,
            expiresOnTurn: mod.remaining > 0 ? turn + mod.remaining : undefined
          });
        });
        buffs.forEach(buff => {
          attackerBuffs.push(buff);
          buffsApplied.push({
            turn,
            source: buff.source,
            stackingKey: buff.stackingKey,
            appliedTo: buff.target,
            expiresOnTurn: buff.remaining > 0 ? turn + buff.remaining : undefined
          });
        });
      } else {
        modifiers.forEach(mod => {
          defenderModifiers.push(mod);
          buffsApplied.push({
            turn,
            source: mod.source,
            stackingKey: mod.modifier.stackingKey,
            appliedTo: mod.modifier.appliesTo,
            expiresOnTurn: mod.remaining > 0 ? turn + mod.remaining : undefined
          });
        });
        buffs.forEach(buff => {
          defenderBuffs.push(buff);
          buffsApplied.push({
            turn,
            source: buff.source,
            stackingKey: buff.stackingKey,
            appliedTo: buff.target,
            expiresOnTurn: buff.remaining > 0 ? turn + buff.remaining : undefined
          });
        });
      }
    });

    const skillsActivated: TurnLog["skillsActivated"] = [];
    const skillImpacts: TurnLog["skillImpacts"] = [];
    const skillRolls: TurnLog["skillRolls"] = [];

    applySkillTrigger(
      attackerSkillRuntime,
      "OnTurnStart",
      turn,
      config,
      rng,
      attackerModifiers,
      attackerBuffs,
      buffsApplied,
      attacker.role,
      scheduledEffectsQueue,
      "attacker",
      skillsActivated,
      skillImpacts,
      skillRolls,
      attackerTroops
    );
    applySkillTrigger(
      defenderSkillRuntime,
      "OnTurnStart",
      turn,
      config,
      rng,
      defenderModifiers,
      defenderBuffs,
      buffsApplied,
      defender.role,
      scheduledEffectsQueue,
      "defender",
      skillsActivated,
      skillImpacts,
      skillRolls,
      defenderTroops
    );

    // Log passive/permanent skills as active each turn (for display) without re-triggering effects
    logPassiveSkillsActive(attackerSkillRuntime, "attacker", skillsActivated);
    logPassiveSkillsActive(defenderSkillRuntime, "defender", skillsActivated);

    const startAttackerTroops = { ...attackerTroops };
    const startDefenderTroops = { ...defenderTroops };
    const attackerEffectiveSnapshot = snapshotEffectiveStats(attackerStats, attackerAdditiveBase, attackerBuffs);
    const defenderEffectiveSnapshot = snapshotEffectiveStats(defenderStats, defenderAdditiveBase, defenderBuffs);

    // Normal attacks
    for (const attackerType of TROOP_TYPES) {
      if (attackerTroops[attackerType] <= 0) continue;
      const targetSelection = pickTarget(attackerType, defenderTroops, config, rng);
      const target = targetSelection.target;
      if (!target) continue;
      const computation = resolveHit({
        attackerType,
        defenderType: target,
        attackerStats: attackerStats[attackerType].final,
        defenderStats: defenderStats[target].final,
        attackerCount: attackerTroops[attackerType],
        defenderCount: defenderTroops[target],
        attackerModifiers,
        defenderModifiers,
        config,
        actionType: "NormalAttack",
        attackerBuffs,
        defenderBuffs,
        attackerAdditiveBase: attackerAdditiveBase[attackerType],
        defenderAdditiveBase: defenderAdditiveBase[target]
      });
      const preDefenderCount = defenderTroops[target];
      const killsApplied = Math.round(computation.components.finalKills);
      defenderTroops[target] = Math.max(0, defenderTroops[target] - killsApplied);
      actions.push({
        id: `act-${turn}-att-${attackerType}-${target}-${actions.length}`,
        turn,
        actor: attackerType,
        target,
        actionType: "NormalAttack",
        trigger: "OnNormalAttack",
        side: "attacker",
        components: computation.components,
        outgoingComponents: computation.outgoingComponents,
        incomingComponents: computation.incomingComponents,
        stats: { attacker: computation.attackerDetail, defender: computation.defenderDetail },
        targeting: {
          selected: targetSelection.target,
          reason: targetSelection.reason,
          mode: config.randomMode,
          roll: targetSelection.roll,
          probability: targetSelection.probability,
          backlineDive: targetSelection.backlineDive,
          priority: TROOP_TYPES
        },
        rngRolls:
          targetSelection.roll !== undefined
            ? [
              {
                label: "targeting",
                value: targetSelection.roll ?? 0,
                threshold: targetSelection.probability,
                succeeded: targetSelection.backlineDive
              }
            ]
            : undefined,
        remaining: { ...defenderTroops },
        attackerCount: attackerTroops[attackerType],
        defenderCount: preDefenderCount,
        appliedKills: { [target]: killsApplied }
      });
    }

    // Defender retaliates
    for (const defenderType of TROOP_TYPES) {
      if (defenderTroops[defenderType] <= 0) continue;
      const targetSelection = pickTarget(defenderType, attackerTroops, config, rng);
      const target = targetSelection.target;
      if (!target) continue;
      const computation = resolveHit({
        attackerType: defenderType,
        defenderType: target,
        attackerStats: defenderStats[defenderType].final,
        defenderStats: attackerStats[target].final,
        attackerCount: defenderTroops[defenderType],
        defenderCount: attackerTroops[target],
        attackerModifiers: defenderModifiers,
        defenderModifiers: attackerModifiers,
        config,
        actionType: "NormalAttack",
        attackerBuffs: defenderBuffs,
        defenderBuffs: attackerBuffs,
        attackerAdditiveBase: defenderAdditiveBase[defenderType],
        defenderAdditiveBase: attackerAdditiveBase[target]
      });
      const preDefenderCount = attackerTroops[target];
      const killsApplied = Math.round(computation.components.finalKills);
      attackerTroops[target] = Math.max(0, attackerTroops[target] - killsApplied);
      actions.push({
        id: `act-${turn}-def-${defenderType}-${target}-${actions.length}`,
        turn,
        actor: defenderType,
        target,
        actionType: "NormalAttack",
        trigger: "OnNormalAttack",
        side: "defender",
        components: computation.components,
        outgoingComponents: computation.outgoingComponents,
        incomingComponents: computation.incomingComponents,
        stats: { attacker: computation.attackerDetail, defender: computation.defenderDetail },
        targeting: {
          selected: targetSelection.target,
          reason: targetSelection.reason,
          mode: config.randomMode,
          roll: targetSelection.roll,
          probability: targetSelection.probability,
          backlineDive: targetSelection.backlineDive,
          priority: TROOP_TYPES
        },
        rngRolls:
          targetSelection.roll !== undefined
            ? [
              {
                label: "targeting",
                value: targetSelection.roll ?? 0,
                threshold: targetSelection.probability,
                succeeded: targetSelection.backlineDive
              }
            ]
            : undefined,
        remaining: { ...attackerTroops },
        attackerCount: defenderTroops[defenderType],
        defenderCount: preDefenderCount,
        appliedKills: { [target]: killsApplied }
      });
    }

    // Turn end trigger
    applySkillTrigger(
      attackerSkillRuntime,
      "OnTurnEnd",
      turn,
      config,
      rng,
      attackerModifiers,
      attackerBuffs,
      buffsApplied,
      attacker.role,
      scheduledEffectsQueue,
      "attacker",
      skillsActivated,
      skillImpacts,
      skillRolls,
      attackerTroops
    );
    applySkillTrigger(
      defenderSkillRuntime,
      "OnTurnEnd",
      turn,
      config,
      rng,
      defenderModifiers,
      defenderBuffs,
      buffsApplied,
      defender.role,
      scheduledEffectsQueue,
      "defender",
      skillsActivated,
      skillImpacts,
      skillRolls,
      defenderTroops
    );

    turns.push({
      turn,
      startAttackerTroops,
      startDefenderTroops,
      startModifiers: { attacker: mapActiveModifiers(attackerModifiers), defender: mapActiveModifiers(defenderModifiers) },
      startEffectiveStats: {
        attacker: {
          Infantry: attackerEffectiveSnapshot.Infantry.detail,
          Lancer: attackerEffectiveSnapshot.Lancer.detail,
          Marksman: attackerEffectiveSnapshot.Marksman.detail
        },
        defender: {
          Infantry: defenderEffectiveSnapshot.Infantry.detail,
          Lancer: defenderEffectiveSnapshot.Lancer.detail,
          Marksman: defenderEffectiveSnapshot.Marksman.detail
        }
      },
      buffsApplied,
      buffsExpired,
      actions,
      attackerTroops: { ...attackerTroops },
      defenderTroops: { ...defenderTroops },
      stacking: {
        attacker: mapActiveModifiers(attackerModifiers),
        defender: mapActiveModifiers(defenderModifiers)
      },
      skillsActivated,
      skillImpacts,
      skillRolls
    });

    const attackerAlive = TROOP_TYPES.some((t) => attackerTroops[t] > 0);
    const defenderAlive = TROOP_TYPES.some((t) => defenderTroops[t] > 0);
    if (!attackerAlive || !defenderAlive) {
      break;
    }
  }

  // Win condition: Primary - one side reaches zero troops
  // Secondary - if battle ends with both sides having troops (max turns reached),
  // winner is whoever has more troops remaining
  const attackerTotal = total(attackerTroops);
  const defenderTotal = total(defenderTroops);

  const winner =
    defenderTotal === 0 && attackerTotal > 0
      ? "attacker"
      : attackerTotal === 0 && defenderTotal > 0
        ? "defender"
        : attackerTotal > defenderTotal
          ? "attacker"
          : defenderTotal > attackerTotal
            ? "defender"
            : "draw";

  return {
    config,
    configSnapshot: config,
    targetingConfig: {
      priority: TROOP_TYPES,
      allowBacklineDive: config.allowLancerBacklineDive,
      backlineDiveChance: config.lancerBacklineDiveChance,
      backlineDivers: ["Lancer"]
    },
    attacker,
    defender,
    turns,
    winner,
    attackerRemaining: attackerTroops,
    defenderRemaining: defenderTroops,
    totalTurns: turns.length,
    casualties: {
      attacker: {
        Infantry: Math.max(0, attacker.troops.Infantry - attackerTroops.Infantry),
        Lancer: Math.max(0, attacker.troops.Lancer - attackerTroops.Lancer),
        Marksman: Math.max(0, attacker.troops.Marksman - attackerTroops.Marksman)
      },
      defender: {
        Infantry: Math.max(0, defender.troops.Infantry - defenderTroops.Infantry),
        Lancer: Math.max(0, defender.troops.Lancer - defenderTroops.Lancer),
        Marksman: Math.max(0, defender.troops.Marksman - defenderTroops.Marksman)
      }
    }
  };
}

function resolveHit(params: {
  attackerType: keyof TroopCounts;
  defenderType: keyof TroopCounts;
  attackerStats: TroopStats;
  defenderStats: TroopStats;
  attackerCount: number;
  defenderCount: number;
  attackerModifiers: ActiveModifier[];
  defenderModifiers: ActiveModifier[];
  config: BattleConfig;
  actionType: "NormalAttack" | "Skill";
  attackerBuffs: ActiveStatBuff[];
  defenderBuffs: ActiveStatBuff[];
  attackerAdditiveBase: TroopStats;
  defenderAdditiveBase: TroopStats;
}) {
  const {
    attackerType,
    defenderType,
    attackerStats,
    defenderStats,
    attackerCount,
    defenderCount,
    attackerModifiers,
    defenderModifiers,
    config,
    actionType,
    attackerBuffs,
    defenderBuffs,
    attackerAdditiveBase,
    defenderAdditiveBase
  } = params;

  const attackerStatBuff = computeBuffedStats(attackerStats, attackerAdditiveBase, attackerBuffs, attackerType);
  const defenderStatBuff = computeBuffedStats(defenderStats, defenderAdditiveBase, defenderBuffs, defenderType);

  // Apply stacking rules: same type additive, different types multiplicative
  const outgoingModifiersList = filterModifiersForAction(
    attackerModifiers.map((m) => m.modifier).filter((m) => m.subject === "outgoing"),
    attackerType,
    actionType
  );
  const enemyOutgoingModifiersList = filterModifiersForAction(
    defenderModifiers.map((m) => m.modifier).filter((m) => m.subject === "enemyOutgoing"),
    attackerType,
    actionType
  );
  const incomingModifiersList = filterModifiersForAction(
    defenderModifiers.map((m) => m.modifier).filter((m) => m.subject === "incoming"),
    defenderType,
    actionType
  );

  // Group by type and apply stacking rules (same type additive, different types multiplicative)
  // Combine outgoing and enemyOutgoing modifiers, then apply stacking
  const allOutgoingModifiers = [...outgoingModifiersList, ...enemyOutgoingModifiersList];
  const outgoingStack = stackModifiersWithLog(allOutgoingModifiers, config.stackingBehavior);
  const incomingStack = stackModifiersWithLog(incomingModifiersList, config.stackingBehavior);
  const outgoingMods = outgoingStack.magnitudes;
  const incomingMods = incomingStack.magnitudes;

  const components = computeDamage(
    {
      attackerType,
      defenderType,
      attackerStats: attackerStatBuff.stats,
      defenderStats: defenderStatBuff.stats,
      attackerCount,
      defenderCount,
      matchupMultiplier: 1,
      actionMultiplier: 1,
      outgoingModifiers: outgoingMods,
      incomingModifiers: incomingMods,
      outgoingDetails: outgoingStack.components,
      incomingDetails: incomingStack.components,
      attackerEffectiveDetail: attackerStatBuff.detail,
      defenderEffectiveDetail: defenderStatBuff.detail
    },
    config
  );

  return {
    components,
    attackerDetail: attackerStatBuff.detail,
    defenderDetail: defenderStatBuff.detail,
    outgoingComponents: outgoingStack.components,
    incomingComponents: incomingStack.components
  };
}

function stackModifiersWithLog(
  modifiers: DamageModifier[],
  stackingBehavior: "strict" | "permissive"
): { magnitudes: number[]; components: ModifierComponentLog[] } {
  const components: ModifierComponentLog[] = [];

  // Apply stackingKey rule (keep strongest by absolute magnitude) when strict
  let filtered = modifiers;
  if (stackingBehavior === "strict") {
    const bestByKey = new Map<string, DamageModifier>();
    modifiers.forEach((mod) => {
      if (!mod.stackingKey) return;
      const existing = bestByKey.get(mod.stackingKey);
      if (!existing || Math.abs(mod.magnitude) > Math.abs(existing.magnitude)) {
        bestByKey.set(mod.stackingKey, mod);
      }
    });

    filtered = modifiers.map((mod) => {
      if (!mod.stackingKey) return mod;
      const kept = bestByKey.get(mod.stackingKey) === mod;
      components.push({
        id: mod.id,
        source: mod.source,
        stackingKey: mod.stackingKey,
        magnitude: mod.magnitude,
        subject: mod.subject,
        appliesTo: mod.appliesTo,
        scope: mod.scope,
        remaining: mod.durationTurns,
        kept,
        discardedReason: kept ? undefined : "weaker-stackingKey"
      });
      return kept ? mod : null;
    }).filter((m): m is DamageModifier => Boolean(m));
  }

  const modifiersByType = new Map<string, DamageModifier[]>();
  filtered.forEach((mod) => {
    const type = categorizeModifierType(mod);
    if (!modifiersByType.has(type)) modifiersByType.set(type, []);
    modifiersByType.get(type)!.push(mod);
  });

  const magnitudes: number[] = [];

  modifiersByType.forEach((mods, type) => {
    const sum = mods.reduce((acc, m) => acc + m.magnitude, 0);
    const clamped = Math.max(-0.99, sum);
    magnitudes.push(clamped);
    components.push({
      id: `${type}-stacked`,
      source: mods.map((m) => m.source).join("+"),
      stackingKey: mods.find((m) => m.stackingKey)?.stackingKey,
      magnitude: clamped,
      subject: mods[0]?.subject ?? "outgoing",
      appliesTo: mods[0]?.appliesTo ?? "All",
      scope: mods[0]?.scope,
      kept: true
    });
  });

  // If permissive or no stackingKey matches, ensure each modifier is represented
  if (stackingBehavior === "permissive") {
    modifiers.forEach((mod) => {
      components.push({
        id: mod.id,
        source: mod.source,
        stackingKey: mod.stackingKey,
        magnitude: mod.magnitude,
        subject: mod.subject,
        appliesTo: mod.appliesTo,
        scope: mod.scope,
        remaining: mod.durationTurns,
        kept: true
      });
    });
  }

  return { magnitudes, components };
}

function snapshotEffectiveStats(
  baseStats: Record<TroopType, { final: TroopStats }>,
  additiveBase: Record<TroopType, TroopStats>,
  buffs: ActiveStatBuff[]
): Record<TroopType, { stats: TroopStats; detail: Record<keyof TroopStats, StatComputationDetail> }> {
  return TROOP_TYPES.reduce((acc, type) => {
    const computed = computeBuffedStats(baseStats[type].final, additiveBase[type], buffs, type);
    acc[type] = computed;
    return acc;
  }, {} as Record<TroopType, { stats: TroopStats; detail: Record<keyof TroopStats, StatComputationDetail> }>);
}

function mapActiveModifiers(mods: ActiveModifier[]): ModifierComponentLog[] {
  return mods.map((m) => ({
    id: m.modifier.id,
    source: m.modifier.source ?? m.source,
    stackingKey: m.modifier.stackingKey,
    magnitude: m.modifier.magnitude,
    subject: m.modifier.subject,
    appliesTo: m.modifier.appliesTo,
    scope: m.modifier.scope,
    remaining: m.remaining,
    kept: true
  }));
}

function computeBuffedStats(
  base: TroopStats,
  baseAdditive: TroopStats | undefined,
  buffs: ActiveStatBuff[],
  troop: keyof TroopCounts
): { stats: TroopStats; detail: { attack: StatComputationDetail; defense: StatComputationDetail; health: StatComputationDetail; lethality: StatComputationDetail } } {
  const additiveBase = baseAdditive ?? { attack: 0, defense: 0, health: 0, lethality: 0 };
  const additive = { ...additiveBase };
  const specialAll = { attack: 0, defense: 0, health: 0, lethality: 0 };
  const specialType = { attack: 0, defense: 0, health: 0, lethality: 0 };

  buffs.forEach((buff) => {
    if (buff.target !== "All" && buff.target !== troop) return;
    additive.attack += buff.additive.attack ?? 0;
    additive.defense += buff.additive.defense ?? 0;
    additive.health += buff.additive.health ?? 0;
    additive.lethality += buff.additive.lethality ?? 0;

    if (buff.target === "All") {
      specialAll.attack = applySpecialFormula(specialAll.attack, buff.special.attack ?? 0);
      specialAll.defense = applySpecialFormula(specialAll.defense, buff.special.defense ?? 0);
      specialAll.health = applySpecialFormula(specialAll.health, buff.special.health ?? 0);
      specialAll.lethality = applySpecialFormula(specialAll.lethality, buff.special.lethality ?? 0);
    } else {
      specialType.attack = applySpecialFormula(specialType.attack, buff.special.attack ?? 0);
      specialType.defense = applySpecialFormula(specialType.defense, buff.special.defense ?? 0);
      specialType.health = applySpecialFormula(specialType.health, buff.special.health ?? 0);
      specialType.lethality = applySpecialFormula(specialType.lethality, buff.special.lethality ?? 0);
    }
  });

  const buildDetail = (key: keyof TroopStats): StatComputationDetail => {
    const basePercent = additive[key];
    const afterAll = applySpecialFormula(basePercent, specialAll[key]);
    const finalPercent = applySpecialFormula(afterAll, specialType[key]);
    const effective = base[key] * (1 + finalPercent / 100);
    return {
      base: base[key],
      additiveAll: additiveBase[key],
      additiveType: 0,
      specialAll: specialAll[key],
      specialType: specialType[key],
      finalPercent,
      effective
    };
  };

  const detail = {
    attack: buildDetail("attack"),
    defense: buildDetail("defense"),
    health: buildDetail("health"),
    lethality: buildDetail("lethality")
  };

  return {
    stats: {
      attack: detail.attack.effective,
      defense: detail.defense.effective,
      health: detail.health.effective,
      lethality: detail.lethality.effective
    },
    detail
  };
}

function expireEffects(
  modifiers: ActiveModifier[],
  buffs: ActiveStatBuff[],
  expiredLog: TurnLog["buffsExpired"],
  turn: number
) {
  const expiredMods = modifiers.filter((item) => item.remaining === 0);
  const expiredBuffs = buffs.filter((item) => item.remaining === 0);
  expiredMods.forEach((m) =>
    expiredLog.push({
      turn,
      source: m.modifier.source,
      stackingKey: m.modifier.stackingKey,
      appliedTo: m.modifier.appliesTo,
      expiresOnTurn: turn
    })
  );
  expiredBuffs.forEach((b) =>
    expiredLog.push({
      turn,
      source: b.source,
      stackingKey: b.stackingKey,
      appliedTo: b.target
    })
  );
  // keep only active
  modifiers.forEach((m) => {
    if (m.remaining > 0) m.remaining -= 1;
  });
  buffs.forEach((b) => {
    if (b.remaining > 0) b.remaining -= 1;
  });
  prune(modifiers);
  prune(buffs);
}

function prune<T extends { remaining: number }>(items: T[]) {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i].remaining === 0) {
      items.splice(i, 1);
    }
  }
}

function applySkillTrigger(
  runtime: ReturnType<typeof initSkillRuntime>,
  trigger: Parameters<typeof triggerSkills>[1],
  turn: number,
  config: BattleConfig,
  rng: ReturnType<typeof makeRng>,
  activeModifiers: ActiveModifier[],
  activeBuffs: ActiveStatBuff[],
  log: TurnLog["buffsApplied"],
  role: "attacker" | "defender",
  scheduledEffectsQueue: Array<{
    effect: SkillEffect;
    applyOnTurn: number;
    modifiers: ActiveModifier[];
    buffs: ActiveStatBuff[];
    side: "attacker" | "defender";
  }>,
  side: "attacker" | "defender",
  skillActivations: TurnLog["skillsActivated"],
  skillImpacts: Array<{
    side: "attacker" | "defender";
    name: string;
    heroId?: string;
    stats?: string[];
    specialStats?: string[];
    damageModifier?: boolean;
    trigger?: SkillTrigger;
    succeeded?: boolean;
  }>,
  skillRolls: TurnLog["skillRolls"],
  currentTroops: TroopCounts
) {
  const { effects, damageModifiers, triggeredSkills, triggeredSkillImpacts } = triggerSkills(
    runtime,
    trigger,
    turn,
    config,
    rng,
    skillRolls,
    side,
    currentTroops
  );
  if (triggeredSkills?.length && skillActivations) {
    triggeredSkills.forEach((entry) => {
      if (entry.trigger === "PassivePermanent") return; // avoid double-logging passives; logged separately per turn
      skillActivations.push({ side, name: entry.name, heroId: entry.heroId, succeeded: true });
    });
  }
  if (triggeredSkillImpacts?.length) {
    triggeredSkillImpacts.forEach((entry) =>
      skillImpacts.push({
        side,
        name: entry.name,
        heroId: entry.heroId,
        stats: entry.stats,
        specialStats: entry.specialStats,
        damageModifier: entry.damageModifier,
        trigger: entry.trigger,
        succeeded: true
      })
    );
  }

  effects.forEach((effect) => {
    const remaining = effect.durationTurns ?? 0;
    const trackedRemaining = remaining === 0 ? -1 : remaining;

    // Handle "after every N turns" - schedule for next turn
    const skillDef = runtime.find(e => e.skill.effects.includes(effect))?.skill;
    if (skillDef?.isAfterEveryNTurns && trigger === "OnTurnEnd") {
      // Schedule effect for next turn
      const scheduledModifiers: ActiveModifier[] = [];
      const scheduledBuffs: ActiveStatBuff[] = [];

      if (effect.damageModifier) {
        scheduledModifiers.push({
          modifier: { ...effect.damageModifier, source: effect.damageModifier.source ?? effect.id },
          remaining: trackedRemaining,
          source: effect.id
        });
      }
      if (effect.statBuff || effect.specialBuff) {
        scheduledBuffs.push({
          target: effect.target === "All" ? "All" : effect.target,
          additive: effect.statBuff ?? {},
          special: effect.specialBuff ?? {},
          remaining: trackedRemaining,
          source: effect.id,
          stackingKey: effect.stackingKey
        });
      }

      scheduledEffectsQueue.push({
        effect,
        applyOnTurn: turn + 1,
        modifiers: scheduledModifiers,
        buffs: scheduledBuffs,
        side
      });
      return; // Don't apply now, schedule for next turn
    }

    if (effect.statBuff || effect.specialBuff) {
      // Handle not-stackable: remove existing buffs with same stackingKey
      if (effect.stackingKey) {
        for (let i = activeBuffs.length - 1; i >= 0; i--) {
          if (activeBuffs[i].stackingKey === effect.stackingKey &&
            activeBuffs[i].target === effect.target) {
            activeBuffs.splice(i, 1);
          }
        }
      }

      activeBuffs.push({
        target: effect.target === "All" ? "All" : effect.target,
        additive: effect.statBuff ?? {},
        special: effect.specialBuff ?? {},
        remaining: trackedRemaining,
        source: effect.id,
        stackingKey: effect.stackingKey
      });
      log.push({
        turn,
        source: effect.id,
        stackingKey: effect.stackingKey,
        appliedTo: effect.target,
        expiresOnTurn: remaining > 0 ? turn + remaining : undefined
      });
    }
    if (effect.damageModifier) {
      // Handle not-stackable: remove existing modifiers with same stackingKey
      if (effect.damageModifier.stackingKey) {
        for (let i = activeModifiers.length - 1; i >= 0; i--) {
          if (activeModifiers[i].modifier.stackingKey === effect.damageModifier!.stackingKey &&
            activeModifiers[i].modifier.appliesTo === effect.damageModifier!.appliesTo) {
            activeModifiers.splice(i, 1);
          }
        }
      }

      const modifierWithDuration: ActiveModifier = {
        modifier: { ...effect.damageModifier, source: effect.damageModifier.source ?? effect.id },
        remaining: trackedRemaining,
        source: effect.id
      };
      activeModifiers.push(modifierWithDuration);
      log.push({
        turn,
        source: effect.id,
        stackingKey: effect.damageModifier.stackingKey,
        appliedTo: effect.damageModifier.appliesTo,
        expiresOnTurn: remaining > 0 ? turn + remaining : undefined
      });
    }
  });

  damageModifiers.forEach((mod) => {
    // Handle not-stackable: remove existing modifiers with same stackingKey
    if (mod.stackingKey) {
      for (let i = activeModifiers.length - 1; i >= 0; i--) {
        if (activeModifiers[i].modifier.stackingKey === mod.stackingKey &&
          activeModifiers[i].modifier.appliesTo === mod.appliesTo) {
          activeModifiers.splice(i, 1);
        }
      }
    }

    activeModifiers.push({
      modifier: mod,
      remaining: mod.durationTurns === 0 || mod.durationTurns === undefined ? -1 : mod.durationTurns,
      source: mod.source
    });
    log.push({
      turn,
      source: mod.source,
      stackingKey: mod.stackingKey,
      appliedTo: mod.appliesTo,
      expiresOnTurn: mod.durationTurns ? turn + mod.durationTurns : undefined
    });
  });
}

function logPassiveSkillsActive(
  runtime: ReturnType<typeof initSkillRuntime>,
  side: BattleRole,
  skillActivations: TurnLog["skillsActivated"]
) {
  const exists = new Set(
    (skillActivations || [])
      .filter((s) => s.side === side)
      .map((s) => `${s.heroId ?? '__troop'}:${s.name}`)
  );
  runtime.forEach(({ skill }) => {
    if (skill.trigger === "PassivePermanent") {
      const key = `${skill.heroId ?? '__troop'}:${skill.name || skill.id}`;
      if (exists.has(key)) return;
      exists.add(key);
      skillActivations?.push({
        side,
        name: skill.name || skill.id,
        heroId: skill.heroId,
        isActive: true,
        succeeded: true
      });
    }
  });
}

function total(counts: TroopCounts) {
  return counts.Infantry + counts.Lancer + counts.Marksman;
}
