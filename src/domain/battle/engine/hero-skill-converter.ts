/**
 * Hero Skill Converter
 *
 * Converts hero LevelSkill data to combat engine SkillDefinition format.
 * Handles all skill types, triggers, durations, chances, and scopes.
 */

import type { Hero, HeroSkillLevelPercent, LevelSkill, SkillLevel, SkillEffectEntry } from "../data/heroes/hero_types";
import { extractSkillValue, getMaxSkillLevel } from "../data/heroes/skill-utils";
import { STAT_TROOP_TYPES } from "../calculations";
import type {
  BonusTarget,
  DamageModifier,
  DamageModifierScope,
  DamageModifierSubject,
  SkillDefinition,
  SkillEffect,
  SkillTrigger,
  TroopStats
} from "./types";

/**
 * Parse troop target from skill property key
 */
function parseTroopTarget(key: string): BonusTarget {
  if (key.includes('all_troops') || key.includes('rally_troops')) {
    return 'All';
  }
  if (key.includes('infantry')) {
    return 'Infantry';
  }
  if (key.includes('lancer')) {
    return 'Lancer';
  }
  if (key.includes('marksman')) {
    return 'Marksman';
  }
  return 'All'; // Default
}

/**
 * Determine trigger type from skill data
 */
function determineTrigger(skill: LevelSkill | null): SkillTrigger {
  if (!skill) {
    return 'PassivePermanent';
  }

  // Check for periodic triggers
  if (skill.trigger_every_n_turns !== undefined ||
    skill.trigger_every_n_strikes !== undefined) {
    return 'OnTurnStart'; // "every N turns" triggers at start
  }
  if (skill.trigger_after_every_n_turns !== undefined) {
    return 'OnTurnEnd'; // "after every N turns" triggers at end
  }

  // Check for action-based triggers
  const skillKeys = Object.keys(skill);
  if (skillKeys.some(k => k.includes('normal_attack_damage') &&
    (k.includes('up') || k.includes('taken_down')))) {
    return 'OnNormalAttack';
  }
  if (skillKeys.some(k => k.includes('skill_damage') &&
    (k.includes('up') || k.includes('taken_down')))) {
    return 'OnSkillCast';
  }

  // Default to permanent passive
  return 'PassivePermanent';
}

/**
 * Determine periodic interval from skill data
 */
function getPeriodicInterval(skill: LevelSkill | null): number | undefined {
  if (!skill) {
    return undefined;
  }

  if (skill.trigger_every_n_turns !== undefined) {
    const raw = skill.trigger_every_n_turns;
    const val = typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseInt(raw, 10) || 0
        : Array.isArray(raw)
          ? 0
          : extractSkillValue(raw, 5);
    return val;
  }
  // Handle "every N strikes" (treat as "every N turns" for now)
  if (skill.trigger_every_n_strikes !== undefined) {
    const raw = skill.trigger_every_n_strikes;
    const val = typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseInt(raw, 10) || 0
        : Array.isArray(raw)
          ? 0
          : extractSkillValue(raw, 5);
    return val;
  }
  if (skill.trigger_after_every_n_turns !== undefined) {
    const raw = skill.trigger_after_every_n_turns;
    const val = typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? parseInt(raw, 10) || 0
        : Array.isArray(raw)
          ? 0
          : extractSkillValue(raw, 5);
    return val;
  }
  return undefined;
}

/**
 * Determine duration from skill data
 */
function getDuration(skill: LevelSkill | null, level: SkillLevel): number {
  if (!skill) {
    return 0;
  }

  if (skill.duration_turns !== undefined) {
    return extractSkillValue(skill.duration_turns, level);
  }
  if (skill.target_damage_taken_duration_turns !== undefined) {
    return extractSkillValue(skill.target_damage_taken_duration_turns, level);
  }
  if (skill.reduction_duration_turns !== undefined) {
    return extractSkillValue(skill.reduction_duration_turns, level);
  }
  return 0; // Permanent
}

/**
 * Determine chance from skill data
 */
