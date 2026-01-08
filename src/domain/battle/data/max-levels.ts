/**
 * Get maximum levels for all game systems
 */

import { CHIEF_GEAR_DATA } from './chief_gear/chief_gear';
import { CHIEF_CHARMS_DATA } from './chief_charms/chief_charms';
import { BATTLE_RESEARCH } from './research/research';
import { WAR_ACADEMY_DATA } from './war_academy/war_academy';

/**
 * Get maximum expert levels for all experts
 * Note: This is kept for backward compatibility but returns default max values
 * The new expert system uses relationship level (0-100) and expedition bonus level (0-100)
 */
export function getMaxExpertLevels() {
  // Return default max values for the new system
  return {
    cyrille: 100,
    agnes: 100,
    holger: 100,
    romulus: 100,
    baldur: 100,
    fabian: 100,
  };
}

/**
 * Get maximum chief gear option (highest tier/stars/step)
 */
export function getMaxChiefGearOption(gearType: string) {
  const gearData = CHIEF_GEAR_DATA[gearType as keyof typeof CHIEF_GEAR_DATA];
  if (!gearData || gearData.length === 0) return null;

  // Find the last entry (should be the highest)
  const maxGear = gearData[gearData.length - 1];
  return {
    tier: maxGear.Tier,
    stars: maxGear.Stars,
    step: maxGear.Step,
  };
}

/**
 * Get maximum charm level
 */
export function getMaxCharmLevel(): number {
  const levels = CHIEF_CHARMS_DATA.map(c => c.Level);
  return levels.length > 0 ? Math.max(...levels) : 0;
}

/**
 * Get maximum research level for a category and tier
 */
export function getMaxResearchLevel(category: string, tierLabel: string): number {
  const categoryData = BATTLE_RESEARCH['Battle Research'][category];
  if (!categoryData) return 0;

  const tierData = categoryData[tierLabel];
  if (!tierData || tierData.length === 0) return 0;

  const levels = tierData.map(node => node.level);
  return levels.length > 0 ? Math.max(...levels) : 0;
}

/**
 * Get maximum research levels for all categories and tiers
 */
export function getMaxResearchLevels(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  const categories = Object.keys(BATTLE_RESEARCH['Battle Research']);

  for (const category of categories) {
    const categoryData = BATTLE_RESEARCH['Battle Research'][category];
    result[category] = {};

    for (const tierLabel of Object.keys(categoryData)) {
      result[category][tierLabel] = getMaxResearchLevel(category, tierLabel);
    }
  }

  return result;
}

/**
 * Get maximum war academy level for a tech
 */
export function getMaxWarAcademyLevel(techName: string): number {
  const tech = WAR_ACADEMY_DATA.War_Academy_tech.find(t => t.name === techName);
  if (!tech) return 0;

  const levels = Object.keys(tech.level).map(l => parseInt(l));
  return levels.length > 0 ? Math.max(...levels) : 0;
}

/**
 * Get maximum war academy levels for all techs
 * Uses unique keys: "TechName-troopType" to handle techs with duplicate names
 */
export function getMaxWarAcademyLevels(): Record<string, number> {
  const result: Record<string, number> = {};

  for (const tech of WAR_ACADEMY_DATA.War_Academy_tech) {
    const uniqueKey = `${tech.name}-${tech.type}`;
    result[uniqueKey] = getMaxWarAcademyLevel(tech.name);
  }

  return result;
}

