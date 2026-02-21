import { PETS_DATA } from '@/domain/battle';
import type { CityBonuses, PetSkillCalc, PetSkillStats } from './playerInfo.types';

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function normalizeCityBonuses(input?: Partial<CityBonuses>): CityBonuses {
  return {
    attack: input?.attack ?? 0,
    defense: input?.defense ?? 0,
    lethality: input?.lethality ?? 0,
    health: input?.health ?? 0,
    enemyAttackReduction: input?.enemyAttackReduction ?? 0,
    enemyDefenseReduction: input?.enemyDefenseReduction ?? 0,
    deploymentCapacity: input?.deploymentCapacity ?? 0
  };
}

export function buildDefaultCharmLevels(maxCharmLevel: number) {
  return {
    Cap: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Watch: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Coat: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Pants: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Ring: [maxCharmLevel, maxCharmLevel, maxCharmLevel],
    Weapon: [maxCharmLevel, maxCharmLevel, maxCharmLevel]
  };
}

export function computePetSkillCalc(petSkillSelections: Record<string, unknown>): PetSkillCalc {
  const calculatedPetSkills: PetSkillStats = { attack: 0, defense: 0, lethality: 0, health: 0 };
  const calculatedPetDebuffs: PetSkillStats = { attack: 0, defense: 0, lethality: 0, health: 0 };

  const petContributions: Record<'attack' | 'defense' | 'lethality' | 'health', Record<string, number>> = {
    attack: {},
    defense: {},
    lethality: {},
    health: {}
  };

  const petDebuffContributions: Record<'defense' | 'health', Record<string, number>> = {
    defense: {},
    health: {}
  };

  Object.entries(petSkillSelections).forEach(([petName, level]) => {
    const levelNum = typeof level === 'number' ? level : parseInt(String(level), 10);
    if (!levelNum || levelNum === 0 || Number.isNaN(levelNum)) return;

    const pet = (PETS_DATA as Record<string, { levels?: Record<string, number>; stat?: string }>)[petName];
    if (!pet) return;

    const levelValue = pet.levels?.[levelNum.toString()];
    if (levelValue === undefined || levelValue === null) return;

    const stat = String(pet.stat || '').toLowerCase();
    const isDebuff = stat.includes('reduction');

    if (stat.includes('attack')) {
      calculatedPetSkills.attack += levelValue;
      petContributions.attack[petName] = (petContributions.attack[petName] || 0) + levelValue;
      return;
    }

    if (stat.includes('defense') && !isDebuff) {
      calculatedPetSkills.defense += levelValue;
      petContributions.defense[petName] = (petContributions.defense[petName] || 0) + levelValue;
      return;
    }

    if (stat.includes('lethality')) {
      calculatedPetSkills.lethality += levelValue;
      petContributions.lethality[petName] = (petContributions.lethality[petName] || 0) + levelValue;
      return;
    }

    if (stat.includes('health') && !isDebuff) {
      calculatedPetSkills.health += levelValue;
      petContributions.health[petName] = (petContributions.health[petName] || 0) + levelValue;
      return;
    }

    if (stat.includes('health') && isDebuff) {
      calculatedPetDebuffs.health += levelValue;
      petDebuffContributions.health[petName] = (petDebuffContributions.health[petName] || 0) + levelValue;
      return;
    }

    if (stat.includes('defense') && isDebuff) {
      calculatedPetDebuffs.defense += levelValue;
      petDebuffContributions.defense[petName] = (petDebuffContributions.defense[petName] || 0) + levelValue;
      return;
    }
  });

  return { calculatedPetSkills, calculatedPetDebuffs, petContributions, petDebuffContributions };
}
