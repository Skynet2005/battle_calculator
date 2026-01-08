/**
 * Extract War Academy Capacity Bonuses
 * Calculates deployment capacity and rally capacity from War Academy tech selections
 */

import type { TroopType } from '../../calculations';
import { WAR_ACADEMY_DATA } from './war_academy';

/**
 * Extract War Academy capacity bonuses from academy level selections
 * @param academyLevels Record of tech keys to levels (format: "TechName-troopType" or just "TechName")
 * @returns Object with deploymentCapacity (sum of all troop deployment capacities) and rallyCapacity (sum of all rally capacities)
 */
export function getWarAcademyCapacityBonuses(academyLevels: Record<string, number>): {
  deploymentCapacity: number;
  rallyCapacity: number;
} {
  let deploymentCapacity = 0;
  let rallyCapacity = 0;

  for (const [techKey, level] of Object.entries(academyLevels)) {
    // Handle both old format (just tech name) and new format (techName-troopType)
    let techName: string;
    let expectedType: TroopType | undefined;

    if (techKey.includes('-')) {
      // New format: "TechName-troopType"
      const parts = techKey.split('-');
      techName = parts.slice(0, -1).join('-'); // Handle tech names that might contain dashes
      expectedType = parts[parts.length - 1] as TroopType;
    } else {
      // Old format: just tech name (for backward compatibility)
      techName = techKey;
    }

    // Find the tech - if we have an expected type, match both name and type
    const tech = expectedType
      ? WAR_ACADEMY_DATA.War_Academy_tech.find(t => t.name === techName && t.type === expectedType)
      : WAR_ACADEMY_DATA.War_Academy_tech.find(t => t.name === techName);

    if (!tech) continue;

    const levelValue = tech.level[level.toString()];
    if (levelValue === undefined) continue;

    const effect = tech.effect.toLowerCase();

    // Check for deployment capacity bonuses
    if (effect.includes('deployment capacity') || effect.includes('troop deployment capacity')) {
      deploymentCapacity += levelValue;
    }

    // Check for rally capacity bonuses
    if (effect.includes('rally capacity')) {
      rallyCapacity += levelValue;
    }
  }

  return {
    deploymentCapacity,
    rallyCapacity,
  };
}

