/**
 * Extract bonuses from Rally Configuration (Leaders and Joiners)
 * and automatically populate Additive and Multiplicative bonuses
 */

import type { RallyConfiguration, RallyHero } from '@/shared/types';
import type {
  HeroSkillLevelPercent,
  LevelSkill,
  SkillLevel,
  SkillLevelKey,
  SkillLevelsByName
} from '../battle';
import { getHeroByName } from '../battle';
import type { AdditiveBonuses, BasicBonuses, MultiplicativeBonuses, TroopScope, TroopType } from '../battle/calculations';
import { getHeroExpeditionSkills } from '../battle/data-selectors';

/**
 * Extract value from skill property at a specific level
 */
function extractSkillValue(
  skillProperty: number | HeroSkillLevelPercent | undefined,
  level: SkillLevel
): number {
  if (!skillProperty) return 0;

  if (typeof skillProperty === 'number') {
    return skillProperty;
  }

  // It's a level-based object
  const levelValue =
    skillProperty[level.toString() as SkillLevelKey] ??
    skillProperty['1'];
  if (typeof levelValue === 'number') {
    return levelValue;
  }

  return 0;
}

/**
 * Get the maximum skill level available for a skill property
 */
function getMaxSkillLevel(skillProperty: number | HeroSkillLevelPercent | undefined): SkillLevel {
  if (!skillProperty) return 1;

  if (typeof skillProperty === 'number') {
    return 1; // Flat value, no levels
  }

  // It's a level-based object - find the highest level key
  const levelKeys = Object.keys(skillProperty)
    .filter(k => !isNaN(parseInt(k)))
    .map(k => parseInt(k))
    .sort((a, b) => b - a); // Sort descending

  return (levelKeys.length > 0 ? levelKeys[0] : 1) as SkillLevel;
}

/**
 * Extract bonuses from a hero's expedition skills
 * @param mode - 'attacking' or 'defending' to filter which stats apply
 */
function extractHeroSkillBonuses(
  hero: any,
  skillLevels: SkillLevelsByName,
  isJoiner: boolean = false,
  mode?: 'attacking' | 'defending'
): {
  additive: {
    attack: number;
    defense: number;
    lethality: number;
    health: number;
  };
  multiplicative: {
    attack: number;
    defense: number;
    lethality: number;
    health: number;
  };
} {
  const additive = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const multiplicative = { attack: 0, defense: 0, lethality: 0, health: 0 };

  const skills = getHeroExpeditionSkills(hero);

  skills.forEach(skill => {
    const skillData = skill.data as LevelSkill;
    if (!skillData) return;

    // Check skill description to determine if it's for attacking or defending
    const description = (skillData.description || '').toLowerCase();
    const isAttackingSkill = description.includes('rally') || description.includes('attacking');
    const isDefendingSkill = description.includes('defender') || description.includes('defending');

    // If mode is specified, filter based on skill type
    if (mode === 'attacking' && isDefendingSkill) {
      return; // Skip defending skills when in attacking mode
    }
    if (mode === 'defending' && isAttackingSkill) {
      return; // Skip attacking skills when in defending mode
    }

    // Additional check: if mode is set but skill type is unclear, check properties
    // If mode is 'attacking' and we find defender_troops properties, skip the skill
    // If mode is 'defending' and we find rally_troops properties, skip the skill
    if (mode) {
      const hasDefenderProperties = Object.keys(skillData).some(key =>
        key.includes('defender_troops') && !key.includes('all_troops')
      );
      const hasRallyProperties = Object.keys(skillData).some(key =>
        key.includes('rally_troops') && !key.includes('all_troops')
      );

      if (mode === 'attacking' && hasDefenderProperties && !hasRallyProperties && !isAttackingSkill) {
        return; // Skip skills with only defender properties when attacking
      }
      if (mode === 'defending' && hasRallyProperties && !hasDefenderProperties && !isDefendingSkill) {
        return; // Skip skills with only rally properties when defending
      }
    }

    // Leaders use their configured level
    // Note: Joiners are handled separately in extractJoinerBonuses
    const level: SkillLevel = isJoiner ? 1 : (skillLevels[skill.name] ?? 1);

    // Process all skill properties
    Object.keys(skillData).forEach(key => {
      if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;

      const value = extractSkillValue(skillData[key as keyof LevelSkill] as any, level);
      if (value === 0) return;

      const percentage = value * 100;

      // Route to additive or multiplicative based on property type
      if (key.includes('attack_increase') || key.includes('defense_increase') ||
        key.includes('health_increase') || key.includes('lethality_increase')) {
        // These are additive bonuses
        // Filter based on mode: attacking only gets attack, defending gets defense/lethality/health
        if (mode === 'attacking') {
          // Only include attack bonuses when attacking
          if (key.includes('all_troops_attack_increase') || key.includes('rally_troops_attack_increase') ||
            (key.includes('attack_increase') && !key.includes('all_troops') && !key.includes('rally'))) {
            additive.attack += percentage;
          }
        } else if (mode === 'defending') {
          // Only include defense/lethality/health bonuses when defending
          if (key.includes('all_troops_defense_increase') || (key.includes('defense_increase') && !key.includes('all_troops'))) {
            additive.defense += percentage;
          } else if (key.includes('rally_troops_lethality_increase') || (key.includes('lethality_increase') && !key.includes('rally'))) {
            additive.lethality += percentage;
          } else if (key.includes('all_troops_health_increase') || key.includes('rally_troops_health_increase') ||
            (key.includes('health_increase') && !key.includes('all_troops') && !key.includes('rally'))) {
            additive.health += percentage;
          }
        } else {
          // No mode specified, include all (for backward compatibility)
          if (key.includes('all_troops_attack_increase')) {
            additive.attack += percentage;
          } else if (key.includes('all_troops_defense_increase')) {
            additive.defense += percentage;
          } else if (key.includes('all_troops_health_increase')) {
            additive.health += percentage;
          } else if (key.includes('rally_troops_attack_increase')) {
            additive.attack += percentage;
          } else if (key.includes('rally_troops_health_increase')) {
            additive.health += percentage;
          } else if (key.includes('rally_troops_lethality_increase')) {
            additive.lethality += percentage;
          } else if (key.includes('attack_increase') && !key.includes('all_troops') && !key.includes('rally')) {
            additive.attack += percentage;
          } else if (key.includes('defense_increase') && !key.includes('all_troops')) {
            additive.defense += percentage;
          } else if (key.includes('health_increase') && !key.includes('all_troops') && !key.includes('rally')) {
            additive.health += percentage;
          } else if (key.includes('lethality_increase') && !key.includes('rally')) {
            additive.lethality += percentage;
          }
        }
      } else if (
        key.includes('damage_reduction') ||
        key.includes('damage_taken_decrease') ||
        key.includes('damage_from_attacks_reduction') ||
        key.includes('damage_from_skills_reduction')
      ) {
        // These are multiplicative (defensive)
        if (!mode || mode === 'defending') {
          multiplicative.defense += percentage;
        }
      } else if (key.includes('damage_increase') || key.includes('damage_dealt_increase') ||
        key.includes('damage_boost') || key.includes('damage_percentage') ||
        key.includes('additional_damage') || key.includes('skill_damage_increase')) {
        // These are multiplicative (offensive)
        if (!mode || mode === 'attacking') {
          multiplicative.attack += percentage;
        } else if (!mode) {
          multiplicative.attack += percentage;
        }
      }
    });
  });

  return { additive, multiplicative };
}

