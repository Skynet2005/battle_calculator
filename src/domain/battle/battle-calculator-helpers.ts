import { normalizeRatios } from '@/domain/rally/mix-utils';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import type { CapacityBreakdown, CapacityReport, SpecialBonusSummary } from '@/shared/types';
import type { HeroLevel, RallyConfiguration, TroopMixConfig, UserProfile } from '@/shared/types';
import { totalTroops as countTroops } from '@/domain/rally/combat-fighter';
import type { RallySideConfig, SideBaseStats, TroopCounts } from '../rally/combat-types';
import { calculateRallyBonuses, extractLeaderBonuses } from '../rally/rally-bonus-extractor';
import type {
  AdditiveBonuses,
  AdditiveManualOverride,
  BasicBonuses,
  CombatSideBonuses,
  MultiplicativeBonuses,
  MultiplicativeManualOverride,
  TroopType
} from './calculations';
import { STAT_TROOP_TYPES } from './calculations';
import { calculateFinalStatsForSide } from './calculations';
import { getChiefCharmBonuses } from './data-extractors';
import { getChiefGearTypes } from './data-selectors';
import { getCommandCenterCapacityBonuses } from './data/capacity/command-center-capacity';
import { getChiefGearMarchCapacity } from './data/chief_gear/chief-gear-capacity';
import { getExpertBonuses } from './data/experts/expert-extractor';
import type { ExpertSelections } from './data/experts/expert-types';
import { getHeroSkillCapacity } from './data/heroes/hero-skill-capacity';
import { getMaxCharmLevel, getMaxChiefGearOption, getMaxWarAcademyLevels } from './data/max-levels';
import { getDefaultOpponentCommandCenterLevel } from './data/opponent-defaults';
import { PETS_DATA } from './data/pets/pet_skills';
import { TROOP_DEFINITIONS } from './data/troops/troop_levels';
import { getWarAcademyCapacityBonuses } from './data/war_academy/war-academy-capacity';

/** Re-export for backward compatibility. Prefer STAT_TROOP_TYPES from calculations. */
export const TROOP_TYPE_LIST = STAT_TROOP_TYPES;

export const defaultExpertSelections: ExpertSelections = {
  attack: 0,
  defense: 0,
  lethality: 0,
  health: 0,
  deploymentCapacity: 0,
  rallyCapacity: 0
};

export const EMPTY_FINAL_STATS = TROOP_TYPE_LIST.reduce(
  (acc, troop) => {
    acc[troop] = { attack: 0, defense: 0, lethality: 0, health: 0 };
    return acc;
  },
  {} as Record<TroopType, { attack: number; defense: number; lethality: number; health: number }>
);

export function createEmptyPetSkillSelections(): Record<string, number> {
  const selections: Record<string, number> = {};
  Object.keys(PETS_DATA).forEach((petName) => {
    selections[petName] = 0;
  });
  return selections;
}

export function createEmptyBaseStats(): SideBaseStats {
  return TROOP_TYPE_LIST.reduce((acc, troop) => {
    acc[troop] = { attack: 0, defense: 0, health: 0, lethality: 0 };
    return acc;
  }, {} as SideBaseStats);
}

export function buildSideBaseStats(
  basic: BasicBonuses,
  additive: AdditiveBonuses,
  multiplicative: MultiplicativeBonuses,
  rally: RallyConfiguration | null | undefined,
  heroLevels: Record<string, HeroLevel> | undefined,
  side: 'player' | 'opponent',
  troopLevels?: Partial<Record<TroopType, string | undefined>>,
  enemySide?: CombatSideBonuses
): SideBaseStats {
  const normalizedAdditive = normalizeAdditiveBonuses(additive);
  const normalizedMultiplicative = normalizeMultiplicativeBonuses(multiplicative);
  return TROOP_TYPE_LIST.reduce((acc, troop) => {
    const heroOverride = computeTroopSpecificHeroBonus(rally, heroLevels, side, troop);
    const basicWithHero = heroOverride ? { ...basic, hero: heroOverride } : basic;
    const selfSide: CombatSideBonuses = {
      basic: basicWithHero,
      additive: normalizedAdditive,
      multipliers: normalizedMultiplicative
    };
    const finalStats = calculateFinalStatsForSide(selfSide, troop, enemySide);
    const troopBaseStats = getTroopBaseStats(troopLevels, troop);
    acc[troop] = {
      attack: finalStats.attack + troopBaseStats.attack,
      defense: finalStats.defense + troopBaseStats.defense,
      lethality: finalStats.lethality + troopBaseStats.lethality,
      health: finalStats.health + troopBaseStats.health
    };
    return acc;
  }, {} as SideBaseStats);
}