function getChance(skill: LevelSkill | null, level: SkillLevel): number | undefined {
  if (!skill || skill.trigger_chance === undefined) {
    return undefined; // No chance = always proc
  }
  const chanceValue = skill.trigger_chance;
  if (typeof chanceValue === 'string') {
    return undefined; // String values not supported for chance
  }
  if (typeof chanceValue === 'number') {
    return chanceValue;
  }
  return extractSkillValue(chanceValue as HeroSkillLevelPercent, level);
}

/**
 * Determine stacking key for non-stackable effects
 */
function getStackingKey(skill: LevelSkill | null, heroName: string, skillIndex: number): string | undefined {
  if (!skill) {
    return undefined;
  }

  // Check if skill has "not stackable" or recurring behavior
  const desc = (skill.description || '').toLowerCase();
  if (desc.includes('not stackable') || desc.includes('recurring')) {
    return `${heroName}_skill_${skillIndex}`;
  }
  return undefined;
}

/**
 * Create damage modifier from skill property
 */
function createDamageModifier(
  key: string,
  value: number,
  heroName: string,
  skillName: string,
  skillIndex: number,
  duration: number,
  chance?: number,
  stackingKey?: string
): DamageModifier | null {
  if (value === 0) return null;

  // Determine subject
  let subject: DamageModifierSubject = 'outgoing';
  if (key.includes('damage_taken_down') || key.includes('damage_taken_up')) {
    subject = 'incoming';
  } else if (key.includes('enemy_damage_down') || key.includes('enemy_attack_down') ||
    key.includes('lethality_reduction')) {
    subject = 'enemyOutgoing';
  } else if (key.includes('enemy_damage_taken_up') || key.includes('target_damage_taken_up')) {
    subject = 'incoming'; // Enemy damage taken up = our incoming damage multiplier
  }

  // Determine scope
  let scope: DamageModifierScope = 'Any';
  if (key.includes('normal_attack')) {
    scope = key.includes('taken') || key.includes('received') ? 'NormalAttackReceived' : 'NormalAttack';
  } else if (key.includes('skill_damage')) {
    scope = key.includes('taken') || key.includes('received') ? 'SkillReceived' : 'Skill';
  }

  // Determine appliesTo
  const appliesTo = parseTroopTarget(key);

  // Determine magnitude (convert percentage to decimal)
  const magnitude = value; // Already in decimal form (0.20 = 20%)

  return {
    id: `${heroName}_${skillName}_${key}_${skillIndex}`,
    source: `${heroName}: ${skillName}`,
    subject,
    appliesTo,
    durationTurns: duration,
    chance: chance ?? 1,
    stackingKey,
    magnitude,
    scope
  };
}

/**
 * Create stat buff from skill property
 */
function createStatBuff(
  key: string,
  value: number,
  appliesTo: BonusTarget
): Partial<TroopStats> | null {
  if (value === 0) return null;

  const buff: Partial<TroopStats> = {};

  if (key.includes('attack_up') || key.includes('attack_increase')) {
    buff.attack = value * 100; // Convert to percentage
  } else if (key.includes('defense_up') || key.includes('defense_increase')) {
    buff.defense = value * 100;
  } else if (key.includes('health_up') || key.includes('health_increase')) {
    buff.health = value * 100;
  } else if (key.includes('lethality_up') || key.includes('lethality_increase')) {
    buff.lethality = value * 100;
  } else {
    return null;
  }

  return buff;
}

/**
 * Convert a single LevelSkill to SkillDefinition
 */
