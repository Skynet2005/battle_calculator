/**
 * Type validation tests for combat type interfaces.
 * These tests verify that the type definitions compile correctly and
 * can be used as expected throughout the codebase.
 */

import type {
  ActionComputationLog,
  // Logging
  ActionLogEntry,
  // Bonuses
  AdditiveBonuses,
  // Configuration
  BattleConfig,
  // Battle results
  BattleReport,
  // Combat state
  CombatState,
  // Damage system
  DamageInput,
  DamageModifier,
  // Hero and composition
  HeroInfo,
  SideComposition,
  SimulateParams,
  SimulationConfig,
  SkillDefinition,
  SkillEffect,
  SpecialBonuses,
  TroopCounts,
  TroopPool,
  // Stats and counts
  TroopStats,
  // Core enums and types
  TroopType,
  TurnLog,
  // Unit representation
  Unit
} from "./types";

import {
  DEFAULT_BATTLE_CONFIG,
  DEFAULT_TARGETING_CONFIG,
  isBattleRole,
  isBattleWinner,
  isBonusTarget,
  // Type guards
  isTroopType,
  STAT_KEYS,
  // Constants
  TROOP_TYPE_VALUES,
  ZERO_STATS,
  ZERO_TROOPS,
} from "./types";

// ============================================================================
// Type Compatibility Tests
// ============================================================================

// Test TroopType values
const troopTypes: TroopType[] = ["Infantry", "Lancer", "Marksman"];
const validTroopType: TroopType = "Infantry";

// Test TroopStats
const stats: TroopStats = {
  attack: 100,
  defense: 50,
  health: 200,
  lethality: 75,
};

// Test TroopCounts
const counts: TroopCounts = {
  Infantry: 1000,
  Lancer: 500,
  Marksman: 250,
};

// Test TroopPool
const pool: TroopPool = {
  type: "Infantry",
  row: "Front",
  count: 500,
};

// Test Unit interface
const unit: Unit = {
  id: "unit-1",
  type: "Infantry",
  count: 1000,
  initialCount: 1000,
  row: "Front",
  baseStats: stats,
  effectiveStats: stats,
  side: "attacker",
};

// Test AdditiveBonuses
const additiveBonuses: AdditiveBonuses = {
  Infantry: { attack: 10, defense: 5 },
  All: { health: 15 },
};

// Test SpecialBonuses
const specialBonuses: SpecialBonuses = {
  Marksman: { lethality: 20 },
};

// Test DamageModifier
const modifier: DamageModifier = {
  id: "mod-1",
  source: "Test Skill",
  subject: "outgoing",
  appliesTo: "All",
  durationTurns: 3,
  chance: 0.75,
  magnitude: 0.25,
  scope: "Any",
  stackingKey: "skill_buff",
};

// Test SkillEffect
const effect: SkillEffect = {
  id: "effect-1",
  trigger: "OnTurnStart",
  type: "StatBuff",
  target: "Infantry",
  statBuff: { attack: 10 },
  durationTurns: 2,
  chance: 1.0,
};

// Test SkillDefinition
const skill: SkillDefinition = {
  id: "skill-1",
  name: "Power Strike",
  trigger: "OnTurnStart",
  effects: [effect],
  cooldownTurns: 3,
};

// Test BattleConfig (using default)
const config: BattleConfig = { ...DEFAULT_BATTLE_CONFIG };

// Test SimulationConfig
const simConfig: SimulationConfig = {
  ...DEFAULT_BATTLE_CONFIG,
  enableDetailedLogging: true,
  trackVariance: true,
  confidenceInterval: 95,
};

// Test HeroInfo
const hero: HeroInfo = {
  id: "hero-1",
  name: "Test Hero",
  class: "Infantry",
  starLevel: 5,
  generation: 3,
};

// Test SideComposition
const side: SideComposition = {
  name: "Player",
  role: "attacker",
  troops: counts,
  baseStats: {
    Infantry: stats,
    Lancer: stats,
    Marksman: stats,
  },
  additiveBonuses,
  specialBonuses,
  damageModifiers: [modifier],
  skills: [skill],
  heroes: [hero],
};

// Test DamageInput
const damageInput: DamageInput = {
  attackerType: "Infantry",
  defenderType: "Lancer",
  attackerStats: stats,
  defenderStats: stats,
  attackerCount: 1000,
  defenderCount: 800,
  matchupMultiplier: 1.0,
  actionMultiplier: 1.0,
  outgoingModifiers: [0.25],
  incomingModifiers: [-0.1],
};

// Test DamageComputation
const computation: ActionComputationLog = {
  k: 1,
  alpha: 0.5,
  nTerm: 1,
  numerator: 1,
  denominator: 1,
  ratio: 1,
  matchupMultiplier: 1,
  actionMultiplier: 1,
  rawFinal: 112.5,
  baseKills: 100,
  outgoingMultiplier: 1.25,
  incomingMultiplier: 0.9,
  outgoingComponents: [],
  incomingComponents: [],
  finalKills: 112.5
};

