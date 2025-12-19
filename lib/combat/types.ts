/**
 * Core combat type definitions for the deterministic damage engine.
 * All public types are consumed by the adapter layer so keep them stable and explicit.
 *
 * This file contains comprehensive TypeScript interfaces for:
 * - CombatState: Real-time battle state tracking
 * - Unit: Unified unit representation with stats, counts, and effects
 * - Skill: Skill definitions, triggers, effects, and runtime state
 * - Damage: Damage computation, input parameters, and results
 * - Effect: Active effects, buffs, modifiers with duration tracking
 * - SimulationConfig: Battle and simulation configuration options
 */

// ============================================================================
// TROOP TYPES & CORE ENUMS
// ============================================================================

export type TroopType = "Infantry" | "Lancer" | "Marksman";

/** Array of all troop types for iteration */
export const TROOP_TYPE_VALUES: readonly TroopType[] = ["Infantry", "Lancer", "Marksman"] as const;

/** Battle role - attacker initiates, defender responds */
export type BattleRole = "attacker" | "defender";

/** Row positioning for formation-based targeting */
export type TroopRow = "Front" | "Back";

/** Action types that can occur during combat */
export type ActionType = "NormalAttack" | "Skill";

/** Battle outcome winner determination */
export type BattleWinner = "attacker" | "defender" | "draw";

// ============================================================================
// TROOP STATS & COUNTS
// ============================================================================

/**
 * Core statistics for a troop type.
 * All values are percentages or absolute values depending on context.
 */
export interface TroopStats {
  /** Offensive power - used in damage numerator */
  attack: number;
  /** Defensive power - used in damage denominator */
  defense: number;
  /** Health points - used in damage denominator */
  health: number;
  /** Critical damage factor - used in damage numerator */
  lethality: number;
}

/** Stat key type for iteration */
export type StatKey = keyof TroopStats;

/** All stat keys for iteration */
export const STAT_KEYS: readonly StatKey[] = ["attack", "defense", "health", "lethality"] as const;

/**
 * Count of troops by type.
 * Used for tracking alive troops during battle.
 */
export interface TroopCounts {
  Infantry: number;
  Lancer: number;
  Marksman: number;
}

/**
 * Troop pool representing a group of troops in a specific row.
 * Used for formation-based targeting systems.
 */
export interface TroopPool {
  type: TroopType;
  row: TroopRow;
  count: number;
}

// ============================================================================
// UNIT - Unified Unit Representation
// ============================================================================

/**
 * Unified unit representation combining type, stats, count, and state.
 * Represents a single troop group within a battle.
 */
export interface Unit {
  /** Unique identifier for this unit */
  id: string;
  /** The type of troop */
  type: TroopType;
  /** Current troop count (alive) */
  count: number;
  /** Initial troop count at battle start */
  initialCount: number;
  /** Row position for targeting */
  row: TroopRow;
  /** Base stats before any bonuses */
  baseStats: TroopStats;
  /** Effective stats after all bonuses applied */
  effectiveStats: TroopStats;
  /** Which side this unit belongs to */
  side: BattleRole;
}

/**
 * Unit state snapshot for a specific point in time.
 * Used for logging and replay functionality.
 */
export interface UnitSnapshot {
  unitId: string;
  type: TroopType;
  count: number;
  effectiveStats: TroopStats;
  row: TroopRow;
}

// ============================================================================
// BONUSES - Stat Modification System
// ============================================================================

/**
 * Additive bonuses applied per troop type.
 * These are summed together before being applied to base stats.
 * "All" applies to every troop type.
 */
export interface AdditiveBonuses {
  Infantry?: Partial<TroopStats>;
  Lancer?: Partial<TroopStats>;
  Marksman?: Partial<TroopStats>;
  All?: Partial<TroopStats>;
}

/**
 * Special bonuses that use the Whiteout Survival stacking formula:
 * finalPercent = base + special + (base * special / 100)
 * This creates multiplicative-like behavior for certain buff types.
 */
export interface SpecialBonuses {
  Infantry?: Partial<TroopStats>;
  Lancer?: Partial<TroopStats>;
  Marksman?: Partial<TroopStats>;
  All?: Partial<TroopStats>;
}

/**
 * Bonus target specification - either a specific troop type or all troops.
 */
export type BonusTarget = TroopType | "All";

// ============================================================================
// DAMAGE MODIFIERS - Damage Scaling System
// ============================================================================

/**
 * Subject of a damage modifier - determines which side's damage is affected.
 * - outgoing: Affects damage this side deals
 * - incoming: Affects damage this side receives
 * - enemyOutgoing: Debuff that reduces enemy's outgoing damage
 */
