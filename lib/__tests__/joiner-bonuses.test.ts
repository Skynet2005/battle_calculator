import type { RallyConfiguration, RallyHero, TroopMixConfig } from '@/components/types';
import { describe, expect, it, vi } from 'vitest';
import { calculateRallyBonuses, extractJoinerBonuses } from '../rally/rally-bonus-extractor';

type SkillData = Record<string, any>;

const mockHeroes: Record<string, { skills: { name: string; data: SkillData }[] }> = {
  GlobalHero: {
    skills: [
      {
        name: 'Global Skill',
        data: {
          'skill-name': 'Global Skill',
          description: 'all troops attack',
          all_troops_attack_increase: { '1': 0.1 },
        },
      },
    ],
  },
  MixedHero: {
    skills: [
      {
        name: 'Mixed Skill',
        data: {
          'skill-name': 'Mixed Skill',
          description: 'infantry attack + all troops attack',
          infantry_attack_increase: { '1': 0.2 },
          all_troops_attack_increase: { '1': 0.1 },
        },
      },
    ],
  },
  DamageScopedHero: {
    skills: [
      {
        name: 'Damage Skill',
        data: {
          'skill-name': 'Damage Skill',
          description: 'damage only',
          normal_attack_damage_up_percentage: { '1': 0.15 },
          damage_from_skills_reduction: { '1': 0.2 },
        },
      },
    ],
  },
};

vi.mock('../battle', () => ({
  getHeroByName: (name: string) => mockHeroes[name],
}));

vi.mock('../battle/data-selectors', () => ({
  getHeroExpeditionSkills: (hero: any) => hero?.skills ?? [],
}));

const baseJoiner = (heroName: string, heroClass: 'infantry' | 'lancer' | 'marksman'): RallyHero => ({
  heroName,
  heroClass,
  starLevel: 1,
  generation: 1,
  skillLevels: {},
});

const makeRally = (joiners: RallyHero[]): RallyConfiguration =>
  ({
    leader: { infantry: null, lancer: null, marksman: null },
    capacity: {
      infantry: [{ type: 'infantry', tier: 'normal', fireCrystalLevel: 1, count: 1000 }],
      lancer: [{ type: 'lancer', tier: 'normal', fireCrystalLevel: 1, count: 1000 }],
      marksman: [{ type: 'marksman', tier: 'normal', fireCrystalLevel: 1, count: 1000 }],
    },
    troopMix: {
      player: { infantry: 0.33, lancer: 0.33, marksman: 0.34, totalTroops: 3000 } as TroopMixConfig,
      opponent: { infantry: 0.33, lancer: 0.33, marksman: 0.34, totalTroops: 3000 } as TroopMixConfig,
    },
    joiners,
    playerJoiners: joiners,
    opponentJoiners: [],
    usePlayerHeroes: true,
  }) as unknown as RallyConfiguration;

describe('extractJoinerBonuses - troop scoping', () => {
  it('keeps global-only bonuses compatible with previous outputs', () => {
    const rally = makeRally([baseJoiner('GlobalHero', 'infantry')]);
    const { additive, multiplicative } = calculateRallyBonuses(rally, undefined, 'attacking', 'defending');

    expect(additive.specialBuffs.attack).toBeCloseTo(10);
    expect(additive.joinerBuffs?.infantry?.attack).toBeCloseTo(10);
    expect(additive.joinerBuffs?.lancer?.attack).toBeCloseTo(10);
    expect(additive.joinerBuffs?.marksman?.attack).toBeCloseTo(10);
    expect(multiplicative.combatBuffs.attack).toBeCloseTo(0);
  });

  it('applies mixed troop-specific + all_troops only to the targeted troop', () => {
    const rally = makeRally([baseJoiner('MixedHero', 'infantry')]);
    const { additive } = calculateRallyBonuses(rally, undefined, 'attacking', 'defending');

    expect(additive.specialBuffs.attack).toBeCloseTo(10);
    expect(additive.joinerBuffs?.infantry?.attack).toBeCloseTo(30);
    expect(additive.joinerBuffs?.lancer?.attack).toBeCloseTo(10);
    expect(additive.joinerBuffs?.marksman?.attack).toBeCloseTo(10);
  });

  it('keeps damage and damage-reduction scoped to the right action mode', () => {
    const joiner = baseJoiner('DamageScopedHero', 'lancer');
    const attackResult = extractJoinerBonuses([joiner], 'attacking');
    const defendResult = extractJoinerBonuses([joiner], 'defending');

    expect(attackResult.perScope.multiplicative.all_troops.damage).toBeGreaterThan(0);
    expect(attackResult.perScope.multiplicative.all_troops.damageReduction).toBeGreaterThan(0);
    expect(defendResult.perScope.multiplicative.all_troops.damage).toBe(0);
    expect(defendResult.perScope.multiplicative.all_troops.damageReduction).toBeGreaterThan(0);
  });
});
