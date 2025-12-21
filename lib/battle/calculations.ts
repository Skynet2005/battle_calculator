/**
 * Core Battle Calculation Engine
 * Implements all formulas from the game mechanics documentation
 */

export type TroopType = 'infantry' | 'lancer' | 'marksman';
export type TroopScope = TroopType | 'all_troops' | 'rally_troops';
export type StatType = 'attack' | 'defense' | 'lethality' | 'health';

export interface BasicBonuses {
  // Combat Tech (Research)
  combatTech: {
    troopTypeBonus: Record<TroopType, Record<StatType, number>>;
    totalTroopBonus: Record<StatType, number>;
  };
  // Alliance Tech (max +10% to ATK, DEF, LETH, HP)
  allianceTech: Record<StatType, number>;
  // Experts (scales with level)
  experts: Record<StatType, number>;
  // Daybreak Island decorations - Troop-type specific bonuses plus global bonuses
  daybreakIsland: {
    infantry: {
      attack: number;
      defense: number;
    };
    lancer: {
      attack: number;
      defense: number;
    };
    marksman: {
      attack: number;
      defense: number;
    };
    troops: {
      attack: number;
      defense: number;
      lethality: number;
      health: number;
    };
    deploymentCapacity?: number;
    rallyCapacity?: number;
  };
  // Pets (levels/breakthroughs = ATK/DEF; refinements = LETH/HP)
  pets: Record<StatType, number>;
  // Stacked Skins (Castle, Avatar, Relocation, Chat)
  stackedSkins: Record<StatType, number>;
  // Hero (Leader) - Rally lead only
  hero: {
    attack: number;
    defense: number;
    lethality: number;
    health: number;
  };
  // Chief Gear (6 pieces + set bonus) - ATK/DEF only
  chiefGear: {
    attack: number;
    defense: number;
  };
  // Charms - LETH/HP only, organized by gear piece and troop type
  // 3 charms per piece: Cap/Watch = Lancer, Coat/Pants = Infantry, Ring/Weapon = Marksman
  charms: {
    infantry: {
      lethality: number;
      health: number;
    };
    lancer: {
      lethality: number;
      health: number;
    };
    marksman: {
      lethality: number;
      health: number;
    };
  };
  // Hero Gear - Troop-type specific bonuses (Goggles/Boot = LETH, Glove/Belt = HP, plus empowerment bonuses)
  heroGear: {
    infantry: {
      lethality: number;
      health: number;
      attack: number; // Empowerment bonuses
      defense: number; // Empowerment bonuses
    };
    lancer: {
      lethality: number;
      health: number;
      attack: number;
      defense: number;
    };
    marksman: {
      lethality: number;
      health: number;
      attack: number;
      defense: number;
    };
  };
  // Alliance Facilities (up to +13% ATK/DEF when bordering and protected)
  allianceFacilities: {
    attack: number;
    defense: number;
  };
  // Pet Refinement - Troop-type specific bonuses from pet refinement
  petRefinement: {
    infantry: {
      lethality: number;
      health: number;
    };
    lancer: {
      lethality: number;
      health: number;
    };
    marksman: {
      lethality: number;
      health: number;
    };
    troops: {
      attack: number;
      defense: number;
    };
  };
  // War Academy bonuses
  warAcademy: Record<TroopType, Record<StatType, number>>;
  // Special Heroes
  specialHeroes: {
    jeronimo: boolean; // +15% LETH & HP
    natalia: boolean; // +10% ATK & DEF (always active)
  };
  // VIP Prestige (all stats active only when enabled)
  vipPrestige: Record<StatType, number>;
  // Globe (VIP Skin) - Permanent small global bonus
  globe: Record<StatType, number>;
}

export type AdditiveManualOverride = Partial<Record<TroopType, Partial<Record<StatType, number>>>>;

