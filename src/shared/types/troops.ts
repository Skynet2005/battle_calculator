/**
 * Troop-related types
 */

export type TroopType = 'infantry' | 'lancer' | 'marksman';
export type FireCrystalLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type TroopTier = 'normal' | 'helios';

export interface TroopConfiguration {
  type: TroopType;
  tier: TroopTier;
  fireCrystalLevel: FireCrystalLevel;
  count: number;
}

export interface TroopMixConfig {
  totalTroops: number;
  infantryRatio: number;
  lancerRatio: number;
  marksmanRatio: number;
}
