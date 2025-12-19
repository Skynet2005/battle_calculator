/**
 * Data Selectors - Extract and format data from component files for UI
 */

import type { FireCrystalLevel, TroopTier, TroopType } from '../../components/types';
import { CHIEF_CHARMS_DATA } from './data/chief_charms/chief_charms';
import { CHIEF_GEAR_DATA } from './data/chief_gear/chief_gear';
import { getAllHeroes, getHeroesByClass } from './data/heroes/hero-extractor';
import type { Hero, SkillLevel } from './data/heroes/hero_types';
import { BATTLE_RESEARCH } from './data/research/research';
import { TROOP_DEFINITIONS } from './data/troops/troop_levels';
import { WAR_ACADEMY_DATA } from './data/war_academy/war_academy';

type RawTroopDefinition = (typeof TROOP_DEFINITIONS)[keyof typeof TROOP_DEFINITIONS];

interface ParsedTroopKey {
  type: TroopType;
  tier: TroopTier;
  fireCrystalLevel: FireCrystalLevel;
}

function parseTroopKey(key: string): ParsedTroopKey | null {
  const isHelios = key.includes('Helios');
  const typeMatch = key.match(/(Infantry|Lancer|Marksman)/i);
  const fcMatch = key.match(/FC(\d+)/i);

  if (!typeMatch || !fcMatch) return null;

  const type = typeMatch[1].toLowerCase() as TroopType;
  const fireCrystalLevel = parseInt(fcMatch[1], 10) as FireCrystalLevel;
  const tier = isHelios ? 'helios' : 'normal';

  return { type, tier, fireCrystalLevel };
}

function selectTroopDefinition(
  type: TroopType,
  tier: TroopTier,
  fireCrystalLevel: FireCrystalLevel
): RawTroopDefinition | null {
  const entry = Object.entries(TROOP_DEFINITIONS).find(([key]) => {
    const parsed = parseTroopKey(key);
    return parsed?.type === type &&
      parsed?.tier === tier &&
      parsed?.fireCrystalLevel === fireCrystalLevel;
  });

  return entry ? entry[1] : null;
}

function formatTroopDefinitionLabel(key: string, definition: RawTroopDefinition): string {
  const parsed = parseTroopKey(key);
  if (!parsed) return key;
  const prefix = parsed.tier === 'helios' ? 'Helios ' : '';
  const typeName = parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1);
  return `${prefix}${typeName} (FC${parsed.fireCrystalLevel})`;
}

/**
 * Get all heroes grouped by class
 */
export function getHeroesByClassForSelect(): {
  infantry: Hero[];
  lancer: Hero[];
  marksman: Hero[];
} {
  return {
    infantry: getHeroesByClass('infantry'),
    lancer: getHeroesByClass('lancer'),
    marksman: getHeroesByClass('marksman'),
  };
}

/**
 * Get all heroes for selection
 */
export function getAllHeroesForSelect(): Hero[] {
  return getAllHeroes();
}

/**
 * Get Chief Gear options for a specific gear type
 */
export function getChiefGearOptions(gearType: string) {
  const gearData = CHIEF_GEAR_DATA[gearType as keyof typeof CHIEF_GEAR_DATA];
  if (!gearData) return [];

  return gearData.map(gear => ({
    tier: gear.Tier,
    stars: gear.Stars,
    step: gear.Step,
    attack: gear.Attack,
    defense: gear.Defense,
    power: gear['Power Total'],
    marchCapacity: gear['March Capacity'] || 0,
    label: `${gear.Tier} - ${gear.Stars} Stars${gear.Step !== undefined ? ` - Step ${gear.Step}` : ''}`,
  }));
}

/**
 * Get all Chief Gear types
 */
export function getChiefGearTypes(): string[] {
  return Object.keys(CHIEF_GEAR_DATA);
}

/**
 * Get Charm levels
 */