export interface AdditiveBonuses {
  // Temporary events, Supreme President skills, special buffs
  temporaryEvents: Record<StatType, number>;
  supremePresident: Record<StatType, number>;
  specialBuffs: Record<StatType, number>;
  // Optional per-troop joiner bonuses (already combined from rally/all_troops + troop-specific)
  joinerBuffs?: Partial<Record<TroopType, Partial<Record<StatType, number>>>>;
  // Optional manual override of the total additive bonuses per troop type
  manualOverrideTotals?: AdditiveManualOverride;
}

export type MultiplicativeManualOverride = Partial<Record<TroopType, Partial<Record<StatType, number>>>>;

export interface MultiplicativeBonuses {
  // Castle or Event Buffs
  castleBuffs: Record<StatType, number>;
  eventBuffs: Record<StatType, number>;
  // Active Pet Skills
  petSkills: Record<StatType, number>;
  // Combat Buffs/Debuffs (10-20%)
  combatBuffs: Record<StatType, number>;
  combatDebuffs: Record<StatType, number>;
  // Exclusive Weapon Effects
  exclusiveWeapon: Record<StatType, number>;
  // Alliance Territory bonuses
  allianceTerritory: Record<StatType, number>;
  // Tyrant Spire Skills
  tyrantSpire: Record<StatType, number>;
  // City Bonuses (10% or 20% multiplicative)
  cityBonuses: {
    attack: number; // 0, 10, or 20
    defense: number; // 0, 10, or 20
    lethality: number; // 0, 10, or 20
    health: number; // 0, 10, or 20
    enemyAttackReduction: number; // 0, 10, or 20 (debuff)
    enemyDefenseReduction: number; // 0, 10, or 20 (debuff)
    deploymentCapacity: number; // 0, 10, or 20
  };
  // Optional per-troop joiner multiplicative bonuses (already combined from rally/all_troops + troop-specific)
  joinerBuffs?: Partial<
    Record<
      TroopType,
      Partial<{
        attack: number;
        defense: number;
        lethality: number;
        health: number;
        damage: number;
        damageReduction: number;
      }>
    >
  >;
  // Optional manual override of total multiplicative % per troop type/stat
  manualOverrideTotals?: MultiplicativeManualOverride;
}

export interface FinalStats {
  attack: number;
  defense: number;
  lethality: number;
  health: number;
}

/**
 * Calculate Basic Bonus (permanent additives)
 */
