/**
 * Combat Module Index
 *
 * Central export point for all combat-related types, functions, and constants.
 * Import from this file for clean access to the combat system.
 *
 * @example
 * import { simulateBattle, BattleConfig, TroopType } from "@/domain/combat";
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export all types from the types module
export type {
  // Core enums and types
  TroopType,
  TroopRow,
  BattleRole,
  ActionType,
  BattleWinner,
  StatKey,
  BonusTarget,
  RandomMode,
  StackingBehavior,
  BattleType,
  CombatPhase,

  // Stats and counts
  TroopStats,
  TroopCounts,
  TroopPool,
  TroopEffectiveStats,

  // Unit representation
  Unit,
  UnitSnapshot,

  // Bonuses
  AdditiveBonuses,
  SpecialBonuses,

  // Damage modifiers
  DamageModifierSubject,
  DamageModifierScope,
  DamageModifier,

  // Skills
  SkillTrigger,
  SkillEffectType,
  SkillEffect,
  SkillDefinition,
  SkillRuntimeState,
  ActiveEffect,

  // Active buffs and modifiers
  ActiveModifier,
  ActiveStatBuff,

  // Configuration
  BattleConfig,
  SimulationConfig,
  TargetingConfig,

  // Casualty system
  CasualtyBreakdown,
  CasualtyModel,

  // Hero and composition
  HeroInfo,
  SideComposition,

  // Damage system
  DamageInput,
  DamageComputation,
  DamageResult,
  DamageBreakdown,

  // Logging
  ActionLogEntry,
  BuffLogEntry,
  TurnLog,

  // Battle results
  BattleReport,
  BattleReportWithStats,
  BattleOutcome,

  // Combat state
  CombatState,
  CombatSideState,
  CombatStateSnapshot,

  // Targeting
  TargetSelection,
  TriggerResult,

  // Joiner system
  JoinerSkill,
  Joiner,

  // Utilities
  Rng,
  DeepPartial,
  SimulateParams,
  CalibrationSample,
} from "./types";

// ============================================================================
// CONSTANT EXPORTS
// ============================================================================

export {
  TROOP_TYPE_VALUES,
  STAT_KEYS,
  DEFAULT_BATTLE_CONFIG,
  ZERO_STATS,
  ZERO_TROOPS,
  DEFAULT_TARGETING_CONFIG,
} from "./types";

// ============================================================================
// TYPE GUARD EXPORTS
// ============================================================================

export {
  isTroopType,
  isBattleRole,
  isBattleWinner,
  isBonusTarget,
} from "./types";

// ============================================================================
// FUNCTION EXPORTS
// ============================================================================

// Engine functions
export { simulateBattle } from "./engine";

// Bonus calculation functions
export {
  TROOP_TYPES,
  zeroStats,
  cloneStats,
  aggregateAdditive,
  applySpecialFormula,
  aggregateSpecial,
  computeEffectiveStats,
  enforceStacking,
  normalizeModifiers,
} from "./bonuses";

// Damage calculation functions
export { computeDamage, productFromMagnitudes, emptyDamage } from "./damage";

// Skill functions
export {
  makeRng,
  initSkillRuntime,
  triggerSkills,
  selectJoinerPrimarySkills,
  filterModifiersForAction,
} from "./skills";

// Targeting functions
export { pickTarget } from "./targeting";
