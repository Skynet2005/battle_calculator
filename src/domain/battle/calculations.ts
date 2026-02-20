/**
 * Core Battle Calculation Engine (Updated per Guide v2)
 *
 * Key principles:
 * 1) Final Stats (ATK/DEF/LETH/HP) are separate from Combat Modifiers (Damage Up, Damage Taken Down)
 * 2) City bonuses are multiplicative stat buffs, not additive
 * 3) Enemy stat reductions apply to enemy's stat pipeline, not yours
 * 4) Rounding is display-only; internal math keeps full precision
 * 5) Damage formula is an empirical approximation (HP does not belong in damage numerator/denominator)
 * 6) Damage modifiers apply at the damage step, not inside Final Stats calculation
 *
 * Stat Pipeline:
 * Step A: X_base% = X_basic% + X_additive%
 * Step B: X_final% = ( X_base% × (1 + BuffSum%/100) + FlatBuff% - FlatDebuff% ) / (1 + DebuffSum%/100)
 */

import { memoizedCalculateFinalStats as _memoizedCalculateFinalStats } from './calculations-cache';

export type TroopType = 'infantry' | 'lancer' | 'marksman';

/** Single source of truth for stat-pipeline troop types (lowercase). Use for calculations and rally. */
export const STAT_TROOP_TYPES: readonly TroopType[] = ['infantry', 'lancer', 'marksman'] as const;

export type TroopScope = TroopType | 'all_troops' | 'rally_troops';
export type StatType = 'attack' | 'defense' | 'lethality' | 'health';

const STAT_KEYS: StatType[] = ['attack', 'defense', 'lethality', 'health'];

function addBasicContrib(
  result: Record<StatType, number>,
  values: Partial<Record<StatType, number>>,
  caps?: Partial<Record<StatType, number>>
): void {
  for (const stat of STAT_KEYS) {
    const v = values[stat] ?? 0;
    result[stat] += caps?.[stat] !== undefined ? Math.min(v, caps[stat]) : v;
  }
}

export interface BasicBonuses {
  combatTech: {
    troopTypeBonus: Record<TroopType, Record<StatType, number>>;
    totalTroopBonus: Record<StatType, number>;
  };
  allianceTech: Record<StatType, number>;
  experts: Record<StatType, number>;
  daybreakIsland: {
    infantry: { attack: number; defense: number };
    lancer: { attack: number; defense: number };
    marksman: { attack: number; defense: number };
    troops: { attack: number; defense: number; lethality: number; health: number };
    deploymentCapacity?: number;
    rallyCapacity?: number;
  };
  pets: Record<StatType, number>;
  stackedSkins: Record<StatType, number>;
  hero: { attack: number; defense: number; lethality: number; health: number };
  chiefGear: { attack: number; defense: number };
  charms: {
    infantry: { lethality: number; health: number };
    lancer: { lethality: number; health: number };
    marksman: { lethality: number; health: number };
  };
  heroGear: {
    infantry: { lethality: number; health: number; attack: number; defense: number };
    lancer: { lethality: number; health: number; attack: number; defense: number };
    marksman: { lethality: number; health: number; attack: number; defense: number };
  };
  allianceFacilities: { attack: number; defense: number };
  petRefinement: {
    infantry: { lethality: number; health: number };
    lancer: { lethality: number; health: number };
    marksman: { lethality: number; health: number };
    troops: { attack: number; defense: number };
  };
  warAcademy: Record<TroopType, Record<StatType, number>>;
  specialHeroes: { jeronimo: boolean; natalia: boolean };
  vipPrestige: Record<StatType, number>;
  globe: Record<StatType, number>;
}

export type AdditiveManualOverride = Partial<Record<TroopType, Partial<Record<StatType, number>>>>;

export interface AdditiveBonuses {
  temporaryEvents: Record<StatType, number>;
  supremePresident: Record<StatType, number>;
  specialBuffs: Record<StatType, number>;
  joinerBuffs?: Partial<Record<TroopType, Partial<Record<StatType, number>>>>;
  manualOverrideTotals?: AdditiveManualOverride;
}