export type DamageModifierSubject = "outgoing" | "incoming" | "enemyOutgoing";

/**
 * Scope of a damage modifier - determines when it applies.
 * - Any: Applies to all damage types
 * - NormalAttack: Only applies to normal attack damage dealt
 * - Skill: Only applies to skill damage dealt
 * - NormalAttackReceived: Only applies when receiving normal attack damage
 * - SkillReceived: Only applies when receiving skill damage
 */
export type DamageModifierScope =
  | "Any"
  | "NormalAttack"
  | "Skill"
  | "NormalAttackReceived"
  | "SkillReceived";

/**
 * A modifier that affects damage calculations.
 * Applied multiplicatively: FinalDamage = BaseDamage * Π(1 + magnitude)
 */
export interface DamageModifier {
  /** Unique identifier for this modifier */
  id: string;
  /** Source of this modifier (skill name, buff source, etc.) */
  source: string;
  /** Which damage direction this affects */
  subject: DamageModifierSubject;
  /** Which troop type(s) this modifier applies to */
  appliesTo: BonusTarget;
  /** Duration in turns; 0 or -1 for permanent */
  durationTurns: number;
  /** Probability of activation (0..1), used in Monte Carlo or scaled in expected value */
  chance: number;
  /** Stacking key - only strongest of same key is kept when strict stacking */
  stackingKey?: string;
  /** Magnitude as decimal (0.25 = +25%, -0.20 = -20%) */
  magnitude: number;
  /** When this modifier applies */
  scope?: DamageModifierScope;
}

// ============================================================================
// SKILL SYSTEM - Skills, Triggers, and Effects
// ============================================================================

/**
 * When a skill is triggered during combat.
 * - OnTurnStart: At the beginning of each turn
 * - OnNormalAttack: When performing a normal attack
 * - OnSkillCast: When casting another skill
 * - OnTurnEnd: At the end of each turn
 * - PassivePermanent: Always active, applied once at battle start
 */
export type SkillTrigger =
  | "OnTurnStart"
  | "OnNormalAttack"
  | "OnSkillCast"
  | "OnTurnEnd"
  | "PassivePermanent";

/**
 * The type of effect a skill provides.
 * - StatBuff: Modifies troop stats (additive or special)
 * - DamageMultiplier: Applies a damage modifier
 * - FlatDamage: Deals direct damage (not multiplied by stats)
 * - TargetingOverride: Changes targeting behavior
 * - Heal: Restores troop count (future use)
 * - Shield: Absorbs damage (future use)
 */
export type SkillEffectType =
  | "StatBuff"
  | "DamageMultiplier"
  | "FlatDamage"
  | "TargetingOverride"
  | "Heal"
  | "Shield";

/**
 * A single effect that a skill can produce.
 * Skills can have multiple effects that activate together.
 */
export interface SkillEffect {
  /** Unique identifier for this effect */
  id: string;
  /** When this effect triggers */
  trigger: SkillTrigger;
  /** What type of effect this is */
  type: SkillEffectType;
  /** Which troops this effect targets */
  target: BonusTarget;
  /** Additive stat bonus to apply */
  statBuff?: Partial<TroopStats>;
  /** Special stat bonus (uses Whiteout Survival formula) */
  specialBuff?: Partial<TroopStats>;
  /** Damage modifier to apply */
  damageModifier?: DamageModifier;
  /** Flat damage amount (for FlatDamage type) */
  flatDamage?: number;
  /** Multiplier for actions (e.g., 2x attacks) */
  actionMultiplier?: number;
  /** How long this effect lasts in turns; 0 or undefined for permanent */
  durationTurns?: number;
  /** Stacking key for buff conflict resolution */
  stackingKey?: string;
  /** Probability of this effect activating (0..1) */
  chance?: number;
  /** Description of this effect for UI display */
  description?: string;
}

/**
 * Complete definition of a skill.
 * Contains all effects and activation rules.
 */
export interface SkillDefinition {
  /** Unique identifier for this skill */
  id: string;
  /** Display name of the skill */
  name: string;
  /** Primary trigger for this skill */
  trigger: SkillTrigger;
  /** All effects this skill produces */
  effects: SkillEffect[];
  /** Cooldown in turns before skill can activate again */
  cooldownTurns?: number;
  /** Periodic interval for "every N turns" skills (e.g., 4 for "every 4 turns") */
  periodicInterval?: number;
  /** Whether this is an "after every N turns" skill (triggers at EndOfTurn) */
  isAfterEveryNTurns?: boolean;
  /** Multiplier for the number of actions taken */
  actionMultiplier?: number;
  /** Skill level (affects magnitude of effects) */
  level?: number;
  /** Hero that owns this skill */
  heroId?: string;
  /** Description of this skill for UI display */
  description?: string;
  /** Icon identifier for UI display */
  icon?: string;
}

