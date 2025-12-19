/**
 * Bonus Aggregator System
 *
 * Provides a unified interface for aggregating bonuses from all game sources:
 * - Combat Tech (Research)
 * - Experts
 * - Pets (levels, breakthroughs, refinements)
 * - Hero Gear (all 4 pieces per troop type)
 * - Chief Gear (6 pieces)
 * - Charms (troop-type specific LETH/HP)
 *
 * Implements the game's multi-layer bonus formula:
 * Final Stat = Base × (1 + Basic% + Additive%) × (1 + Multiplicative%)
 *
 * Or with Special stacking:
 * Final Stat = Base × (1 + Special%) where Special uses:
 * finalPercent = base + special + (base * special / 100)
 */

import type {
  TroopType,
  TroopStats,
  AdditiveBonuses,
  SpecialBonuses,
  DamageModifier,
  BonusTarget,
} from "./types";

import {
  aggregateAdditive,
  aggregateSpecial,
  applySpecialFormula,
  zeroStats,
  cloneStats,
  TROOP_TYPES,
} from "./bonuses";

// ============================================================================
// TYPES
// ============================================================================

/**
 * All possible bonus sources in the game
 */
export type BonusSource =
  | "combatTech"
  | "experts"
  | "pets"
  | "petRefinement"
  | "heroGear"
  | "chiefGear"
  | "charms"
  | "allianceTech"
  | "warAcademy"
  | "daybreakIsland"
  | "stackedSkins"
  | "allianceFacilities"
  | "vipPrestige"
  | "globe"
  | "specialHeroes"
  | "hero";

/**
 * Stat key type for consistency
 */
export type StatKey = keyof TroopStats;

/**
 * Bonus layer classification
 */
export type BonusLayer = "basic" | "additive" | "multiplicative" | "special";

/**
 * A single bonus entry with metadata
 */
export interface BonusEntry {
  /** Source of this bonus */
  source: BonusSource;
  /** Which troop type(s) this applies to */
  target: BonusTarget;
  /** The stat being modified */
  stat: StatKey;
  /** The bonus value (percentage, e.g., 10 = +10%) */
  value: number;
  /** Which layer this bonus belongs to */
  layer: BonusLayer;
  /** Optional description for debugging */
  description?: string;
}

/**
 * Per-troop-type bonus totals
 */
export interface TroopTypeBonuses {
  Infantry: TroopStats;
  Lancer: TroopStats;
  Marksman: TroopStats;
}

/**
 * Combat Tech input structure
 */
export interface CombatTechInput {
  /** Troop-type specific bonuses */
  troopTypeBonus: Record<string, Record<StatKey, number>>;
  /** Global troop bonuses (applies to all types) */
  totalTroopBonus: Record<StatKey, number>;
}

/**
 * Expert bonuses input
 */
export interface ExpertInput {
  attack: number;
  defense: number;
  lethality: number;
  health: number;
}

/**
 * Pet bonuses input (from levels/breakthroughs)
 */
export interface PetInput {
  attack: number;
  defense: number;
  lethality: number;
  health: number;
}

/**
 * Pet refinement input (troop-type specific LETH/HP + global ATK/DEF)
 */
export interface PetRefinementInput {
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
  troops: { attack: number; defense: number };
}

/**
 * Hero gear input per troop type
 */
export interface HeroGearInput {
  infantry: { lethality: number; health: number; attack: number; defense: number };
  lancer: { lethality: number; health: number; attack: number; defense: number };
  marksman: { lethality: number; health: number; attack: number; defense: number };
}

/**
 * Chief gear input (ATK/DEF only)
 */
export interface ChiefGearInput {
  attack: number;
  defense: number;
}

/**
 * Charms input (troop-type specific LETH/HP)
 */
export interface CharmsInput {
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
}

/**
 * Alliance Tech input (max +10% to all stats)
 */
export interface AllianceTechInput {
  attack: number;
  defense: number;
  lethality: number;
  health: number;
}

/**
 * War Academy input (per troop type)
 */
