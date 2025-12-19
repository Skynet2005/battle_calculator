import { normalizeModifiers } from "./bonuses";
import type {
  BattleConfig,
  BattleRole,
  DamageModifier,
  Joiner,
  JoinerSkill,
  Rng,
  SkillDefinition,
  SkillEffect,
  SkillRuntimeState,
  SkillTrigger,
  TriggerResult,
  TroopCounts,
  TroopType
} from "./types";

// Re-export types that were previously defined here for backwards compatibility
export type { Joiner, JoinerSkill, Rng, SkillRuntimeState, TriggerResult };

export function makeRng(seed: number): Rng {
  // Mulberry32 for deterministic Monte Carlo.
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initSkillRuntime(skills: SkillDefinition[]): SkillRuntimeState[] {
  return skills.map((skill) => ({
    skill,
    nextAvailableTurn: 0,
    periodicInterval: skill.periodicInterval,
    isAfterEveryNTurns: skill.isAfterEveryNTurns
  }));
}

export function triggerSkills(
  runtime: SkillRuntimeState[],
  trigger: SkillTrigger,
  turn: number,
  config: BattleConfig,
  rng: Rng,
  skillRolls?: Array<{
    side: BattleRole;
    name: string;
    heroId?: string;
    trigger?: SkillTrigger;
    roll?: number;
    threshold?: number;
    succeeded: boolean;
    sourceType?: 'hero' | 'troop';
  }>,
  side?: BattleRole,
  currentTroops?: TroopCounts
): TriggerResult {
  const activeEffects: SkillEffect[] = [];
  const activeModifiers: DamageModifier[] = [];
  const triggeredSkills: Array<{ name: string; heroId?: string }> = [];
  const triggeredSkillImpacts: Array<{
    name: string;
    heroId?: string;
    stats?: string[];
    specialStats?: string[];
    damageModifier?: boolean;
    target?: string;
    trigger?: SkillTrigger;
    sourceType?: 'hero' | 'troop';
  }> = [];

  runtime.forEach((entry) => {
    const { skill } = entry;

    if (currentTroops && !hasLiveTargets(skill, currentTroops)) {
      return;
    }

    // PassivePermanent: only once, on Turn 1, and only when called with OnTurnStart
    if (skill.trigger === "PassivePermanent") {
      if (turn > 1 || trigger !== "OnTurnStart") {
        return;
      }
    } else if (skill.trigger !== trigger) {
      return;
    }

    // Handle periodic triggers
    if (trigger === "OnTurnStart" && entry.periodicInterval && !entry.isAfterEveryNTurns) {
      // "Every N turns" triggers at StartOfTurn when turn % N === 0
      if (turn % entry.periodicInterval !== 0) {
        return; // Not the right turn
      }
    } else if (trigger === "OnTurnEnd" && entry.periodicInterval && entry.isAfterEveryNTurns) {
      // "After every N turns" triggers at EndOfTurn when turn % N === 0
      if (turn % entry.periodicInterval !== 0) {
        return; // Not the right turn
      }
      // Effect will be applied at StartOfTurn next turn (handled in engine)
    } else {
      if (turn < entry.nextAvailableTurn) {
        return;
      }
    }

    // PassivePermanent only triggers once at battle start (turn 1)
    // (handled above)

    let skillTriggeredThisEntry = false;
    const impactStats = new Set<string>();
    const impactSpecial = new Set<string>();
    let impactDamage = false;

    skill.effects.forEach((effect) => {
      const chance = effect.chance ?? 1;
      if (config.randomMode === "expectedValue") {
        const scaled = scaleEffect(effect, chance);
        activeEffects.push(scaled.effect);
        if (scaled.modifier) {
          activeModifiers.push(scaled.modifier);
        }
        skillTriggeredThisEntry = true;
        if (skillRolls && side) {
          skillRolls.push({
            side,
            name: skill.name || skill.id,
            heroId: skill.heroId,
            trigger: skill.trigger,
            roll: chance,
            threshold: chance,
            succeeded: true, // In expectedValue mode, effects always succeed
            sourceType: skill.heroId ? "hero" : "troop"
          });
        }
      } else {
        const roll = rng();
        const succeeded = roll <= chance;
        if (skillRolls && side) {
          skillRolls.push({
            side,
            name: skill.name || skill.id,
            heroId: skill.heroId,
            trigger: skill.trigger,
            roll,
            threshold: chance,
            succeeded,
            sourceType: skill.heroId ? "hero" : "troop"
          });
        }
        if (succeeded) {
          activeEffects.push(effect);
          if (effect.damageModifier) {
            activeModifiers.push(effect.damageModifier);
          }
          skillTriggeredThisEntry = true;
        }
      }

      if (skillTriggeredThisEntry) {
        if (effect.statBuff) {
          Object.keys(effect.statBuff).forEach((k) => impactStats.add(k));
        }
        if (effect.specialBuff) {
          Object.keys(effect.specialBuff).forEach((k) => impactSpecial.add(k));
        }
        if (effect.damageModifier) {
          impactDamage = true;
        }
      }
    });

    if (skillTriggeredThisEntry) {
      const sourceType: 'hero' | 'troop' = skill.heroId ? 'hero' : 'troop';
      triggeredSkills.push({ name: skill.name || skill.id, heroId: skill.heroId });
      triggeredSkillImpacts.push({
        name: skill.name || skill.id,
        heroId: skill.heroId,
        stats: impactStats.size ? Array.from(impactStats) : undefined,
        specialStats: impactSpecial.size ? Array.from(impactSpecial) : undefined,
        damageModifier: impactDamage || undefined,
        target: skill.effects.find((e) => e.target)?.target ?? undefined,
        trigger: skill.trigger,
        sourceType
      });
    }

    // Set cooldown for periodic skills
    if (entry.periodicInterval) {
      // Periodic skills reset after their interval
      entry.nextAvailableTurn = turn + entry.periodicInterval;
    } else if (skill.cooldownTurns && skill.cooldownTurns > 0) {
      entry.nextAvailableTurn = turn + skill.cooldownTurns;
    }
  });

  return {
    effects: activeEffects,
    damageModifiers: normalizeModifiers(activeModifiers, config.stackingBehavior),
    triggeredSkills,
    triggeredSkillImpacts
  };
}

function hasLiveTargets(skill: SkillDefinition, troops: TroopCounts): boolean {
  const total = (troops.Infantry ?? 0) + (troops.Lancer ?? 0) + (troops.Marksman ?? 0);
  if (total === 0) return false;
  // If any effect targets a troop type that has units > 0, allow; if target is All, allow.
  let hasTargeting = false;
  for (const effect of skill.effects) {
    if (!effect.target || effect.target === "All") {
      hasTargeting = true;
      if (total > 0) return true;
    } else if (effect.target === "Infantry") {
      hasTargeting = true;
      if (troops.Infantry > 0) return true;
    } else if (effect.target === "Lancer") {
      hasTargeting = true;
      if (troops.Lancer > 0) return true;
    } else if (effect.target === "Marksman") {
      hasTargeting = true;
      if (troops.Marksman > 0) return true;
    }
  }
  // If the skill had explicit targeting and none were alive, block it.
  return !hasTargeting ? true : false;
}

function scaleEffect(effect: SkillEffect, chance: number): { effect: SkillEffect; modifier?: DamageModifier } {
  const effCopy: SkillEffect = { ...effect };
  if (effCopy.statBuff) {
    effCopy.statBuff = scaleStats(effCopy.statBuff, chance);
  }
  if (effCopy.specialBuff) {
    effCopy.specialBuff = scaleStats(effCopy.specialBuff, chance);
  }
  if (effCopy.damageModifier) {
    const mod: DamageModifier = {
      ...effCopy.damageModifier,
      magnitude: (effCopy.damageModifier.magnitude ?? 0) * chance
    };
    effCopy.damageModifier = mod;
    return { effect: effCopy, modifier: mod };
  }
  if (effCopy.flatDamage !== undefined) {
    effCopy.flatDamage = effCopy.flatDamage * chance;
  }
  return { effect: effCopy };
}

function scaleStats(stats: Partial<Record<"attack" | "defense" | "health" | "lethality", number>>, chance: number) {
  return Object.entries(stats).reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = (value ?? 0) * chance;
    return acc;
  }, {});
}

export function selectJoinerPrimarySkills(joiners: Joiner[], battleType: BattleConfig["battleType"]): JoinerSkill[] {
  const primaries = joiners
    .map((j) => j.primarySkill)
    .filter((skill): skill is JoinerSkill => Boolean(skill));
  const sorted = primaries.sort((a, b) => {
    if (b.level === a.level) {
      return a.heroId.localeCompare(b.heroId);
    }
    return b.level - a.level;
  });
  const limit = battleType === "BearTrap" ? 4 : 4;
  return sorted.slice(0, limit);
}

export function filterModifiersForAction(
  modifiers: DamageModifier[],
  actor: TroopType,
  actionType: "NormalAttack" | "Skill"
): DamageModifier[] {
  return modifiers.filter((mod) => {
    const scope = mod.scope ?? "Any";
    const matchesScope =
      scope === "Any" ||
      (scope === "NormalAttack" && actionType === "NormalAttack") ||
      (scope === "Skill" && actionType === "Skill") ||
      scope === "NormalAttackReceived" ||
      scope === "SkillReceived";
    const appliesToActor = mod.appliesTo === "All" || mod.appliesTo === actor;
    return matchesScope && appliesToActor;
  });
}