/**
 * Runtime state for a skill during battle.
 * Tracks cooldowns and availability.
 */
export interface SkillRuntimeState {
  /** The skill definition */
  skill: SkillDefinition;
  /** Turn number when this skill can next activate */
  nextAvailableTurn: number;
  /** Number of times this skill has activated */
  activationCount?: number;
  /** Periodic interval for "every N turns" skills (e.g., 4 for "every 4 turns") */
  periodicInterval?: number;
  /** Whether this is an "after every N turns" skill (triggers at EndOfTurn) */
  isAfterEveryNTurns?: boolean;
}

/**
 * An active effect currently applied during battle.
 * Tracks remaining duration and source.
 */
export interface ActiveEffect {
  /** The effect being applied */
  effect: SkillEffect;
  /** Turns remaining; -1 for permanent, 0 to expire this turn */
  remaining: number;
  /** Source skill or ability that created this effect */
  source?: string;
  /** Turn this effect was applied */
  appliedOnTurn?: number;
}

// ============================================================================
// ACTIVE MODIFIERS & BUFFS - Runtime Effect Tracking
// ============================================================================

/**
 * An active damage modifier during combat.
 * Wraps DamageModifier with runtime duration tracking.
 */
export interface ActiveModifier {
  /** The damage modifier being applied */
  modifier: DamageModifier;
  /** Turns remaining; -1 for permanent */
  remaining: number;
  /** Source of this modifier */
  source: string;
}

/**
 * An active stat buff during combat.
 * Tracks both additive and special bonuses with duration.
 */
export interface ActiveStatBuff {
  /** Which troops this buff applies to */
  target: BonusTarget;
  /** Additive stat bonuses */
  additive: Partial<TroopStats>;
  /** Special stat bonuses (Whiteout formula) */
  special: Partial<TroopStats>;
  /** Turns remaining; -1 for permanent */
  remaining: number;
  /** Source skill or ability */
  source: string;
  /** Stacking key for conflict resolution */
  stackingKey?: string;
}

// ============================================================================
// SIMULATION CONFIGURATION
// ============================================================================

/**
 * Random mode for simulation.
 * - expectedValue: Scale effects by probability for deterministic results
 * - monteCarlo: Run multiple simulations with random rolls
 */
export type RandomMode = "expectedValue" | "monteCarlo";

/**
 * Stacking behavior for conflicting buffs.
 * - strict: Only keep strongest of same stackingKey
 * - permissive: Allow all buffs to stack
 */
export type StackingBehavior = "strict" | "permissive";

/**
 * Type of battle - affects casualty calculation and rules.
 * - Expedition: PvE content, all losses are permanent deaths
 * - Rally: Large-scale PvP, all losses are permanent deaths
 * - Garrison: Defensive PvP, wounded/dead split applies
 * - BearTrap: Trap-based PvP, wounded/dead split applies
 */
export type BattleType = "Expedition" | "Rally" | "Garrison" | "BearTrap";

/**
 * Complete battle configuration.
 * Controls all aspects of the simulation.
 */
export interface BattleConfig {
  /** Maximum turns before battle ends in draw */
  maxTurns: number;
  /** How to handle probability-based effects */
  randomMode: RandomMode;
  /** Exponent for troop count in damage formula (default 0.5) */
  troopCountExponentAlpha: number;
  /** Calibration constant K in damage formula */
  calibrationConstantK: number;
  /** Whether lancers can dive to backline */
  allowLancerBacklineDive: boolean;
  /** Probability of lancer backline dive (0..1) */
  lancerBacklineDiveChance: number;
  /** How to handle conflicting buffs */
  stackingBehavior: StackingBehavior;
  /** Type of battle - affects casualties */
  battleType: BattleType;
  /** Seed for deterministic RNG in Monte Carlo mode */
  rngSeed?: number;
  /** Number of simulations for Monte Carlo mode */
  simulations?: number;
}

/**
 * Extended simulation configuration with additional options.
 * Used for advanced simulation scenarios.
 */
