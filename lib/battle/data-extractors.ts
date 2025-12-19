/**
 * Data Extractors - Convert game data files into bonus values
 */

import type { StatType, TroopType } from './calculations';
import { CHIEF_CHARMS_DATA } from './data/chief_charms/chief_charms';
import { CHIEF_GEAR_DATA } from './data/chief_gear/chief_gear';
import { getHeroByName } from './data/heroes/hero-extractor';
import { BATTLE_RESEARCH } from './data/research/research';
import { WAR_ACADEMY_DATA } from './data/war_academy/war_academy';


/**
 * Extract Chief Gear bonuses
 * gearLevels: { Cap: { tier, stars, step? }, Coat: {...}, etc. }
 */
export function getChiefGearBonuses(gearLevels: Record<string, { tier: string; stars: number; step?: number }>): { attack: number; defense: number } {
  let totalAttack = 0;
  let totalDefense = 0;

  for (const [gearType, level] of Object.entries(gearLevels)) {
    const gearData = CHIEF_GEAR_DATA[gearType as keyof typeof CHIEF_GEAR_DATA];
    if (!gearData) continue;

    const match = gearData.find(g => {
      if (g.Tier !== level.tier) return false;
      if (g.Stars !== level.stars) return false;
      if (level.step !== undefined && 'Step' in g && g.Step !== level.step) return false;
      return true;
    });

    if (match) {
      const attackStr = match.Attack as string;
      const defenseStr = match.Defense as string;

      totalAttack += parseFloat(attackStr.replace('%', '')) || 0;
      totalDefense += parseFloat(defenseStr.replace('%', '')) || 0;
    }
  }

  return { attack: totalAttack, defense: totalDefense };
}

/**
 * Extract Chief Charm bonuses organized by gear piece and troop type
 * charmLevels: object with gear piece as key and array of 3 charm levels
 * Mapping: Cap/Watch = Lancer, Coat/Pants = Infantry, Ring/Weapon = Marksman
 */
export function getChiefCharmBonuses(charmLevels: Record<string, number[]>): {
  infantry: { lethality: number; health: number };
  lancer: { lethality: number; health: number };
  marksman: { lethality: number; health: number };
} {
  const bonuses = {
    infantry: { lethality: 0, health: 0 },
    lancer: { lethality: 0, health: 0 },
    marksman: { lethality: 0, health: 0 },
  };

  // Map gear pieces to troop types
  const pieceToTroopType: Record<string, 'infantry' | 'lancer' | 'marksman'> = {
    'Cap': 'lancer',
    'Watch': 'lancer',
    'Coat': 'infantry',
    'Pants': 'infantry',
    'Ring': 'marksman',
    'Weapon': 'marksman',
  };

  // Process each gear piece
  for (const [gearPiece, levels] of Object.entries(charmLevels)) {
    const troopType = pieceToTroopType[gearPiece];
    if (!troopType) continue;

    // Sum the 3 charms for this piece
    for (const level of levels) {
      const charm = CHIEF_CHARMS_DATA.find(c => c.Level === level);
      if (charm) {
        bonuses[troopType].lethality += charm.Lethality * 100; // Convert to percentage
        bonuses[troopType].health += charm.Health * 100;
      }
    }
  }

  return bonuses;
}

/**
 * Extract Research bonuses
 * researchLevels: { category: { tierLabel: level } }
 */
export function getResearchBonuses(
  researchLevels: Record<string, Record<string, number>>,
  troopType: TroopType
): { troopTypeBonus: Record<TroopType, Record<StatType, number>>; totalTroopBonus: Record<StatType, number> } {
  const troopTypeBonus: Record<TroopType, Record<StatType, number>> = {
    infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
    lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
    marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };

  const totalTroopBonus: Record<StatType, number> = {
    attack: 0,
    defense: 0,
    lethality: 0,
    health: 0,
  };

  const research = BATTLE_RESEARCH['Battle Research'];

  for (const [category, tiers] of Object.entries(researchLevels)) {
    const categoryData = research[category];
    if (!categoryData) continue;

    for (const [tierLabel, level] of Object.entries(tiers)) {
      const tierData = categoryData[tierLabel];
      if (!tierData) continue;

      const node = tierData.find(n => n.level === level);
      if (!node) continue;

      // Check each stat field
      for (const [key, value] of Object.entries(node)) {
        if (key === 'level' || key === 'power' || typeof value === 'string') continue;

        const statValue = value as number;

        // Handle troop-specific stats
        if (key.includes('Infantry')) {
          if (key.includes('Attack')) troopTypeBonus.infantry.attack += statValue;
          else if (key.includes('Defense')) troopTypeBonus.infantry.defense += statValue;
          else if (key.includes('Lethality')) troopTypeBonus.infantry.lethality += statValue;
          else if (key.includes('Health')) troopTypeBonus.infantry.health += statValue;
        } else if (key.includes('Lancer')) {
          if (key.includes('Attack')) troopTypeBonus.lancer.attack += statValue;
          else if (key.includes('Defense')) troopTypeBonus.lancer.defense += statValue;
          else if (key.includes('Lethality')) troopTypeBonus.lancer.lethality += statValue;
          else if (key.includes('Health')) troopTypeBonus.lancer.health += statValue;
        } else if (key.includes('Marksman')) {
          if (key.includes('Attack')) troopTypeBonus.marksman.attack += statValue;
          else if (key.includes('Defense')) troopTypeBonus.marksman.defense += statValue;
          else if (key.includes('Lethality')) troopTypeBonus.marksman.lethality += statValue;
          else if (key.includes('Health')) troopTypeBonus.marksman.health += statValue;
        } else if (key.includes('Troop')) {
          // Applies to all troop types
          if (key.includes('Attack')) {
            totalTroopBonus.attack += statValue;
            troopTypeBonus.infantry.attack += statValue;
            troopTypeBonus.lancer.attack += statValue;
            troopTypeBonus.marksman.attack += statValue;
          } else if (key.includes('Defense')) {
            totalTroopBonus.defense += statValue;
            troopTypeBonus.infantry.defense += statValue;
            troopTypeBonus.lancer.defense += statValue;
            troopTypeBonus.marksman.defense += statValue;
          } else if (key.includes('Lethality')) {
            totalTroopBonus.lethality += statValue;
            troopTypeBonus.infantry.lethality += statValue;
            troopTypeBonus.lancer.lethality += statValue;
            troopTypeBonus.marksman.lethality += statValue;
          } else if (key.includes('Health')) {
            totalTroopBonus.health += statValue;
            troopTypeBonus.infantry.health += statValue;
            troopTypeBonus.lancer.health += statValue;
            troopTypeBonus.marksman.health += statValue;
          }
        }
      }
    }
  }

  return { troopTypeBonus, totalTroopBonus };
}