const TROOP_TYPES: TroopType[] = ['infantry', 'lancer', 'marksman'];

/**
 * Extract exclusive weapon bonuses
 * LETH/HP bonuses go to basic bonuses
 * Expedition skills go to additive bonuses (Special Buffs) and are filtered by mode
 * @param mode - 'attacking' or 'defending' to filter which stats apply (required)
 */
function extractExclusiveWeaponBonuses(
  hero: any,
  weaponLevel: number | undefined,
  mode: 'attacking' | 'defending' // Mode is now required
): {
  basic: { attack: number; defense: number; lethality: number; health: number };
  additive: { attack: number; defense: number; lethality: number; health: number };
  multiplicative: { attack: number; defense: number; lethality: number; health: number };
} {
  const basic = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const additive = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const multiplicative = { attack: 0, defense: 0, lethality: 0, health: 0 };

  if (!hero['exclusive-weapon'] || weaponLevel === undefined) {
    return { basic, additive, multiplicative };
  }

  // Ensure mode is always defined
  if (!mode) {
    console.warn('extractExclusiveWeaponBonuses: mode is required but was undefined, defaulting to attacking');
    mode = 'attacking';
  }

  const weapon = hero['exclusive-weapon'];
  const weaponLevelData = weapon.levels.find((l: any) => l.level === weaponLevel);

  if (!weaponLevelData) return { basic, additive, multiplicative };

  // Exclusive weapons provide LETH/HP bonuses (additive to basic)
  // These are always applied regardless of mode
  const troopType = hero['hero-class'] as 'infantry' | 'lancer' | 'marksman';
  if (troopType && weaponLevelData[`${troopType}-lethality`]) {
    basic.lethality += (weaponLevelData[`${troopType}-lethality`] || 0) * 100;
  }
  if (troopType && weaponLevelData[`${troopType}-health`]) {
    basic.health += (weaponLevelData[`${troopType}-health`] || 0) * 100;
  }

  // Process exclusive weapon expedition skills
  if (weaponLevelData.skills?.expedition) {
    const skill = weaponLevelData.skills.expedition;
    // Handle null skills (some weapons have null expedition skills at certain levels)
    if (!skill || skill === null) {
      return { basic, additive, multiplicative };
    }

    // First, check if this skill has defender_troops or rally_troops properties
    // to determine if it should be filtered by mode
    const skillKeys = Object.keys(skill);
    const hasDefenderTroopsProps = skillKeys.some(key =>
      key.includes('defender_troops') && !key.includes('all_troops')
    );
    const hasRallyTroopsProps = skillKeys.some(key =>
      key.includes('rally_troops') && !key.includes('all_troops')
    );

    // Early exit: Skip defender skills when in attacking mode
    if (hasDefenderTroopsProps && !hasRallyTroopsProps && mode === 'attacking') {
      // Skip this entire skill - it's a defender skill but we're in attacking mode
      return { basic, additive, multiplicative };
    }
    // Early exit: Skip rally skills when in defending mode
    if (hasRallyTroopsProps && !hasDefenderTroopsProps && mode === 'defending') {
      // Skip this entire skill - it's a rally skill but we're in defending mode
      return { basic, additive, multiplicative };
    }

    // Process skill properties
    Object.keys(skill).forEach(key => {
      if (key === 'skill-name' || key === 'description') return;

      const value = skill[key];
      if (typeof value !== 'number' || value === 0) return;

      const percentage = value * 100;
      const isDamageReduction =
        key.includes('damage_reduction') ||
        key.includes('damage_taken_decrease') ||
        key.includes('damage_from_attacks_reduction') ||
        key.includes('damage_from_skills_reduction');
      const isDamageIncrease =
        key.includes('damage_increase') ||
        key.includes('damage_dealt_increase') ||
        key.includes('damage_boost') ||
        key.includes('damage_percentage') ||
        key.includes('additional_damage') ||
        key.includes('skill_damage_increase');

      // Handle defender_troops skills (defending mode only)
      if (key.includes('defender_troops')) {
        // Strict check: only apply in defending mode
        if (mode !== 'defending') {
          return; // Skip this property
        }
        if (isDamageReduction) {
          multiplicative.defense += percentage;
          return;
        }
        if (isDamageIncrease) {
          multiplicative.attack += percentage;
          return;
        }
        if (key.includes('attack_increase')) {
          additive.attack += percentage;
        } else if (key.includes('defense_increase')) {
          additive.defense += percentage;
        } else if (key.includes('health_increase')) {
          additive.health += percentage;
        } else if (key.includes('lethality_increase')) {
          additive.lethality += percentage;
        }
      }
      // Handle rally_troops skills (attacking mode only)
      else if (key.includes('rally_troops')) {
        // Strict check: only apply in attacking mode
        if (mode !== 'attacking') {
          return; // Skip this property
        }
        if (isDamageReduction) {
          multiplicative.defense += percentage;
          return;
        }
        if (isDamageIncrease) {
          multiplicative.attack += percentage;
          return;
        }
        if (key.includes('attack_increase')) {
          additive.attack += percentage;
        } else if (key.includes('health_increase')) {
          additive.health += percentage;
        } else if (key.includes('lethality_increase')) {
          additive.lethality += percentage;
        }
      }
      // Handle all_troops skills (apply based on stat type and mode)
      // Exclusive weapon skills can have all_troops properties that apply to all troops
      else if (key.includes('all_troops') && !key.includes('defender')) {
        // For all_troops skills, apply based on what stat they affect and the mode
        if (isDamageReduction) {
          if (mode === 'defending') {
            multiplicative.defense += percentage;
          }
          return;
        }
        if (isDamageIncrease) {
          if (mode === 'attacking') {
            multiplicative.attack += percentage;
          }
          return;
        }
        if (key.includes('attack_increase')) {
          // Attack bonuses apply in attacking mode
          if (mode === 'attacking') {
            additive.attack += percentage;
          }
        } else if (key.includes('defense_increase')) {
          // Defense bonuses apply in defending mode
          if (mode === 'defending') {
            additive.defense += percentage;
          }
        } else if (key.includes('health_increase')) {
          // Health bonuses apply in defending mode
          if (mode === 'defending') {
            additive.health += percentage;
          }
        } else if (key.includes('lethality_increase')) {
          // Lethality bonuses apply in defending mode
          if (mode === 'defending') {
            additive.lethality += percentage;
          }
        }
        // Note: all_troops damage bonuses are multiplicative, not additive
        // They are handled above via isDamageIncrease/isDamageReduction
      }
    });
  }

  return { basic, additive, multiplicative };
}

