/**
 * Central type exports for the Expedition Battle Calculator
 *
 * Import types from this file for clean access to all domain types.
 *
 * @example
 * import type { UserProfile, TroopMixConfig, RallyConfiguration } from '@/shared/types';
 */

// Troop types
export type {
  TroopType,
  FireCrystalLevel,
  TroopTier,
  TroopConfiguration,
  TroopMixConfig,
} from './troops';

// Rally types
export type {
  RallyHero,
  RallyConfiguration,
} from './rally';

// Hero types
export type {
  HeroLevel,
} from './heroes';

// Profile types
export type {
  UserProfile,
} from './profile';

// Game data types
export type {
  GameData,
} from './game';

// Capacity and bonus summary (used by domain and features)
export type {
  CapacityBreakdown,
  CapacityReport,
  SpecialBonusSummary,
} from './capacity';
