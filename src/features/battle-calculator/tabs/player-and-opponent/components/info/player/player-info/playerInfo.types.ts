import type { STAT_LIST } from './playerInfo.constants';

export type Stat = (typeof STAT_LIST)[number];

export type CityBonuses = {
  attack: number;
  defense: number;
  lethality: number;
  health: number;
  enemyAttackReduction: number;
  enemyDefenseReduction: number;
  deploymentCapacity: number;
};

export type PetSkillStats = Record<Stat, number>;

export type PetSkillCalc = {
  calculatedPetSkills: PetSkillStats;
  calculatedPetDebuffs: PetSkillStats; // defense/health are used as reductions; others remain 0
  petContributions: Record<Stat, Record<string, number>>;
  petDebuffContributions: Record<'defense' | 'health', Record<string, number>>;
};