/**
 * Extract leader bonuses (go to Basic Bonuses for hero stats, Additive/Multiplicative for skills)
 * @param mode - 'attacking' or 'defending' to filter which stats apply (required)
 * @param xpLevel - Optional XP level (0-80) to scale base stats. If not provided, assumes max level (80)
 */
export function extractLeaderBonuses(
  leader: RallyHero | null,
  mode: 'attacking' | 'defending', // Mode is now required
  xpLevel?: number // Optional XP level for scaling base stats
): {
  basic: { attack: number; defense: number; lethality: number; health: number };
  additive: { attack: number; defense: number; lethality: number; health: number };
  multiplicative: { attack: number; defense: number; lethality: number; health: number };
} {
  const basic = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const additive = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const multiplicative = { attack: 0, defense: 0, lethality: 0, health: 0 };

  if (!leader || !leader.heroName) return { basic, additive, multiplicative };

  const hero = getHeroByName(leader.heroName);
  if (!hero) return { basic, additive, multiplicative };

  // Ensure mode is always defined
  if (!mode) {
    console.warn('extractLeaderBonuses: mode is required but was undefined, defaulting to attacking');
    mode = 'attacking';
  }

  // Hero base stats (from hero data, scaled by star level and XP level)
  // Base stats in heroes.ts are at MAX star level (30) and MAX XP level (80)
  // Scale them based on actual star level and XP level
  const heroClass = leader.heroClass || hero['hero-class'] as 'infantry' | 'lancer' | 'marksman';
  if (hero['base-stats'] && heroClass) {
    const maxBaseAttack = hero['base-stats'][`${heroClass}-attack` as keyof typeof hero['base-stats']] as number | undefined;
    const maxBaseDefense = hero['base-stats'][`${heroClass}-defense` as keyof typeof hero['base-stats']] as number | undefined;

    if (maxBaseAttack !== undefined) {
      // Scale by star level (0-30) and XP level (0-80)
      // If xpLevel not provided, default to 80 (max level)
      const effectiveXpLevel = xpLevel !== undefined ? Math.max(0, Math.min(xpLevel, 80)) : 80;
      const starLevelMultiplier = leader.starLevel / 30; // Scale from 0 to 1
      const xpLevelMultiplier = effectiveXpLevel / 80; // Scale from 0 to 1
      // Base stats scale with both star level and XP level
      const scaledBaseAttack = maxBaseAttack * starLevelMultiplier * xpLevelMultiplier;
      basic.attack += scaledBaseAttack * 100; // Convert decimal to percentage
    }

    if (maxBaseDefense !== undefined) {
      // Scale by star level (0-30) and XP level (0-80)
      const effectiveXpLevel = xpLevel !== undefined ? Math.max(0, Math.min(xpLevel, 80)) : 80;
      const starLevelMultiplier = leader.starLevel / 30; // Scale from 0 to 1
      const xpLevelMultiplier = effectiveXpLevel / 80; // Scale from 0 to 1
      // Base stats scale with both star level and XP level
      const scaledBaseDefense = maxBaseDefense * starLevelMultiplier * xpLevelMultiplier;
      basic.defense += scaledBaseDefense * 100; // Convert decimal to percentage
    }
  }

  // Extract skill bonuses (filtered by mode)
  // NOTE: Hero skills are NOT included in Special Buffs - they go to Basic Bonuses or Multiplicative Bonuses
  // Special Buffs only includes exclusive weapon skills and joiner bonuses
  const skillBonuses = extractHeroSkillBonuses(hero, leader.skillLevels, false, mode);
  // Hero skills go to multiplicative bonuses (for damage increases) or basic bonuses (for stat increases)
  // They are NOT added to additive.specialBuffs
  multiplicative.attack += skillBonuses.multiplicative.attack;
  multiplicative.defense += skillBonuses.multiplicative.defense;
  multiplicative.lethality += skillBonuses.multiplicative.lethality;
  multiplicative.health += skillBonuses.multiplicative.health;
  // Note: Hero skill additive bonuses are NOT included in Special Buffs

  // Exclusive weapon bonuses (mode is required)
  const weaponBonuses = extractExclusiveWeaponBonuses(hero, leader.exclusiveWeaponLevel, mode);
  // Exclusive weapons provide LETH/HP bonuses (additive to basic)
  basic.lethality += weaponBonuses.basic.lethality;
  basic.health += weaponBonuses.basic.health;
  // Exclusive weapon expedition skills go to additive bonuses (Special Buffs)
  additive.attack += weaponBonuses.additive.attack;
  additive.defense += weaponBonuses.additive.defense;
  additive.lethality += weaponBonuses.additive.lethality;
  additive.health += weaponBonuses.additive.health;
  // Exclusive weapon expedition skills that are multiplicative (e.g., damage up/down)
  multiplicative.attack += weaponBonuses.multiplicative.attack;
  multiplicative.defense += weaponBonuses.multiplicative.defense;
  multiplicative.lethality += weaponBonuses.multiplicative.lethality;
  multiplicative.health += weaponBonuses.multiplicative.health;

  return { basic, additive, multiplicative };
}