function getTroopBaseStats(
  troopLevels: Partial<Record<TroopType, string | undefined>> | undefined,
  troop: TroopType
): { attack: number; defense: number; lethality: number; health: number } {
  const fallback = { attack: 0, defense: 0, lethality: 0, health: 0 };
  if (!troopLevels) return fallback;
  const id = troopLevels[troop];
  if (!id) return fallback;
  const definition = TROOP_DEFINITIONS[id];
  if (!definition) return fallback;
  return {
    attack: definition.Attack ?? 0,
    defense: definition.Defense ?? 0,
    lethality: definition.Lethality ?? 0,
    health: definition.Health ?? 0
  };
}

export function computeTroopSpecificHeroBonus(
  rally: RallyConfiguration | null | undefined,
  heroLevels: Record<string, HeroLevel> | undefined,
  side: 'player' | 'opponent',
  troop: TroopType
): BasicBonuses['hero'] | null {
  if (!rally) {
    return null;
  }
  const mode = side === 'player'
    ? rally.specialWidgetBonus?.player ?? 'attacking'
    : rally.specialWidgetBonus?.opponent ?? 'defending';
  const leaders = side === 'player'
    ? rally.playerLeader ?? rally.leader
    : rally.opponentLeader ?? rally.leader;
  const matchingLeader = leaders?.[troop];
  if (!matchingLeader?.heroName) {
    return null;
  }
  const rallyXpLevel = matchingLeader.xpLevel;
  const heroXpLevel = heroLevels?.[matchingLeader.heroName]?.xpLevel;
  const effectiveXpLevel = rallyXpLevel !== undefined ? rallyXpLevel : (heroXpLevel !== undefined ? heroXpLevel : 80);
  const leaderBonuses = extractLeaderBonuses(matchingLeader, mode, effectiveXpLevel);
  return {
    attack: leaderBonuses.basic.attack,
    defense: leaderBonuses.basic.defense,
    lethality: leaderBonuses.basic.lethality,
    health: leaderBonuses.basic.health
  };
}

export function normalizeAdditiveBonuses(bonuses?: AdditiveBonuses): AdditiveBonuses {
  const zero = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const manualOverrideTotals: AdditiveManualOverride | undefined = bonuses?.manualOverrideTotals
    ? TROOP_TYPE_LIST.reduce((acc, troop) => {
      const override = bonuses.manualOverrideTotals?.[troop];
      const hasValue =
        override &&
        (override.attack !== undefined ||
          override.defense !== undefined ||
          override.lethality !== undefined ||
          override.health !== undefined);
      if (!hasValue) {
        return acc;
      }
      acc[troop] = {
        attack: Number(override?.attack ?? 0),
        defense: Number(override?.defense ?? 0),
        lethality: Number(override?.lethality ?? 0),
        health: Number(override?.health ?? 0)
      };
      return acc;
    }, {} as AdditiveManualOverride)
    : undefined;

  const joinerBuffs = TROOP_TYPE_LIST.reduce((acc, troop) => {
    const existing = bonuses?.joinerBuffs?.[troop];
    if (!existing) {
      acc[troop] = { ...zero };
    } else {
      acc[troop] = {
        attack: Number(existing.attack ?? 0),
        defense: Number(existing.defense ?? 0),
        lethality: Number(existing.lethality ?? 0),
        health: Number(existing.health ?? 0)
      };
    }
    return acc;
  }, {} as NonNullable<AdditiveBonuses['joinerBuffs']>);

  return {
    temporaryEvents: { ...zero, ...(bonuses?.temporaryEvents ?? {}) },
    supremePresident: { ...zero, ...(bonuses?.supremePresident ?? {}) },
    specialBuffs: { ...zero, ...(bonuses?.specialBuffs ?? {}) },
    joinerBuffs,
    ...(manualOverrideTotals && Object.keys(manualOverrideTotals).length > 0 ? { manualOverrideTotals } : {})
  };
}

