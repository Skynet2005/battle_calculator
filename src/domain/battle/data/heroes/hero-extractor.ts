import type {
  BaseStats,
  CombatEffectCategory,
  ExclusiveWeapon,
  Hero,
  HeroClass,
  HeroCombatProfile,
  HeroSelection,
  LevelSkill,
  NormalizedSkillEffect,
  SkillLevel,
  TroopTarget
} from "./hero_types";
import {
  HERO_BY_NAME,
  HEROES,
  HEROES_BY_CLASS,
  HEROES_BY_GENERATION
} from "./heroes";

/**
 * Flattens the HERO array structure to get individual hero objects
 */
export function getAllHeroes(): Hero[] {
  return HEROES;
}

/**
 * Gets a hero by name (case-insensitive)
 */
export function getHeroByName(name: string): Hero | undefined {
  return HERO_BY_NAME[name.toLowerCase()];
}

/**
 * Gets all heroes of a specific class
 */
export function getHeroesByClass(heroClass: HeroClass): Hero[] {
  return [...HEROES_BY_CLASS[heroClass]];
}

/**
 * Gets all heroes of a specific generation
 */
export function getHeroesByGeneration(generation: number): Hero[] {
  return [...(HEROES_BY_GENERATION[generation] ?? [])];
}

/**
 * Gets heroes within a generation range (inclusive)
 */
export function getHeroesByGenerationRange(
  minGeneration: number,
  maxGeneration: number
): Hero[] {
  return HEROES.filter(
    (hero) =>
      hero.generation >= minGeneration && hero.generation <= maxGeneration
  );
}

/**
 * Gets all expedition skills for a hero
 */
export function getHeroSkills(hero: Hero): LevelSkill[] {
  const skills: LevelSkill[] = [];
  const expeditionSkills = hero.skills.expedition;

  for (const key in expeditionSkills) {
    const skill = expeditionSkills[key];
    if (skill && skill !== null && skill["skill-name"]) {
      skills.push(skill as LevelSkill);
    }
  }

  return skills;
}

/**
 * Gets a specific skill by skill name for a hero
 */
export function getHeroSkillByName(
  hero: Hero,
  skillName: string
): LevelSkill | undefined {
  const skills = getHeroSkills(hero);
  return skills.find(
    (skill) => skill && skill["skill-name"]?.toLowerCase() === skillName.toLowerCase()
  );
}

/**
 * Gets the exclusive weapon for a hero
 */
export function getHeroExclusiveWeapon(hero: Hero): ExclusiveWeapon | null {
  return hero["exclusive-weapon"];
}

/**
 * Gets exclusive weapon level data for a specific level
 */
export function getExclusiveWeaponLevel(
  weapon: ExclusiveWeapon,
  level: number
) {
  return weapon.levels.find((lvl) => lvl.level === level);
}

/**
 * Gets base stats for a hero
 */
export function getHeroBaseStats(hero: Hero): BaseStats {
  return hero["base-stats"];
}

/**
 * Gets all heroes that have an exclusive weapon
 */
export function getHeroesWithExclusiveWeapon(): Hero[] {
  const heroes = getAllHeroes();
  return heroes.filter((hero) => hero["exclusive-weapon"] !== null);
}

/**
 * Gets all heroes that don't have an exclusive weapon
 */
export function getHeroesWithoutExclusiveWeapon(): Hero[] {
  const heroes = getAllHeroes();
  return heroes.filter((hero) => hero["exclusive-weapon"] === null);
}

/**
 * Searches heroes by name (partial match, case-insensitive)
 */
export function searchHeroesByName(searchTerm: string): Hero[] {
  const heroes = getAllHeroes();
  const lowerSearchTerm = searchTerm.toLowerCase();
  return heroes.filter((hero) =>
    hero["hero-name"].toLowerCase().includes(lowerSearchTerm)
  );
}

/**
 * Gets heroes that have a specific skill property
 */
export function getHeroesWithSkillProperty(
  propertyName: keyof LevelSkill
): Hero[] {
  const heroes = getAllHeroes();
  return heroes.filter((hero) => {
    const skills = getHeroSkills(hero);
    return skills.some((skill) => skill !== null && propertyName in skill);
  });
}

/**
 * Gets all unique hero classes
 */
export function getHeroClasses(): HeroClass[] {
  return Object.keys(HEROES_BY_CLASS) as HeroClass[];
}