export function convertLevelSkillToSkillDefinition(
  heroName: string,
  skill: LevelSkill,
  skillIndex: number,
  level: SkillLevel
): SkillDefinition | null {
  if (!skill || !skill['skill-name']) {
    return null;
  }

  const skillName = skill['skill-name'];
  const description = skill.description || '';
  const trigger = determineTrigger(skill);
  const duration = getDuration(skill, level);
  const chance = getChance(skill, level);
  const stackingKey = getStackingKey(skill, heroName, skillIndex);
  const periodicInterval = getPeriodicInterval(skill);

  const effects: SkillEffect[] = [];

  // Process all skill properties
  for (const [key, rawValue] of Object.entries(skill)) {
    if (key === 'skill-name' || key === 'description' ||
      key === 'trigger_chance' || key === 'duration_turns' ||
      key === 'target_damage_taken_duration_turns' || key === 'reduction_duration_turns' ||
      key === 'trigger_every_n_turns' || key === 'trigger_after_every_n_turns') {
      continue;
    }

    const value = extractSkillValue(rawValue as number | HeroSkillLevelPercent | undefined, level);
    if (value === 0) continue;

    const appliesTo = parseTroopTarget(key);

    // Handle damage modifiers
    if (key.includes('damage_up') || key.includes('damage_down') ||
      key.includes('damage_taken_down') || key.includes('damage_taken_up') ||
      key.includes('enemy_damage_down') || key.includes('enemy_attack_down') ||
      key.includes('enemy_damage_taken_up') || key.includes('extra_damage_up') ||
      key.includes('target_damage_taken_up') || key.includes('normal_attack_damage') ||
      key.includes('skill_damage') || key.includes('lethality_reduction')) {

      // Special handling for Wu Ming-style skills with separate normal/skill damage reductions
      if (key.includes('skill_damage_taken_down')) {
        // Skill damage reduction - create modifier with SkillReceived scope
        const modifier: DamageModifier = {
          id: `${heroName}_${skillName}_skill_reduction_${skillIndex}`,
          source: `${heroName}: ${skillName}`,
          subject: 'incoming',
          appliesTo,
          durationTurns: duration,
          chance: chance ?? 1,
          stackingKey,
          magnitude: value,
          scope: 'SkillReceived'
        };

        effects.push({
          id: `${heroName}_${skillName}_effect_${skillIndex}_skill_reduction`,
          trigger,
          type: 'DamageMultiplier',
          target: appliesTo,
          damageModifier: modifier,
          durationTurns: duration > 0 ? duration : undefined,
          chance,
          stackingKey,
          description: `${skillName}: Skill Damage Reduction`
        });
      } else if (key.includes('damage_taken_down') && !key.includes('skill')) {
        // Normal attack damage reduction (when there's also a skill_damage version)
        // Check if this skill also has skill_damage_taken_down
        const hasSkillVersion = Object.keys(skill).some(k =>
          k.includes('skill_damage_taken_down') && k.includes(parseTroopTarget(key).toLowerCase())
        );

        const modifier: DamageModifier = {
          id: `${heroName}_${skillName}_normal_reduction_${skillIndex}`,
          source: `${heroName}: ${skillName}`,
          subject: 'incoming',
          appliesTo,
          durationTurns: duration,
          chance: chance ?? 1,
          stackingKey,
          magnitude: value,
          scope: hasSkillVersion ? 'NormalAttackReceived' : 'Any' // If there's a skill version, this is normal-only
        };

        effects.push({
          id: `${heroName}_${skillName}_effect_${skillIndex}_normal_reduction`,
          trigger,
          type: 'DamageMultiplier',
          target: appliesTo,
          damageModifier: modifier,
          durationTurns: duration > 0 ? duration : undefined,
          chance,
          stackingKey,
          description: `${skillName}: Normal Attack Damage Reduction`
        });
      } else {
        // General damage modifier
        const modifier = createDamageModifier(
          key,
          value,
          heroName,
          skillName,
          skillIndex,
          duration,
          chance,
          stackingKey
        );

        if (modifier) {
          effects.push({
            id: `${heroName}_${skillName}_effect_${skillIndex}_${key}`,
            trigger,
            type: 'DamageMultiplier',
            target: appliesTo,
            damageModifier: modifier,
            durationTurns: duration > 0 ? duration : undefined,
            chance,
            stackingKey,
            description: `${skillName}: ${key}`
          });
        }
      }
    }
    // Handle stat buffs
    else if (key.includes('attack_up') || key.includes('attack_increase') ||
      key.includes('defense_up') || key.includes('defense_increase') ||
      key.includes('health_up') || key.includes('health_increase') ||
      key.includes('lethality_up') || key.includes('lethality_increase')) {

      const statBuff = createStatBuff(key, value, appliesTo);

      if (statBuff) {
        effects.push({
          id: `${heroName}_${skillName}_effect_${skillIndex}_${key}`,
          trigger,
          type: 'StatBuff',
          target: appliesTo,
          statBuff,
          durationTurns: duration > 0 ? duration : undefined,
          chance,
          stackingKey,
          description: `${skillName}: ${key}`
        });
      }
    }
    // Handle stun chance
    else if (key.includes('stun_chance')) {
      // Stun is a control effect - for now, treat as damage modifier with special handling
      const modifier: DamageModifier = {
        id: `${heroName}_${skillName}_stun_${skillIndex}`,
        source: `${heroName}: ${skillName}`,
        subject: 'outgoing',
        appliesTo,
        durationTurns: duration > 0 ? duration : 1, // Stuns typically last 1 turn
        chance: value, // Stun chance is the proc chance
        magnitude: 0, // Stun doesn't modify damage, just applies control
        scope: 'Any'
      };

      effects.push({
        id: `${heroName}_${skillName}_effect_${skillIndex}_stun`,
        trigger,
        type: 'DamageMultiplier',
        target: appliesTo,
        damageModifier: modifier,
        durationTurns: duration > 0 ? duration : 1,
        chance: value,
        description: `${skillName}: Stun Chance`
      });
    }
  }

  if (effects.length === 0) {
    return null; // No valid effects found
  }

  // Determine if this is an "after every N turns" skill
  const isAfterEveryNTurns = skill.trigger_after_every_n_turns !== undefined;

  // Extract doubling chance from skill data
  // Check for explicit double_damage_chance property (used by troop skills)
  let doubleDamageChance: number | undefined = undefined;
  if ('double_damage_chance' in skill && typeof skill.double_damage_chance === 'number') {
    doubleDamageChance = skill.double_damage_chance;
  }
  // Check skill_effects for extra_attack with chance (troop skills may have this)
  else if (skill.skill_effects && Array.isArray(skill.skill_effects)) {
    for (const se of skill.skill_effects) {
      // Type assertion needed since extra_attack may exist on some skill effect types but not in TypeScript interface
      const seAny = se as SkillEffectEntry & { extra_attack?: boolean };
      if (seAny.extra_attack && se.effect_is_chance && se.effect_probabilities) {
        // Use the max probability from effect_probabilities as doubling chance
        const probabilities = Object.values(se.effect_probabilities).map((n) => Number(n) / 100 || 0);
        if (probabilities.length > 0) {
          doubleDamageChance = Math.max(...probabilities);
          break;
        }
      }
    }
  }
  // Check description for common doubling chance mentions (25%, 20%, etc.)
  // This is a fallback heuristic - skills that mention doubling/critical damage chances
  if (doubleDamageChance === undefined && description) {
    const descLower = description.toLowerCase();
    // Look for patterns like "25% chance of dealing extra damage" or "25% chance of dealing critical damage"
    const chanceMatch = description.match(/(\d+)%\s+chance.*(?:deal|deal|deal|deal).*(?:extra|critical|double)/i);
    if (chanceMatch) {
      const chancePercent = parseInt(chanceMatch[1], 10);
      if (!isNaN(chancePercent) && chancePercent > 0 && chancePercent <= 100) {
        doubleDamageChance = chancePercent / 100;
      }
    }
  }

  // Create skill definition
  const skillDef: SkillDefinition = {
    id: `${heroName}_${skillName}_${skillIndex}`,
    name: skillName,
    trigger,
    effects,
    level,
    heroId: heroName,
    description,
    ...(periodicInterval ? { periodicInterval } : {}),
    ...(isAfterEveryNTurns ? { isAfterEveryNTurns: true } : {}),
    ...(doubleDamageChance !== undefined ? { doubleDamageChance } : {})
  };

  return skillDef;
}

