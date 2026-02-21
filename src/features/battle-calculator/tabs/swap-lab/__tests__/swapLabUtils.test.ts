import { HEROES_BY_CLASS } from '@/domain/battle/data/heroes/heroes';
import type { UserProfile } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { getCandidatesForSlot, profileWithSlotOverride } from '../swapLabUtils';

function makeProfile(): UserProfile {
  const infantryHero = HEROES_BY_CLASS.infantry[0]['hero-name'];
  const infantryHero2 = HEROES_BY_CLASS.infantry[1]['hero-name'];
  const lancerHero = HEROES_BY_CLASS.lancer[0]['hero-name'];
  const lancerHero2 = HEROES_BY_CLASS.lancer[1]['hero-name'];
  const marksmanHero = HEROES_BY_CLASS.marksman[0]['hero-name'];

  return {
    id: 'p1',
    name: 'Test',
    rally: {
      leader: {
        infantry: { heroName: infantryHero, heroClass: 'infantry', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 },
        lancer: { heroName: lancerHero, heroClass: 'lancer', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 },
        marksman: { heroName: marksmanHero, heroClass: 'marksman', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 }
      },
      playerLeader: {
        infantry: { heroName: infantryHero, heroClass: 'infantry', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 },
        lancer: { heroName: lancerHero, heroClass: 'lancer', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 },
        marksman: { heroName: marksmanHero, heroClass: 'marksman', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 }
      },
      playerJoiners: [
        { heroName: infantryHero2, heroClass: 'infantry', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 },
        { heroName: lancerHero2, heroClass: 'lancer', starLevel: 1, generation: 1, skillLevels: {}, xpLevel: 80 }
      ],
      opponentLeader: { infantry: null, lancer: null, marksman: null },
      opponentJoiners: [],
      capacity: { infantry: [], lancer: [], marksman: [] },
      troopMix: {
        player: { totalTroops: 1000, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
        opponent: { totalTroops: 1000, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 }
      }
    }
  } as unknown as UserProfile;
}

describe('swapLabUtils', () => {
  it('filters out occupied heroes and no-op same-slot candidates', () => {
    const profile = makeProfile();
    const candidates = getCandidatesForSlot('infantry_leader', profile);
    const currentInfantry = profile.rally?.playerLeader?.infantry?.heroName as string;
    const occupiedJoiner = profile.rally?.playerJoiners?.[0]?.heroName as string;

    expect(candidates).not.toContain(currentInfantry);
    expect(candidates).not.toContain(occupiedJoiner);
  });

  it('does not allow duplicate hero assignment across rally slots', () => {
    const profile = makeProfile();
    const existingLancerLeader = profile.rally?.playerLeader?.lancer?.heroName as string;

    const updated = profileWithSlotOverride(profile, 'joiner_3', existingLancerLeader);
    expect(updated).toBe(profile);
  });
});