export type MultiplicativeManualOverride = Partial<Record<TroopType, Partial<Record<StatType, number>>>>;

export interface MultiplicativeBonuses {
  castleBuffs: Record<StatType, number>;
  eventBuffs: Record<StatType, number>;
  petSkills: Record<StatType, number>;
  combatBuffs: Record<StatType, number>;

  /**
   * IMPORTANT: These are debuffs you APPLY to the enemy.
   * They should affect the enemy's final stats, not yours.
   */
  combatDebuffs: Record<StatType, number>;

  exclusiveWeapon: Record<StatType, number>;
  allianceTerritory: Record<StatType, number>;
  tyrantSpire: Record<StatType, number>;

  cityBonuses: {
    attack: number; // multiplicative buff to your ATK stat
    defense: number;
    lethality: number;
    health: number;

    /**
     * These are reductions you APPLY to the enemy.
     * So they become "incoming debuffs" when calculating the enemy's stats.
     */
    enemyAttackReduction: number; // debuff to enemy attack stat
    enemyDefenseReduction: number; // debuff to enemy defense stat

    deploymentCapacity: number;
  };

  /**
   * Joiner multipliers:
   * - attack/defense/lethality/health are STAT multipliers
   * - damage and damageReduction are DAMAGE modifiers (NOT stats)
   */
  joinerBuffs?: Partial<
    Record<
      TroopType,
      Partial<{
        attack: number;
        defense: number;
        lethality: number;
        health: number;
        damage: number; // damage up (outgoing)
        damageReduction: number; // damage taken down (incoming)
      }>
    >
  >;

  /**
   * Flat buff bonuses (Σyᵢ) - rare flat bonuses added after percentage multiplication
   * Used in exact game formula: X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)
   */
  flatBuffBonuses?: Record<StatType, number>;

  /**
   * Flat debuff values (Σzⱼ) - rare flat debuffs subtracted after percentage division
   * Used in exact game formula: X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)
   */
  flatDebuffValues?: Record<StatType, number>;

  manualOverrideTotals?: MultiplicativeManualOverride;
}

export interface FinalStats {
  attack: number;   // still % bonus value, e.g. 320.15
  defense: number;
  lethality: number;
  health: number;
}

/** Base stat line shared across domain modules */
export interface TroopStatLine {
  attack: number;
  defense: number;
  health: number;
  lethality: number;
}

export interface CombatSideBonuses {
  basic: BasicBonuses;
  additive: AdditiveBonuses;
  multipliers: MultiplicativeBonuses;
}

/**
 * Round ONLY for UI/reporting. Keep engine full precision.
 *
 * Internal calculations maintain full precision for accurate simulation/Monte Carlo.
 * Battle reports may show ~1 decimal, but game computes with higher precision internally.
 * Expect small variance (±0.1%) when comparing rounded reports to full-precision math.
 */
export function roundFinalStats(stats: FinalStats, decimals = 2): FinalStats {
  const f = Math.pow(10, decimals);
  return {
    attack: Math.round(stats.attack * f) / f,
    defense: Math.round(stats.defense * f) / f,
    lethality: Math.round(stats.lethality * f) / f,
    health: Math.round(stats.health * f) / f,
  };
}

/**
 * Calculate Basic Bonus (permanent additives)
 * Table-driven: uniform sources use addBasicContrib; special cases applied after.
 */
