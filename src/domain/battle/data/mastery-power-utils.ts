/**
 * Utility functions for calculating mastery forged power
 */

import masteryPowerData from './hero_gear/mastery_power_data.json';

type GearPiece = 'goggles' | 'glove' | 'boot' | 'belt';

/**
 * Get mastery power for a gear piece at a specific level and mastery level
 * @param gearPiece - The type of gear piece
 * @param gearLevel - The gear level (0-200)
 * @param masteryLevel - The mastery level (0-20)
 * @param masteryForged - Whether mastery forging is enabled
 * @returns The mastery power bonus, or 0 if mastery level < 10 or not forged
 */
export function getMasteryPower(
  gearPiece: GearPiece,
  gearLevel: number,
  masteryLevel: number,
  masteryForged: boolean
): number {
  // Mastery power only applies at mastery levels 10-20
  if (!masteryForged || masteryLevel < 10 || masteryLevel > 20) {
    return 0;
  }

  // Clamp gear level to valid range
  const lvl = Math.max(0, Math.min(200, Math.floor(gearLevel)));

  // Use goggles data as the base (assuming all gear pieces use the same mastery power structure)
  // If different gear pieces have different mastery power, we'll need to update the JSON structure
  const gearData = masteryPowerData.goggles;
  if (!gearData || !gearData.mastery) {
    return 0;
  }

  const masteryKey = masteryLevel.toString();
  const masteryArray = gearData.mastery[masteryKey as keyof typeof gearData.mastery];

  if (!masteryArray || !Array.isArray(masteryArray) || lvl >= masteryArray.length) {
    return 0;
  }

  // Return the mastery power value (this is the TOTAL power, not a bonus)
  return masteryArray[lvl] || 0;
}

