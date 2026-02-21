/**
 * Utilities for Lineup Swap Lab: clone profile with one hero slot overridden, run and compare to baseline.
 * Uses project hero data (heroes.ts) and profile heroLevels for accurate battle results.
 */

import { getHeroByName } from '@/domain/battle/data/heroes/hero-extractor';
import { HEROES, HEROES_BY_CLASS } from '@/domain/battle/data/heroes/heroes';
import type { RallyHero, UserProfile } from '@/shared/types';

export type SwapSlot =
  | 'infantry_leader'
  | 'lancer_leader'
  | 'marksman_leader'
  | 'joiner_0'
  | 'joiner_1'
  | 'joiner_2'
  | 'joiner_3';

const SLOT_LABELS: Record<SwapSlot, string> = {
  infantry_leader: 'Infantry leader',
  lancer_leader: 'Lancer leader',
  marksman_leader: 'Marksman leader',
  joiner_0: 'Joiner 1',
  joiner_1: 'Joiner 2',
  joiner_2: 'Joiner 3',
  joiner_3: 'Joiner 4'
};

const SLOT_CLASS: Record<SwapSlot, 'infantry' | 'lancer' | 'marksman' | null> = {
  infantry_leader: 'infantry',
  lancer_leader: 'lancer',
  marksman_leader: 'marksman',
  joiner_0: null,
  joiner_1: null,
  joiner_2: null,
  joiner_3: null
};

export function getSlotLabel(slot: SwapSlot): string {
  return SLOT_LABELS[slot];
}

function getHeroNameInSlot(profile: UserProfile, slot: SwapSlot): string | null {
  const rally = profile.rally;
  if (!rally) return null;

  const leaders = rally.playerLeader ?? rally.leader;
  const joiners = rally.playerJoiners ?? rally.joiners ?? [];

  if (slot === 'infantry_leader') return leaders?.infantry?.heroName ?? null;
  if (slot === 'lancer_leader') return leaders?.lancer?.heroName ?? null;
  if (slot === 'marksman_leader') return leaders?.marksman?.heroName ?? null;

  const idx = slot === 'joiner_0' ? 0 : slot === 'joiner_1' ? 1 : slot === 'joiner_2' ? 2 : 3;
  return joiners[idx]?.heroName ?? null;
}

function getOccupiedHeroNames(profile: UserProfile): Set<string> {
  const occupied = new Set<string>();
  const rally = profile.rally;
  if (!rally) return occupied;

  const leaders = rally.playerLeader ?? rally.leader;
  const joiners = rally.playerJoiners ?? rally.joiners ?? [];

  if (leaders?.infantry?.heroName) occupied.add(leaders.infantry.heroName);
  if (leaders?.lancer?.heroName) occupied.add(leaders.lancer.heroName);
  if (leaders?.marksman?.heroName) occupied.add(leaders.marksman.heroName);
  for (const joiner of joiners.slice(0, 4)) {
    if (joiner?.heroName) occupied.add(joiner.heroName);
  }

  return occupied;
}

/** Hero names that are valid for this slot (leader slots = same class only; joiners = all). */
export function getCandidatesForSlot(slot: SwapSlot, profile?: UserProfile): string[] {
  const requiredClass = SLOT_CLASS[slot];
  const candidates = requiredClass == null
    ? HEROES.map((h) => h['hero-name'])
    : HEROES_BY_CLASS[requiredClass].map((h) => h['hero-name']);

  if (!profile?.rally) return candidates;

  const occupied = getOccupiedHeroNames(profile);
  const heroInCurrentSlot = getHeroNameInSlot(profile, slot);
  if (heroInCurrentSlot) occupied.delete(heroInCurrentSlot);

  // Exclude no-op swaps (same hero already in slot) and impossible duplicate lineups.
  return candidates.filter((name) => name !== heroInCurrentSlot && !occupied.has(name));
}

