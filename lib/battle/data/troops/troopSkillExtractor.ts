import { TROOP_SKILLS } from "./troop_skills";

/**
 * Types from troop_skills.ts.
 */
export type TroopType = keyof typeof TROOP_SKILLS;
export type TroopSkill = (typeof TROOP_SKILLS.infantry)[number] |
                         (typeof TROOP_SKILLS.lancer)[number] |
                         (typeof TROOP_SKILLS.marksman)[number];

/**
 * Get all skills for a specific troop type.
 */
export function getTroopSkills(troopType: TroopType): TroopSkill[] {
  if (!(troopType in TROOP_SKILLS)) return [];
  return TROOP_SKILLS[troopType] ?? [];
}

/**
 * Get a specific skill by name for a troop type.
 */
export function getTroopSkillByName(
  troopType: TroopType,
  skillName: string
): TroopSkill | undefined {
  const skills = getTroopSkills(troopType);
  const lowerName = skillName.trim().toLowerCase();
  return skills.find(
    (skill) => (skill["skill-name"] ?? skill.skill_name).toLowerCase() === lowerName
  );
}

/**
 * Get all skills across all troop types.
 */
export function getAllTroopSkills(): TroopSkill[] {
  return ([] as TroopSkill[]).concat(
    TROOP_SKILLS.infantry,
    TROOP_SKILLS.lancer,
    TROOP_SKILLS.marksman
  );
}

/**
 * Search for skills by name across all troop types (partial match, case-insensitive).
 */
export function searchTroopSkillsByName(searchTerm: string): TroopSkill[] {
  const lowerSearchTerm = searchTerm.trim().toLowerCase();
  return getAllTroopSkills().filter((skill) =>
    (skill["skill-name"] ?? skill.skill_name).toLowerCase().includes(lowerSearchTerm)
  );
}

/**
 * Get skills that have a specific property.
 */
export function getTroopSkillsWithProperty(
  troopType: TroopType,
  propertyName: string
): TroopSkill[] {
  return getTroopSkills(troopType).filter((skill) => propertyName in skill);
}

/**
 * Get skills that require another skill to be active.
 */
export function getTroopSkillsWithRequirement(
  troopType: TroopType
): TroopSkill[] {
  return getTroopSkills(troopType).filter((skill) => "requires_skill" in skill && !!skill.requires_skill);
}

/**
 * Get all unique skill names for a troop type.
 */
export function getTroopSkillNames(troopType: TroopType): string[] {
  return getTroopSkills(troopType).map((skill) => skill["skill-name"] ?? skill.skill_name);
}

/**
 * Get all unique skill names across all troop types.
 */
export function getAllTroopSkillNames(): string[] {
  const names = getAllTroopSkills().map((skill) => skill["skill-name"] ?? skill.skill_name);
  return Array.from(new Set(names));
}

/**
 * Gets troop statistics summary.
 */
export function getTroopSkillStatistics() {
  return {
    infantry: {
      totalSkills: TROOP_SKILLS.infantry.length,
      skillNames: getTroopSkillNames("infantry"),
    },
    lancer: {
      totalSkills: TROOP_SKILLS.lancer.length,
      skillNames: getTroopSkillNames("lancer"),
    },
    marksman: {
      totalSkills: TROOP_SKILLS.marksman.length,
      skillNames: getTroopSkillNames("marksman"),
    },
    totalSkills: getAllTroopSkills().length,
  };
}