export function calculateBasicBonus(
  bonuses: BasicBonuses,
  troopType: TroopType
): Record<StatType, number> {
  const result: Record<StatType, number> = { attack: 0, defense: 0, lethality: 0, health: 0 };

  addBasicContrib(result, bonuses.combatTech.troopTypeBonus[troopType] ?? {});
  addBasicContrib(result, bonuses.combatTech.totalTroopBonus);
  addBasicContrib(
    result,
    {
      attack: bonuses.allianceTech.attack ?? 0,
      defense: bonuses.allianceTech.defense ?? 0,
      lethality: bonuses.allianceTech.lethality ?? 0,
      health: bonuses.allianceTech.health ?? 0,
    },
    { attack: 10, defense: 10, lethality: 10, health: 10 }
  );
  addBasicContrib(result, bonuses.experts);

  if (bonuses.daybreakIsland && troopType in bonuses.daybreakIsland) {
    const island = bonuses.daybreakIsland[troopType as keyof typeof bonuses.daybreakIsland] as { attack?: number; defense?: number } | undefined;
    addBasicContrib(result, { attack: island?.attack ?? 0, defense: island?.defense ?? 0 });
  }
  if (bonuses.daybreakIsland?.troops) {
    addBasicContrib(result, bonuses.daybreakIsland.troops);
  }

  addBasicContrib(result, bonuses.pets);
  addBasicContrib(result, bonuses.stackedSkins);
  addBasicContrib(result, bonuses.hero);
  addBasicContrib(result, bonuses.chiefGear);

  if (bonuses.charms && troopType in bonuses.charms) {
    const troopCharms = bonuses.charms[troopType as keyof typeof bonuses.charms] as { lethality?: number; health?: number } | undefined;
    addBasicContrib(result, { lethality: troopCharms?.lethality ?? 0, health: troopCharms?.health ?? 0 });
  }
  if (bonuses.heroGear && troopType in bonuses.heroGear) {
    addBasicContrib(result, bonuses.heroGear[troopType as keyof typeof bonuses.heroGear]);
  }

  addBasicContrib(
    result,
    { attack: bonuses.allianceFacilities.attack ?? 0, defense: bonuses.allianceFacilities.defense ?? 0 },
    { attack: 13, defense: 13 }
  );

  if (bonuses.petRefinement && troopType in bonuses.petRefinement) {
    const refinement = bonuses.petRefinement[troopType as keyof typeof bonuses.petRefinement] as { lethality?: number; health?: number } | undefined;
    addBasicContrib(result, { lethality: refinement?.lethality ?? 0, health: refinement?.health ?? 0 });
  }
  if (bonuses.petRefinement?.troops) {
    addBasicContrib(result, bonuses.petRefinement.troops);
  }

  if (bonuses.warAcademy?.[troopType]) {
    addBasicContrib(result, bonuses.warAcademy[troopType]);
  }

  if (bonuses.specialHeroes.jeronimo) {
    addBasicContrib(result, { lethality: 15, health: 15 });
  }
  if (bonuses.specialHeroes.natalia) {
    addBasicContrib(result, { attack: 10, defense: 10 });
  }

  addBasicContrib(result, bonuses.vipPrestige);
  addBasicContrib(result, bonuses.globe);

  return result;
}

/**
 * Calculate Additive Bonuses (flat % layers)
 */
export function calculateAdditiveBonus(
  bonuses: AdditiveBonuses,
  troopType?: TroopType
): Record<StatType, number> {
  const manualOverride = troopType ? bonuses.manualOverrideTotals?.[troopType] : undefined;
  const manualOverrideActive =
    manualOverride &&
    Object.values(manualOverride).some(
      (v) => v !== undefined && v !== null && !Number.isNaN(Number(v))
    );

  if (manualOverrideActive) {
    return {
      attack: Number(manualOverride?.attack ?? 0),
      defense: Number(manualOverride?.defense ?? 0),
      lethality: Number(manualOverride?.lethality ?? 0),
      health: Number(manualOverride?.health ?? 0),
    };
  }

  const joinerBuff = troopType ? bonuses.joinerBuffs?.[troopType] : undefined;

  return {
    attack:
      (bonuses.temporaryEvents.attack || 0) +
      (bonuses.supremePresident.attack || 0) +
      (bonuses.specialBuffs.attack || 0) +
      (joinerBuff?.attack ?? 0),
    defense:
      (bonuses.temporaryEvents.defense || 0) +
      (bonuses.supremePresident.defense || 0) +
      (bonuses.specialBuffs.defense || 0) +
      (joinerBuff?.defense ?? 0),
    lethality:
      (bonuses.temporaryEvents.lethality || 0) +
      (bonuses.supremePresident.lethality || 0) +
      (bonuses.specialBuffs.lethality || 0) +
      (joinerBuff?.lethality ?? 0),
    health:
      (bonuses.temporaryEvents.health || 0) +
      (bonuses.supremePresident.health || 0) +
      (bonuses.specialBuffs.health || 0) +
      (joinerBuff?.health ?? 0),
  };
}

