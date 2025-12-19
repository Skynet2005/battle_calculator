import {
  buildHeroCombatProfile,
  getHeroByName
} from "./hero-extractor";
import type {
  Hero,
  HeroCombatProfile,
  HeroSelection,
  SkillLevel,
  SkillLevelsByName
} from "./hero_types";

export interface HeroSelectionInput {
  heroName: string;
  selectionType?: HeroSelection["selectionType"];
  exclusiveWeaponLevel?: number;
  starLevel?: number;
  xpLevel?: number;
  skillLevels?: SkillLevelsByName;
}

export interface HeroSelectionOptions {
  enforceUniqueClasses?: boolean;
  maxSelections?: number;
  allowedSelectionTypes?: HeroSelection["selectionType"][];
}

const DEFAULT_OPTIONS: Required<HeroSelectionOptions> = {
  enforceUniqueClasses: true,
  maxSelections: 3,
  allowedSelectionTypes: ["leader", "joiner"]
};

export function buildHeroSelection(
  input: HeroSelectionInput,
  options: HeroSelectionOptions = DEFAULT_OPTIONS,
  resolvedHero?: Hero
): HeroSelection {
  const hero = resolvedHero ?? findHero(input.heroName);

  if (
    options.allowedSelectionTypes &&
    input.selectionType &&
    !options.allowedSelectionTypes.includes(input.selectionType)
  ) {
    throw new Error(
      `Selection type ${input.selectionType} is not allowed for ${hero["hero-name"]}`
    );
  }

  return {
    heroName: hero["hero-name"],
    selectionType: input.selectionType ?? "leader",
    exclusiveWeaponLevel: input.exclusiveWeaponLevel,
    starLevel: input.starLevel ?? 0,
    xpLevel: input.xpLevel ?? 80,
    skillLevels: normalizeSkillLevels(hero, input.skillLevels)
  };
}

export function buildHeroSelections(
  inputs: HeroSelectionInput[],
  options: HeroSelectionOptions = DEFAULT_OPTIONS
): HeroSelection[] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  if (inputs.length > mergedOptions.maxSelections) {
    throw new Error(
      `Received ${inputs.length} hero selections but only ${mergedOptions.maxSelections} are allowed`
    );
  }

  const classes = new Set<string>();
  const selections = inputs.map((input) => {
    const hero = findHero(input.heroName);
    if (mergedOptions.enforceUniqueClasses) {
      const heroClass = hero["hero-class"];
      if (classes.has(heroClass)) {
        throw new Error(`Hero class ${heroClass} already used in this selection set`);
      }
      classes.add(heroClass);
    }
    return buildHeroSelection(input, mergedOptions, hero);
  });

  return selections;
}

export function buildHeroProfiles(
  selections: HeroSelection[],
  role: "attacker" | "defender"
): HeroCombatProfile[] {
  return selections.map((selection) => buildHeroCombatProfile(selection, role));
}

export function findHero(heroName: string): Hero {
  const hero = getHeroByName(heroName);
  if (!hero) {
    throw new Error(`Hero not found: ${heroName}`);
  }
  return hero;
}

function normalizeSkillLevels(
  hero: Hero,
  skillLevels?: SkillLevelsByName
): SkillLevelsByName {
  if (!hero.skills?.expedition) {
    return {};
  }

  const normalized: SkillLevelsByName = {};
  Object.values(hero.skills.expedition).forEach((skill) => {
    if (!skill || !skill["skill-name"]) {
      return;
    }
    const configuredLevel = skillLevels?.[skill["skill-name"]];
    if (configuredLevel && configuredLevel > 0) {
      normalized[skill["skill-name"]] = clampSkillLevel(configuredLevel);
      return;
    }

    const maxLevel = extractMaxSkillLevel(skill);
    normalized[skill["skill-name"]] = maxLevel;
  });
  return normalized;
}

function extractMaxSkillLevel(
  skill: Hero["skills"]["expedition"][string]
): SkillLevel {
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