export function normalizeMultiplicativeBonuses(bonuses?: MultiplicativeBonuses): MultiplicativeBonuses {
  const zero = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const defaultCity = {
    attack: 0,
    defense: 0,
    lethality: 0,
    health: 0,
    enemyAttackReduction: 0,
    enemyDefenseReduction: 0,
    deploymentCapacity: 0
  };
  const manualOverrideTotals: MultiplicativeManualOverride | undefined = bonuses?.manualOverrideTotals
    ? TROOP_TYPE_LIST.reduce((acc, troop) => {
      const override = bonuses.manualOverrideTotals?.[troop];
      const hasValue =
        override &&
        (override.attack !== undefined ||
          override.defense !== undefined ||
          override.lethality !== undefined ||
          override.health !== undefined);
      if (!hasValue) {
        return acc;
      }
      acc[troop] = {
        attack: Number(override?.attack ?? 0),
        defense: Number(override?.defense ?? 0),
        lethality: Number(override?.lethality ?? 0),
        health: Number(override?.health ?? 0)
      };
      return acc;
    }, {} as MultiplicativeManualOverride)
    : undefined;

  const joinerBuffs = TROOP_TYPE_LIST.reduce((acc, troop) => {
    const existing = bonuses?.joinerBuffs?.[troop];
    acc[troop] = {
      attack: Number(existing?.attack ?? 0),
      defense: Number(existing?.defense ?? 0),
      lethality: Number(existing?.lethality ?? 0),
      health: Number(existing?.health ?? 0),
      damage: Number(existing?.damage ?? 0),
      damageReduction: Number(existing?.damageReduction ?? 0)
    };
    return acc;
  }, {} as NonNullable<MultiplicativeBonuses['joinerBuffs']>);

  return {
    castleBuffs: { ...zero, ...(bonuses?.castleBuffs ?? {}) },
    eventBuffs: { ...zero, ...(bonuses?.eventBuffs ?? {}) },
    petSkills: { ...zero, ...(bonuses?.petSkills ?? {}) },
    combatBuffs: { ...zero, ...(bonuses?.combatBuffs ?? {}) },
    combatDebuffs: { ...zero, ...(bonuses?.combatDebuffs ?? {}) },
    exclusiveWeapon: { ...zero, ...(bonuses?.exclusiveWeapon ?? {}) },
    allianceTerritory: { ...zero, ...(bonuses?.allianceTerritory ?? {}) },
    tyrantSpire: { ...zero, ...(bonuses?.tyrantSpire ?? {}) },
    cityBonuses: { ...defaultCity, ...(bonuses?.cityBonuses ?? {}) },
    joinerBuffs,
    ...(bonuses?.flatBuffBonuses && Object.keys(bonuses.flatBuffBonuses).length > 0
      ? { flatBuffBonuses: { ...zero, ...bonuses.flatBuffBonuses } }
      : {}),
    ...(bonuses?.flatDebuffValues && Object.keys(bonuses.flatDebuffValues).length > 0
      ? { flatDebuffValues: { ...zero, ...bonuses.flatDebuffValues } }
      : {}),
    ...(manualOverrideTotals && Object.keys(manualOverrideTotals).length > 0 ? { manualOverrideTotals } : {})
  };
}

export function createDefaultAdditiveBonuses(): AdditiveBonuses {
  return normalizeAdditiveBonuses();
}

export function createDefaultMultiplicativeBonuses(): MultiplicativeBonuses {
  return normalizeMultiplicativeBonuses();
}

function buildDefaultChiefGearSelections(): Record<string, { tier: string; stars: number; step?: number }> {
  const defaults: Record<string, { tier: string; stars: number; step?: number }> = {};
  for (const gearType of getChiefGearTypes()) {
    const maxOption = getMaxChiefGearOption(gearType);
    if (maxOption) {
      defaults[gearType] = {
        tier: maxOption.tier,
        stars: maxOption.stars,
        step: maxOption.step
      };
    }
  }
  return defaults;
}

function resolveChiefGearSelections(
  gearSelections: Record<string, { tier: string; stars: number; step?: number }> | undefined,
  basicChiefGear?: { attack: number; defense: number }
): Record<string, { tier: string; stars: number; step?: number }> | undefined {
  const hasProvidedSelections = gearSelections && Object.keys(gearSelections).length > 0;
  if (hasProvidedSelections) return gearSelections;

  const hasChiefGearBonuses = (basicChiefGear?.attack || 0) > 0 || (basicChiefGear?.defense || 0) > 0;
  if (hasChiefGearBonuses) {
    return buildDefaultChiefGearSelections();
  }

  return undefined;
}