/**
 * Get STAT buff percent sum for this side (BuffSum%).
 *
 * These are multiplicative stat buffs that affect Final Stats:
 * - Castle/Event stat buffs
 * - Pet skills that say "Troops Attack +X%" (stat buffs)
 * - Exclusive weapon stat buffs
 * - Tyrant Spire stat buffs
 * - Alliance territory stat buffs
 * - City stat bonuses (10% or 20%) - these are multiplicative stat buffs, not additive
 * - Joiner stat buffs (attack/defense/lethality/health only)
 *
 * NOTE: Excludes damage/damageReduction on purpose - those are combat modifiers, not stat multipliers.
 */
function getStatBuffPercentSum(
  self: MultiplicativeBonuses,
  statType: StatType,
  troopType?: TroopType
): number {
  const joiner = troopType ? self.joinerBuffs?.[troopType] : undefined;

  return (
    (self.castleBuffs[statType] || 0) +
    (self.eventBuffs[statType] || 0) +
    (self.petSkills[statType] || 0) +
    (self.combatBuffs[statType] || 0) +
    (self.exclusiveWeapon[statType] || 0) +
    (self.allianceTerritory[statType] || 0) +
    (self.tyrantSpire[statType] || 0) +
    // City bonuses are multiplicative stat buffs (not additive)
    (self.cityBonuses?.[statType] || 0) +
    // Joiner stat buffs (attack/def/leth/health only - excludes damage/damageReduction)
    (joiner?.[statType] ?? 0)
  );
}

/**
 * Get flat buff bonuses (Σyᵢ) - rare flat bonuses added after percentage multiplication.
 */
function getFlatBuffBonuses(
  self: MultiplicativeBonuses,
  statType: StatType
): number {
  return self.flatBuffBonuses?.[statType] || 0;
}

/**
 * Get incoming STAT debuff percent sum applied to this side (DebuffSum%).
 *
 * These are enemy-targeted stat reductions that affect YOUR final stats:
 * - Enemy's combatDebuffs (e.g., "Enemy Attack -10%")
 * - Enemy's city bonuses enemyAttackReduction / enemyDefenseReduction
 *
 * These are NOT combat modifiers (Damage Up/Down) - those apply at the damage step.
 * Enemy stat reductions belong in the enemy's stat pipeline when calculating their stats.
 */
function getIncomingStatDebuffPercentSum(
  enemy: MultiplicativeBonuses | undefined,
  statType: StatType
): number {
  if (!enemy) return 0;

  const combatDebuff = enemy.combatDebuffs?.[statType] || 0;

  // City enemy reductions map onto the affected stat type
  // These are enemy-targeted stat reductions, not damage modifiers
  const cityDebuff =
    statType === 'attack'
      ? enemy.cityBonuses?.enemyAttackReduction || 0
      : statType === 'defense'
        ? enemy.cityBonuses?.enemyDefenseReduction || 0
        : 0;

  return combatDebuff + cityDebuff;
}

/**
 * Get flat debuff values (Σzⱼ) - rare flat debuffs subtracted after percentage division.
 * This comes from the ENEMY's flat debuff values.
 */