/**
 * Categorize a skill's primary bonus type based on its first-skill effect
 * Returns: 'damage' | 'attack' | 'defense' | 'health' | 'lethality' | null
 *
 * The "type" determines stacking behavior:
 * - Same type bonuses ADD together (e.g., two +DMG skills: 10% + 25% = 35%)
 * - Different type bonuses MULTIPLY (e.g., +DMG and +ATK: Base × 1.25 × 1.10)
 */
function categorizeSkillType(skillData: LevelSkill | null): string | null {
  if (!skillData) return null;
  const keys = Object.keys(skillData).map(key => key.toLowerCase());
  const damageIncreaseKeywords = [
    'damage_up',
    'extra_damage_up',
    'normal_attack_damage_up',
    'skill_damage_up',
    'damage_increase',
    'damage_dealt_increase',
    'additional_damage',
    'enemy_damage_taken_up',
  ];
  const damageReductionKeywords = [
    'damage_taken_down',
    'damage_taken',
    'enemy_damage_down',
    'damage_reduction',
    'damage_from_skills_reduction',
  ];
  const attackKeywords = ['attack_up', 'attack_bonus', 'attack_increase'];
  const defenseKeywords = ['defense_up', 'defense_bonus', 'defense_increase'];
  const healthKeywords = ['health_up', 'health_bonus', 'health_increase'];

  if (keys.some(k => damageIncreaseKeywords.some(keyword => k.includes(keyword) && !k.includes('damage_taken')))) {
    return 'damage';
  }
  if (keys.some(k => damageReductionKeywords.some(keyword => k.includes(keyword)))) {
    return 'damageReduction';
  }
  if (keys.some(k => attackKeywords.some(keyword => k.includes(keyword)))) return 'attack';
  if (keys.some(k => defenseKeywords.some(keyword => k.includes(keyword)))) return 'defense';
  if (keys.some(k => healthKeywords.some(keyword => k.includes(keyword)))) return 'health';
  if (keys.some(k => k.includes('lethality_increase') || k.includes('lethality_bonus'))) return 'lethality';

  return null;
}

