/**
 * Color Tier Bonuses for Opponent
 * Based on pet color tiers, applies Lethality and Health bonuses to all troop types
 */

export type ColorTier = 'grey' | 'green' | 'blue' | 'purple' | 'gold';

export interface ColorTierBonuses {
  lethality: number;
  health: number;
}

const COLOR_TIER_VALUES: Record<ColorTier, ColorTierBonuses> = {
  grey: {
    lethality: 70.4,
    health: 70.4,
  },
  green: {
    lethality: 178.12,
    health: 178.12,
  },
  blue: {
    lethality: 233.53,
    health: 233.53,
  },
  purple: {
    lethality: 326.92,
    health: 326.92,
  },
  gold: {
    lethality: 467.02,
    health: 467.02,
  },
};

/**
 * Get color tier bonuses for a given color tier
 */
export function getColorTierBonuses(colorTier?: ColorTier): ColorTierBonuses {
  if (!colorTier) {
    return { lethality: 0, health: 0 };
  }
  return COLOR_TIER_VALUES[colorTier] || { lethality: 0, health: 0 };
}

