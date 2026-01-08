/**
 * Extract Chief Gear March Capacity Bonus
 * Calculates total march capacity from Chief Gear selections
 */

import { CHIEF_GEAR_DATA } from './chief_gear';

/**
 * Extract Chief Gear march capacity bonus from gear selections
 * @param gearSelections Record of gear type to selection (e.g., { Cap: { tier: "...", stars: 0, step: 0 }, ... })
 * @returns Total march capacity bonus from all selected gear pieces
 */
export function getChiefGearMarchCapacity(gearSelections?: Record<string, { tier: string; stars: number; step?: number }>): number {
  if (!gearSelections) return 0;

  let totalMarchCapacity = 0;

  for (const [gearType, selection] of Object.entries(gearSelections)) {
    const gearData = CHIEF_GEAR_DATA[gearType as keyof typeof CHIEF_GEAR_DATA];
    if (!gearData) continue;

    // Find matching gear entry
    const match = gearData.find(g => {
      if (g.Tier !== selection.tier) return false;
      if (g.Stars !== selection.stars) return false;
      if (selection.step !== undefined && 'Step' in g && g.Step !== selection.step) return false;
      return true;
    });

    if (match && 'March Capacity' in match && typeof match['March Capacity'] === 'number') {
      totalMarchCapacity += match['March Capacity'];
    }
  }

  return totalMarchCapacity;
}