/**
 * Extract joiner bonuses with proper stacking:
 * - Same skill type → Additive (sum percentages)
 * - Different skill types → Multiplicative (multiply effects)
 * @param mode - 'attacking' or 'defending' to filter which stats apply
 */
export function extractJoinerBonuses(
  joiners: RallyHero[],
  mode?: 'attacking' | 'defending'
): {
  additive: { attack: number; defense: number; lethality: number; health: number };
  multiplicative: { damage: number; attack: number; defense: number; health: number; lethality: number; damageReduction: number };
  perScope: {
    additive: Partial<Record<TroopScope, Partial<Record<'attack' | 'defense' | 'lethality' | 'health', number>>>>;
    multiplicative: Partial<Record<TroopScope, Partial<{ attack: number; defense: number; lethality: number; health: number; damage: number; damageReduction: number }>>>;
    hasTroopSpecific: boolean;
  };
} {
  type Bucket = {
    damage: number[];
    attack: number[];
    defense: number[];
    health: number[];
    lethality: number[];
    damageReduction: number[];
  };

  const scopes: TroopScope[] = ['all_troops', 'rally_troops', 'infantry', 'lancer', 'marksman'];
  const emptyBucket = (): Bucket => ({
    damage: [],
    attack: [],
    defense: [],
    health: [],
    lethality: [],
    damageReduction: [],
  });

  const bonusesByScope: Record<TroopScope, Bucket> = {
    all_troops: emptyBucket(),
    rally_troops: emptyBucket(),
    infantry: emptyBucket(),
    lancer: emptyBucket(),
    marksman: emptyBucket(),
  };

  const getScopeForKey = (key: string): TroopScope => {
    const lowered = key.toLowerCase();
    if (lowered.startsWith('infantry_')) return 'infantry';
    if (lowered.startsWith('lancer_')) return 'lancer';
    if (lowered.startsWith('marksman_')) return 'marksman';
    if (lowered.includes('rally_troops')) return 'rally_troops';
    if (lowered.includes('all_troops')) return 'all_troops';
    return 'all_troops';
  };

  // Only process the first 4 joiners
  const firstFourJoiners = joiners.slice(0, 4);

  firstFourJoiners.forEach(joiner => {
    if (!joiner.heroName) return;

    const hero = getHeroByName(joiner.heroName);
    if (!hero) return;

    const skills = getHeroExpeditionSkills(hero);
    if (skills.length === 0) return;

    // Only process the first skill
    const firstSkill = skills[0];
    const skillData = firstSkill.data as LevelSkill;
    if (!skillData) return;

    // Check skill description to determine if it's for attacking or defending
    const description = (skillData.description || '').toLowerCase();
    const isAttackingSkill = description.includes('rally') || description.includes('attacking');
    const isDefendingSkill = description.includes('defender') || description.includes('defending');

    // If mode is specified, filter based on skill type
    if (mode === 'attacking' && isDefendingSkill) {
      return; // Skip defending skills when in attacking mode
    }
    if (mode === 'defending' && isAttackingSkill) {
      return; // Skip attacking skills when in defending mode
    }

    // Additional check: if mode is set but skill type is unclear, check properties
    // If mode is 'attacking' and we find defender_troops properties, skip the skill
    // If mode is 'defending' and we find rally_troops properties, skip the skill
    if (mode) {
      const hasDefenderProperties = Object.keys(skillData).some(key =>
        key.includes('defender_troops') && !key.includes('all_troops')
      );
      const hasRallyProperties = Object.keys(skillData).some(key =>
        key.includes('rally_troops') && !key.includes('all_troops')
      );

      if (mode === 'attacking' && hasDefenderProperties && !hasRallyProperties && !isAttackingSkill) {
        return; // Skip skills with only defender properties when attacking
      }
      if (mode === 'defending' && hasRallyProperties && !hasDefenderProperties && !isDefendingSkill) {
        return; // Skip skills with only rally properties when defending
      }
    }

    // Find the maximum skill level for this skill
    let maxLevel: SkillLevel = 1;
    Object.keys(skillData).forEach(key => {
      if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;
      const property = skillData[key as keyof LevelSkill] as any;
      const propMaxLevel = getMaxSkillLevel(property);
      if (propMaxLevel > maxLevel) {
        maxLevel = propMaxLevel;
      }
    });

    // Allow configured joiner skill level; otherwise fall back to max
    const levelToUse: SkillLevel =
      (joiner.skillLevels?.[firstSkill.name] as SkillLevel | undefined) ??
      maxLevel;

    // Categorize the skill type
    const skillType = categorizeSkillType(skillData);
    if (!skillType) return;

    const damageIncreaseKeywords = [
      'damage_up',
      'extra_damage_up',
      'normal_attack_damage_up',
      'skill_damage_up',
      'damage_increase',
      'damage_dealt_increase',
      'additional_damage',
      'enemy_damage_taken_up',
    ];
    const damageReductionKeywords = [
      'damage_taken_down',
      'damage_reduction',
      'damage_received_reduction',
      'damage_resistance',
      'damage_from_attacks_reduction',
      'damage_from_skills_reduction',
    ];

    // Extract the bonus value at the chosen level and bucket it by troop scope
    Object.keys(skillData).forEach(key => {
      if (key === 'skill-name' || key === 'description' || key === 'trigger_chance') return;

      const value = extractSkillValue(skillData[key as keyof LevelSkill] as any, levelToUse);
      if (value === 0) return;

      const scope = getScopeForKey(key);
      const bucket = bonusesByScope[scope];
      if (!bucket) return;

      const normalizedKey = key.toLowerCase();
      const isDamageKey = damageIncreaseKeywords.some(keyword => normalizedKey.includes(keyword) && !normalizedKey.includes('damage_taken'));
      const isDamageReductionKey = damageReductionKeywords.some(keyword => normalizedKey.includes(keyword));

      if (isDamageReductionKey) {
        bucket.damageReduction.push(value * 100);
      }

      if (skillType === 'damage' && isDamageKey) {
        bucket.damage.push(value * 100);
      } else if (skillType === 'attack' && normalizedKey.includes('attack_increase')) {
        bucket.attack.push(value * 100);
      } else if (skillType === 'defense' && normalizedKey.includes('defense_increase')) {
        bucket.defense.push(value * 100);
      } else if (skillType === 'health' && normalizedKey.includes('health_increase')) {
        bucket.health.push(value * 100);
      } else if (skillType === 'lethality' && normalizedKey.includes('lethality_increase')) {
        bucket.lethality.push(value * 100);
      }
    });
  });

  const summarizeScope = (bucket: Bucket): {
    additive: { attack: number; defense: number; lethality: number; health: number };
    multiplicative: { damage: number; attack: number; defense: number; health: number; lethality: number; damageReduction: number };
  } => {
    const additive = { attack: 0, defense: 0, lethality: 0, health: 0 };
    const multiplicative = { damage: 0, attack: 0, defense: 0, health: 0, lethality: 0, damageReduction: 0 };

    if (mode === 'attacking') {
      additive.attack += bucket.attack.reduce((sum, val) => sum + val, 0);
      multiplicative.damage = bucket.damage.reduce((sum, val) => sum + val, 0);
      multiplicative.damageReduction = 0;
    } else if (mode === 'defending') {
      additive.defense += bucket.defense.reduce((sum, val) => sum + val, 0);
      additive.health += bucket.health.reduce((sum, val) => sum + val, 0);
      additive.lethality += bucket.lethality.reduce((sum, val) => sum + val, 0);
      multiplicative.damageReduction = bucket.damageReduction.reduce((sum, val) => sum + val, 0);
    } else {
      const sumType = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0);
      multiplicative.damage = sumType(bucket.damage);
      multiplicative.attack = sumType(bucket.attack);
      multiplicative.defense = sumType(bucket.defense);
      multiplicative.health = sumType(bucket.health);
      multiplicative.lethality = sumType(bucket.lethality);
      multiplicative.damageReduction = sumType(bucket.damageReduction);
      additive.attack += multiplicative.attack;
      additive.defense += multiplicative.defense;
      additive.health += multiplicative.health;
      additive.lethality += multiplicative.lethality;
    }

    return { additive, multiplicative };
  };

  const perScopeAdditive: Record<TroopScope, { attack: number; defense: number; lethality: number; health: number }> = {
    all_troops: summarizeScope(bonusesByScope.all_troops).additive,
    rally_troops: summarizeScope(bonusesByScope.rally_troops).additive,
    infantry: summarizeScope(bonusesByScope.infantry).additive,
    lancer: summarizeScope(bonusesByScope.lancer).additive,
    marksman: summarizeScope(bonusesByScope.marksman).additive,
  };

  const perScopeMultiplicative: Record<TroopScope, { damage: number; attack: number; defense: number; health: number; lethality: number; damageReduction: number }> = {
    all_troops: summarizeScope(bonusesByScope.all_troops).multiplicative,
    rally_troops: summarizeScope(bonusesByScope.rally_troops).multiplicative,
    infantry: summarizeScope(bonusesByScope.infantry).multiplicative,
    lancer: summarizeScope(bonusesByScope.lancer).multiplicative,
    marksman: summarizeScope(bonusesByScope.marksman).multiplicative,
  };

  const hasTroopSpecific = ['infantry', 'lancer', 'marksman'].some(scope => {
    const bucket = bonusesByScope[scope as TroopScope];
    return Object.values(bucket).some(arr => arr.length > 0);
  });

  const globalScopes: TroopScope[] = ['all_troops', 'rally_troops'];
  if (!hasTroopSpecific) {
    globalScopes.push('infantry', 'lancer', 'marksman');
  }

  const additive = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const multiplicative = { damage: 0, attack: 0, defense: 0, health: 0, lethality: 0, damageReduction: 0 };

  globalScopes.forEach(scope => {
    const add = perScopeAdditive[scope] || { attack: 0, defense: 0, lethality: 0, health: 0 };
    const mul = perScopeMultiplicative[scope] || { damage: 0, attack: 0, defense: 0, health: 0, lethality: 0, damageReduction: 0 };
    additive.attack += add.attack || 0;
    additive.defense += add.defense || 0;
    additive.lethality += add.lethality || 0;
    additive.health += add.health || 0;
    multiplicative.damage += mul.damage || 0;
    multiplicative.attack += mul.attack || 0;
    multiplicative.defense += mul.defense || 0;
    multiplicative.health += mul.health || 0;
    multiplicative.lethality += mul.lethality || 0;
    multiplicative.damageReduction += mul.damageReduction || 0;
  });

  return {
    additive,
    multiplicative,
    perScope: {
      additive: perScopeAdditive,
      multiplicative: perScopeMultiplicative,
      hasTroopSpecific,
    },
  };
}