/**
 * Convert all expedition skills for a hero to SkillDefinitions
 */
export function convertHeroSkillsToSkillDefinitions(
  heroName: string,
  skills: LevelSkill[],
  skillLevels: Record<string, SkillLevel>,
  isJoiner: boolean = false
): SkillDefinition[] {
  const definitions: SkillDefinition[] = [];

  skills.forEach((skill, index) => {
    if (!skill) return;

    // For joiners, only process first skill
    if (isJoiner && index > 0) {
      return;
    }

    // Determine skill level
    let level: SkillLevel = 1;
    if (isJoiner) {
      // For joiners, find max level from skill data
      let maxLevel: SkillLevel = 1;
      for (const [key, value] of Object.entries(skill)) {
        if (key === 'skill-name' || key === 'description') continue;
        const propMaxLevel = getMaxSkillLevel(value as number | HeroSkillLevelPercent | undefined);
        if (propMaxLevel > maxLevel) {
          maxLevel = propMaxLevel;
        }
      }
      level = maxLevel;
    } else {
      // For leaders, use configured level or default to 5
      const skillName = skill['skill-name'] || `skill_${index + 1}`;
      level = skillLevels[skillName] || 5;
    }

    const skillDef = convertLevelSkillToSkillDefinition(heroName, skill, index + 1, level);
    if (skillDef) {
      definitions.push(skillDef);
    }
  });

  return definitions;
}