/**
 * Gets all unique generations
 */
export function getGenerations(): number[] {
  return Object.keys(HEROES_BY_GENERATION)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Gets hero statistics summary
 */
export function getHeroStatistics() {
  const classes = getHeroClasses();
  const generations = getGenerations();

  const statsByClass = Object.entries(HEROES_BY_CLASS).reduce(
    (acc, [heroClass, list]) => {
      acc[heroClass] = list.length;
      return acc;
    },
    {} as Record<string, number>
  );

  const statsByGeneration = Object.entries(HEROES_BY_GENERATION).reduce(
    (acc, [generation, list]) => {
      acc[Number(generation)] = list.length;
      return acc;
    },
    {} as Record<number, number>
  );

  return {
    totalHeroes: HEROES.length,
    heroesWithExclusiveWeapon: getHeroesWithExclusiveWeapon().length,
    heroesWithoutExclusiveWeapon: getHeroesWithoutExclusiveWeapon().length,
    byClass: statsByClass,
    byGeneration: statsByGeneration,
    classes,
    generations,
  };
}

/**
 * Gets all skill names across all heroes
 */
export function getAllSkillNames(): string[] {
  const heroes = getAllHeroes();
  const skillNames = new Set<string>();

  heroes.forEach((hero) => {
    const skills = getHeroSkills(hero);
    skills.forEach((skill) => {
      if (skill && skill["skill-name"]) {
        skillNames.add(skill["skill-name"]);
      }
    });
  });

  return Array.from(skillNames).sort();
}

/**
 * Gets heroes that have a skill with a specific name
 */
export function getHeroesWithSkill(skillName: string): Hero[] {
  const heroes = getAllHeroes();
  return heroes.filter((hero) => {
    const skill = getHeroSkillByName(hero, skillName);
    return skill !== undefined && skill !== null;
  });
}

/**
 * Gets all exclusive weapon names
 */
export function getAllExclusiveWeaponNames(): string[] {
  const heroes = getAllHeroes();
  const weaponNames = new Set<string>();

  heroes.forEach((hero) => {
    const weapon = getHeroExclusiveWeapon(hero);
    if (weapon) {
      weaponNames.add(weapon.name);
    }
  });

  return Array.from(weaponNames).sort();
}

/**
 * Gets hero by exclusive weapon name
 */
export function getHeroByExclusiveWeaponName(weaponName: string): Hero | undefined {
  const heroes = getAllHeroes();
  return heroes.find((hero) => {
    const weapon = getHeroExclusiveWeapon(hero);
    return weapon?.name.toLowerCase() === weaponName.toLowerCase();
  });
}

/**
 * Builds a combat-ready profile for the provided hero selection.
 */
export function buildHeroCombatProfile(
  selection: HeroSelection,
  role: "attacker" | "defender"
): HeroCombatProfile {
  const hero = getHeroByName(selection.heroName);
  if (!hero) {
    throw new Error(`Hero not found: ${selection.heroName}`);
  }

  const skillEffects = collectHeroSkillEffects(hero, selection, role);
  const weaponEffects = collectExclusiveWeaponEffects(hero, selection, role);

  return {
    hero,
    exclusiveWeaponLevel: selection.exclusiveWeaponLevel,
    baseStats: cloneValue(hero["base-stats"]),
    normalizedEffects: [...skillEffects, ...weaponEffects]
  };
}

/**
 * Serializes a hero into a JSON-friendly structure (deep clone).
 */
export function serializeHero(hero: Hero): Hero {
  return cloneValue(hero);
}

/**
 * Serializes a hero collection into JSON-friendly data.
 */
export function serializeHeroes(heroes: Hero[] = HEROES): Hero[] {
  return heroes.map(serializeHero);
}

export const HEROES_JSON = Object.freeze(serializeHeroes());

// ===== Helper constants =====

const DAMAGE_DEALT_PATTERNS = [
  "damage_dealt",
  "damage_percentage",
  "damage_up",
  "extra_damage_up",
  "normal_attack_damage_up",
  "skill_damage_up",
  "additional_damage",
  "skill_damage",
  "lethality_increase",
  "enemy_damage_taken_up",
  "enemy_damage_down"
];

const DAMAGE_TAKEN_PATTERNS = [
  "damage_taken",
  "damage_taken_down",
  "damage_taken_up",
  "damage_reduction",
  "damage_from",
  "defense_increase",
  "health_increase",
  "shield",
  "resistance",
  "offset"
];

const CONTROL_PATTERNS = ["immobilize", "stun", "dodge", "control"];

const DOT_PATTERNS = ["dot", "burn", "bleed", "poison"];

const STAT_PATTERNS = ["attack", "defense", "health", "lethality"];

const IGNORED_SKILL_FIELDS = new Set([
  "description",
  "trigger_chance",
  "duration_turns",
  "duration_seconds",
  "trigger_every_n_turns",
  "trigger_every_n_strikes",
  "reduction_duration_turns",
  "target_damage_taken_duration_turns",
  "target",
  "research_speed_type",
  "duration_turn",
  "duration",
  "skill-name"
]);

const MAGNITUDE_SUFFIXES = [
  "_percentage",
  "_increase_percentage",
  "_damage_percentage",
  "_damage_increase_percentage",
  "_damage_dealt_increase_percentage",
  "_additional_damage_percentage"
];

const WEAPON_STAT_FIELDS: Array<{
  key: keyof ExclusiveWeapon["levels"][number];
  target: TroopTarget;
  stat: "health" | "lethality";
}> = [
    { key: "infantry-health", target: "infantry", stat: "health" },
    { key: "infantry-lethality", target: "infantry", stat: "lethality" },
    { key: "lancer-health", target: "lancer", stat: "health" },
    { key: "lancer-lethality", target: "lancer", stat: "lethality" },
    { key: "marksman-health", target: "marksman", stat: "health" },
    { key: "marksman-lethality", target: "marksman", stat: "lethality" }
  ];

type ResolvedSkillEntry = {
  property: string;
  value: number | Record<string, number>;
};

// ===== Helper functions =====

function collectHeroSkillEffects(
  hero: Hero,
  selection: HeroSelection,
  role: "attacker" | "defender"
): NormalizedSkillEffect[] {
  const skills = getHeroSkills(hero);
  const activeSkills =
    selection.selectionType === "joiner" ? skills.slice(0, 1) : skills;

  return activeSkills.flatMap((skill) => {
    if (!skill) {
      return [];
    }
    const level = determineSkillLevel(skill, selection);
    return normalizeSkillEffects({
      source: "hero-skill",
      heroName: hero["hero-name"],
      skill,
      level,
      role
    });
  });
}

function collectExclusiveWeaponEffects(
  hero: Hero,
  selection: HeroSelection,
  role: "attacker" | "defender"
): NormalizedSkillEffect[] {
  const weapon = getHeroExclusiveWeapon(hero);
  if (!weapon || selection.exclusiveWeaponLevel === undefined) {
    return [];
  }

  const levelData = selectExclusiveWeaponLevel(weapon, selection.exclusiveWeaponLevel);
  if (!levelData) {
    return [];
  }

  const statEffects: NormalizedSkillEffect[] = WEAPON_STAT_FIELDS.flatMap(
    ({ key, target, stat }) => {
      const value = levelData[key];
      if (typeof value !== "number" || value === 0) {
        return [];
      }
      const effect: NormalizedSkillEffect = {
        source: "weapon-skill",
        sourceName: weapon.name,
        category: "stat",
        target,
        stat,
        value,
        isMultiplicative: false
      };
      return shouldApplyToRole(effect.target, role) ? [effect] : [];
    }
  );

  const skillEffects = levelData.skills?.expedition
    ? normalizeSkillEffects({
      source: "weapon-skill",
      heroName: weapon.name,
      skill: levelData.skills.expedition,
      level: 1 as SkillLevel,
      role
    })
    : [];

  return [...statEffects, ...skillEffects];
}

function determineSkillLevel(
  skill: LevelSkill | null,
  selection: HeroSelection
): SkillLevel {
  if (!skill) {
    return 1;
  }

  const skillName = skill["skill-name"];
  if (selection.selectionType === "joiner") {
    return getSkillMaxLevel(skill);
  }

  if (skillName) {
    const configured = selection.skillLevels?.[skillName];
    if (typeof configured === "number" && configured > 0) {
      return clampSkillLevel(configured);
    }
  }

  return getSkillMaxLevel(skill);
}

function getSkillMaxLevel(skill: LevelSkill | null): SkillLevel {
  if (!skill) {
    return 1;
  }
  let maxLevel = 1;
  Object.entries(skill).forEach(([key, value]) => {
    if (!/^\d+$/.test(key)) {
      if (typeof value === "object" && value !== null) {
        Object.keys(value as Record<string, unknown>).forEach((nested) => {
          if (/^\d+$/.test(nested)) {
            maxLevel = Math.max(maxLevel, Number(nested));
          }
        });
      }
      return;
    }
    maxLevel = Math.max(maxLevel, Number(key));
  });
  return clampSkillLevel(maxLevel);
}

function clampSkillLevel(value: number): SkillLevel {
  const clamped = Math.max(1, Math.min(5, Math.floor(value)));
  return clamped as SkillLevel;
}

function normalizeSkillEffects(params: {
  source: "hero-skill" | "weapon-skill";
  heroName: string;
  skill: LevelSkill | null;
  level: SkillLevel;
  role: "attacker" | "defender";
}): NormalizedSkillEffect[] {
  const { source, heroName, skill, level, role } = params;
  if (!skill) {
    return [];
  }

  const skillName = skill["skill-name"] ?? "Unnamed Skill";
  const sourceName = `${heroName} · ${skillName}`;
  const entries = extractSkillPropertyEntries(skill, level);
  const skillTriggerChance = resolveSkillTriggerChance(skill, level);
  const { chanceByPrefix, pairedChanceProperties } = identifyChancePairs(entries);

  return entries.flatMap(({ property, value }) =>
    createEffectsFromValue({
      source,
      sourceName,
      property,
      value,
      role,
      skillTriggerChance,
      chanceByPrefix,
      pairedChanceProperties
    })
  );
}

function resolveSkillTriggerChance(skill: LevelSkill, level: SkillLevel): number {
  const rawChance = resolveSkillPropertyValue(
    (skill as Record<string, unknown>)["trigger_chance"],
    level
  );
  if (typeof rawChance !== "number" || !isFinite(rawChance)) {
    return 1;
  }
  return clampChance(rawChance);
}

function clampChance(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function extractSkillPropertyEntries(
  skill: LevelSkill,
  level: SkillLevel
): ResolvedSkillEntry[] {
  const entries: ResolvedSkillEntry[] = [];
  Object.entries(skill as Record<string, unknown>).forEach(([property, rawValue]) => {
    if (IGNORED_SKILL_FIELDS.has(property)) {
      return;
    }
    const resolved = resolveSkillPropertyValue(rawValue, level);
    if (resolved === undefined) {
      return;
    }
    entries.push({ property, value: resolved });
  });
  return entries;
}

function resolveSkillPropertyValue(
  rawValue: unknown,
  level: SkillLevel
): number | Record<string, number> | undefined {
  if (rawValue === null || rawValue === undefined) {
    return undefined;
  }

  if (typeof rawValue === "number") {
    return rawValue;
  }

  if (typeof rawValue !== "object") {
    return undefined;
  }

  const valueMap = rawValue as Record<string, unknown>;
  const numericKeys = Object.keys(valueMap).filter((key) => /^\d+$/.test(key));

  if (numericKeys.length === 0) {
    return normalizeValueDictionary(valueMap);
  }

  const levelKey = findBestLevelKey(numericKeys, level);
  const levelValue = valueMap[levelKey];

  if (typeof levelValue === "number") {
    return levelValue;
  }

  if (typeof levelValue === "object" && levelValue !== null) {
    return normalizeValueDictionary(levelValue as Record<string, unknown>);
  }

  return undefined;
}

function normalizeValueDictionary(
  dictionary: Record<string, unknown>
): Record<string, number> | undefined {
  const normalizedEntries = Object.entries(dictionary)
    .map(([key, value]) => {
      if (typeof value !== "number") {
        return undefined;
      }
      return [key, value] as [string, number];
    })
    .filter((entry): entry is [string, number] => Boolean(entry));

  if (!normalizedEntries.length) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

function findBestLevelKey(keys: string[], desiredLevel: SkillLevel): string {
  const numericKeys = keys.map(Number).sort((a, b) => a - b);
  let candidate = numericKeys[0];
  numericKeys.forEach((key) => {
    if (key <= desiredLevel) {
      candidate = key;
    }
  });
  return candidate.toString();
}

function identifyChancePairs(entries: ResolvedSkillEntry[]): {
  chanceByPrefix: Map<string, number>;
  pairedChanceProperties: Set<string>;
} {
  const chanceByPrefix = new Map<string, number>();
  const pairedChanceProperties = new Set<string>();
  const propertyNames = entries.map((entry) => entry.property);

  entries.forEach(({ property, value }) => {
    if (typeof value !== "number") {
      return;
    }
    const prefix = extractChancePrefix(property);
    if (!prefix) {
      return;
    }
    const hasMagnitude = propertyNames.some((candidate) => {
      const magnitudePrefix = extractMagnitudePrefix(candidate);
      return magnitudePrefix !== null && magnitudePrefix === prefix;
    });
    if (hasMagnitude) {
      chanceByPrefix.set(prefix, value);
      pairedChanceProperties.add(property);
    }
  });

  return { chanceByPrefix, pairedChanceProperties };
}

function extractChancePrefix(property: string): string | null {
  const index = property.indexOf("_chance");
  if (index === -1) {
    return null;
  }
  return property.slice(0, index);
}

function extractMagnitudePrefix(property: string): string | null {
  for (const suffix of MAGNITUDE_SUFFIXES) {
    const index = property.indexOf(suffix);
    if (index !== -1) {
      return property.slice(0, index);
    }
  }
  return null;
}

function createEffectsFromValue(params: {
  source: "hero-skill" | "weapon-skill";
  sourceName: string;
  property: string;
  value: number | Record<string, number>;
  role: "attacker" | "defender";
  skillTriggerChance: number;
  chanceByPrefix: Map<string, number>;
  pairedChanceProperties: Set<string>;
}): NormalizedSkillEffect[] {
  const {
    source,
    sourceName,
    property,
    value,
    role,
    skillTriggerChance,
    chanceByPrefix,
    pairedChanceProperties
  } = params;

  const applyToEnemy = property.toLowerCase().startsWith("enemy_");

  if (pairedChanceProperties.has(property)) {
    return [];
  }

  if (typeof value === "number") {
    const effect = buildEffect({
      source,
      sourceName,
      property,
      value,
      role,
      chanceMultiplier: getChanceMultiplier(property, chanceByPrefix) * skillTriggerChance,
      applyToEnemy
    });
    return effect ? [effect] : [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    if (typeof nestedValue !== "number") {
      return [];
    }
    const effect = buildEffect({
      source,
      sourceName,
      property,
      value: nestedValue,
      role,
      targetOverride: key as TroopTarget,
      chanceMultiplier: getChanceMultiplier(property, chanceByPrefix) * skillTriggerChance,
      applyToEnemy
    });
    return effect ? [effect] : [];
  });
}

function getChanceMultiplier(
  property: string,
  chanceByPrefix: Map<string, number>
): number {
  const prefix = extractMagnitudePrefix(property);
  if (!prefix) {
    return 1;
  }
  const chance = chanceByPrefix.get(prefix);
  if (typeof chance !== "number") {
    return 1;
  }
  return chance;
}

function buildEffect(params: {
  source: "hero-skill" | "weapon-skill";
  sourceName: string;
  property: string;
  value: number;
  role: "attacker" | "defender";
  targetOverride?: string;
  chanceMultiplier?: number;
  applyToEnemy?: boolean;
}): NormalizedSkillEffect | null {
  const {
    source,
    sourceName,
    property,
    value,
    role,
    targetOverride,
    chanceMultiplier = 1,
    applyToEnemy = false
  } = params;

  const adjustedValue = value * chanceMultiplier;
  if (!isFinite(adjustedValue) || adjustedValue === 0) {
    return null;
  }

  const target = inferTarget(property, targetOverride);
  if (!shouldApplyToRole(target, role)) {
    return null;
  }

  const stat = inferStat(property);
  const category = determineCategory(stat, property);
  const signedValue = adjustValueSign(stat, property, adjustedValue);
  const isMultiplicative = stat !== "attack" &&
    stat !== "defense" &&
    stat !== "health" &&
    stat !== "lethality";

  const effect: NormalizedSkillEffect = {
    source,
    sourceName,
    category,
    target,
    stat,
    value: signedValue,
    isMultiplicative,
    applyToEnemy
  };

  return effect;
}

function inferTarget(property: string, override?: string): TroopTarget {
  if (override) {
    if (override.toLowerCase().includes("infantry")) {
      return "infantry";
    }
    if (override.toLowerCase().includes("lancer")) {
      return "lancer";
    }
    if (override.toLowerCase().includes("marksman")) {
      return "marksman";
    }
  }

  const normalized = property.toLowerCase();
  if (normalized.includes("rally_troops")) {
    return "rally_troops";
  }
  if (normalized.includes("defender_troops")) {
    return "defender_troops";
  }
  if (normalized.includes("all_troops")) {
    return "all_troops";
  }
  if (normalized.includes("infantry")) {
    return "infantry";
  }
  if (normalized.includes("lancer")) {
    return "lancer";
  }
  if (normalized.includes("marksman")) {
    return "marksman";
  }
  return "all_troops";
}

function inferStat(property: string): NormalizedSkillEffect["stat"] {
  const normalized = property.toLowerCase();

  // Explicit handling for new plain-language keys
  if (normalized.includes("stun")) {
    return "control_chance";
  }
  if (normalized.includes("dodge")) {
    return "dodge_chance";
  }
  if (normalized.includes("damage_taken")) {
    return "damage_taken";
  }
  if (
    normalized.includes("enemy_damage_down") ||
    normalized.includes("enemy_damage_taken_up") ||
    normalized.includes("damage_up") ||
    normalized.includes("extra_damage_up") ||
    normalized.includes("normal_attack_damage_up") ||
    normalized.includes("skill_damage_up")
  ) {
    return "damage_dealt";
  }
  if (normalized.includes("attack_up")) {
    return "attack";
  }
  if (normalized.includes("defense_up")) {
    return "defense";
  }
  if (normalized.includes("health_up")) {
    return "health";
  }

  if (DAMAGE_TAKEN_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "damage_taken";
  }
  if (DAMAGE_DEALT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "damage_dealt";
  }
  if (CONTROL_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "control_chance";
  }
  if (normalized.includes("hit")) {
    return "hit_chance";
  }
  if (normalized.includes("dodge")) {
    return "dodge_chance";
  }
  if (STAT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    if (normalized.includes("attack")) {
      return "attack";
    }
    if (normalized.includes("defense")) {
      return "defense";
    }
    if (normalized.includes("health") || normalized.includes("hp")) {
      return "health";
    }
    if (normalized.includes("lethality")) {
      return "lethality";
    }
  }
  return "other";
}

function determineCategory(
  stat: NormalizedSkillEffect["stat"],
  property: string
): CombatEffectCategory {
  if (stat === "control_chance") {
    return "control";
  }
  if (DOT_PATTERNS.some((pattern) => property.toLowerCase().includes(pattern))) {
    return "dot";
  }
  if (stat === "damage_dealt") {
    return "damage-dealt";
  }
  if (stat === "damage_taken") {
    return "damage-taken";
  }
  if (stat === "attack" || stat === "defense" || stat === "health" || stat === "lethality") {
    return "stat";
  }
  return "other";
}

function adjustValueSign(
  stat: NormalizedSkillEffect["stat"],
  property: string,
  value: number
): number {
  const normalized = property.toLowerCase();
  if (normalized.includes("enemy_damage_down")) {
    return -Math.abs(value);
  }
  if (normalized.includes("attack_down")) {
    return -Math.abs(value);
  }
  if (
    stat === "damage_taken" &&
    (normalized.includes("decrease") ||
      normalized.includes("damage_taken_down") ||
      normalized.includes("reduction") ||
      normalized.includes("resistance") ||
      normalized.includes("offset") ||
      normalized.includes("half"))
  ) {
    return -Math.abs(value);
  }
  if (
    stat === "damage_dealt" &&
    (normalized.includes("decrease") || normalized.includes("reduction"))
  ) {
    return -Math.abs(value);
  }
  return value;
}

function shouldApplyToRole(target: TroopTarget, role: "attacker" | "defender"): boolean {
  if (target === "rally_troops" && role !== "attacker") {
    return false;
  }
  if (target === "defender_troops" && role !== "defender") {
    return false;
  }
  return true;
}

function selectExclusiveWeaponLevel(
  weapon: ExclusiveWeapon,
  weaponLevel?: number
) {
  if (!weapon.levels.length) {
    return undefined;
  }

  if (weaponLevel !== undefined) {
    return (
      weapon.levels.find((lvl) => lvl.level === weaponLevel) ??
      weapon.levels[weapon.levels.length - 1]
    );
  }

  return weapon.levels[weapon.levels.length - 1];
}

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