export function buildPlayerCapacityReport(profile: UserProfile): CapacityReport {
  const warAcademySelections = profile.warAcademySelections || getMaxWarAcademyLevels();
  const warAcademyCapacity = getWarAcademyCapacityBonuses(warAcademySelections);
  const commandCenterCapacity = getCommandCenterCapacityBonuses(profile.commandCenterLevel);
  const expertDeploymentCapacity = profile.expertSelections?.deploymentCapacity || 0;
  const expertRallyCapacity = profile.expertSelections?.rallyCapacity || 0;
  const chiefGearMarchCapacity = getChiefGearMarchCapacity(
    resolveChiefGearSelections(profile.chiefGearSelections, profile.basicBonuses.chiefGear)
  );
  const daybreakDeploymentCapacity = profile.basicBonuses.daybreakIsland?.deploymentCapacity || 0;
  const daybreakRallyCapacity = profile.basicBonuses.daybreakIsland?.rallyCapacity || 0;
  const heroSkillCapacity = getHeroSkillCapacity(profile.heroLevels);
  const researchDeploymentCapacity = 32200;
  const manualDeploymentOverride = profile.baseCapacity?.march || 0;
  const manualRallyOverride = profile.baseCapacity?.rally || 0;
  const marchPetBonus = profile.capacity?.march || 0;
  const rallyPetBonus = profile.capacity?.rally || 0;
  const cityPercent = profile.multiplicativeBonuses.cityBonuses?.deploymentCapacity || 0;

  const deployment = computeCapacityBreakdown({
    baseComponents: [
      { label: 'Command Center', value: commandCenterCapacity.deploymentCapacity },
      { label: 'War Academy', value: warAcademyCapacity.deploymentCapacity },
      { label: 'Expert', value: expertDeploymentCapacity },
      { label: 'Chief Gear', value: chiefGearMarchCapacity },
      { label: 'Daybreak', value: daybreakDeploymentCapacity },
      { label: 'Research', value: researchDeploymentCapacity },
      { label: 'Hero Skill', value: heroSkillCapacity.deploymentCapacity }
    ],
    manualOverride: manualDeploymentOverride,
    petBonus: marchPetBonus,
    percentValue: cityPercent,
    percentLabel: cityPercent > 0 ? `${cityPercent}% Bonus` : undefined
  });

  const rally = computeCapacityBreakdown({
    baseComponents: [
      { label: 'Command Center', value: commandCenterCapacity.rallyCapacity },
      { label: 'War Academy', value: warAcademyCapacity.rallyCapacity },
      { label: 'Expert', value: expertRallyCapacity },
      { label: 'Daybreak', value: daybreakRallyCapacity }
    ],
    manualOverride: manualRallyOverride,
    petBonus: rallyPetBonus,
    percentValue: cityPercent,
    percentLabel: cityPercent > 0 ? `${cityPercent}% Bonus` : undefined
  });

  return { deployment, rally };
}