/**
 * Get max skill level from a skill's properties
 */
export function getMaxSkillLevelFromSkill(skill: LevelSkill): SkillLevel {
  let maxLevel: SkillLevel = 1;

  if (!skill) return maxLevel;

  for (const [key, value] of Object.entries(skill)) {
    if (key === 'skill-name' || key === 'description') continue;
    const propMaxLevel = getMaxSkillLevel(value as number | HeroSkillLevelPercent | undefined);
    if (propMaxLevel > maxLevel) {
      maxLevel = propMaxLevel;
    }
  }

  return maxLevel;
}

/**
 * Convert joiner heroes to SkillDefinitions (only 1st skill at max level)
 */
export function convertJoinersToSkillDefinitions(
  joiners: Array<{ heroName?: string }> | undefined,
  getHeroByName: (name: string) => Hero | null | undefined,
  getHeroExpeditionSkills: (hero: Hero) => Array<{ name: string; description: string; data: NonNullable<LevelSkill> }>
): SkillDefinition[] {
  const skills: SkillDefinition[] = [];

  if (!joiners) return skills;

  // Only process first 4 joiners
  const firstFourJoiners = joiners.slice(0, 4);

  firstFourJoiners.forEach((joiner) => {
    if (!joiner.heroName) return;

    const hero = getHeroByName(joiner.heroName);
    if (!hero) return;

    const heroSkills = getHeroExpeditionSkills(hero);
    if (heroSkills.length === 0) return;

    // Only process first skill
    const firstSkill = heroSkills[0];
    const skillData = firstSkill.data as LevelSkill;
    if (!skillData) return;

    // Find max level for this skill
    const maxLevel = getMaxSkillLevelFromSkill(skillData);

    // Convert to SkillDefinition
    const skillDef = convertLevelSkillToSkillDefinition(
      joiner.heroName,
      skillData,
      1,
      maxLevel
    );

    if (skillDef) {
      skills.push(skillDef);
    }
  });

  return skills;
}

/**
 * Convert leader heroes to SkillDefinitions (all skills at configured levels)
 */
export function convertLeadersToSkillDefinitions(
  leaders: {
    infantry?: { heroName?: string; skillLevels?: Record<string, SkillLevel> } | null;
    lancer?: { heroName?: string; skillLevels?: Record<string, SkillLevel> } | null;
    marksman?: { heroName?: string; skillLevels?: Record<string, SkillLevel> } | null;
  },
  getHeroByName: (name: string) => Hero | null | undefined,
  getHeroExpeditionSkills: (hero: Hero) => Array<{ name: string; description: string; data: NonNullable<LevelSkill> }>
): SkillDefinition[] {
  const skills: SkillDefinition[] = [];

  STAT_TROOP_TYPES.forEach((type) => {
    const leader = leaders[type];
    if (!leader || !leader.heroName) return;

    const hero = getHeroByName(leader.heroName);
    if (!hero) return;

    const heroSkills = getHeroExpeditionSkills(hero);
    const skillLevels = leader.skillLevels || {};

    heroSkills.forEach((skillWrapper, index) => {
      const skillData = skillWrapper.data as LevelSkill;
      if (!skillData) return;

      // Get skill level from config or default to 5
      const skillName = skillData['skill-name'] || `skill_${index + 1}`;
      const level = skillLevels[skillName] || 5;

      // Convert to SkillDefinition
      const skillDef = convertLevelSkillToSkillDefinition(
        leader.heroName!,
        skillData,
        index + 1,
        level
      );

      if (skillDef) {
        skills.push(skillDef);
      }
    });
  });

  return skills;
}