export interface SimulationConfig extends BattleConfig {
  /** Enable detailed logging of each action */
  enableDetailedLogging?: boolean;
  /** Enable variance tracking for Monte Carlo */
  trackVariance?: boolean;
  /** Confidence interval percentage (e.g., 95) */
  confidenceInterval?: number;
  /** Custom matchup multipliers by attacker->defender type */
  matchupMultipliers?: Record<TroopType, Record<TroopType, number>>;
  /** Custom targeting priorities */
  targetingPriorities?: TroopType[];
  /** Infirmary capacity for wounded calculations */
  infirmaryCapacity?: number;
}

// ============================================================================
// CASUALTY SYSTEM
// ============================================================================

/**
 * Breakdown of casualties into dead and wounded.
 */
export interface CasualtyBreakdown {
  /** Permanently lost troops */
  dead: number;
  /** Wounded troops that can be healed */
  wounded: number;
}

/**
 * Model for calculating casualty distribution.
 * Different battle types use different split ratios.
 */
export interface CasualtyModel {
  /** Apply the casualty model to convert kills to dead/wounded */
  apply: (
    kills: number,
    battleType: BattleType,
    infirmaryCapacity?: number
  ) => CasualtyBreakdown;
}

/**
 * Complete breakdown of effective stats showing all layers.
 * Useful for debugging and displaying stat calculations.
 */
export interface TroopEffectiveStats {
  /** Original base stats */
  base: TroopStats;
  /** Aggregated additive bonuses */
  additive: TroopStats;
  /** Aggregated special bonuses */
  special: TroopStats;
  /** Final computed effective stats */
  final: TroopStats;
}

// ============================================================================
// HERO INFORMATION
// ============================================================================

/**
 * Basic hero information for display purposes.
 */
export interface HeroInfo {
  /** Unique hero identifier */
  id: string;
  /** Display name */
  name: string;
  /** Hero class/troop type */
  class: TroopType;
  /** Star level (1-5) */
  starLevel?: number;
  /** Generation (1-4) */
  generation?: number;
  /** Experience level */
  level?: number;
}

// ============================================================================
// SIDE COMPOSITION - Battle Participant Definition
// ============================================================================

/**
 * Complete composition of one side in a battle.
 * Contains all troops, stats, bonuses, and skills.
 */
export interface SideComposition {
  /** Display name for this side (e.g., player name, "Enemy") */
  name: string;
  /** Whether this is the attacker or defender */
  role: BattleRole;
  /** Troop counts by type */
  troops: TroopCounts;
  /** Optional row-based formation */
  rows?: TroopPool[];
  /** Base stats per troop type (before bonuses) */
  baseStats: Record<TroopType, TroopStats>;
  /** Additive bonuses from various sources */
  additiveBonuses: AdditiveBonuses;
  /** Special bonuses (Whiteout formula) */
  specialBonuses: SpecialBonuses;
  /** Pre-existing damage modifiers (from equipment, etc.) */
  damageModifiers: DamageModifier[];
  /** All skills available to this side */
  skills: SkillDefinition[];
  /** Optional hero information for display */
  heroes?: HeroInfo[];
}

// ============================================================================
// DAMAGE SYSTEM - Damage Calculation and Results
// ============================================================================

/**
 * Input parameters for damage calculation.
 * Contains all information needed to compute damage between two units.
 */
export interface DamageInput {
  /** Type of the attacking troop */
  attackerType: TroopType;
  /** Type of the defending troop */
  defenderType: TroopType;
  /** Effective stats of the attacker */
  attackerStats: TroopStats;
  /** Effective stats of the defender */
  defenderStats: TroopStats;
  /** Number of attacking troops */
  attackerCount: number;
  /** Number of defending troops */
  defenderCount: number;
  /** Type-based advantage multiplier (default 1.0) */
  matchupMultiplier: number;
  /** Action multiplier (e.g., for skills that do 2x damage) */
  actionMultiplier: number;
  /** Array of outgoing damage modifier magnitudes */
  outgoingModifiers: number[];
  /** Array of incoming damage modifier magnitudes */
  incomingModifiers: number[];
  /** Optional detailed outgoing modifiers for logging */
  outgoingDetails?: ModifierComponentLog[];
  /** Optional detailed incoming modifiers for logging */
  incomingDetails?: ModifierComponentLog[];
  /** Optional effective stat derivations for logging */
  attackerEffectiveDetail?: EffectiveStatSnapshot;
  /** Optional effective stat derivations for logging */
  defenderEffectiveDetail?: EffectiveStatSnapshot;
}

/**
 * Result of a damage computation.
 * Shows base damage and all multipliers applied.
 */
export interface DamageComputation {
  /** Raw kill count before multipliers */
  baseKills: number;
  /** Combined outgoing damage multiplier */
  outgoingMultiplier: number;
  /** Combined incoming damage multiplier */
  incomingMultiplier: number;
  /** Final kill count after all multipliers */
  finalKills: number;
}