export function buildOpponentCapacityReport(profile: UserProfile): CapacityReport | null {
  if (!profile.opponent) {
    return null;
  }
  const opponent = profile.opponent;
  const warAcademyCapacity = getWarAcademyCapacityBonuses(getMaxWarAcademyLevels());
  const commandCenterCapacity = getCommandCenterCapacityBonuses(opponent.commandCenterLevel || getDefaultOpponentCommandCenterLevel());
  const expertDeploymentCapacity = opponent.expertSelections?.deploymentCapacity || 0;
  const expertRallyCapacity = opponent.expertSelections?.rallyCapacity || 0;
  const chiefGearMarchCapacity = getChiefGearMarchCapacity(
    resolveChiefGearSelections(opponent.chiefGearSelections, opponent.basicBonuses.chiefGear)
  );
  const daybreakDeploymentCapacity = opponent.basicBonuses.daybreakIsland?.deploymentCapacity || 0;
  const daybreakRallyCapacity = opponent.basicBonuses.daybreakIsland?.rallyCapacity || 0;
  const heroSkillCapacity = getHeroSkillCapacity(opponent.heroLevels);
  const researchDeploymentCapacity = 32200;
  const manualDeploymentOverride = opponent.baseCapacity?.march || 0;
  const manualRallyOverride = opponent.baseCapacity?.rally || 0;
  const marchPetBonus = opponent.capacity?.march || profile.capacity?.march || 0;
  const rallyPetBonus = opponent.capacity?.rally || profile.capacity?.rally || 0;
  const cityPercent = opponent.multiplicativeBonuses?.cityBonuses?.deploymentCapacity || 0;

  const deployment = computeCapacityBreakdown({
    baseComponents: [
      { label: 'Command Center', value: commandCenterCapacity.deploymentCapacity },
      { label: 'War Academy', value: warAcademyCapacity.deploymentCapacity },
      { label: 'Expert', value: expertDeploymentCapacity },
      { label: 'Chief Gear', value: chiefGearMarchCapacity },
      { label: 'Daybreak', value: daybreakDeploymentCapacity },
      { label: 'Research', value: researchDeploymentCapacity },
      { label: 'Hero Skill', value: heroSkillCapacity.deploymentCapacity }
    ],
    manualOverride: manualDeploymentOverride,
    petBonus: marchPetBonus,
    percentValue: cityPercent,
    percentLabel: cityPercent > 0 ? `${cityPercent}% Bonus` : undefined
  });

  const rally = computeCapacityBreakdown({
    baseComponents: [
      { label: 'Command Center', value: commandCenterCapacity.rallyCapacity },
      { label: 'War Academy', value: warAcademyCapacity.rallyCapacity },
      { label: 'Expert', value: expertRallyCapacity },
      { label: 'Daybreak', value: daybreakRallyCapacity }
    ],
    manualOverride: manualRallyOverride,
    petBonus: rallyPetBonus,
    percentValue: cityPercent,
    percentLabel: cityPercent > 0 ? `${cityPercent}% Bonus` : undefined
  });

  return { deployment, rally };
}

export function computeCapacityBreakdown({
  baseComponents,
  manualOverride,
  petBonus,
  percentValue,
  percentLabel
}: {
  baseComponents: Array<{ label: string; value: number }>;
  manualOverride: number;
  petBonus: number;
  percentValue: number;
  percentLabel?: string;
}): CapacityBreakdown {
  const filteredBase = baseComponents.filter((entry) => entry.value > 0);
  const baseSum = filteredBase.reduce((sum, entry) => sum + entry.value, 0);

  if (manualOverride > 0) {
    return {
      total: manualOverride,
      base: manualOverride,
      temporary: 0,
      manualOverride: true,
      breakdown: [{ label: 'Manual Override', value: manualOverride }],
      temporaryBreakdown: []
    };
  }

  const percentAmount = percentValue > 0 ? Math.ceil((baseSum + petBonus) * (percentValue / 100)) : 0;
  const temporary = petBonus + percentAmount;
  const total = baseSum + temporary;

  const temporaryBreakdown: Array<{ label: string; value: number }> = [];
  if (petBonus > 0) {
    temporaryBreakdown.push({ label: 'Pet Bonus', value: petBonus });
  }
  if (percentAmount > 0) {
    temporaryBreakdown.push({ label: percentLabel ?? `${percentValue}% Bonus`, value: percentAmount });
  }

  return {
    total,
    base: baseSum,
    temporary,
    manualOverride: false,
    breakdown: filteredBase,
    temporaryBreakdown
  };
}

export function ensureTroopCounts(
  side: RallySideConfig,
  fallbackCounts?: TroopCounts
): RallySideConfig {
  const currentTotal = countTroops(side.troopCounts);
  if (currentTotal > 0 || !fallbackCounts || countTroops(fallbackCounts) === 0) {
    return side;
  }
  return {
    ...side,
    troopCounts: fallbackCounts,
    totalTroops: countTroops(fallbackCounts)
  };
}

export function sumCapacityCounts(
  capacity: UserProfile['rally']['capacity']
): TroopCounts {
  return {
    infantry: capacity.infantry.reduce((sum: number, config: { count: number }) => sum + Math.max(0, config.count || 0), 0),
    lancer: capacity.lancer.reduce((sum: number, config: { count: number }) => sum + Math.max(0, config.count || 0), 0),
    marksman: capacity.marksman.reduce((sum: number, config: { count: number }) => sum + Math.max(0, config.count || 0), 0)
  };
}

