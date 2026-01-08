/**
 * Default values for Opponent Section
 * Dropdowns default to max values, inputs default to blank/0
 */

import type { BasicBonuses } from '@/domain/battle/calculations';
import { getHeroExpeditionSkills } from '@/domain/battle/data-selectors';
import type { ExpertSelections } from '@/domain/battle/data/experts/expert-types';
import { getAllHeroes } from '@/domain/battle/data/heroes/hero-extractor';
import type { SkillLevelsByName } from '@/domain/battle/data/heroes/hero_types';
import { getMaxResearchLevels, getMaxWarAcademyLevels } from '@/domain/battle/data/max-levels';
import { PETS_DATA } from '@/domain/battle/data/pets/pet_skills';
import type { HeroLevel } from '@/shared/types';

// ============================================================================
// Constants
// ============================================================================

const MAX_STAR_LEVEL = 30; // 5 stars * 6 segments
const MAX_XP_LEVEL = 80;
const MAX_EXCLUSIVE_WEAPON_LEVEL = 10;
const MAX_SKILL_LEVEL = 5;

// ============================================================================
// Hero Defaults
// ============================================================================

/**
 * Get default hero level with max values for opponent
 */
export function getDefaultOpponentHeroLevel(heroName: string): HeroLevel {
  const heroes = getAllHeroes();
  const hero = heroes.find(h => h['hero-name'] === heroName);
  const skills = hero ? getHeroExpeditionSkills(hero) : [];

  const skillLevels: SkillLevelsByName = {};
  skills.forEach(skill => {
    skillLevels[skill.name] = MAX_SKILL_LEVEL;
  });

  return {
    starLevel: MAX_STAR_LEVEL,
    xpLevel: MAX_XP_LEVEL,
    skillLevels,
    exclusiveWeaponLevel: hero?.['exclusive-weapon'] ? MAX_EXCLUSIVE_WEAPON_LEVEL : undefined,
  };
}

// ============================================================================
// Basic Bonuses Defaults
// ============================================================================

/**
 * Get default basic bonuses for opponent with max dropdown values and blank inputs
 */
export function getDefaultOpponentBasicBonuses(): BasicBonuses {
  const maxResearchLevels = getMaxResearchLevels();
  const maxWarAcademyLevels = getMaxWarAcademyLevels();

  // Get max pet levels
  const maxPetLevels: Record<string, number> = {};
  Object.entries(PETS_DATA).forEach(([petName, pet]) => {
    const maxLevel = Math.max(...Object.keys(pet.levels).map(k => parseInt(k)));
    maxPetLevels[petName] = maxLevel;
  });

  return {
    combatTech: {
      troopTypeBonus: {
        infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
        lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
        marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    allianceTech: { attack: 0, defense: 0, lethality: 0, health: 0 },
    experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
    daybreakIsland: {
      infantry: { attack: 0, defense: 0 },
      lancer: { attack: 0, defense: 0 },
      marksman: { attack: 0, defense: 0 },
      troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
      deploymentCapacity: 0,
      rallyCapacity: 0,
    },
    pets: { attack: 0, defense: 0, lethality: 0, health: 0 },
    stackedSkins: { attack: 0, defense: 0, lethality: 0, health: 0 },
    hero: { attack: 0, defense: 0, lethality: 0, health: 0 },
    chiefGear: { attack: 0, defense: 0 },
    charms: {
      infantry: { lethality: 0, health: 0 },
      lancer: { lethality: 0, health: 0 },
      marksman: { lethality: 0, health: 0 },
    },
    heroGear: {
      infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
      lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
      marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
    },
    allianceFacilities: { attack: 0, defense: 0 },
    petRefinement: {
      infantry: { lethality: 0, health: 0 },
      lancer: { lethality: 0, health: 0 },
      marksman: { lethality: 0, health: 0 },
      troops: { attack: 0, defense: 0 },
    },
    warAcademy: {
      infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
      lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
      marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    specialHeroes: { jeronimo: false, natalia: false },
    vipPrestige: { attack: 0, defense: 0, lethality: 0, health: 0 },
    globe: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };
}

// ============================================================================
// Expert Defaults
// ============================================================================

/**
 * Get default expert selections for opponent (blank inputs)
 */
export function getDefaultOpponentExpertSelections(): ExpertSelections {
  return {
    attack: 0,
    defense: 0,
    lethality: 0,
    health: 0,
    deploymentCapacity: 0,
    rallyCapacity: 0,
  };
}

// ============================================================================
// Command Center Defaults
// ============================================================================

/**
 * Get default Command Center level for opponent (max level FC10)
 */
export function getDefaultOpponentCommandCenterLevel(): string {
  return 'FC10';
}