function getFlatDebuffValues(
  enemy: MultiplicativeBonuses | undefined,
  statType: StatType
): number {
  if (!enemy) return 0;
  return enemy.flatDebuffValues?.[statType] || 0;
}

/**
 * Apply stat multipliers using the exact game formula:
 * X_final% = ( X_base% × (1 + BuffSum%/100) + FlatBuff% - FlatDebuff% ) / (1 + DebuffSum%/100)
 *
 * Where:
 * - X_base% = baseStatPercent (Basic + Additive)
 * - BuffSum% = sum of all multiplicative stat buff percentages
 * - FlatBuff% = flat buff bonuses (rare)
 * - FlatDebuff% = flat debuff values (rare)
 * - DebuffSum% = sum of all debuff percentages (incoming from enemy)
 *
 * This formula ensures debuffs divide the total instead of subtracting,
 * preventing buffs/debuffs from canceling evenly.
 *
 * If flat terms are not modeled, simplified version:
 * X_final% = X_base% × (1 + BuffSum%/100) / (1 + DebuffSum%/100)
 */
export function calculateFinalStatValue(
  baseStatPercent: number,
  selfMultipliers: MultiplicativeBonuses,
  statType: StatType,
  troopType: TroopType,
  enemyMultipliers?: MultiplicativeBonuses
): number {
  // Manual override means: "treat my total buff% as this value"
  const manualBuffOverride = selfMultipliers.manualOverrideTotals?.[troopType]?.[statType];
  const buffPct =
    manualBuffOverride !== undefined && manualBuffOverride !== null && !Number.isNaN(Number(manualBuffOverride))
      ? Number(manualBuffOverride)
      : getStatBuffPercentSum(selfMultipliers, statType, troopType);

  const debuffPct = getIncomingStatDebuffPercentSum(enemyMultipliers, statType);
  const flatBuffBonuses = getFlatBuffBonuses(selfMultipliers, statType);
  const flatDebuffValues = getFlatDebuffValues(enemyMultipliers, statType);

  // Exact game formula: X_final% = ( X_base% × (1 + BuffSum%/100) + FlatBuff% - FlatDebuff% ) / (1 + DebuffSum%/100)
  // Step 1: Multiply base by (1 + buff percentage)
  const multipliedBase = baseStatPercent * (1 + buffPct / 100);
  // Step 2: Add flat buff bonuses and subtract flat debuff values
  const numerator = multipliedBase + flatBuffBonuses - flatDebuffValues;
  // Step 3: Divide by (1 + debuff percentage)
  const debuffDivisor = 1 + debuffPct / 100;
  const result = numerator / debuffDivisor;

  return result;
}

/**
 * Calculate Final Stats for a troop type (correct pipeline)
 *
 * Step A: Pooled Base Stat %
 *   X_base% = X_basic% + X_additive%
 *
 * Step B: Apply multiplicative stat buffs and debuffs
 *   X_final% = ( X_base% × (1 + BuffSum%/100) + FlatBuff% - FlatDebuff% ) / (1 + DebuffSum%/100)
 *
 * IMPORTANT: enemy debuffs are not optional if you want faithful comparisons.
 * Combat modifiers (Damage Up, Damage Taken Down) are NOT applied here - they affect damage step.
 *
 * NOTE: This function is memoized via calculateFinalStatsMemoized wrapper for performance.
 */
export function calculateFinalStats(
  basicBonuses: BasicBonuses,
  additiveBonuses: AdditiveBonuses,
  selfMultipliers: MultiplicativeBonuses,
  troopType: TroopType,
  enemyMultipliers?: MultiplicativeBonuses
): FinalStats {
  const basic = calculateBasicBonus(basicBonuses, troopType);
  const additive = calculateAdditiveBonus(additiveBonuses, troopType);

  const base: Record<StatType, number> = {
    attack: basic.attack + additive.attack,
    defense: basic.defense + additive.defense,
    lethality: basic.lethality + additive.lethality,
    health: basic.health + additive.health,
  };

  return {
    attack: calculateFinalStatValue(base.attack, selfMultipliers, 'attack', troopType, enemyMultipliers),
    defense: calculateFinalStatValue(base.defense, selfMultipliers, 'defense', troopType, enemyMultipliers),
    lethality: calculateFinalStatValue(base.lethality, selfMultipliers, 'lethality', troopType, enemyMultipliers),
    health: calculateFinalStatValue(base.health, selfMultipliers, 'health', troopType, enemyMultipliers),
  };
}