/**
 * Extended damage result with additional breakdown.
 * Used for detailed damage analysis.
 */
export interface DamageResult extends DamageComputation {
  /** Breakdown of damage by source */
  breakdown?: DamageBreakdown;
  /** Whether a critical hit occurred (future use) */
  isCritical?: boolean;
  /** Raw damage before any reductions */
  rawDamage?: number;
}

/**
 * Detailed breakdown of damage calculation.
 * Shows contribution from each factor.
 */
export interface DamageBreakdown {
  /** Contribution from attack stat */
  attackContribution: number;
  /** Contribution from lethality stat */
  lethalityContribution: number;
  /** Reduction from defense stat */
  defenseReduction: number;
  /** Reduction from health stat */
  healthReduction: number;
  /** Contribution from troop count */
  countContribution: number;
  /** List of applied modifiers with their magnitudes */
  appliedModifiers: Array<{ source: string; magnitude: number }>;
}

/**
 * Full per-stat computation pipeline for display/debug.
 */
export interface StatComputationDetail {
  /** Base stat before any bonuses */
  base: number;
  /** Additive bonus from "All" */
  additiveAll: number;
  /** Additive bonus from troop-specific */
  additiveType: number;
  /** Special bonus from "All" (Whiteout formula) */
  specialAll: number;
  /** Special bonus from troop-specific (Whiteout formula) */
  specialType: number;
  /** Final percent after applySpecialFormula */
  finalPercent: number;
  /** Effective stat value after applying finalPercent */
  effective: number;
}

/**
 * Effective stats pipeline for all four stats.
 */
export interface EffectiveStatSnapshot {
  attack: StatComputationDetail;
  defense: StatComputationDetail;
  health: StatComputationDetail;
  lethality: StatComputationDetail;
}

/**
 * Detailed modifier component used in a damage multiplication product.
 */
export interface ModifierComponentLog {
  id: string;
  source: string;
  stackingKey?: string;
  magnitude: number;
  subject: DamageModifierSubject;
  appliesTo: BonusTarget;
  scope?: DamageModifierScope;
  /** Remaining duration (turns) at time of use */
  remaining?: number;
  /** Whether this modifier was kept after stacking resolution */
  kept?: boolean;
  /** Why this modifier was discarded (if applicable) */
  discardedReason?: string;
}

/**
 * Targeting decision evidence for an action.
 */
export interface TargetingDecisionLog {
  selected: TroopType | null;
  selectedRow?: TroopRow;
  reason?: string;
  overrideSource?: string;
  /** Random mode for this decision */
  mode?: RandomMode;
  /** Random roll used in monteCarlo mode */
  roll?: number;
  /** Probability threshold used */
  probability?: number;
  /** Whether backline dive was allowed and/or used */
  backlineDive?: boolean;
  /** Targeting priority order */
  priority?: TroopType[];
}

/**
 * RNG roll used during an action/turn (for reproducibility).
 */
export interface RngRollLog {
  label: string;
  value: number;
  threshold?: number;
  succeeded?: boolean;
  seed?: number;
}

/**
 * Detailed computation log for one damage action.
 */
export interface ActionComputationLog extends DamageComputation {
  /** Calibration constant used */
  k: number;
  /** Troop count exponent alpha */
  alpha: number;
  /** attackerCount ^ alpha */
  nTerm: number;
  /** (AtkEff * LethEff) / (DefEff * HpEff) */
  ratio: number;
  /** Numerator = AtkEff * LethEff */
  numerator: number;
  /** Denominator = DefEff * HpEff */
  denominator: number;
  /** Troop-type matchup multiplier */
  matchupMultiplier: number;
  /** Action multiplier (e.g., skill %) */
  actionMultiplier: number;
  /** Raw final before clamping to defender count */
  rawFinal: number;
  /** Detailed outgoing components */
  outgoingComponents: ModifierComponentLog[];
  /** Detailed incoming components */
  incomingComponents: ModifierComponentLog[];
}

// ============================================================================
// BATTLE LOGGING - Action and Turn Tracking
// ============================================================================

/**
 * Log entry for a single action (attack or skill use).
 */