export function computePetDebuffTotals(
  petSkillSelections?: Record<string, number>
): Record<'attack' | 'defense' | 'lethality' | 'health', number> {
  const totals = { attack: 0, defense: 0, lethality: 0, health: 0 };
  if (!petSkillSelections) return totals;

  Object.entries(petSkillSelections).forEach(([petName, level]) => {
    if (!level) return;
    const pet = PETS_DATA[petName];
    if (!pet) return;
    const levelValue = pet.levels[level.toString()];
    if (levelValue === undefined) return;
    const stat = pet.stat.toLowerCase();
    const isDebuff = stat.includes('reduction');

    if (stat.includes('attack') && isDebuff) {
      totals.attack += levelValue;
    } else if (stat.includes('defense') && isDebuff) {
      totals.defense += levelValue;
    } else if (stat.includes('health') && isDebuff) {
      totals.health += levelValue;
    } else if (stat.includes('lethality') && isDebuff) {
      totals.lethality += levelValue;
    }
  });

  return totals;
}

export function buildSpecialBonusSummary(
  additive: AdditiveBonuses,
  multiplicative: MultiplicativeBonuses,
  role: 'attacker' | 'defender',
  joinerMultiplicative?: ReturnType<typeof calculateRallyBonuses>['multiplicative'],
  combatDebuffsOverride?: MultiplicativeBonuses['combatDebuffs'],
  joinerNames: string[] = [],
  petDebuffTotals?: Partial<Record<'attack' | 'defense' | 'lethality' | 'health', number>>
): SpecialBonusSummary {
  const zero = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const additiveSpecial = additive?.specialBuffs ?? zero;
  const pet = multiplicative.petSkills || zero;
  const combatBuffs = multiplicative.combatBuffs || zero;
  type JoinerMultipliers = Partial<{
    damage: number;
    attack: number;
    defense: number;
    health: number;
    lethality: number;
    damageReduction: number;
  }>;
  const joinerMul: JoinerMultipliers = (joinerMultiplicative as JoinerMultipliers) || {};
  const city = multiplicative.cityBonuses ?? {
    attack: 0,
    defense: 0,
    lethality: 0,
    health: 0,
    enemyAttackReduction: 0,
    enemyDefenseReduction: 0,
    deploymentCapacity: 0
  };

  const troopsAttackBase = (pet.attack || 0) + (city.attack || 0) + (combatBuffs.attack || 0);
  const troopsDefenseBase = (pet.defense || 0) + (city.defense || 0) + (combatBuffs.defense || 0);
  const troopsLethalityBase = (pet.lethality || 0) + (city.lethality || 0) + (combatBuffs.lethality || 0);
  const troopsHealthBase = (pet.health || 0) + (city.health || 0) + (combatBuffs.health || 0);

  const petDebuffs = {
    attack: petDebuffTotals?.attack || 0,
    defense: petDebuffTotals?.defense || 0,
    lethality: petDebuffTotals?.lethality || 0,
    health: petDebuffTotals?.health || 0
  };

  const combatDebuffs = combatDebuffsOverride || multiplicative.combatDebuffs || zero;
  const manualCombatDebuffs = {
    attack: (combatDebuffs.attack || 0) - petDebuffs.attack,
    defense: (combatDebuffs.defense || 0) - petDebuffs.defense,
    lethality: (combatDebuffs.lethality || 0) - petDebuffs.lethality,
    health: (combatDebuffs.health || 0) - petDebuffs.health
  };

  const enemyAttackReduction = (city.enemyAttackReduction || 0) + (combatDebuffs.attack || 0);
  const enemyDefenseReduction = (city.enemyDefenseReduction || 0) + (combatDebuffs.defense || 0);

  const specialAttack = additiveSpecial.attack || 0;
  const specialHealth = additiveSpecial.health || 0;
  const specialLethality = additiveSpecial.lethality || 0;

  const troopsAttack = troopsAttackBase + (role === 'attacker' ? specialAttack : role === 'defender' ? specialAttack : 0);
  const troopsLethality = troopsLethalityBase + (role === 'attacker' ? specialLethality : 0);
  const troopsHealth = troopsHealthBase + (role === 'defender' ? specialHealth : 0);
  const troopsDefense = troopsDefenseBase;

  return {
    troopsAttack,
    troopsDefense,
    troopsLethality,
    troopsHealth,
    enemyAttackReduction,
    enemyDefenseReduction,
    defenderAttack: role === 'defender' ? specialAttack : 0,
    defenderHealth: role === 'defender' ? specialHealth : 0,
    rallyAttack: role === 'attacker' ? specialAttack : 0,
    rallyLethality: role === 'attacker' ? specialLethality : 0,
    breakdown: {
      pet: {
        attack: pet.attack || 0,
        defense: pet.defense || 0,
        lethality: pet.lethality || 0,
        health: pet.health || 0
      },
      city: {
        attack: city.attack || 0,
        defense: city.defense || 0,
        lethality: city.lethality || 0,
        health: city.health || 0
      },
      combat: {
        attack: combatBuffs.attack || 0,
        defense: combatBuffs.defense || 0,
        lethality: combatBuffs.lethality || 0,
        health: combatBuffs.health || 0
      },
      special: {
        attack: role === 'attacker' ? specialAttack : role === 'defender' ? specialAttack : 0,
        defense: 0,
        lethality: role === 'attacker' ? specialLethality : 0,
        health: role === 'defender' ? specialHealth : 0
      },
      joiner: {
        attack: (joinerMul.attack || 0) + (joinerMul.damage || 0),
        defense: joinerMul.defense || 0,
        lethality: joinerMul.lethality || 0,
        health: joinerMul.health || 0,
        damageReduction: joinerMul.damageReduction || 0,
        names: joinerNames
      },
      enemyAttack: {
        city: city.enemyAttackReduction || 0,
        combat: combatDebuffs.attack || 0,
        joiner: joinerMul.damageReduction || 0,
        pet: petDebuffs.attack,
        manual: manualCombatDebuffs.attack
      },
      enemyDefense: {
        city: city.enemyDefenseReduction || 0,
        combat: combatDebuffs.defense || 0,
        joiner: 0,
        pet: petDebuffs.defense,
        manual: manualCombatDebuffs.defense
      }
    }
  };
}