export function calculateBasicBonus(
  bonuses: BasicBonuses,
  troopType: TroopType
): Record<StatType, number> {
  const result: Record<StatType, number> = {
    attack: 0,
    defense: 0,
    lethality: 0,
    health: 0,
  };

  // Combat Tech - Troop-Type Bonus
  result.attack += bonuses.combatTech.troopTypeBonus[troopType]?.attack || 0;
  result.defense += bonuses.combatTech.troopTypeBonus[troopType]?.defense || 0;
  result.lethality += bonuses.combatTech.troopTypeBonus[troopType]?.lethality || 0;
  result.health += bonuses.combatTech.troopTypeBonus[troopType]?.health || 0;

  // Combat Tech - Total Troop Bonus
  result.attack += bonuses.combatTech.totalTroopBonus.attack || 0;
  result.defense += bonuses.combatTech.totalTroopBonus.defense || 0;
  result.lethality += bonuses.combatTech.totalTroopBonus.lethality || 0;
  result.health += bonuses.combatTech.totalTroopBonus.health || 0;

  // Alliance Tech (max +10%)
  result.attack += Math.min(bonuses.allianceTech.attack || 0, 10);
  result.defense += Math.min(bonuses.allianceTech.defense || 0, 10);
  result.lethality += Math.min(bonuses.allianceTech.lethality || 0, 10);
  result.health += Math.min(bonuses.allianceTech.health || 0, 10);

  // Experts
  result.attack += bonuses.experts.attack || 0;
  result.defense += bonuses.experts.defense || 0;
  result.lethality += bonuses.experts.lethality || 0;
  result.health += bonuses.experts.health || 0;

  // Daybreak Island (troop-type specific ATK/DEF, plus global bonuses)
  if (bonuses.daybreakIsland && troopType in bonuses.daybreakIsland) {
    const island = bonuses.daybreakIsland[troopType as keyof typeof bonuses.daybreakIsland];
    if (island && typeof island === 'object' && 'attack' in island) {
      result.attack += (island as any).attack || 0;
      result.defense += (island as any).defense || 0;
    }
  }
  // Daybreak Island - Global Troops bonuses (applies to all troop types)
  if (bonuses.daybreakIsland?.troops) {
    result.attack += bonuses.daybreakIsland.troops.attack || 0;
    result.defense += bonuses.daybreakIsland.troops.defense || 0;
    result.lethality += bonuses.daybreakIsland.troops.lethality || 0;
    result.health += bonuses.daybreakIsland.troops.health || 0;
  }

  // Pets
  result.attack += bonuses.pets.attack || 0;
  result.defense += bonuses.pets.defense || 0;
  result.lethality += bonuses.pets.lethality || 0;
  result.health += bonuses.pets.health || 0;

  // Stacked Skins
  result.attack += bonuses.stackedSkins.attack || 0;
  result.defense += bonuses.stackedSkins.defense || 0;
  result.lethality += bonuses.stackedSkins.lethality || 0;
  result.health += bonuses.stackedSkins.health || 0;

  // Hero (Leader) - Rally lead only
  result.attack += bonuses.hero.attack || 0;
  result.defense += bonuses.hero.defense || 0;
  result.lethality += bonuses.hero.lethality || 0;
  result.health += bonuses.hero.health || 0;

  // Chief Gear (ATK/DEF only)
  result.attack += bonuses.chiefGear.attack || 0;
  result.defense += bonuses.chiefGear.defense || 0;

  // Charms (LETH/HP only, troop-type specific)
  // Handle both old format (flat) and new format (troop-type specific)
  if (bonuses.charms && typeof bonuses.charms === 'object') {
    if ('lethality' in bonuses.charms && 'health' in bonuses.charms) {
      // Old format - apply to all troop types
      result.lethality += (bonuses.charms as any).lethality || 0;
      result.health += (bonuses.charms as any).health || 0;
    } else if (troopType in bonuses.charms) {
      // New format - troop-type specific
      const troopCharms = bonuses.charms[troopType as keyof typeof bonuses.charms];
      if (troopCharms && typeof troopCharms === 'object') {
        result.lethality += (troopCharms as any).lethality || 0;
        result.health += (troopCharms as any).health || 0;
      }
    }
  }

  // Hero Gear (LETH/HP from gear, ATK/DEF from empowerment bonuses)
  if (bonuses.heroGear && troopType in bonuses.heroGear) {
    const gear = bonuses.heroGear[troopType as keyof typeof bonuses.heroGear];
    if (gear) {
      result.lethality += gear.lethality || 0;
      result.health += gear.health || 0;
      result.attack += gear.attack || 0;
      result.defense += gear.defense || 0;
    }
  }

  // Alliance Facilities (ATK/DEF only, up to +13%)
  result.attack += Math.min(bonuses.allianceFacilities.attack || 0, 13);
  result.defense += Math.min(bonuses.allianceFacilities.defense || 0, 13);

  // Pet Refinement (troop-type specific LETH/HP, plus global ATK/DEF)
  if (bonuses.petRefinement && troopType in bonuses.petRefinement) {
    const refinement = bonuses.petRefinement[troopType as keyof typeof bonuses.petRefinement];
    if (refinement && typeof refinement === 'object' && 'lethality' in refinement) {
      result.lethality += (refinement as any).lethality || 0;
      result.health += (refinement as any).health || 0;
    }
  }
  // Pet Refinement - Troops Attack/Defense (applies to all troop types)
  if (bonuses.petRefinement?.troops) {
    result.attack += bonuses.petRefinement.troops.attack || 0;
    result.defense += bonuses.petRefinement.troops.defense || 0;
  }

  // War Academy
  if (bonuses.warAcademy && bonuses.warAcademy[troopType]) {
    result.attack += bonuses.warAcademy[troopType].attack || 0;
    result.defense += bonuses.warAcademy[troopType].defense || 0;
    result.lethality += bonuses.warAcademy[troopType].lethality || 0;
    result.health += bonuses.warAcademy[troopType].health || 0;
  }

  // Special Heroes
  if (bonuses.specialHeroes.jeronimo) {
    result.lethality += 15;
    result.health += 15;
  }
  if (bonuses.specialHeroes.natalia) {
    result.attack += 10;
    result.defense += 10;
  }

  // VIP Prestige
  result.attack += bonuses.vipPrestige.attack || 0;
  result.defense += bonuses.vipPrestige.defense || 0;
  result.lethality += bonuses.vipPrestige.lethality || 0;
  result.health += bonuses.vipPrestige.health || 0;

  // Globe (VIP Skin)
  result.attack += bonuses.globe.attack || 0;
  result.defense += bonuses.globe.defense || 0;
  result.lethality += bonuses.globe.lethality || 0;
  result.health += bonuses.globe.health || 0;

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
    Object.values(manualOverride).some((value) => value !== undefined && value !== null && !Number.isNaN(Number(value)));

  if (manualOverrideActive) {
    return {
      attack: Number(manualOverride?.attack ?? 0),
      defense: Number(manualOverride?.defense ?? 0),
      lethality: Number(manualOverride?.lethality ?? 0),
      health: Number(manualOverride?.health ?? 0),
    };
  }

  const joinerBuff = troopType ? bonuses.joinerBuffs?.[troopType] : undefined;
  const joinerAttack = joinerBuff?.attack ?? 0;
  const joinerDefense = joinerBuff?.defense ?? 0;
  const joinerLethality = joinerBuff?.lethality ?? 0;
  const joinerHealth = joinerBuff?.health ?? 0;

  return {
    attack: (bonuses.temporaryEvents.attack || 0) +
      (bonuses.supremePresident.attack || 0) +
      (bonuses.specialBuffs.attack || 0) +
      joinerAttack,
    defense: (bonuses.temporaryEvents.defense || 0) +
      (bonuses.supremePresident.defense || 0) +
      (bonuses.specialBuffs.defense || 0) +
      joinerDefense,
    lethality: (bonuses.temporaryEvents.lethality || 0) +
      (bonuses.supremePresident.lethality || 0) +
      (bonuses.specialBuffs.lethality || 0) +
      joinerLethality,
    health: (bonuses.temporaryEvents.health || 0) +
      (bonuses.supremePresident.health || 0) +
      (bonuses.specialBuffs.health || 0) +
      joinerHealth,
  };
}