export interface WarAcademyInput {
  infantry: Record<StatKey, number>;
  lancer: Record<StatKey, number>;
  marksman: Record<StatKey, number>;
}

/**
 * Daybreak Island input
 */
export interface DaybreakIslandInput {
  infantry: { attack: number; defense: number };
  lancer: { attack: number; defense: number };
  marksman: { attack: number; defense: number };
  troops: { attack: number; defense: number; lethality: number; health: number };
}

/**
 * Special heroes input
 */
export interface SpecialHeroesInput {
  jeronimo: boolean; // +15% LETH & HP
  natalia: boolean;  // +10% ATK & DEF
}

/**
 * Complete aggregation input combining all sources
 */
export interface AggregationInput {
  combatTech?: CombatTechInput;
  experts?: ExpertInput;
  pets?: PetInput;
  petRefinement?: PetRefinementInput;
  heroGear?: HeroGearInput;
  chiefGear?: ChiefGearInput;
  charms?: CharmsInput;
  allianceTech?: AllianceTechInput;
  warAcademy?: WarAcademyInput;
  daybreakIsland?: DaybreakIslandInput;
  stackedSkins?: Record<StatKey, number>;
  allianceFacilities?: { attack: number; defense: number };
  vipPrestige?: Record<StatKey, number>;
  globe?: Record<StatKey, number>;
  specialHeroes?: SpecialHeroesInput;
  hero?: { attack: number; defense: number; lethality: number; health: number };
}

/**
 * Aggregation result with breakdown by layer
 */
export interface AggregationResult {
  /** Combined basic bonuses per troop type */
  basic: TroopTypeBonuses;
  /** Additive bonuses (temporary events, buffs) */
  additive: AdditiveBonuses;
  /** Special bonuses (use special stacking formula) */
  special: SpecialBonuses;
  /** Damage modifiers for multiplicative effects */
  damageModifiers: DamageModifier[];
  /** Breakdown of all individual entries for debugging */
  entries: BonusEntry[];
  /** Final computed percentages per troop type */
  finalPercentages: TroopTypeBonuses;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create empty troop type bonuses
 */
export function createEmptyTroopBonuses(): TroopTypeBonuses {
  return {
    Infantry: zeroStats(),
    Lancer: zeroStats(),
    Marksman: zeroStats(),
  };
}

/**
 * Normalize troop type string to TroopType
 */
function normalizeType(type: string): TroopType {
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (normalized === "Infantry" || normalized === "Lancer" || normalized === "Marksman") {
    return normalized;
  }
  throw new Error(`Invalid troop type: ${type}`);
}

/**
 * Map lowercase stat to StatKey
 */
function normalizeStat(stat: string): StatKey {
  const lower = stat.toLowerCase();
  if (lower === "attack" || lower === "defense" || lower === "health" || lower === "lethality") {
    return lower as StatKey;
  }
  throw new Error(`Invalid stat key: ${stat}`);
}

// ============================================================================
// BONUS AGGREGATOR CLASS
// ============================================================================

/**
 * Main bonus aggregator that collects and combines bonuses from all sources
 */
export class BonusAggregator {
  private entries: BonusEntry[] = [];

  /**
   * Add a bonus entry
   */
  addBonus(entry: BonusEntry): void {
    this.entries.push(entry);
  }