// Test ActionLogEntry
const action: ActionLogEntry = {
  id: "act-1",
  turn: 1,
  actor: "Infantry",
  target: "Lancer",
  actionType: "NormalAttack",
  side: "attacker",
  components: computation,
  remaining: counts,
  attackerCount: 1000,
  defenderCount: 700
};

// Test TurnLog
const turnLog: TurnLog = {
  turn: 1,
  buffsApplied: [],
  buffsExpired: [],
  actions: [action],
  attackerTroops: counts,
  defenderTroops: counts,
};

// Test BattleReport
const report: BattleReport = {
  config,
  attacker: side,
  defender: side,
  turns: [turnLog],
  winner: "attacker",
  attackerRemaining: counts,
  defenderRemaining: { Infantry: 0, Lancer: 0, Marksman: 0 },
};

// Test CombatState
const combatState: CombatState = {
  currentTurn: 5,
  phase: "AttackerActions",
  attacker: {
    composition: side,
    troops: counts,
    effectiveStats: {
      Infantry: stats,
      Lancer: stats,
      Marksman: stats,
    },
    activeModifiers: [],
    activeBuffs: [],
    skillStates: [],
    totalDamageDealt: 5000,
    totalKills: 500,
    casualties: { dead: 100, wounded: 50 },
  },
  defender: {
    composition: side,
    troops: counts,
    effectiveStats: {
      Infantry: stats,
      Lancer: stats,
      Marksman: stats,
    },
    activeModifiers: [],
    activeBuffs: [],
    skillStates: [],
    totalDamageDealt: 3000,
    totalKills: 300,
    casualties: { dead: 200, wounded: 100 },
  },
  config,
  isComplete: false,
};

// Test SimulateParams
const params: SimulateParams = {
  attacker: side,
  defender: side,
  config: { maxTurns: 50 },
};

// ============================================================================
// Type Guard Tests
// ============================================================================

// Test type guards work correctly
const testTypeGuards = () => {
  // isTroopType
  console.assert(isTroopType("Infantry") === true);
  console.assert(isTroopType("Lancer") === true);
  console.assert(isTroopType("Marksman") === true);
  console.assert(isTroopType("Archer") === false);
  console.assert(isTroopType(123) === false);

  // isBattleRole
  console.assert(isBattleRole("attacker") === true);
  console.assert(isBattleRole("defender") === true);
  console.assert(isBattleRole("neutral") === false);

  // isBattleWinner
  console.assert(isBattleWinner("attacker") === true);
  console.assert(isBattleWinner("defender") === true);
  console.assert(isBattleWinner("draw") === true);
  console.assert(isBattleWinner("tie") === false);

  // isBonusTarget
  console.assert(isBonusTarget("Infantry") === true);
  console.assert(isBonusTarget("All") === true);
  console.assert(isBonusTarget("Everyone") === false);
};

// ============================================================================
// Constant Validation Tests
// ============================================================================

// Verify constants are properly defined
const testConstants = () => {
  // TROOP_TYPE_VALUES
  console.assert(TROOP_TYPE_VALUES.length === 3);
  console.assert(TROOP_TYPE_VALUES.includes("Infantry"));
  console.assert(TROOP_TYPE_VALUES.includes("Lancer"));
  console.assert(TROOP_TYPE_VALUES.includes("Marksman"));

  // STAT_KEYS
  console.assert(STAT_KEYS.length === 4);
  console.assert(STAT_KEYS.includes("attack"));
  console.assert(STAT_KEYS.includes("defense"));
  console.assert(STAT_KEYS.includes("health"));
  console.assert(STAT_KEYS.includes("lethality"));

  // ZERO_STATS
  console.assert(ZERO_STATS.attack === 0);
  console.assert(ZERO_STATS.defense === 0);
  console.assert(ZERO_STATS.health === 0);
  console.assert(ZERO_STATS.lethality === 0);

  // ZERO_TROOPS
  console.assert(ZERO_TROOPS.Infantry === 0);
  console.assert(ZERO_TROOPS.Lancer === 0);
  console.assert(ZERO_TROOPS.Marksman === 0);

  // DEFAULT_BATTLE_CONFIG
  console.assert(DEFAULT_BATTLE_CONFIG.maxTurns === 30);
  console.assert(DEFAULT_BATTLE_CONFIG.randomMode === "monteCarlo");
  console.assert(DEFAULT_BATTLE_CONFIG.battleType === "Rally");

  // DEFAULT_TARGETING_CONFIG
  console.assert(DEFAULT_TARGETING_CONFIG.priority.length === 3);
  console.assert(DEFAULT_TARGETING_CONFIG.allowBacklineDive === false);
};

// ============================================================================
// Export validation - ensure all types are properly exported
// ============================================================================

export {
  action, additiveBonuses, combatState, computation, config, counts, damageInput, effect, hero, modifier, params, pool, report, side, simConfig, skill, specialBonuses, stats, testConstants, testTypeGuards,
  // Re-export for validation that all types can be imported
  troopTypes, turnLog, unit, validTroopType
};

// This file serves as a compile-time validation that all types are correctly defined
// and can be used together. If this file compiles without errors, the type system is valid.
console.log("All type definitions validated successfully!");