/**
 * Memoized wrapper for calculateFinalStats
 * Use this for better performance when the same inputs are calculated multiple times.
 */
export function calculateFinalStatsMemoized(
  basicBonuses: BasicBonuses,
  additiveBonuses: AdditiveBonuses,
  selfMultipliers: MultiplicativeBonuses,
  troopType: TroopType,
  enemyMultipliers?: MultiplicativeBonuses
): FinalStats {
  return _memoizedCalculateFinalStats(
    calculateFinalStats,
    basicBonuses,
    additiveBonuses,
    selfMultipliers,
    troopType,
    enemyMultipliers
  );
}

/**
 * Convenience: compute final stats for both sides with proper cross-application of debuffs.
 * Uses memoized version for better performance.
 */
export function calculateFinalStatsForSide(
  side: CombatSideBonuses,
  troopType: TroopType,
  enemy?: CombatSideBonuses
): FinalStats {
  return calculateFinalStatsMemoized(side.basic, side.additive, side.multipliers, troopType, enemy?.multipliers);
}

/**
 * Damage modifiers are NOT stats.
 * We apply them at the damage layer, not inside calculateFinalStats.
 */
export interface DamageLayerModifiers {
  attackerDamageUpPct: number;          // e.g. +5% damage
  defenderDamageReductionPct: number;   // e.g. +10% damage taken down
}

/**
 * Pull troop-scoped damage layer modifiers from joiners.
 * (If you later add other damage sources, aggregate them here too.)
 */
export function getDamageLayerModifiers(
  attackerMultipliers: MultiplicativeBonuses,
  defenderMultipliers: MultiplicativeBonuses,
  troopType: TroopType
): DamageLayerModifiers {
  const atkJoiner = attackerMultipliers.joinerBuffs?.[troopType];
  const defJoiner = defenderMultipliers.joinerBuffs?.[troopType];

  return {
    attackerDamageUpPct: Number(atkJoiner?.damage ?? 0),
    defenderDamageReductionPct: Number(defJoiner?.damageReduction ?? 0),
  };
}

/**
 * Calculate damage (empirical approximation model).
 *
 * IMPORTANT: This is an empirical model based on testing, not a canonical formula.
 * HP does NOT belong in the damage numerator/denominator directly.
 * HP influences survivability across rounds, not raw hit damage.
 *
 * Base Damage (stat-only approximation):
 *   BaseDamage ≈ K × √(Troop Count) × (Attack × Lethality) / EnemyDefense
 *
 * Where:
 * - K = hidden factor (depends on troop tier, Fire Crystal level, troop type)
 * - Attack/Lethality/Defense are final stat % values converted to multipliers: (1 + stat/100)
 *
 * Combat Modifiers (applied after base damage):
 *   FinalDamage = BaseDamage
 *     × (1 + DamageUp%/100)
 *     × (1 + SkillDamage%/100)          (only when a skill hits)
 *     × (1 + NormalAttackDamage%/100)   (only on normal attacks)
 *     ÷ (1 + TargetDamageTakenDown%/100)
 */