/**
 * Calculate all bonuses from Rally Configuration
 * Includes hero gear bonuses if provided
 * @param playerMode - 'attacking' or 'defending' for player side
 * @param opponentMode - 'attacking' or 'defending' for opponent side
 */
export function calculateRallyBonuses(
  rally: RallyConfiguration,
  heroGearBonuses?: BasicBonuses['heroGear'],
  playerMode?: 'attacking' | 'defending',
  opponentMode?: 'attacking' | 'defending'
): {
  basic: BasicBonuses['hero'];
  additive: AdditiveBonuses;
  multiplicative: MultiplicativeBonuses;
} {
  // Determine which mode to use based on usePlayerHeroes flag
  // Ensure mode is always defined (default to 'attacking' if undefined)
  const mode = rally.usePlayerHeroes
    ? (playerMode || 'attacking')
    : (opponentMode || 'defending');
  // Initialize
  const basic = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const additive: AdditiveBonuses = {
    temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
    supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
    specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };
  const multiplicative: MultiplicativeBonuses = {
    castleBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    eventBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    petSkills: { attack: 0, defense: 0, lethality: 0, health: 0 },
    combatBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    exclusiveWeapon: { attack: 0, defense: 0, lethality: 0, health: 0 },
    allianceTerritory: { attack: 0, defense: 0, lethality: 0, health: 0 },
    tyrantSpire: { attack: 0, defense: 0, lethality: 0, health: 0 },
    cityBonuses: {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      enemyAttackReduction: 0,
      enemyDefenseReduction: 0,
      deploymentCapacity: 0,
    },
  };

  // Extract from leaders
  if (rally.leader.infantry) {
    const leaderBonuses = extractLeaderBonuses(rally.leader.infantry, mode);
    basic.attack += leaderBonuses.basic.attack;
    basic.defense += leaderBonuses.basic.defense;
    basic.lethality += leaderBonuses.basic.lethality;
    basic.health += leaderBonuses.basic.health;
    additive.specialBuffs.attack += leaderBonuses.additive.attack;
    additive.specialBuffs.defense += leaderBonuses.additive.defense;
    additive.specialBuffs.lethality += leaderBonuses.additive.lethality;
    additive.specialBuffs.health += leaderBonuses.additive.health;
    multiplicative.exclusiveWeapon.attack += leaderBonuses.multiplicative.attack;
    multiplicative.exclusiveWeapon.defense += leaderBonuses.multiplicative.defense;
    multiplicative.exclusiveWeapon.lethality += leaderBonuses.multiplicative.lethality;
    multiplicative.exclusiveWeapon.health += leaderBonuses.multiplicative.health;

    // Add hero gear bonuses (additive) for infantry leader
    if (heroGearBonuses?.infantry) {
      basic.attack += heroGearBonuses.infantry.attack || 0;
      basic.defense += heroGearBonuses.infantry.defense || 0;
      basic.lethality += heroGearBonuses.infantry.lethality || 0;
      basic.health += heroGearBonuses.infantry.health || 0;
    }
  }

  if (rally.leader.lancer) {
    const leaderBonuses = extractLeaderBonuses(rally.leader.lancer, mode);
    basic.attack += leaderBonuses.basic.attack;
    basic.defense += leaderBonuses.basic.defense;
    basic.lethality += leaderBonuses.basic.lethality;
    basic.health += leaderBonuses.basic.health;
    additive.specialBuffs.attack += leaderBonuses.additive.attack;
    additive.specialBuffs.defense += leaderBonuses.additive.defense;
    additive.specialBuffs.lethality += leaderBonuses.additive.lethality;
    additive.specialBuffs.health += leaderBonuses.additive.health;
    multiplicative.exclusiveWeapon.attack += leaderBonuses.multiplicative.attack;
    multiplicative.exclusiveWeapon.defense += leaderBonuses.multiplicative.defense;
    multiplicative.exclusiveWeapon.lethality += leaderBonuses.multiplicative.lethality;
    multiplicative.exclusiveWeapon.health += leaderBonuses.multiplicative.health;

    // Add hero gear bonuses (additive) for lancer leader
    if (heroGearBonuses?.lancer) {
      basic.attack += heroGearBonuses.lancer.attack || 0;
      basic.defense += heroGearBonuses.lancer.defense || 0;
      basic.lethality += heroGearBonuses.lancer.lethality || 0;
      basic.health += heroGearBonuses.lancer.health || 0;
    }
  }

  if (rally.leader.marksman) {
    const leaderBonuses = extractLeaderBonuses(rally.leader.marksman, mode);
    basic.attack += leaderBonuses.basic.attack;
    basic.defense += leaderBonuses.basic.defense;
    basic.lethality += leaderBonuses.basic.lethality;
    basic.health += leaderBonuses.basic.health;
    additive.specialBuffs.attack += leaderBonuses.additive.attack;
    additive.specialBuffs.defense += leaderBonuses.additive.defense;
    additive.specialBuffs.lethality += leaderBonuses.additive.lethality;
    additive.specialBuffs.health += leaderBonuses.additive.health;
    multiplicative.exclusiveWeapon.attack += leaderBonuses.multiplicative.attack;
    multiplicative.exclusiveWeapon.defense += leaderBonuses.multiplicative.defense;
    multiplicative.exclusiveWeapon.lethality += leaderBonuses.multiplicative.lethality;
    multiplicative.exclusiveWeapon.health += leaderBonuses.multiplicative.health;

    // Add hero gear bonuses (additive) for marksman leader
    if (heroGearBonuses?.marksman) {
      basic.attack += heroGearBonuses.marksman.attack || 0;
      basic.defense += heroGearBonuses.marksman.defense || 0;
      basic.lethality += heroGearBonuses.marksman.lethality || 0;
      basic.health += heroGearBonuses.marksman.health || 0;
    }
  }

  // Extract from joiners (with proper stacking: same type = additive, different types = multiplicative)
  // Use playerJoiners or opponentJoiners if available, otherwise fall back to legacy joiners
  const joinersToUse = rally.usePlayerHeroes !== false
    ? (rally.playerJoiners || rally.joiners || [])
    : (rally.opponentJoiners || rally.joiners || []);
  const joinerBonuses = extractJoinerBonuses(joinersToUse, mode);

  // Global/all-troops contributions (display and backward-compat path)
  additive.specialBuffs.attack += joinerBonuses.additive.attack;
  additive.specialBuffs.defense += joinerBonuses.additive.defense;
  additive.specialBuffs.lethality += joinerBonuses.additive.lethality;
  additive.specialBuffs.health += joinerBonuses.additive.health;
  multiplicative.combatBuffs.attack += joinerBonuses.multiplicative.damage;
  multiplicative.cityBonuses.enemyAttackReduction += joinerBonuses.multiplicative.damageReduction;

  // Per-troop joiner bonuses (no leaking across troops)
  const joinerAdditiveByTroop: NonNullable<AdditiveBonuses['joinerBuffs']> = {
    infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
    lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
    marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };
  const joinerMultiplicativeByTroop: NonNullable<MultiplicativeBonuses['joinerBuffs']> = {
    infantry: { attack: 0, defense: 0, lethality: 0, health: 0, damage: 0, damageReduction: 0 },
    lancer: { attack: 0, defense: 0, lethality: 0, health: 0, damage: 0, damageReduction: 0 },
    marksman: { attack: 0, defense: 0, lethality: 0, health: 0, damage: 0, damageReduction: 0 },
  };
  const perScopeAdditive = joinerBonuses.perScope?.additive ?? {};
  const perScopeMultiplicative = joinerBonuses.perScope?.multiplicative ?? {};

  TROOP_TYPES.forEach(troop => {
    const additiveTarget = joinerAdditiveByTroop[troop];
    const multiplicativeTarget = joinerMultiplicativeByTroop[troop];
    if (!additiveTarget || !multiplicativeTarget) {
      return;
    }

    const add = (perScopeAdditive.all_troops || {}) as any;
    const rallyAdd = (perScopeAdditive.rally_troops || {}) as any;
    const troopAdd = (perScopeAdditive[troop as TroopScope] || {}) as any;

    additiveTarget.attack = (add.attack || 0) + (rallyAdd.attack || 0) + (troopAdd.attack || 0);
    additiveTarget.defense = (add.defense || 0) + (rallyAdd.defense || 0) + (troopAdd.defense || 0);
    additiveTarget.lethality = (add.lethality || 0) + (rallyAdd.lethality || 0) + (troopAdd.lethality || 0);
    additiveTarget.health = (add.health || 0) + (rallyAdd.health || 0) + (troopAdd.health || 0);

    const mulAll = perScopeMultiplicative.all_troops || {};
    const mulRally = perScopeMultiplicative.rally_troops || {};
    const mulTroop = perScopeMultiplicative[troop as TroopScope] || {};

    const attackMul = (mulAll.damage || 0) + (mulAll.attack || 0) + (mulRally.damage || 0) + (mulRally.attack || 0) + (mulTroop.damage || 0) + (mulTroop.attack || 0);
    const defenseMul = (mulAll.defense || 0) + (mulAll.damageReduction || 0) + (mulRally.defense || 0) + (mulRally.damageReduction || 0) + (mulTroop.defense || 0) + (mulTroop.damageReduction || 0);
    const healthMul = (mulAll.health || 0) + (mulRally.health || 0) + (mulTroop.health || 0);
    const lethalityMul = (mulAll.lethality || 0) + (mulRally.lethality || 0) + (mulTroop.lethality || 0);
    const dmgRed = (mulAll.damageReduction || 0) + (mulRally.damageReduction || 0) + (mulTroop.damageReduction || 0);

    multiplicativeTarget.attack = attackMul;
    multiplicativeTarget.defense = defenseMul;
    multiplicativeTarget.health = healthMul;
    multiplicativeTarget.lethality = lethalityMul;
    multiplicativeTarget.damage = attackMul;
    multiplicativeTarget.damageReduction = dmgRed;

    joinerMultiplicativeByTroop[troop] = {
      attack: attackMul,
      defense: defenseMul,
      health: healthMul,
      lethality: lethalityMul,
      damage: attackMul,
      damageReduction: dmgRed,
    };
  });

  additive.joinerBuffs = joinerAdditiveByTroop;
  multiplicative.joinerBuffs = joinerMultiplicativeByTroop;

  return { basic, additive, multiplicative };
}
