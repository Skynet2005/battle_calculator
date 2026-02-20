export * from './battle-calculator-helpers';
export * from './calculations';
export * from './data-extractors';
export * from './data-selectors';

// Engine (simulation system) — formerly src/domain/combat/
export * from './engine';

/**
 * TroopType naming: use StatTroopType (lowercase) for stat pipeline and rally;
 * use SimTroopType (PascalCase) for the simulation engine. Constants: STAT_TROOP_TYPES (calculations), TROOP_TYPE_VALUES (engine/types).
 */
export type { TroopType as StatTroopType } from './calculations';
export type { TroopType as SimTroopType } from './engine/types';

// Heroes
export * from './data/heroes/hero-defaults';
export * from './data/heroes/hero-extractor';
export * from './data/heroes/hero_types';
export * from './data/heroes/skill';

// Hero gear
export * from './data/hero_gear/hero-gear-extractor';

// Experts
export * from './data/experts/expert-extractor';
export * from './data/experts/expert-types';

// Chief gear & charms
export * from './data/chief_charms/chief_charm_types';
export * from './data/chief_charms/chief_charms';
export * from './data/chief_gear/chief_gear';
export * from './data/chief_gear/chief_gear_types';

// Capacity
export * from './data/capacity/command-center-capacity';
export * from './data/chief_gear/chief-gear-capacity';
export * from './data/heroes/hero-skill-capacity';
export * from './data/war_academy/war-academy-capacity';

// Pets
export * from './data/pets/color-tier-bonuses';
export * from './data/pets/pet_skills';

// Research
export * from './data/research/research';

// War academy data and types
export * from "./data/war_academy/war_academy";
export * from "./data/war_academy/war_academy_types";

// Troops
export * from './data/troops/troop_levels';
export * from './data/troops/troop_skills';
export type { TroopType } from './data/troops/troop_skills_types';
export {
  getAllTroopSkillNames,
  getAllTroopSkills,
  getTroopSkillByName,
  getTroopSkillNames, getTroopSkills, getTroopSkillStatistics, getTroopSkillsWithProperty,
  getTroopSkillsWithRequirement,
  searchTroopSkillsByName
} from './data/troops/troopSkillExtractor';

// Utility functions
export * from "./data/mastery-power-utils";
export * from "./data/max-levels";
export * from "./data/opponent-defaults";
export * from "./data/stat_bonuses";