/**
 * Calculate Multiplicative Bonuses using the actual game formula
 *
 * Formula: X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)
 *
 * Where:
 * - X = Base stat after Basic + Additive
 * - Σyᵢ% = % buffs
 * - Σyᵢ = Flat bonuses (rare)
 * - Σzⱼ% = % debuffs
 * - Σzⱼ = Flat debuffs (rare)
 */
export function calculateMultiplicativeBonus(
  baseStat: number,
  bonuses: MultiplicativeBonuses,
  statType: StatType,
  troopType?: TroopType
): number {
  const manualOverride = troopType ? bonuses.manualOverrideTotals?.[troopType]?.[statType] : undefined;
  if (manualOverride !== undefined && manualOverride !== null && !Number.isNaN(Number(manualOverride))) {
    return baseStat * (1 + Number(manualOverride) / 100);
  }

  const joinerBuff = troopType ? bonuses.joinerBuffs?.[troopType] : undefined;
  const joinerOffense =
    (statType === 'attack' ? (joinerBuff?.attack ?? 0) + (joinerBuff?.damage ?? 0) : 0) +
    (statType === 'lethality' ? (joinerBuff?.lethality ?? 0) : 0);
  const joinerDefense =
    (statType === 'defense' ? (joinerBuff?.defense ?? 0) + (joinerBuff?.damageReduction ?? 0) : 0) +
    (statType === 'health' ? (joinerBuff?.health ?? 0) : 0);

  // Sum all buff percentages
  const buffPercentSum =
    (bonuses.castleBuffs[statType] || 0) +
    (bonuses.eventBuffs[statType] || 0) +
    (bonuses.petSkills[statType] || 0) +
    (bonuses.combatBuffs[statType] || 0) +
    (bonuses.exclusiveWeapon[statType] || 0) +
    (bonuses.allianceTerritory[statType] || 0) +
    (bonuses.tyrantSpire[statType] || 0) +
    joinerOffense +
    joinerDefense;

  // Sum all debuff percentages
  // Note: combatDebuffs represent enemy-focused debuffs (applied to the opponent).
  // They should not reduce the acting side's own stats here; they are handled against the enemy during combat.
  const debuffPercentSum = 0;

  // City bonus enemy reductions are handled differently:
  // - Enemy Attack Reduction: Reduces enemy's attack (affects their damage to us)
  //   This is effectively a defensive buff for us, but it's applied as a debuff to enemy stats
  //   For our calculation, we don't apply it here - it would be applied when calculating enemy stats
  // - Enemy Defense Reduction: Reduces enemy's defense (makes our attacks more effective)
  //   This is effectively an offensive buff for us, but it's applied as a debuff to enemy stats
  //   For our calculation, we don't apply it here - it would be applied when calculating enemy stats
  // Note: These are stored but not used in our stat calculation - they affect enemy stats instead

  // Apply the formula
  // X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)
  // For simplicity, assuming flat bonuses (Σyᵢ, Σzⱼ) are 0 unless specified
  let result = baseStat * (1 + buffPercentSum / 100);

  // Apply debuffs (debuffs divide the total instead of subtracting)
  if (debuffPercentSum > 0) {
    result = result / (1 + debuffPercentSum / 100);
  }

  return result;
}