export function getCharmLevels() {
  return CHIEF_CHARMS_DATA.map(charm => ({
    level: charm.Level,
    lethality: charm.Lethality * 100, // Convert to percentage
    health: charm.Health * 100,
  }));
}

/**
 * Get Research categories
 */
export function getResearchCategories(): string[] {
  return Object.keys(BATTLE_RESEARCH['Battle Research']);
}

/**
 * Get Research tier labels for a category
 */
export function getResearchTierLabels(category: string): string[] {
  const categoryData = BATTLE_RESEARCH['Battle Research'][category];
  if (!categoryData) return [];
  return Object.keys(categoryData);
}

/**
 * Get Research levels for a category and tier
 */
export function getResearchLevels(category: string, tierLabel: string) {
  const categoryData = BATTLE_RESEARCH['Battle Research'][category];
  if (!categoryData) return [];

  const tierData = categoryData[tierLabel];
  if (!tierData) return [];

  return tierData.map(node => ({
    level: node.level,
    power: node.power,
    stats: Object.keys(node)
      .filter(key => key !== 'level' && key !== 'power' && typeof node[key] === 'number')
      .map(key => ({ name: key, value: node[key] as number })),
  }));
}

/**
 * Get War Academy tech options
 */
export function getWarAcademyTech() {
  return WAR_ACADEMY_DATA.War_Academy_tech.map(tech => ({
    name: tech.name,
    effect: tech.effect,
    type: tech.type,
    levels: Object.keys(tech.level).map(level => ({
      level: parseInt(level),
      value: tech.level[level as keyof typeof tech.level],
    })),
  }));
}


/**
 * Get Troop Definition options
 */
export function getTroopDefinitionOptions(type: TroopType, tier: TroopTier, fireCrystalLevel: FireCrystalLevel) {
  return selectTroopDefinition(type, tier, fireCrystalLevel);
}

/**
 * Get all available troop definitions for a type
 */
export function getAllTroopDefinitionsForType(type: TroopType) {
  return Object.entries(TROOP_DEFINITIONS)
    .filter(([key]) => {
      const parsed = parseTroopKey(key);
      return parsed?.type === type;
    })
    .map(([key, definition]) => {
      const parsed = parseTroopKey(key)!;
      return {
        key,
        tier: parsed.tier,
        fireCrystalLevel: parsed.fireCrystalLevel,
        stats: definition,
        label: formatTroopDefinitionLabel(key, definition),
      };
    });
}

/**
 * Get hero expedition skills
 */
export function getHeroExpeditionSkills(hero: Hero) {
  const skills: Array<{ name: string; description: string; data: any }> = [];

  for (const key in hero.skills.expedition) {
    const skill = hero.skills.expedition[key];
    if (skill && skill['skill-name']) {
      skills.push({
        name: skill['skill-name'],
        description: skill.description || '',
        data: skill,
      });
    }
  }

  return skills;
}

/**
 * Get hero skill level options (for joiners, only level 1)
 */
export function getHeroSkillLevelOptions(skill: any, isJoiner: boolean = false): SkillLevel[] {
  if (isJoiner) {
    return [1];
  }

  const levels = new Set<SkillLevel>();

  Object.entries(skill as Record<string, unknown>).forEach(([key, value]) => {
    if (/^\d+$/.test(key)) {
      levels.add(clampSkillLevel(Number(key)));
      return;
    }
    if (typeof value === 'object' && value !== null) {
      Object.keys(value as Record<string, unknown>)
        .filter((nestedKey) => /^\d+$/.test(nestedKey))
        .forEach((nestedKey) => levels.add(clampSkillLevel(Number(nestedKey))));
    }
  });

  if (!levels.size) {
    return [1, 2, 3, 4, 5];
  }

  return Array.from(levels).sort((a, b) => a - b) as SkillLevel[];
}

function clampSkillLevel(value: number): SkillLevel {
  const clamped = Math.max(1, Math.min(5, Math.floor(value)));
  return clamped as SkillLevel;
}