/**
 * Extract War Academy bonuses
 */
export function getWarAcademyBonuses(academyLevels: Record<string, number>): Record<TroopType, Record<StatType, number>> {
  const bonuses: Record<TroopType, Record<StatType, number>> = {
    infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
    lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
    marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };

  for (const [techKey, level] of Object.entries(academyLevels)) {
    // Handle both old format (just tech name) and new format (techName-troopType)
    let techName: string;
    let expectedType: TroopType | undefined;

    if (techKey.includes('-')) {
      // New format: "TechName-troopType"
      const parts = techKey.split('-');
      techName = parts.slice(0, -1).join('-'); // Handle tech names that might contain dashes
      expectedType = parts[parts.length - 1] as TroopType;
    } else {
      // Old format: just tech name (for backward compatibility)
      techName = techKey;
    }

    // Find the tech - if we have an expected type, match both name and type
    const tech = expectedType
      ? WAR_ACADEMY_DATA.War_Academy_tech.find(t => t.name === techName && t.type === expectedType)
      : WAR_ACADEMY_DATA.War_Academy_tech.find(t => t.name === techName);

    if (!tech) continue;

    const levelValue = tech.level[level.toString()];
    if (levelValue === undefined) continue;

    const effect = tech.effect.toLowerCase();
    const type = tech.type as TroopType;

    if (effect.includes('attack')) {
      bonuses[type].attack += levelValue * 100; // Convert to percentage
    } else if (effect.includes('defense')) {
      bonuses[type].defense += levelValue * 100;
    } else if (effect.includes('lethality')) {
      bonuses[type].lethality += levelValue * 100;
    } else if (effect.includes('health')) {
      bonuses[type].health += levelValue * 100;
    }
  }

  return bonuses;
}

/**
 * Extract Hero bonuses (for rally leader)
 * heroName: name of the hero
 * heroLevel: level of the hero's expedition skills
 * starLevel: star level of the hero
 * generation: generation of the hero
 * exclusiveWeaponLevel: level of exclusive weapon (if applicable)
 */
export function getHeroBonuses(
  heroName: string,
  heroLevel: number,
  starLevel: number,
  generation: number,
  exclusiveWeaponLevel?: number
): { attack: number; defense: number; lethality: number; health: number } {
  const hero = getHeroByName(heroName);
  if (!hero) {
    return { attack: 0, defense: 0, lethality: 0, health: 0 };
  }

  const bonuses = { attack: 0, defense: 0, lethality: 0, health: 0 };

  // Hero base stats: ATK/DEF = rarity × gen × star level
  // For simplicity, we'll use a multiplier based on generation and star level
  // This is a simplified calculation - actual values depend on rarity
  const rarityMultiplier = generation * starLevel * 0.5; // Simplified
  bonuses.attack += rarityMultiplier;
  bonuses.defense += rarityMultiplier;

  // Exclusive weapon: LETH/HP
  if (hero['exclusive-weapon'] && exclusiveWeaponLevel !== undefined) {
    const weaponLevel = hero['exclusive-weapon'].levels.find(l => l.level === exclusiveWeaponLevel);
    if (weaponLevel) {
      bonuses.lethality += (weaponLevel['infantry-lethality'] || 0) * 100;
      bonuses.health += (weaponLevel['infantry-health'] || 0) * 100;
      bonuses.lethality += (weaponLevel['lancer-lethality'] || 0) * 100;
      bonuses.health += (weaponLevel['lancer-health'] || 0) * 100;
      bonuses.lethality += (weaponLevel['marksman-lethality'] || 0) * 100;
      bonuses.health += (weaponLevel['marksman-health'] || 0) * 100;
    }
  }

  return bonuses;
}

