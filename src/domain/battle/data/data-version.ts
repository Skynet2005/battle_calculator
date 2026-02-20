// Data verified: 2026-02-17 | Central data version tracking for all game data files
export const DATA_VERSION = {
  lastVerified: '2026-02-17',
  heroes: { generations: '1-11', heroCount: 43 },
  troops: { maxFC: 'FC10', tiers: ['Normal', 'Helios'] as const },
  pets: { count: 8, maxLevel: 10 },
  chiefGear: { maxTier: 'Red (Legendary) T4', maxStars: 2, maxStep: 4, gearSlots: 6 },
  charms: { maxLevel: 16 },
  knownGaps: [
    'Chief Gear: Red (Legendary) T4 Stars 3 data missing across all 6 slots',
    'Titan Roc pet: only goes to level 7 (other pets go to level 10)',
  ],
} as const;