// ---------------------------------------------------------------------------
// Troop skills -> SkillDefinition (passive/permanent, heuristic mapping)
// ---------------------------------------------------------------------------
import type { TroopType } from "..";
import { TROOP_SKILLS } from "../data/troops/troop_skills";

export function convertTroopSkillsToSkillDefinitions(troopType: TroopType): SkillDefinition[] {
  const skills = TROOP_SKILLS[troopType];
  if (!skills || !Array.isArray(skills)) return [];

  const targetByTroop = (troopType.charAt(0).toUpperCase() + troopType.slice(1)) as SkillEffect["target"];

  const makeDamageMod = (
    name: string,
    appliesTo: SkillEffect["target"] | "All",
    magnitude: number,
    chance: number,
    subject: DamageModifier["subject"] = "outgoing",
    stackingKey?: string
  ): SkillEffect => ({
    id: `${name.replace(/\s+/g, "_")}_dmg`,
    trigger: "OnTurnStart", // Troop skills should be reassessed every turn based on current troop counts
    type: "DamageMultiplier",
    target: appliesTo === "All" ? "All" : appliesTo,
    chance,
    damageModifier: {
      id: `${name.replace(/\s+/g, "_")}_dmg_mod`,
      source: name,
      subject,
      appliesTo: appliesTo === "All" ? "All" : appliesTo,
      durationTurns: -1,
      chance,
      magnitude,
      stackingKey
    }
  });

  const makeStatBuff = (
    name: string,
    buff: Partial<Record<"attack" | "defense" | "health" | "lethality", number>>,
    chance = 1
  ): SkillEffect => ({
    id: `${name.replace(/\s+/g, "_")}_stat`,
    trigger: "OnTurnStart", // Troop skills should be reassessed every turn based on current troop counts
    type: "StatBuff",
    target: targetByTroop,
    chance,
    statBuff: buff
  });

  const mapTarget = (val?: string): SkillEffect["target"] => {
    if (!val) return targetByTroop;
    const v = val.toLowerCase();
    if (v.includes("all")) return "All";
    if (v.includes("inf")) return "Infantry";
    if (v.includes("lanc")) return "Lancer";
    if (v.includes("mark")) return "Marksman";
    return targetByTroop;
  };

  return skills.map((skill, idx) => {
    const skillName = skill.skill_name || skill["skill-name"] || `Troop Skill ${idx + 1}`;
    const nameLower = skillName.toLowerCase();
    const effects: SkillEffect[] = [];

    // Infantry
    if (nameLower === "master brawler") {
      effects.push(makeDamageMod(skillName, "Lancer", 0.10, 1, "outgoing", "MasterBrawler"));
    } else if (nameLower === "bands of steel") {
      effects.push(makeStatBuff(skillName, { defense: 0.10 }));
    } else if (nameLower === "crystal shield") {
      effects.push(makeDamageMod(skillName, targetByTroop, -1, 0.375, "incoming", "CrystalShield"));
    } else if (nameLower === "body of light") {
      effects.push(makeStatBuff(skillName, { defense: 0.06 }));
      effects.push(makeDamageMod(skillName, targetByTroop, -0.15, 0.375, "incoming", "CrystalShield"));
    }

    // Lancer
    else if (nameLower === "charge") {
      effects.push(makeDamageMod(skillName, "Marksman", 0.10, 1, "outgoing", "Charge"));
    } else if (nameLower === "ambusher") {
      // Approximate backline strike as a conditional 20% damage boost vs Marksman
      effects.push(makeDamageMod(skillName, "Marksman", 0.20, 0.20, "outgoing", "Ambusher"));
    } else if (nameLower === "crystal lance") {
      effects.push(makeDamageMod(skillName, "All", 1.0, 0.15, "outgoing", "CrystalLance"));
    } else if (nameLower === "incandescent field") {
      effects.push(makeDamageMod(skillName, targetByTroop, -0.5, 0.10, "incoming", "IncandescentField"));
    }

    // Marksman
    else if (nameLower === "ranged strike") {
      effects.push(makeDamageMod(skillName, "Infantry", 0.10, 1, "outgoing", "RangedStrike"));
    } else if (nameLower === "volley") {
      effects.push(makeDamageMod(skillName, "All", 1.0, 0.10, "outgoing", "Volley"));
    } else if (nameLower === "crystal gunpowder") {
      effects.push(makeDamageMod(skillName, "All", 0.50, 0.30, "outgoing", "CrystalGunpowder"));
    } else if (nameLower === "flame charge") {
      effects.push(makeStatBuff(skillName, { attack: 0.04 }));
      // Extra damage when Crystal Gunpowder procs; approximate with same chance window
      effects.push(makeDamageMod(skillName, "All", 0.25, 0.30, "outgoing", "CrystalGunpowder"));
    }

    // Fallback: map any remaining skill_effects heuristically but with sane scaling
    if (effects.length === 0) {
      const skillEffects = skill.skill_effects;
      if (Array.isArray(skillEffects)) {
        skillEffects.forEach((se: SkillEffectEntry, sidx) => {
          const effectValues = se?.effect_values || {};
          const statBuff: Partial<Record<"attack" | "defense" | "health" | "lethality", number>> = {};
          Object.entries(effectValues).forEach(([key, val]) => {
            if (typeof val !== "number") return;
            const pct = val / 100; // interpret as percent
            const lower = key.toLowerCase();
            if (lower.includes("attack")) statBuff.attack = (statBuff.attack ?? 0) + pct;
            else if (lower.includes("defense")) statBuff.defense = (statBuff.defense ?? 0) + pct;
            else if (lower.includes("health") || lower.includes("hp")) statBuff.health = (statBuff.health ?? 0) + pct;
            else if (lower.includes("lethality")) statBuff.lethality = (statBuff.lethality ?? 0) + pct;
          });

          const chance = se?.effect_is_chance
            ? Math.max(...Object.values(se.effect_probabilities || { "1": 0 }).map((n) => Number(n) / 100 || 0))
            : 1;
          const target = mapTarget(se?.trigger_types?.trigger_vs || se?.benefit_types?.benefit_vs);
          const effectType = (se?.effect_type || "").toLowerCase();
          const magnitudeRaw = (() => {
            const values = Object.values(effectValues || {}).filter((v) => typeof v === "number") as number[];
            if (values.length) return Math.max(...values) / 100;
            if (typeof se?.effect_op === "number") return se.effect_op / 100;
            return undefined;
          })();

          const effect: SkillEffect = {
            id: `${skillName}_${idx}_${sidx}`,
            trigger: "OnTurnStart", // Troop skills should be reassessed every turn based on current troop counts
            type: statBuff && Object.keys(statBuff).length ? "StatBuff" : "DamageMultiplier",
            target,
            chance,
            statBuff: Object.keys(statBuff).length ? statBuff : undefined
          };

          if (magnitudeRaw !== undefined && effectType.includes("damage")) {
            effect.type = "DamageMultiplier";
            effect.damageModifier = {
              id: `${skillName}_${idx}_${sidx}_dmg`,
              source: skillName,
              subject: se?.affects_opponent ? "incoming" : "outgoing",
              appliesTo: target,
              durationTurns: -1,
              chance,
              magnitude: magnitudeRaw,
              stackingKey: skillName.replace(/\s+/g, "_")
            };
          }

          effects.push(effect);
        });
      }
    }

    return {
      id: `${troopType}_troopskill_${idx}`,
      name: skillName,
      trigger: "OnTurnStart", // Troop skills should be reassessed every turn based on current troop counts
      effects,
      description: skill.description || skill.skill_decription || "",
      heroId: undefined
    } as SkillDefinition;
  });
}