export interface ActionLogEntry {
  /** Stable identifier for this action */
  id: string;
  /** Turn number this action occurred */
  turn: number;
  /** Troop type that performed the action */
  actor: TroopType;
  /** Row of the acting troop (if applicable) */
  actorRow?: TroopRow;
  /** Troop type that was targeted */
  target: TroopType;
  /** Row that was targeted (if applicable) */
  targetRow?: TroopRow;
  /** Type of action performed */
  actionType: ActionType;
  /** Trigger reason for this action */
  trigger?: SkillTrigger;
  /** Which side performed the action */
  side: BattleRole;
  /** Skill ID if this was a skill action */
  skillId?: string;
  /** Skill name for display */
  skillName?: string;
  /** Name/id of hero or troop source */
  sourceName?: string;
  /** Action multiplier used */
  actionMultiplier?: number;
  /** Matchup multiplier used */
  matchupMultiplier?: number;
  /** Effective stats used for attacker and defender */
  stats?: {
    attacker: EffectiveStatSnapshot;
    defender: EffectiveStatSnapshot;
  };
  /** Targeting decision evidence */
  targeting?: TargetingDecisionLog;
  /** RNG rolls used for this action (chance skills/targeting) */
  rngRolls?: RngRollLog[];
  /** Modifier components after stacking resolution */
  outgoingComponents?: ModifierComponentLog[];
  /** Incoming modifiers after stacking resolution */
  incomingComponents?: ModifierComponentLog[];
  /** Damage computation details */
  components: ActionComputationLog;
  /** Remaining troops after this action */
  remaining: TroopCounts;
  /** Count of attacking troops */
  attackerCount: number;
  /** Count of defending troops */
  defenderCount: number;
  /** Kills assignment by troop type (post rounding) */
  appliedKills?: Partial<TroopCounts>;
  /** Timestamp of this action (for replay) */
  timestamp?: number;
}

/**
 * Log entry for buff application or expiration.
 */
export interface BuffLogEntry {
  /** Turn number */
  turn: number;
  /** Source of the buff (skill name, etc.) */
  source: string;
  /** Stacking key if applicable */
  stackingKey?: string;
  /** Which troops this buff applies to */
  appliedTo: BonusTarget;
  /** Turn this buff expires (undefined for permanent) */
  expiresOnTurn?: number;
  /** Type of buff for categorization */
  buffType?: "stat" | "damage" | "other";
  /** Magnitude of the buff for display */
  magnitude?: number;
}

/**
 * Complete log of a single turn.
 */
export interface TurnLog {
  /** Turn number (1-indexed) */
  turn: number;
  /** Troop counts at start of turn */
  startAttackerTroops?: TroopCounts;
  /** Troop counts at start of turn */
  startDefenderTroops?: TroopCounts;
  /** Active modifiers at start of turn */
  startModifiers?: {
    attacker: ModifierComponentLog[];
    defender: ModifierComponentLog[];
  };
  /** Effective stats snapshot at start of turn */
  startEffectiveStats?: {
    attacker: Record<TroopType, EffectiveStatSnapshot>;
    defender: Record<TroopType, EffectiveStatSnapshot>;
  };
  /** Buffs applied at start of this turn */
  buffsApplied: BuffLogEntry[];
  /** Buffs that expired this turn */
  buffsExpired: BuffLogEntry[];
  /** All actions that occurred this turn */
  actions: ActionLogEntry[];
  /** Attacker troop counts at end of turn */
  attackerTroops: TroopCounts;
  /** Defender troop counts at end of turn */
  defenderTroops: TroopCounts;
  /** RNG rolls used at turn-scope */
  turnRng?: RngRollLog[];
  /** Stacking resolution evidence for this turn */
  stacking?: {
    attacker: ModifierComponentLog[];
    defender: ModifierComponentLog[];
  };
  /** Skills that activated this turn */
  skillsActivated?: Array<{
    side: BattleRole;
    name: string;
    heroId?: string;
    isActive?: boolean; // passive carried into this turn
    succeeded?: boolean; // chance result
    roll?: number;
    threshold?: number;
  }>;
  /** What those skills applied (stat buffs / damage mods) */
  skillImpacts?: Array<{
    side: BattleRole;
    name: string;
    heroId?: string;
    stats?: string[];
    specialStats?: string[];
    damageModifier?: boolean;
    trigger?: SkillTrigger;
    roll?: number;
    threshold?: number;
    succeeded?: boolean;
  }>;
  /** Per-skill roll evidence (hit/miss) */
  skillRolls?: Array<{
    side: BattleRole;
    name: string;
    heroId?: string;
    trigger?: SkillTrigger;
    roll?: number;
    threshold?: number;
    succeeded: boolean;
    sourceType?: 'hero' | 'troop';
  }>;
}

// ============================================================================
// BATTLE REPORT - Final Results
// ============================================================================

/**
 * Complete report of a battle simulation.
 * Contains all information needed to replay or analyze the battle.
 */