export function calculateDamage(
  troopCount: number,
  attackPercent: number,
  lethalityPercent: number,
  enemyDefensePercent: number,
  hiddenFactor = 1,
  mods: Partial<DamageLayerModifiers> = {}
): number {
  const sqrtTroops = Math.sqrt(Math.max(0, troopCount));

  const atkMult = 1 + attackPercent / 100;
  const lethMult = 1 + lethalityPercent / 100;
  const defMult = 1 + enemyDefensePercent / 100;

  // Base modeled damage (stat-only approximation)
  // Note: HP is NOT included here - it affects survivability, not raw damage per hit
  let dmg = hiddenFactor * sqrtTroops * (atkMult * lethMult) / defMult;

  // Combat modifiers layer (separate from stats)
  // These are NOT stat multipliers - they apply at the damage step
  const damageUp = mods.attackerDamageUpPct ?? 0;
  const dmgRed = mods.defenderDamageReductionPct ?? 0;

  dmg *= 1 + damageUp / 100;
  if (dmgRed > 0) dmg /= 1 + dmgRed / 100;

  return Math.max(0, dmg);
}

/**
 * Calculate mixed troop damage using proper stat pipeline + damage-layer modifiers.
 */
export function calculateMixedTroopDamage(
  attacker: CombatSideBonuses,
  defender: CombatSideBonuses,
  infantryCount: number,
  lancerCount: number,
  marksmanCount: number,
  hiddenFactors: { infantry: number; lancer: number; marksman: number } = { infantry: 1, lancer: 1, marksman: 1 }
): number {
  const infAtkStats = calculateFinalStatsForSide(attacker, 'infantry', defender);
  const lncAtkStats = calculateFinalStatsForSide(attacker, 'lancer', defender);
  const mksAtkStats = calculateFinalStatsForSide(attacker, 'marksman', defender);

  const infDefStats = calculateFinalStatsForSide(defender, 'infantry', attacker);
  const lncDefStats = calculateFinalStatsForSide(defender, 'lancer', attacker);
  const mksDefStats = calculateFinalStatsForSide(defender, 'marksman', attacker);

  const infMods = getDamageLayerModifiers(attacker.multipliers, defender.multipliers, 'infantry');
  const lncMods = getDamageLayerModifiers(attacker.multipliers, defender.multipliers, 'lancer');
  const mksMods = getDamageLayerModifiers(attacker.multipliers, defender.multipliers, 'marksman');

  const infDamage = calculateDamage(
    infantryCount,
    infAtkStats.attack,
    infAtkStats.lethality,
    infDefStats.defense,
    hiddenFactors.infantry,
    infMods
  );

  const lncDamage = calculateDamage(
    lancerCount,
    lncAtkStats.attack,
    lncAtkStats.lethality,
    lncDefStats.defense,
    hiddenFactors.lancer,
    lncMods
  );

  const mksDamage = calculateDamage(
    marksmanCount,
    mksAtkStats.attack,
    mksAtkStats.lethality,
    mksDefStats.defense,
    hiddenFactors.marksman,
    mksMods
  );

  return infDamage + lncDamage + mksDamage;
}

/**
 * Power Index (kept as a heuristic).
 * Uses % stats -> multipliers.
 */
export function calculatePowerIndex(stats: FinalStats, troopCount: number): number {
  const attackMultiplier = 1 + stats.attack / 100;
  const lethalityMultiplier = 1 + stats.lethality / 100;
  const defenseMultiplier = 1 + stats.defense / 100;
  const healthMultiplier = 1 + stats.health / 100;
  const troopMultiplier = Math.pow(troopCount, 1.5);

  return attackMultiplier * lethalityMultiplier * defenseMultiplier * healthMultiplier * troopMultiplier;
}

/**
 * Balance Ratio (heuristic).
 */
export function calculateBalanceRatio(
  attackerStats: FinalStats,
  attackerTroops: number,
  defenderStats: FinalStats,
  defenderTroops: number
): number {
  const attackerPower =
    attackerStats.health * attackerStats.attack * attackerStats.lethality * attackerStats.defense;

  const defenderPower =
    defenderStats.health * defenderStats.attack * defenderStats.lethality * defenderStats.defense;

  const troopRatio = Math.pow(defenderTroops / attackerTroops, 1.5);

  return (attackerPower / defenderPower) / troopRatio;
}