/**
 * Calculate Final Stats for a troop type
 *
 * Formula: Final Stat % = [(Basic Bonus + Additive Bonuses)] × Multiplicative Bonuses
 */
export function calculateFinalStats(
  basicBonuses: BasicBonuses,
  additiveBonuses: AdditiveBonuses,
  multiplicativeBonuses: MultiplicativeBonuses,
  troopType: TroopType
): FinalStats {
  // Step 1: Calculate Basic Bonus
  const basic = calculateBasicBonus(basicBonuses, troopType);

  // Step 2: Calculate Additive Bonus
  const additive = calculateAdditiveBonus(additiveBonuses, troopType);

  // Step 3: Combine Basic + Additive
  const baseStats: Record<StatType, number> = {
    attack: basic.attack + additive.attack,
    defense: basic.defense + additive.defense,
    lethality: basic.lethality + additive.lethality,
    health: basic.health + additive.health,
  };

  const cityBonuses = multiplicativeBonuses.cityBonuses;
  if (cityBonuses) {
    baseStats.attack += cityBonuses.attack || 0;
    baseStats.defense += cityBonuses.defense || 0;
    baseStats.lethality += cityBonuses.lethality || 0;
    baseStats.health += cityBonuses.health || 0;
  }

  // Step 4: Apply Multiplicative Bonuses
  const final: FinalStats = {
    attack: calculateMultiplicativeBonus(baseStats.attack, multiplicativeBonuses, 'attack', troopType),
    defense: calculateMultiplicativeBonus(baseStats.defense, multiplicativeBonuses, 'defense', troopType),
    lethality: calculateMultiplicativeBonus(baseStats.lethality, multiplicativeBonuses, 'lethality', troopType),
    health: calculateMultiplicativeBonus(baseStats.health, multiplicativeBonuses, 'health', troopType),
  };

  // Round to 2 decimal places (game uses 2 decimals internally)
  return {
    attack: Math.round(final.attack * 100) / 100,
    defense: Math.round(final.defense * 100) / 100,
    lethality: Math.round(final.lethality * 100) / 100,
    health: Math.round(final.health * 100) / 100,
  };
}