  /**
   * Add bonuses from combat tech
   */
  addCombatTech(input: CombatTechInput): void {
    // Troop-type specific bonuses
    for (const [type, stats] of Object.entries(input.troopTypeBonus)) {
      const troopType = normalizeType(type);
      for (const [stat, value] of Object.entries(stats)) {
        if (value && value !== 0) {
          this.entries.push({
            source: "combatTech",
            target: troopType,
            stat: normalizeStat(stat),
            value,
            layer: "basic",
            description: `Combat Tech ${troopType} ${stat}`,
          });
        }
      }
    }

    // Global troop bonuses
    for (const [stat, value] of Object.entries(input.totalTroopBonus)) {
      if (value && value !== 0) {
        this.entries.push({
          source: "combatTech",
          target: "All",
          stat: normalizeStat(stat),
          value,
          layer: "basic",
          description: `Combat Tech Total Troops ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from experts
   */
  addExperts(input: ExpertInput): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = input[stat];
      if (value && value !== 0) {
        this.entries.push({
          source: "experts",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `Expert ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from pets (levels/breakthroughs)
   */
  addPets(input: PetInput): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = input[stat];
      if (value && value !== 0) {
        this.entries.push({
          source: "pets",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `Pet ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from pet refinement
   */
  addPetRefinement(input: PetRefinementInput): void {
    // Troop-type specific LETH/HP
    const troopTypes: Array<"infantry" | "lancer" | "marksman"> = ["infantry", "lancer", "marksman"];
    for (const type of troopTypes) {
      const refinement = input[type];
      if (refinement) {
        if (refinement.lethality !== 0) {
          this.entries.push({
            source: "petRefinement",
            target: normalizeType(type),
            stat: "lethality",
            value: refinement.lethality,
            layer: "basic",
            description: `Pet Refinement ${type} lethality`,
          });
        }
        if (refinement.health !== 0) {
          this.entries.push({
            source: "petRefinement",
            target: normalizeType(type),
            stat: "health",
            value: refinement.health,
            layer: "basic",
            description: `Pet Refinement ${type} health`,
          });
        }
      }
    }

    // Global ATK/DEF
    if (input.troops) {
      if (input.troops.attack !== 0) {
        this.entries.push({
          source: "petRefinement",
          target: "All",
          stat: "attack",
          value: input.troops.attack,
          layer: "basic",
          description: "Pet Refinement troops attack",
        });
      }
      if (input.troops.defense !== 0) {
        this.entries.push({
          source: "petRefinement",
          target: "All",
          stat: "defense",
          value: input.troops.defense,
          layer: "basic",
          description: "Pet Refinement troops defense",
        });
      }
    }
  }

  /**
   * Add bonuses from hero gear
   */
  addHeroGear(input: HeroGearInput): void {
    const troopTypes: Array<"infantry" | "lancer" | "marksman"> = ["infantry", "lancer", "marksman"];
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];

    for (const type of troopTypes) {
      const gear = input[type];
      if (gear) {
        for (const stat of stats) {
          const value = gear[stat];
          if (value && value !== 0) {
            this.entries.push({
              source: "heroGear",
              target: normalizeType(type),
              stat,
              value,
              layer: "basic",
              description: `Hero Gear ${type} ${stat}`,
            });
          }
        }
      }
    }
  }

  /**
   * Add bonuses from chief gear
   */
  addChiefGear(input: ChiefGearInput): void {
    if (input.attack !== 0) {
      this.entries.push({
        source: "chiefGear",
        target: "All",
        stat: "attack",
        value: input.attack,
        layer: "basic",
        description: "Chief Gear attack",
      });
    }
    if (input.defense !== 0) {
      this.entries.push({
        source: "chiefGear",
        target: "All",
        stat: "defense",
        value: input.defense,
        layer: "basic",
        description: "Chief Gear defense",
      });
    }
  }

  /**
   * Add bonuses from charms
   */
  addCharms(input: CharmsInput): void {
    const troopTypes: Array<"infantry" | "lancer" | "marksman"> = ["infantry", "lancer", "marksman"];

    for (const type of troopTypes) {
      const charm = input[type];
      if (charm) {
        if (charm.lethality !== 0) {
          this.entries.push({
            source: "charms",
            target: normalizeType(type),
            stat: "lethality",
            value: charm.lethality,
            layer: "basic",
            description: `Charm ${type} lethality`,
          });
        }
        if (charm.health !== 0) {
          this.entries.push({
            source: "charms",
            target: normalizeType(type),
            stat: "health",
            value: charm.health,
            layer: "basic",
            description: `Charm ${type} health`,
          });
        }
      }
    }
  }

  /**
   * Add bonuses from alliance tech (capped at +10% per stat)
   */
  addAllianceTech(input: AllianceTechInput): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = Math.min(input[stat] || 0, 10); // Cap at 10%
      if (value !== 0) {
        this.entries.push({
          source: "allianceTech",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `Alliance Tech ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from war academy
   */
  addWarAcademy(input: WarAcademyInput): void {
    const troopTypes: Array<"infantry" | "lancer" | "marksman"> = ["infantry", "lancer", "marksman"];
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];

    for (const type of troopTypes) {
      const academy = input[type];
      if (academy) {
        for (const stat of stats) {
          const value = academy[stat];
          if (value && value !== 0) {
            this.entries.push({
              source: "warAcademy",
              target: normalizeType(type),
              stat,
              value,
              layer: "basic",
              description: `War Academy ${type} ${stat}`,
            });
          }
        }
      }
    }
  }

  /**
   * Add bonuses from Daybreak Island
   */
  addDaybreakIsland(input: DaybreakIslandInput): void {
    const troopTypes: Array<"infantry" | "lancer" | "marksman"> = ["infantry", "lancer", "marksman"];

    // Troop-type specific ATK/DEF
    for (const type of troopTypes) {
      const island = input[type];
      if (island) {
        if (island.attack !== 0) {
          this.entries.push({
            source: "daybreakIsland",
            target: normalizeType(type),
            stat: "attack",
            value: island.attack,
            layer: "basic",
            description: `Daybreak Island ${type} attack`,
          });
        }
        if (island.defense !== 0) {
          this.entries.push({
            source: "daybreakIsland",
            target: normalizeType(type),
            stat: "defense",
            value: island.defense,
            layer: "basic",
            description: `Daybreak Island ${type} defense`,
          });
        }
      }
    }

    // Global troop bonuses
    if (input.troops) {
      const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
      for (const stat of stats) {
        const value = input.troops[stat];
        if (value && value !== 0) {
          this.entries.push({
            source: "daybreakIsland",
            target: "All",
            stat,
            value,
            layer: "basic",
            description: `Daybreak Island troops ${stat}`,
          });
        }
      }
    }
  }

  /**
   * Add bonuses from stacked skins
   */
  addStackedSkins(input: Record<StatKey, number>): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = input[stat];
      if (value && value !== 0) {
        this.entries.push({
          source: "stackedSkins",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `Stacked Skins ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from alliance facilities (capped at +13% for ATK/DEF)
   */
  addAllianceFacilities(input: { attack: number; defense: number }): void {
    if (input.attack !== 0) {
      this.entries.push({
        source: "allianceFacilities",
        target: "All",
        stat: "attack",
        value: Math.min(input.attack, 13), // Cap at 13%
        layer: "basic",
        description: "Alliance Facilities attack",
      });
    }
    if (input.defense !== 0) {
      this.entries.push({
        source: "allianceFacilities",
        target: "All",
        stat: "defense",
        value: Math.min(input.defense, 13), // Cap at 13%
        layer: "basic",
        description: "Alliance Facilities defense",
      });
    }
  }

  /**
   * Add bonuses from VIP prestige
   */
  addVipPrestige(input: Record<StatKey, number>): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = input[stat];
      if (value && value !== 0) {
        this.entries.push({
          source: "vipPrestige",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `VIP Prestige ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from globe (VIP skin)
   */
  addGlobe(input: Record<StatKey, number>): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = input[stat];
      if (value && value !== 0) {
        this.entries.push({
          source: "globe",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `Globe ${stat}`,
        });
      }
    }
  }

  /**
   * Add bonuses from special heroes
   */
  addSpecialHeroes(input: SpecialHeroesInput): void {
    if (input.jeronimo) {
      this.entries.push({
        source: "specialHeroes",
        target: "All",
        stat: "lethality",
        value: 15,
        layer: "basic",
        description: "Jeronimo lethality",
      });
      this.entries.push({
        source: "specialHeroes",
        target: "All",
        stat: "health",
        value: 15,
        layer: "basic",
        description: "Jeronimo health",
      });
    }
    if (input.natalia) {
      this.entries.push({
        source: "specialHeroes",
        target: "All",
        stat: "attack",
        value: 10,
        layer: "basic",
        description: "Natalia attack",
      });
      this.entries.push({
        source: "specialHeroes",
        target: "All",
        stat: "defense",
        value: 10,
        layer: "basic",
        description: "Natalia defense",
      });
    }
  }

  /**
   * Add bonuses from hero (rally leader)
   */
  addHero(input: { attack: number; defense: number; lethality: number; health: number }): void {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      const value = input[stat];
      if (value && value !== 0) {
        this.entries.push({
          source: "hero",
          target: "All",
          stat,
          value,
          layer: "basic",
          description: `Hero ${stat}`,
        });
      }
    }
  }

  /**
   * Add an additive bonus (temporary events, etc.)
   */
  addAdditiveBonus(
    source: BonusSource,
    target: BonusTarget,
    stat: StatKey,
    value: number,
    description?: string
  ): void {
    if (value !== 0) {
      this.entries.push({
        source,
        target,
        stat,
        value,
        layer: "additive",
        description: description || `${source} additive ${stat}`,
      });
    }
  }

  /**
   * Add a special bonus (uses special stacking formula)
   */
  addSpecialBonus(
    source: BonusSource,
    target: BonusTarget,
    stat: StatKey,
    value: number,
    description?: string
  ): void {
    if (value !== 0) {
      this.entries.push({
        source,
        target,
        stat,
        value,
        layer: "special",
        description: description || `${source} special ${stat}`,
      });
    }
  }

  /**
   * Add a multiplicative damage modifier
   */
  addDamageModifier(modifier: DamageModifier): void {
    // Track as entry for debugging
    this.entries.push({
      source: modifier.source as BonusSource,
      target: modifier.appliesTo,
      stat: "attack", // Modifiers affect damage, tracked under attack
      value: modifier.magnitude * 100,
      layer: "multiplicative",
      description: modifier.source,
    });
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get all entries
   */
  getEntries(): BonusEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by source
   */
  getEntriesBySource(source: BonusSource): BonusEntry[] {
    return this.entries.filter((e) => e.source === source);
  }

  /**
   * Get entries filtered by layer
   */
  getEntriesByLayer(layer: BonusLayer): BonusEntry[] {
    return this.entries.filter((e) => e.layer === layer);
  }

  /**
   * Compute aggregated basic bonuses per troop type
   */
  computeBasicBonuses(): TroopTypeBonuses {
    const result = createEmptyTroopBonuses();
    const basicEntries = this.entries.filter((e) => e.layer === "basic");

    for (const entry of basicEntries) {
      if (entry.target === "All") {
        // Apply to all troop types
        for (const type of TROOP_TYPES) {
          result[type][entry.stat] += entry.value;
        }
      } else {
        // Apply to specific troop type
        result[entry.target][entry.stat] += entry.value;
      }
    }

    return result;
  }

  /**
   * Compute aggregated additive bonuses
   */
  computeAdditiveBonuses(): AdditiveBonuses {
    const result: AdditiveBonuses = {};
    const additiveEntries = this.entries.filter((e) => e.layer === "additive");

    for (const entry of additiveEntries) {
      if (entry.target === "All") {
        if (!result.All) result.All = {};
        result.All[entry.stat] = (result.All[entry.stat] || 0) + entry.value;
      } else {
        if (!result[entry.target]) result[entry.target] = {};
        result[entry.target]![entry.stat] = (result[entry.target]![entry.stat] || 0) + entry.value;
      }
    }

    return result;
  }

  /**
   * Compute aggregated special bonuses
   */
  computeSpecialBonuses(): SpecialBonuses {
    const result: SpecialBonuses = {};
    const specialEntries = this.entries.filter((e) => e.layer === "special");

    for (const entry of specialEntries) {
      if (entry.target === "All") {
        if (!result.All) result.All = {};
        result.All[entry.stat] = (result.All[entry.stat] || 0) + entry.value;
      } else {
        if (!result[entry.target]) result[entry.target] = {};
        result[entry.target]![entry.stat] = (result[entry.target]![entry.stat] || 0) + entry.value;
      }
    }

    return result;
  }

  /**
   * Compute final percentages per troop type
   * Applies: Basic + Additive, then Special stacking formula
   */
  computeFinalPercentages(): TroopTypeBonuses {
    const basic = this.computeBasicBonuses();
    const additive = this.computeAdditiveBonuses();
    const special = this.computeSpecialBonuses();

    // First, combine basic and additive (simple addition)
    const combined: Record<TroopType, TroopStats> = {
      Infantry: zeroStats(),
      Lancer: zeroStats(),
      Marksman: zeroStats(),
    };

    const additiveAggregated = aggregateAdditive(additive);

    for (const type of TROOP_TYPES) {
      const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
      for (const stat of stats) {
        combined[type][stat] = basic[type][stat] + (additiveAggregated[type]?.[stat] || 0);
      }
    }

    // Then apply special stacking formula
    const final = aggregateSpecial(combined, special);

    return final;
  }

  /**
   * Get complete aggregation result
   */
  aggregate(): AggregationResult {
    return {
      basic: this.computeBasicBonuses(),
      additive: this.computeAdditiveBonuses(),
      special: this.computeSpecialBonuses(),
      damageModifiers: [], // Populated separately if needed
      entries: this.getEntries(),
      finalPercentages: this.computeFinalPercentages(),
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create an aggregator and populate it from a complete input object
 */
export function createAggregator(input: AggregationInput): BonusAggregator {
  const aggregator = new BonusAggregator();

  if (input.combatTech) aggregator.addCombatTech(input.combatTech);
  if (input.experts) aggregator.addExperts(input.experts);
  if (input.pets) aggregator.addPets(input.pets);
  if (input.petRefinement) aggregator.addPetRefinement(input.petRefinement);
  if (input.heroGear) aggregator.addHeroGear(input.heroGear);
  if (input.chiefGear) aggregator.addChiefGear(input.chiefGear);
  if (input.charms) aggregator.addCharms(input.charms);
  if (input.allianceTech) aggregator.addAllianceTech(input.allianceTech);
  if (input.warAcademy) aggregator.addWarAcademy(input.warAcademy);
  if (input.daybreakIsland) aggregator.addDaybreakIsland(input.daybreakIsland);
  if (input.stackedSkins) aggregator.addStackedSkins(input.stackedSkins);
  if (input.allianceFacilities) aggregator.addAllianceFacilities(input.allianceFacilities);
  if (input.vipPrestige) aggregator.addVipPrestige(input.vipPrestige);
  if (input.globe) aggregator.addGlobe(input.globe);
  if (input.specialHeroes) aggregator.addSpecialHeroes(input.specialHeroes);
  if (input.hero) aggregator.addHero(input.hero);

  return aggregator;
}

/**
 * Aggregate bonuses in one step from complete input
 */
export function aggregateBonuses(input: AggregationInput): AggregationResult {
  return createAggregator(input).aggregate();
}

/**
 * Convert final percentages to AdditiveBonuses format for combat engine
 */
export function toAdditiveBonuses(finalPercentages: TroopTypeBonuses): AdditiveBonuses {
  return {
    Infantry: { ...finalPercentages.Infantry },
    Lancer: { ...finalPercentages.Lancer },
    Marksman: { ...finalPercentages.Marksman },
  };
}

/**
 * Calculate effective stat value from base stat and bonus percentage
 */
export function applyBonusToBaseStat(baseStat: number, bonusPercent: number): number {
  return baseStat * (1 + bonusPercent / 100);
}

/**
 * Calculate effective stats for all troop types
 */
export function computeEffectiveStatsFromBonuses(
  baseStats: Record<TroopType, TroopStats>,
  bonuses: TroopTypeBonuses
): Record<TroopType, TroopStats> {
  const result: Record<TroopType, TroopStats> = {
    Infantry: zeroStats(),
    Lancer: zeroStats(),
    Marksman: zeroStats(),
  };

  for (const type of TROOP_TYPES) {
    const stats: StatKey[] = ["attack", "defense", "lethality", "health"];
    for (const stat of stats) {
      result[type][stat] = applyBonusToBaseStat(baseStats[type][stat], bonuses[type][stat]);
    }
  }

  return result;
}