export function normalizeTroopMix(mix: TroopMixConfig): TroopMixConfig {
  const base = mix ?? DEFAULT_TROOP_MIX;
  // Use normalizeRatios from mix-utils for consistent normalization
  return normalizeRatios(base, DEFAULT_TROOP_MIX);
}

export function hasTroops(counts?: TroopCounts | null): counts is TroopCounts {
  return !!counts && countTroops(counts) > 0;
}

export function sanitizeMix(mix: TroopMixConfig): TroopMixConfig {
  return {
    totalTroops: Math.max(0, mix.totalTroops ?? 0),
    infantryRatio: Math.max(0, mix.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio),
    lancerRatio: Math.max(0, mix.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio),
    marksmanRatio: Math.max(0, mix.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio)
  };
}

export function computeAdditiveBreakdownForTroop(
  currentProfile: UserProfile,
  troopType: TroopType
) {
  const expertBonuses = getExpertBonuses(currentProfile.expertSelections || defaultExpertSelections);
  const maxCharmLevel = getMaxCharmLevel();
  const charmBonuses = getChiefCharmBonuses(currentProfile.charmLevels || {
    Cap: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Watch: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Coat: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Pants: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Ring: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Weapon: [maxCharmLevel, maxCharmLevel, maxCharmLevel]
  });

  const playerMode = currentProfile.rally.specialWidgetBonus?.player || 'attacking';
  const currentLeader = currentProfile.rally.playerLeader || currentProfile.rally.leader;
  const troopLeader = currentLeader?.[troopType];

  let heroBonusesForTroopType = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const matchingLeader = troopLeader;
  if (matchingLeader) {
    const rallyXpLevel = matchingLeader.xpLevel;
    const heroXpLevel = currentProfile.heroLevels?.[matchingLeader.heroName]?.xpLevel;
    const effectiveXpLevel = rallyXpLevel !== undefined ? rallyXpLevel : (heroXpLevel !== undefined ? heroXpLevel : 80);
    const leaderBonuses = extractLeaderBonuses(matchingLeader, playerMode, effectiveXpLevel);
    heroBonusesForTroopType = {
      attack: leaderBonuses.basic.attack,
      defense: leaderBonuses.basic.defense,
      lethality: leaderBonuses.basic.lethality,
      health: leaderBonuses.basic.health
    };
  }

  return {
    expertBonuses,
    charmBonuses,
    heroBonusesForTroopType
  };
}


