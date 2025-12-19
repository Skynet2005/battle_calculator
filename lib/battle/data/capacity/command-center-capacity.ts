/**
 * Extract Command Center Capacity Bonuses
 * Calculates Rally Capacity and Troops Deployment Capacity from Command Center level
 */

import { getCommandCenterLevel } from '../command_center/command_center';

/**
 * Extract Command Center capacity bonuses from level selection
 * @param level Command Center building level (e.g., "1", "30", "FC10")
 * @returns Object with rallyCapacity and deploymentCapacity bonuses
 */
export function getCommandCenterCapacityBonuses(level?: string): {
  rallyCapacity: number;
  deploymentCapacity: number;
} {
  if (!level) {
    return {
      rallyCapacity: 0,
      deploymentCapacity: 0,
    };
  }

  const levelData = getCommandCenterLevel(level);

  if (!levelData) {
    return {
      rallyCapacity: 0,
      deploymentCapacity: 0,
    };
  }

  return {
    rallyCapacity: levelData.rallyCapacity || 0,
    deploymentCapacity: levelData.deploymentCapacity || 0,
  };
}