export interface BattleReport {
  /** Configuration used for this battle */
  config: BattleConfig;
  /** Snapshot of config and derived toggles for display */
  configSnapshot?: BattleConfig;
  /** Targeting configuration used */
  targetingConfig?: TargetingConfig;
  /** Attacker composition */
  attacker: SideComposition;
  /** Defender composition */
  defender: SideComposition;
  /** Log of each turn */
  turns: TurnLog[];
  /** Winner of the battle */
  winner: BattleWinner;
  /** Attacker troops remaining at end */
  attackerRemaining: TroopCounts;
  /** Defender troops remaining at end */
  defenderRemaining: TroopCounts;
  /** Total casualties per side */
  casualties?: {
    attacker: TroopCounts;
    defender: TroopCounts;
  };
  /** Summary by action and troop type */
  summary?: {
    actionsByType?: Record<ActionType, number>;
    damageByTroopType?: Record<TroopType, number>;
    damageByActionType?: Record<ActionType, number>;
    damageBySkill?: Record<string, number>;
  };
  /** Number of simulations run (Monte Carlo) */
  simulationsRun?: number;
  /** Average kills across simulations */
  meanFinalKills?: DamageComputation;
  /** Total duration of battle in turns */
  totalTurns?: number;
  /** Timestamp when simulation completed */
  timestamp?: number;
}

/**
 * Extended battle report with statistical analysis.
 * Used for Monte Carlo results.
 */
export interface BattleReportWithStats extends BattleReport {
  /** Standard deviation of kills */
  killsStdDev?: number;
  /** Confidence interval for kills */
  killsConfidenceInterval?: [number, number];
  /** Win rate for attacker across simulations */
  attackerWinRate?: number;
  /** Draw rate across simulations */
  drawRate?: number;
  /** Distribution of remaining troops */
  remainingDistribution?: {
    attacker: { min: TroopCounts; max: TroopCounts; mean: TroopCounts };
    defender: { min: TroopCounts; max: TroopCounts; mean: TroopCounts };
  };
}

/**
 * Wrapper for battle simulation result.
 */
export interface BattleOutcome {
  /** The battle report */
  report: BattleReport;
  /** Error message if simulation failed */
  error?: string;
  /** Duration of simulation in milliseconds */
  durationMs?: number;
}

// ============================================================================
// COMBAT STATE - Real-time Battle State
// ============================================================================

/**
 * Complete state of combat at any point in time.
 * Used by the battle engine to track all runtime information.
 */
export interface CombatState {
  /** Current turn number (1-indexed) */
  currentTurn: number;
  /** Current phase within the turn */
  phase: CombatPhase;
  /** Attacker's current state */
  attacker: CombatSideState;
  /** Defender's current state */
  defender: CombatSideState;
  /** Configuration for this battle */
  config: BattleConfig;
  /** Whether the battle has ended */
  isComplete: boolean;
  /** Winner if battle is complete */
  winner?: BattleWinner;
  /** RNG state for reproducibility */
  rngState?: number;
}

/**
 * Phase of combat within a turn.
 */
export type CombatPhase =
  | "TurnStart"
  | "BuffExpiration"
  | "SkillTrigger"
  | "AttackerActions"
  | "DefenderActions"
  | "TurnEnd";

/**
 * State of one side during combat.
 * Tracks all dynamic information for a battle participant.
 */
export interface CombatSideState {
  /** Original composition */
  composition: SideComposition;
  /** Current troop counts */
  troops: TroopCounts;
  /** Current effective stats per troop type */
  effectiveStats: Record<TroopType, TroopStats>;
  /** Active damage modifiers */
  activeModifiers: ActiveModifier[];
  /** Active stat buffs */
  activeBuffs: ActiveStatBuff[];
  /** Skill runtime states */
  skillStates: SkillRuntimeState[];
  /** Total damage dealt this battle */
  totalDamageDealt: number;
  /** Total kills this battle */
  totalKills: number;
  /** Casualties suffered */
  casualties: CasualtyBreakdown;
}

/**
 * Snapshot of combat state for logging/replay.
 */
export interface CombatStateSnapshot {
  /** Turn this snapshot was taken */
  turn: number;
  /** Phase this snapshot was taken */
  phase: CombatPhase;
  /** Attacker troop counts */
  attackerTroops: TroopCounts;
  /** Defender troop counts */
  defenderTroops: TroopCounts;
  /** Active buff count for attacker */
  attackerBuffCount: number;
  /** Active buff count for defender */
  defenderBuffCount: number;
}

// ============================================================================
// TARGETING SYSTEM
// ============================================================================

/**
 * Result of target selection.
 */