/**
 * Calculate damage for a troop type
 *
 * Formula: Damage ≈ Hidden Factor × √(Troop Count) × Attack × Lethality ÷ Enemy Defense
 */
export function calculateDamage(
  troopCount: number,
  attack: number,
  lethality: number,
  enemyDefense: number,
  hiddenFactor: number = 1 // Default, can be adjusted based on tier/FC level
): number {
  // Apply square root scaling for troop count
  const sqrtTroops = Math.sqrt(troopCount);

  // Calculate damage
  const damage = hiddenFactor * sqrtTroops * attack * lethality / enemyDefense;

  return Math.max(0, damage); // Ensure non-negative
}

/**
 * Calculate Power Index (win predictor)
 *
 * Formula: (1+ATK%) × (1+LETH%) × (1+DEF%) × (1+HP%) × (Troop Count)^1.5
 */
export function calculatePowerIndex(
  stats: FinalStats,
  troopCount: number
): number {
  const attackMultiplier = 1 + stats.attack / 100;
  const lethalityMultiplier = 1 + stats.lethality / 100;
  const defenseMultiplier = 1 + stats.defense / 100;
  const healthMultiplier = 1 + stats.health / 100;
  const troopMultiplier = Math.pow(troopCount, 1.5);

  return attackMultiplier * lethalityMultiplier * defenseMultiplier * healthMultiplier * troopMultiplier;
}

/**
 * Calculate Balance Equation for attacker vs defender
 *
 * Formula: (Attacker_HP × Attacker_ATK × Attacker_LETH × Attacker_DEF) /
 *          (Defender_HP × Defender_ATK × Defender_LETH × Defender_DEF) =
 *          (Defender_Troops / Attacker_Troops)^1.5
 *
 * Returns:
 * - > 1 = Attacker wins
 * - < 1 = Defender holds
 */
export function calculateBalanceRatio(
  attackerStats: FinalStats,
  attackerTroops: number,
  defenderStats: FinalStats,
  defenderTroops: number
): number {
  const attackerPower =
    attackerStats.health *
    attackerStats.attack *
    attackerStats.lethality *
    attackerStats.defense;

  const defenderPower =
    defenderStats.health *
    defenderStats.attack *
    defenderStats.lethality *
    defenderStats.defense;

  const troopRatio = Math.pow(defenderTroops / attackerTroops, 1.5);

  return (attackerPower / defenderPower) / troopRatio;
}

/**
 * Calculate mixed troop damage
 *
 * Total Damage ≈ Damage(Inf) + Damage(Lnc) + Damage(Mks)
 */
export function calculateMixedTroopDamage(
  infantryCount: number,
  infantryStats: FinalStats,
  lancerCount: number,
  lancerStats: FinalStats,
  marksmanCount: number,
  marksmanStats: FinalStats,
  enemyDefense: number,
  hiddenFactors: {
    infantry: number;
    lancer: number;
    marksman: number;
  } = { infantry: 1, lancer: 1, marksman: 1 }
): number {
  const infantryDamage = calculateDamage(
    infantryCount,
    infantryStats.attack,
    infantryStats.lethality,
    enemyDefense,
    hiddenFactors.infantry
  );

  const lancerDamage = calculateDamage(
    lancerCount,
    lancerStats.attack,
    lancerStats.lethality,
    enemyDefense,
    hiddenFactors.lancer
  );

  const marksmanDamage = calculateDamage(
    marksmanCount,
    marksmanStats.attack,
    marksmanStats.lethality,
    enemyDefense,
    hiddenFactors.marksman
  );

  return infantryDamage + lancerDamage + marksmanDamage;
}

