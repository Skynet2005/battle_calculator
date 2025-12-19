/**
 * Tests for the Bonus Aggregation System
 *
 * Tests cover:
 * - Individual bonus source extraction
 * - Additive layer combination
 * - Multiplicative (special) stacking
 * - Edge cases and caps
 * - Full aggregation pipeline
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  aggregateBonuses,
  applyBonusToBaseStat,
  BonusAggregator,
  computeEffectiveStatsFromBonuses,
  createAggregator,
  createEmptyTroopBonuses,
  toAdditiveBonuses,
  type AggregationInput,
  type CharmsInput,
  type ChiefGearInput,
  type CombatTechInput,
  type ExpertInput,
  type HeroGearInput,
  type PetInput,
  type PetRefinementInput
} from "../../lib/combat/bonus-aggregator";
import { applySpecialFormula } from "../../lib/combat/bonuses";
import type { TroopStats } from "../../lib/combat/types";

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createEmptyStats = (): TroopStats => ({
  attack: 0,
  defense: 0,
  lethality: 0,
  health: 0,
});

const createSampleCombatTech = (): CombatTechInput => ({
  troopTypeBonus: {
    infantry: { attack: 10, defense: 5, lethality: 3, health: 2 },
    lancer: { attack: 8, defense: 6, lethality: 4, health: 3 },
    marksman: { attack: 12, defense: 4, lethality: 5, health: 1 },
  },
  totalTroopBonus: { attack: 5, defense: 5, lethality: 0, health: 0 },
});

const createSampleExperts = (): ExpertInput => ({
  attack: 15,
  defense: 10,
  lethality: 8,
  health: 12,
});

const createSamplePets = (): PetInput => ({
  attack: 20,
  defense: 15,
  lethality: 0,
  health: 0,
});

const createSamplePetRefinement = (): PetRefinementInput => ({
  infantry: { lethality: 5, health: 6 },
  lancer: { lethality: 4, health: 5 },
  marksman: { lethality: 6, health: 4 },
  troops: { attack: 3, defense: 2 },
});

const createSampleHeroGear = (): HeroGearInput => ({
  infantry: { lethality: 10, health: 8, attack: 2, defense: 2 },
  lancer: { lethality: 9, health: 9, attack: 1, defense: 3 },
  marksman: { lethality: 11, health: 7, attack: 3, defense: 1 },
});

const createSampleChiefGear = (): ChiefGearInput => ({
  attack: 25,
  defense: 20,
});

const createSampleCharms = (): CharmsInput => ({
  infantry: { lethality: 12, health: 10 },
  lancer: { lethality: 11, health: 11 },
  marksman: { lethality: 13, health: 9 },
});

// ============================================================================
// BASIC UNIT TESTS
// ============================================================================

describe("BonusAggregator", () => {
  let aggregator: BonusAggregator;

  beforeEach(() => {
    aggregator = new BonusAggregator();
  });

  describe("Basic Operations", () => {
    it("should start with empty entries", () => {
      expect(aggregator.getEntries()).toHaveLength(0);
    });

    it("should clear entries", () => {
      aggregator.addExperts({ attack: 10, defense: 10, lethality: 10, health: 10 });
      expect(aggregator.getEntries().length).toBeGreaterThan(0);

      aggregator.clear();
      expect(aggregator.getEntries()).toHaveLength(0);
    });
  });

  describe("Combat Tech Bonuses", () => {
    it("should add troop-type specific bonuses", () => {
      aggregator.addCombatTech(createSampleCombatTech());

      const entries = aggregator.getEntriesBySource("combatTech");
      expect(entries.length).toBeGreaterThan(0);

      const infantryAttack = entries.find(
        (e) => e.target === "Infantry" && e.stat === "attack"
      );
      expect(infantryAttack?.value).toBe(10);
    });

    it("should add global troop bonuses to all types", () => {
      aggregator.addCombatTech(createSampleCombatTech());

      const basic = aggregator.computeBasicBonuses();

      // Global attack bonus of 5 should be added to each type
      expect(basic.Infantry.attack).toBe(15); // 10 type-specific + 5 global
      expect(basic.Lancer.attack).toBe(13); // 8 type-specific + 5 global
      expect(basic.Marksman.attack).toBe(17); // 12 type-specific + 5 global
    });

    it("should handle empty combat tech", () => {
      aggregator.addCombatTech({
        troopTypeBonus: {},
        totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
      });

      const entries = aggregator.getEntriesBySource("combatTech");
      expect(entries).toHaveLength(0);
    });
  });

  describe("Expert Bonuses", () => {
    it("should add expert bonuses to all troop types", () => {
      aggregator.addExperts(createSampleExperts());

      const basic = aggregator.computeBasicBonuses();

      // Expert bonuses apply to all troop types
      expect(basic.Infantry.attack).toBe(15);
      expect(basic.Lancer.attack).toBe(15);
      expect(basic.Marksman.attack).toBe(15);

      expect(basic.Infantry.defense).toBe(10);
      expect(basic.Infantry.lethality).toBe(8);
      expect(basic.Infantry.health).toBe(12);
    });
  });

  describe("Pet Bonuses", () => {
    it("should add pet bonuses to all troop types", () => {
      aggregator.addPets(createSamplePets());

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(20);
      expect(basic.Infantry.defense).toBe(15);
      expect(basic.Infantry.lethality).toBe(0);
      expect(basic.Infantry.health).toBe(0);
    });
  });

  describe("Pet Refinement Bonuses", () => {
    it("should add troop-type specific LETH/HP", () => {
      aggregator.addPetRefinement(createSamplePetRefinement());

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.lethality).toBe(5);
      expect(basic.Infantry.health).toBe(6);
      expect(basic.Lancer.lethality).toBe(4);
      expect(basic.Marksman.health).toBe(4);
    });

    it("should add global ATK/DEF", () => {
      aggregator.addPetRefinement(createSamplePetRefinement());

      const basic = aggregator.computeBasicBonuses();

      // Global ATK/DEF from troops
      expect(basic.Infantry.attack).toBe(3);
      expect(basic.Lancer.attack).toBe(3);
      expect(basic.Marksman.attack).toBe(3);
      expect(basic.Infantry.defense).toBe(2);
    });
  });

  describe("Hero Gear Bonuses", () => {
    it("should add troop-type specific bonuses", () => {
      aggregator.addHeroGear(createSampleHeroGear());

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.lethality).toBe(10);
      expect(basic.Infantry.health).toBe(8);
      expect(basic.Infantry.attack).toBe(2);
      expect(basic.Infantry.defense).toBe(2);

      expect(basic.Marksman.lethality).toBe(11);
      expect(basic.Marksman.attack).toBe(3);
    });
  });

  describe("Chief Gear Bonuses", () => {
    it("should add ATK/DEF to all troop types", () => {
      aggregator.addChiefGear(createSampleChiefGear());

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(25);
      expect(basic.Infantry.defense).toBe(20);
      expect(basic.Lancer.attack).toBe(25);
      expect(basic.Marksman.defense).toBe(20);

      // Chief gear doesn't affect LETH/HP
      expect(basic.Infantry.lethality).toBe(0);
      expect(basic.Infantry.health).toBe(0);
    });
  });

  describe("Charms Bonuses", () => {
    it("should add troop-type specific LETH/HP", () => {
      aggregator.addCharms(createSampleCharms());

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.lethality).toBe(12);
      expect(basic.Infantry.health).toBe(10);
      expect(basic.Lancer.lethality).toBe(11);
      expect(basic.Marksman.health).toBe(9);

      // Charms don't affect ATK/DEF
      expect(basic.Infantry.attack).toBe(0);
      expect(basic.Lancer.defense).toBe(0);
    });
  });

  describe("Alliance Tech Bonuses", () => {
    it("should cap bonuses at 10%", () => {
      aggregator.addAllianceTech({
        attack: 15, // Should be capped to 10
        defense: 8,
        lethality: 12, // Should be capped to 10
        health: 5,
      });

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(10); // Capped
      expect(basic.Infantry.defense).toBe(8);
      expect(basic.Infantry.lethality).toBe(10); // Capped
      expect(basic.Infantry.health).toBe(5);
    });
  });

  describe("Alliance Facilities Bonuses", () => {
    it("should cap bonuses at 13%", () => {
      aggregator.addAllianceFacilities({
        attack: 20, // Should be capped to 13
        defense: 10,
      });

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(13); // Capped
      expect(basic.Infantry.defense).toBe(10);
    });
  });

  describe("Special Heroes Bonuses", () => {
    it("should add Jeronimo LETH/HP bonuses", () => {
      aggregator.addSpecialHeroes({ jeronimo: true, natalia: false });

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.lethality).toBe(15);
      expect(basic.Infantry.health).toBe(15);
      expect(basic.Infantry.attack).toBe(0);
      expect(basic.Infantry.defense).toBe(0);
    });

    it("should add Natalia ATK/DEF bonuses", () => {
      aggregator.addSpecialHeroes({ jeronimo: false, natalia: true });

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(10);
      expect(basic.Infantry.defense).toBe(10);
      expect(basic.Infantry.lethality).toBe(0);
      expect(basic.Infantry.health).toBe(0);
    });

    it("should add both heroes bonuses", () => {
      aggregator.addSpecialHeroes({ jeronimo: true, natalia: true });

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(10);
      expect(basic.Infantry.defense).toBe(10);
      expect(basic.Infantry.lethality).toBe(15);
      expect(basic.Infantry.health).toBe(15);
    });
  });
});

// ============================================================================
// AGGREGATION PIPELINE TESTS
// ============================================================================

describe("Aggregation Pipeline", () => {
  describe("Basic Bonus Aggregation", () => {
    it("should sum bonuses from multiple sources", () => {
      const aggregator = new BonusAggregator();

      aggregator.addExperts({ attack: 15, defense: 10, lethality: 8, health: 12 });
      aggregator.addPets({ attack: 20, defense: 15, lethality: 0, health: 0 });
      aggregator.addChiefGear({ attack: 25, defense: 20 });

      const basic = aggregator.computeBasicBonuses();

      // All sources combined
      expect(basic.Infantry.attack).toBe(60); // 15 + 20 + 25
      expect(basic.Infantry.defense).toBe(45); // 10 + 15 + 20
      expect(basic.Infantry.lethality).toBe(8);
      expect(basic.Infantry.health).toBe(12);
    });

    it("should handle troop-type specific and global bonuses together", () => {
      const aggregator = new BonusAggregator();

      // Add global bonus
      aggregator.addExperts({ attack: 10, defense: 0, lethality: 0, health: 0 });

      // Add troop-type specific
      aggregator.addHeroGear({
        infantry: { lethality: 0, health: 0, attack: 5, defense: 0 },
        lancer: { lethality: 0, health: 0, attack: 8, defense: 0 },
        marksman: { lethality: 0, health: 0, attack: 3, defense: 0 },
      });

      const basic = aggregator.computeBasicBonuses();

      expect(basic.Infantry.attack).toBe(15); // 10 global + 5 specific
      expect(basic.Lancer.attack).toBe(18); // 10 global + 8 specific
      expect(basic.Marksman.attack).toBe(13); // 10 global + 3 specific
    });
  });

  describe("Additive Layer", () => {
    it("should separate additive bonuses from basic", () => {
      const aggregator = new BonusAggregator();

      // Basic
      aggregator.addExperts({ attack: 10, defense: 0, lethality: 0, health: 0 });

      // Additive
      aggregator.addAdditiveBonus("combatTech", "All", "attack", 5, "Temp Event");

      const basic = aggregator.computeBasicBonuses();
      const additive = aggregator.computeAdditiveBonuses();

      expect(basic.Infantry.attack).toBe(10);
      expect(additive.All?.attack).toBe(5);
    });

    it("should aggregate additive bonuses correctly", () => {
      const aggregator = new BonusAggregator();

      aggregator.addAdditiveBonus("combatTech", "All", "attack", 5);
      aggregator.addAdditiveBonus("combatTech", "Infantry", "attack", 10);
      aggregator.addAdditiveBonus("combatTech", "All", "defense", 3);

      const additive = aggregator.computeAdditiveBonuses();

      expect(additive.All?.attack).toBe(5);
      expect(additive.Infantry?.attack).toBe(10);
      expect(additive.All?.defense).toBe(3);
    });
  });

  describe("Special Stacking Formula", () => {
    it("should apply special formula correctly", () => {
      // Test the special stacking formula: base + special + (base * special / 100)
      const result = applySpecialFormula(100, 50);
      expect(result).toBe(200); // 100 + 50 + (100 * 50 / 100) = 100 + 50 + 50 = 200
    });

    it("should compute final percentages with special stacking", () => {
      const aggregator = new BonusAggregator();

      // Basic: 100%
      aggregator.addExperts({ attack: 100, defense: 0, lethality: 0, health: 0 });

      // Special: 50%
      aggregator.addSpecialBonus("combatTech", "All", "attack", 50);

      const final = aggregator.computeFinalPercentages();

      // Expected: 100 + 50 + (100 * 50 / 100) = 200
      expect(final.Infantry.attack).toBe(200);
    });
  });

  describe("Full Aggregation", () => {
    it("should produce complete aggregation result", () => {
      const input: AggregationInput = {
        experts: { attack: 15, defense: 10, lethality: 8, health: 12 },
        pets: { attack: 20, defense: 15, lethality: 0, health: 0 },
        chiefGear: { attack: 25, defense: 20 },
      };

      const result = aggregateBonuses(input);

      expect(result.basic.Infantry.attack).toBe(60);
      expect(result.entries.length).toBeGreaterThan(0);
      expect(result.finalPercentages.Infantry.attack).toBe(60);
    });

    it("should include entries from all sources", () => {
      const input: AggregationInput = {
        combatTech: createSampleCombatTech(),
        experts: createSampleExperts(),
        pets: createSamplePets(),
        petRefinement: createSamplePetRefinement(),
        heroGear: createSampleHeroGear(),
        chiefGear: createSampleChiefGear(),
        charms: createSampleCharms(),
      };

      const result = aggregateBonuses(input);

      const sources = new Set(result.entries.map((e) => e.source));
      expect(sources.has("combatTech")).toBe(true);
      expect(sources.has("experts")).toBe(true);
      expect(sources.has("pets")).toBe(true);
      expect(sources.has("petRefinement")).toBe(true);
      expect(sources.has("heroGear")).toBe(true);
      expect(sources.has("chiefGear")).toBe(true);
      expect(sources.has("charms")).toBe(true);
    });
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe("Utility Functions", () => {
  describe("createEmptyTroopBonuses", () => {
    it("should create empty bonuses for all troop types", () => {
      const empty = createEmptyTroopBonuses();

      expect(empty.Infantry).toEqual({ attack: 0, defense: 0, lethality: 0, health: 0 });
      expect(empty.Lancer).toEqual({ attack: 0, defense: 0, lethality: 0, health: 0 });
      expect(empty.Marksman).toEqual({ attack: 0, defense: 0, lethality: 0, health: 0 });
    });
  });

  describe("createAggregator", () => {
    it("should create pre-populated aggregator", () => {
      const input: AggregationInput = {
        experts: { attack: 10, defense: 5, lethality: 3, health: 2 },
      };

      const aggregator = createAggregator(input);
      const entries = aggregator.getEntries();

      expect(entries.length).toBe(4); // 4 stat types
    });
  });

  describe("toAdditiveBonuses", () => {
    it("should convert final percentages to AdditiveBonuses format", () => {
      const final = {
        Infantry: { attack: 100, defense: 50, lethality: 30, health: 40 },
        Lancer: { attack: 90, defense: 60, lethality: 35, health: 45 },
        Marksman: { attack: 110, defense: 40, lethality: 40, health: 35 },
      };

      const additive = toAdditiveBonuses(final);

      expect(additive.Infantry?.attack).toBe(100);
      expect(additive.Lancer?.defense).toBe(60);
      expect(additive.Marksman?.health).toBe(35);
    });
  });

  describe("applyBonusToBaseStat", () => {
    it("should calculate effective stat from base and bonus", () => {
      expect(applyBonusToBaseStat(100, 50)).toBe(150); // 100 * (1 + 0.5)
      expect(applyBonusToBaseStat(100, 100)).toBe(200); // 100 * (1 + 1.0)
      expect(applyBonusToBaseStat(100, 0)).toBe(100); // 100 * (1 + 0)
    });

    it("should handle negative bonuses (debuffs)", () => {
      expect(applyBonusToBaseStat(100, -20)).toBe(80); // 100 * (1 - 0.2)
    });
  });

  describe("computeEffectiveStatsFromBonuses", () => {
    it("should compute effective stats for all troop types", () => {
      const baseStats = {
        Infantry: { attack: 100, defense: 80, lethality: 60, health: 120 },
        Lancer: { attack: 90, defense: 90, lethality: 70, health: 100 },
        Marksman: { attack: 110, defense: 70, lethality: 80, health: 90 },
      };

      const bonuses = {
        Infantry: { attack: 50, defense: 25, lethality: 10, health: 20 },
        Lancer: { attack: 40, defense: 30, lethality: 15, health: 25 },
        Marksman: { attack: 60, defense: 20, lethality: 20, health: 15 },
      };

      const effective = computeEffectiveStatsFromBonuses(baseStats, bonuses);

      expect(effective.Infantry.attack).toBe(150); // 100 * 1.5
      expect(effective.Infantry.defense).toBe(100); // 80 * 1.25
      expect(effective.Lancer.attack).toBeCloseTo(126); // 90 * 1.4
      expect(effective.Marksman.attack).toBe(176); // 110 * 1.6
    });
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe("Edge Cases", () => {
  it("should handle empty input", () => {
    const result = aggregateBonuses({});

    expect(result.basic.Infantry).toEqual({ attack: 0, defense: 0, lethality: 0, health: 0 });
    expect(result.entries).toHaveLength(0);
  });

  it("should handle zero values", () => {
    const result = aggregateBonuses({
      experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
    });

    expect(result.basic.Infantry.attack).toBe(0);
    expect(result.entries).toHaveLength(0); // Zero values shouldn't create entries
  });

  it("should handle very large values", () => {
    const result = aggregateBonuses({
      experts: { attack: 1000, defense: 1000, lethality: 1000, health: 1000 },
    });

    expect(result.basic.Infantry.attack).toBe(1000);
  });

  it("should handle decimal values", () => {
    const result = aggregateBonuses({
      experts: { attack: 10.5, defense: 5.25, lethality: 3.75, health: 2.5 },
    });

    expect(result.basic.Infantry.attack).toBe(10.5);
    expect(result.basic.Infantry.defense).toBe(5.25);
  });
});

// ============================================================================
// INTEGRATION-LIKE TESTS
// ============================================================================

describe("Realistic Scenarios", () => {
  it("should aggregate a mid-game player profile", () => {
    const input: AggregationInput = {
      combatTech: {
        troopTypeBonus: {
          infantry: { attack: 30, defense: 20, lethality: 15, health: 10 },
          lancer: { attack: 25, defense: 22, lethality: 12, health: 12 },
          marksman: { attack: 35, defense: 18, lethality: 18, health: 8 },
        },
        totalTroopBonus: { attack: 10, defense: 10, lethality: 5, health: 5 },
      },
      experts: { attack: 20, defense: 15, lethality: 10, health: 12 },
      pets: { attack: 25, defense: 20, lethality: 0, health: 0 },
      chiefGear: { attack: 35, defense: 30 },
      charms: {
        infantry: { lethality: 15, health: 12 },
        lancer: { lethality: 14, health: 14 },
        marksman: { lethality: 16, health: 10 },
      },
    };

    const result = aggregateBonuses(input);

    // Infantry: 30+10+20+25+35 = 120 attack
    expect(result.basic.Infantry.attack).toBe(120);
    // Infantry: 20+10+15+20+30 = 95 defense
    expect(result.basic.Infantry.defense).toBe(95);
    // Infantry: 15+5+10+15 = 45 lethality (combatTech type + global + experts + charms)
    expect(result.basic.Infantry.lethality).toBe(45);
    // Infantry: 10+5+12+12 = 39 health
    expect(result.basic.Infantry.health).toBe(39);
  });

  it("should aggregate an end-game player profile with all sources", () => {
    const input: AggregationInput = {
      combatTech: {
        troopTypeBonus: {
          infantry: { attack: 60, defense: 50, lethality: 40, health: 35 },
          lancer: { attack: 55, defense: 52, lethality: 38, health: 37 },
          marksman: { attack: 65, defense: 48, lethality: 42, health: 33 },
        },
        totalTroopBonus: { attack: 20, defense: 20, lethality: 15, health: 15 },
      },
      experts: { attack: 40, defense: 35, lethality: 30, health: 32 },
      pets: { attack: 45, defense: 40, lethality: 0, health: 0 },
      petRefinement: {
        infantry: { lethality: 20, health: 18 },
        lancer: { lethality: 18, health: 20 },
        marksman: { lethality: 22, health: 16 },
        troops: { attack: 10, defense: 8 },
      },
      heroGear: {
        infantry: { lethality: 35, health: 30, attack: 8, defense: 8 },
        lancer: { lethality: 33, health: 32, attack: 6, defense: 10 },
        marksman: { lethality: 37, health: 28, attack: 10, defense: 6 },
      },
      chiefGear: { attack: 55, defense: 50 },
      charms: {
        infantry: { lethality: 25, health: 22 },
        lancer: { lethality: 24, health: 24 },
        marksman: { lethality: 26, health: 20 },
      },
      allianceTech: { attack: 10, defense: 10, lethality: 10, health: 10 },
      allianceFacilities: { attack: 13, defense: 13 },
      specialHeroes: { jeronimo: true, natalia: true },
      vipPrestige: { attack: 5, defense: 5, lethality: 5, health: 5 },
    };

    const result = aggregateBonuses(input);

    // Verify high-value aggregation
    expect(result.basic.Infantry.attack).toBeGreaterThan(200);
    expect(result.basic.Infantry.defense).toBeGreaterThan(180);
    expect(result.basic.Infantry.lethality).toBeGreaterThan(150);
    expect(result.basic.Infantry.health).toBeGreaterThan(130);

    // Verify entries count (should have many sources)
    expect(result.entries.length).toBeGreaterThan(50);
  });
});
