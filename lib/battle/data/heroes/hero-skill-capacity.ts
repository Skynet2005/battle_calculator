/**
 * Extract Hero Skill Capacity Bonus
 * Calculates Rally and Deployment Capacity from Hero Skill levels (XP level)
 * Uses the 3 rally leaders (infantry, lancer, marksman)
 */

/**
 * Calculate Hero Skill Capacity based on hero XP level
 * At level 80, capacity is 13,470
 * Formula appears to scale linearly with level
 * @param xpLevel Hero XP level (0-80)
 * @returns Capacity bonus (both rally and deployment)
 */
function calculateHeroSkillCapacity(xpLevel: number): number {
  if (xpLevel <= 0) return 0;

  // At level 80, capacity is 13,470
  // Assuming linear scaling: capacity = (level / 80) * 13470
  // Or more accurately: capacity = level * (13470 / 80) = level * 168.375
  return Math.floor(xpLevel * (13470 / 80));
}

/**
 * Get Hero Skill Capacity from hero levels
 * Sums capacity from the top 3 heroes by XP level (or all heroes if less than 3)
 * @param heroLevels Record of hero name -> HeroLevel (for XP levels)
 * @returns Object with rallyCapacity and deploymentCapacity (both same value)
 */
export function getHeroSkillCapacity(
  heroLevels?: Record<string, { xpLevel: number }>
): {
  rallyCapacity: number;
  deploymentCapacity: number;
} {
  if (!heroLevels || Object.keys(heroLevels).length === 0) {
    return {
      rallyCapacity: 0,
      deploymentCapacity: 0,
    };
  }

  // Get all heroes with their XP levels and calculate capacity
  const heroCapacities: number[] = [];

  for (const heroLevel of Object.values(heroLevels)) {
    if (!heroLevel || !heroLevel.xpLevel || heroLevel.xpLevel <= 0) continue;

    const capacity = calculateHeroSkillCapacity(heroLevel.xpLevel);
    heroCapacities.push(capacity);
  }

  // Sort descending and take top 3
  heroCapacities.sort((a, b) => b - a);
  const top3 = heroCapacities.slice(0, 3);

  // Sum the top 3 capacities
  const totalCapacity = top3.reduce((sum, cap) => sum + cap, 0);

  return {
    rallyCapacity: totalCapacity,
    deploymentCapacity: totalCapacity,
  };
}