export interface TargetSelection {
  /** Selected target troop type, or null if no valid target */
  target: TroopType | null;
  /** Reason for selection (for debugging) */
  reason?: string;
  /** Random roll if chance-based */
  roll?: number;
  /** Probability threshold used */
  probability?: number;
  /** Whether backline dive was used */
  backlineDive?: boolean;
}

/**
 * Targeting configuration options.
 */
export interface TargetingConfig {
  /** Priority order for targeting */
  priority: TroopType[];
  /** Whether to allow backline targeting */
  allowBacklineDive: boolean;
  /** Chance of backline dive (0..1) */
  backlineDiveChance: number;
  /** Troop types that can dive to backline */
  backlineDivers: TroopType[];
}

// ============================================================================
// SKILL TRIGGER RESULTS
// ============================================================================

/**
 * Result of triggering skills.
 */
export interface TriggerResult {
  /** Skill effects that activated */
  effects: SkillEffect[];
  /** Damage modifiers that were created */
  damageModifiers: DamageModifier[];
  /** Skills that were triggered */
  triggeredSkills?: Array<{ name: string; heroId?: string; trigger?: SkillTrigger }>;
  /** Summary of what each triggered skill applied */
  triggeredSkillImpacts?: Array<{
    name: string;
    heroId?: string;
    stats?: string[];
    specialStats?: string[];
    damageModifier?: boolean;
    target?: string;
    trigger?: SkillTrigger;
    sourceType?: 'hero' | 'troop';
  }>;
}

// ============================================================================
// JOINER SYSTEM
// ============================================================================

/**
 * A skill belonging to a joiner hero.
 */
export interface JoinerSkill {
  /** Skill identifier */
  id: string;
  /** Skill level */
  level: number;
  /** Hero that owns this skill */
  heroId: string;
}

/**
 * A joiner participant in a rally.
 */
export interface Joiner {
  /** Joiner identifier */
  id: string;
  /** Primary skill contributed by this joiner */
  primarySkill: JoinerSkill | null;
  /** Hero name for display */
  heroName?: string;
  /** Hero class */
  heroClass?: TroopType;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Random number generator function type.
 * Returns a number between 0 and 1.
 */
export type Rng = () => number;

/**
 * Deep partial type - makes all nested properties optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type for simulation parameters passed to the battle engine.
 */
export interface SimulateParams {
  /** Attacker composition */
  attacker: SideComposition;
  /** Defender composition */
  defender: SideComposition;
  /** Optional partial config overrides */
  config?: Partial<BattleConfig>;
}

/**
 * Calibration sample for fitting constants.
 */
export interface CalibrationSample {
  /** Input parameters */
  input: DamageInput;
  /** Observed actual kills */
  observedKills: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/** Default battle configuration */
export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  maxTurns: 30,
  randomMode: "monteCarlo",
  troopCountExponentAlpha: 0.5,
  calibrationConstantK: 1.0,
  allowLancerBacklineDive: false,
  lancerBacklineDiveChance: 0.15,
  stackingBehavior: "strict",
  battleType: "Rally",
  rngSeed: 1,
  simulations: 200
};

/** Default zero stats */
export const ZERO_STATS: Readonly<TroopStats> = Object.freeze({
  attack: 0,
  defense: 0,
  health: 0,
  lethality: 0
});

/** Default zero troop counts */
export const ZERO_TROOPS: Readonly<TroopCounts> = Object.freeze({
  Infantry: 0,
  Lancer: 0,
  Marksman: 0
});

/** Default targeting configuration */
export const DEFAULT_TARGETING_CONFIG: Readonly<TargetingConfig> = Object.freeze({
  priority: ["Infantry", "Lancer", "Marksman"] as TroopType[],
  allowBacklineDive: false,
  backlineDiveChance: 0.15,
  backlineDivers: ["Lancer"] as TroopType[]
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid TroopType.
 */
export function isTroopType(value: unknown): value is TroopType {
  return value === "Infantry" || value === "Lancer" || value === "Marksman";
}

/**
 * Type guard to check if a value is a valid BattleRole.
 */
export function isBattleRole(value: unknown): value is BattleRole {
  return value === "attacker" || value === "defender";
}

/**
 * Type guard to check if a value is a valid BattleWinner.
 */
export function isBattleWinner(value: unknown): value is BattleWinner {
  return value === "attacker" || value === "defender" || value === "draw";
}

/**
 * Type guard to check if a value is a valid BonusTarget.
 */
export function isBonusTarget(value: unknown): value is BonusTarget {
  return isTroopType(value) || value === "All";
}