const DEFAULT_HERO_LEVELS = {
  starLevel: 1,
  xpLevel: 80,
  skillLevels: {} as RallyHero['skillLevels'],
  exclusiveWeaponLevel: undefined as number | undefined
};

/**
 * Build a RallyHero for the given hero name using profile heroLevels when available.
 */
function buildRallyHeroForCandidate(
  heroName: string,
  profile: UserProfile
): RallyHero | null {
  const hero = getHeroByName(heroName);
  if (!hero) return null;
  const heroClass = hero['hero-class'] as 'infantry' | 'lancer' | 'marksman';
  const heroLevel = profile.heroLevels?.[heroName];
  const starLevel = heroLevel?.starLevel ?? DEFAULT_HERO_LEVELS.starLevel;
  const xpLevel = heroLevel?.xpLevel ?? DEFAULT_HERO_LEVELS.xpLevel;
  const skillLevels = heroLevel?.skillLevels ?? DEFAULT_HERO_LEVELS.skillLevels;
  const exclusiveWeaponLevel = heroLevel?.exclusiveWeaponLevel ?? DEFAULT_HERO_LEVELS.exclusiveWeaponLevel;
  return {
    heroName: hero['hero-name'],
    heroClass,
    starLevel,
    generation: hero.generation,
    skillLevels,
    xpLevel,
    exclusiveWeaponLevel
  };
}

/**
 * Clone profile and set one player rally slot to the given hero.
 * Uses hero data from the project and profile.heroLevels for accurate stats.
 * Leader slots only accept heroes whose class matches the slot; invalid candidates are ignored (profile returned unchanged).
 * Avoids JSON deep-clone; only copies the small parts we mutate (leaders/joiners).
 */
export function profileWithSlotOverride(
  profile: UserProfile,
  slot: SwapSlot,
  heroName: string
): UserProfile {
  if (!profile.rally) return profile;
  const hero = getHeroByName(heroName);
  if (!hero) return profile;

  const heroClass = hero['hero-class'] as 'infantry' | 'lancer' | 'marksman';
  const requiredClass = SLOT_CLASS[slot];
  if (requiredClass != null && heroClass !== requiredClass) {
    return profile;
  }

  const occupied = getOccupiedHeroNames(profile);
  const heroInCurrentSlot = getHeroNameInSlot(profile, slot);
  if (heroInCurrentSlot) occupied.delete(heroInCurrentSlot);
  if (occupied.has(heroName)) {
    // Keep lineups valid: the same hero cannot occupy two different player rally slots.
    return profile;
  }

  const newHero = buildRallyHeroForCandidate(heroName, profile);
  if (!newHero) return profile;

  const baseRally = profile.rally;
  const leaders = baseRally.playerLeader ?? baseRally.leader;
  const joiners = [...(baseRally.playerJoiners ?? baseRally.joiners ?? [])];
  while (joiners.length < 4) joiners.push(null as unknown as RallyHero);

  const rally = {
    ...baseRally,
    playerLeader: baseRally.playerLeader ? { ...baseRally.playerLeader } : baseRally.playerLeader,
    playerJoiners: baseRally.playerJoiners ? [...baseRally.playerJoiners] : baseRally.playerJoiners
  } as typeof baseRally;

  if (slot === 'infantry_leader' || slot === 'lancer_leader' || slot === 'marksman_leader') {
    const key = slot.replace('_leader', '') as 'infantry' | 'lancer' | 'marksman';
    if (!rally.playerLeader) rally.playerLeader = { ...leaders };
    rally.playerLeader[key] = newHero;
  } else {
    const idx = slot === 'joiner_0' ? 0 : slot === 'joiner_1' ? 1 : slot === 'joiner_2' ? 2 : 3;
    joiners[idx] = newHero;
    rally.playerJoiners = joiners.slice(0, 4);
  }

  return { ...profile, rally };
}

/** All hero names from project data (heroes.ts), for use as swap candidates. */
export const CANDIDATE_HERO_NAMES: string[] = HEROES.map((h) => h['hero-name']);
