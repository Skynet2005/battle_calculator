/**
 * Unit tests for core battle calculation functions.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateBasicBonus,
  calculateAdditiveBonus,
  calculateFinalStatValue,
  calculateFinalStats,
  calculateDamage,
  calculatePowerIndex,
  calculateBalanceRatio,
  roundFinalStats,
  type BasicBonuses,
  type AdditiveBonuses,
  type MultiplicativeBonuses,
  type FinalStats,
} from '../calculations';

function emptyBasicBonuses(): BasicBonuses {
  return {
    combatTech: {
      troopTypeBonus: {
        infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
        lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
        marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    allianceTech: { attack: 0, defense: 0, lethality: 0, health: 0 },
    experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
    daybreakIsland: {
      infantry: { attack: 0, defense: 0 },
      lancer: { attack: 0, defense: 0 },
      marksman: { attack: 0, defense: 0 },
      troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    pets: { attack: 0, defense: 0, lethality: 0, health: 0 },
    stackedSkins: { attack: 0, defense: 0, lethality: 0, health: 0 },
    hero: { attack: 0, defense: 0, lethality: 0, health: 0 },
    chiefGear: { attack: 0, defense: 0 },
    charms: {
      infantry: { lethality: 0, health: 0 },
      lancer: { lethality: 0, health: 0 },
      marksman: { lethality: 0, health: 0 },
    },
    heroGear: {
      infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
      lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
      marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
    },
    allianceFacilities: { attack: 0, defense: 0 },
    petRefinement: {
      infantry: { lethality: 0, health: 0 },
      lancer: { lethality: 0, health: 0 },
      marksman: { lethality: 0, health: 0 },
      troops: { attack: 0, defense: 0 },
    },
    warAcademy: {
      infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
      lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
      marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    specialHeroes: { jeronimo: false, natalia: false },
    vipPrestige: { attack: 0, defense: 0, lethality: 0, health: 0 },
    globe: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };
}

function emptyAdditiveBonuses(): AdditiveBonuses {
  return {
    temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
    supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
    specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };
}

function emptyMultipliers(): MultiplicativeBonuses {
  return {
    castleBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    eventBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    petSkills: { attack: 0, defense: 0, lethality: 0, health: 0 },
    combatBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    exclusiveWeapon: { attack: 0, defense: 0, lethality: 0, health: 0 },
    allianceTerritory: { attack: 0, defense: 0, lethality: 0, health: 0 },
    tyrantSpire: { attack: 0, defense: 0, lethality: 0, health: 0 },
    cityBonuses: { attack: 0, defense: 0, lethality: 0, health: 0, enemyAttackReduction: 0, enemyDefenseReduction: 0, deploymentCapacity: 0 },
  };
}

describe('calculateBasicBonus', () => {
  it('returns all zeros for empty bonuses', () => {
    const result = calculateBasicBonus(emptyBasicBonuses(), 'infantry');
    expect(result.attack).toBe(0);
    expect(result.defense).toBe(0);
  });

  it('sums combat tech bonuses', () => {
    const basic = emptyBasicBonuses();
    basic.combatTech.troopTypeBonus.infantry.attack = 10;
    basic.combatTech.totalTroopBonus.attack = 5;
    const result = calculateBasicBonus(basic, 'infantry');
    expect(result.attack).toBe(15);
  });

  it('caps alliance tech at 10%', () => {
    const basic = emptyBasicBonuses();
    basic.allianceTech.attack = 20;
    const result = calculateBasicBonus(basic, 'infantry');
    expect(result.attack).toBe(10);
  });

  it('includes hero bonuses', () => {
    const basic = emptyBasicBonuses();
    basic.hero.attack = 25;
    basic.hero.defense = 15;
    const result = calculateBasicBonus(basic, 'infantry');
    expect(result.attack).toBe(25);
    expect(result.defense).toBe(15);
  });

  it('includes Jeronimo special hero bonus', () => {
    const basic = emptyBasicBonuses();
    basic.specialHeroes.jeronimo = true;
    const result = calculateBasicBonus(basic, 'infantry');
    expect(result.lethality).toBe(15);
    expect(result.health).toBe(15);
  });

  it('includes Natalia special hero bonus', () => {
    const basic = emptyBasicBonuses();
    basic.specialHeroes.natalia = true;
    const result = calculateBasicBonus(basic, 'infantry');
    expect(result.attack).toBe(10);
    expect(result.defense).toBe(10);
  });
});

describe('calculateAdditiveBonus', () => {
  it('sums all additive categories', () => {
    const additive = emptyAdditiveBonuses();
    additive.temporaryEvents.attack = 10;
    additive.supremePresident.attack = 5;
    additive.specialBuffs.attack = 3;
    const result = calculateAdditiveBonus(additive);
    expect(result.attack).toBe(18);
  });

  it('uses manual override when set', () => {
    const additive = emptyAdditiveBonuses();
    additive.temporaryEvents.attack = 10;
    additive.manualOverrideTotals = { infantry: { attack: 99 } };
    const result = calculateAdditiveBonus(additive, 'infantry');
    expect(result.attack).toBe(99);
  });
});

describe('calculateFinalStatValue', () => {
  it('applies buff and debuff formula correctly', () => {
    const mult = emptyMultipliers();
    mult.castleBuffs.attack = 20;
    const result = calculateFinalStatValue(100, mult, 'attack', 'infantry');
    expect(result).toBeCloseTo(100 * 1.2, 5);
  });

  it('applies enemy debuffs as divisor', () => {
    const mult = emptyMultipliers();
    const enemy = emptyMultipliers();
    enemy.combatDebuffs.attack = 50;
    const result = calculateFinalStatValue(100, mult, 'attack', 'infantry', enemy);
    expect(result).toBeCloseTo(100 / 1.5, 5);
  });
});

describe('calculateFinalStats', () => {
  it('combines basic + additive + multiplicative layers', () => {
    const basic = emptyBasicBonuses();
    basic.combatTech.totalTroopBonus.attack = 50;
    const additive = emptyAdditiveBonuses();
    additive.temporaryEvents.attack = 50;
    const mult = emptyMultipliers();

    const result = calculateFinalStats(basic, additive, mult, 'infantry');
    expect(result.attack).toBe(100);
  });
});

describe('roundFinalStats', () => {
  it('rounds to specified decimal places', () => {
    const stats: FinalStats = { attack: 100.567, defense: 50.1234, lethality: 75.999, health: 80.001 };
    const rounded = roundFinalStats(stats, 2);
    expect(rounded.attack).toBe(100.57);
    expect(rounded.defense).toBe(50.12);
  });
});

describe('calculateDamage', () => {
  it('returns positive damage for valid inputs', () => {
    const dmg = calculateDamage(100, 50, 30, 40);
    expect(dmg).toBeGreaterThan(0);
  });

  it('returns 0 for zero troops', () => {
    const dmg = calculateDamage(0, 50, 30, 40);
    expect(dmg).toBe(0);
  });

  it('applies damage up modifier', () => {
    const base = calculateDamage(100, 50, 30, 40);
    const withMod = calculateDamage(100, 50, 30, 40, 1, { attackerDamageUpPct: 25 });
    expect(withMod).toBeGreaterThan(base);
  });

  it('applies damage reduction modifier', () => {
    const base = calculateDamage(100, 50, 30, 40);
    const withRed = calculateDamage(100, 50, 30, 40, 1, { defenderDamageReductionPct: 50 });
    expect(withRed).toBeLessThan(base);
  });
});

describe('calculatePowerIndex', () => {
  it('returns higher value for better stats', () => {
    const weak: FinalStats = { attack: 10, defense: 10, lethality: 10, health: 10 };
    const strong: FinalStats = { attack: 100, defense: 100, lethality: 100, health: 100 };
    expect(calculatePowerIndex(strong, 100)).toBeGreaterThan(calculatePowerIndex(weak, 100));
  });
});

describe('calculateBalanceRatio', () => {
  it('returns ~1 for equal sides', () => {
    const stats: FinalStats = { attack: 100, defense: 100, lethality: 100, health: 100 };
    const ratio = calculateBalanceRatio(stats, 100, stats, 100);
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('returns > 1 when attacker is stronger', () => {
    const strong: FinalStats = { attack: 200, defense: 200, lethality: 200, health: 200 };
    const weak: FinalStats = { attack: 100, defense: 100, lethality: 100, health: 100 };
    const ratio = calculateBalanceRatio(strong, 100, weak, 100);
    expect(ratio).toBeGreaterThan(1);
  });
});
