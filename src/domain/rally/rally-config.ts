import type { RallyConfiguration, RallyHero, TroopMixConfig } from '@/shared/types';
import type { HeroSelection } from '../battle';
import type { RallySideConfig, SideBaseStats } from './combat-types';
import { computeCountsFromMix, normalizeRatios } from './mix-utils';

export const DEFAULT_TROOP_MIX: TroopMixConfig = {
  totalTroops: 0,
  infantryRatio: 33.34,
  lancerRatio: 33.33,
  marksmanRatio: 33.33
};

export function mixToCounts(mix: TroopMixConfig) {
  const normalized = normalizeRatios(mix, DEFAULT_TROOP_MIX);
  const counts = computeCountsFromMix(normalized);
  const total = counts.infantry + counts.lancer + counts.marksman;

  return {
    counts,
    total
  };
}

export function buildConfigForSide(
  rally: RallyConfiguration,
  side: 'player' | 'opponent',
  baseStats: SideBaseStats
): RallySideConfig {
  const mix = { ...DEFAULT_TROOP_MIX, ...(rally.troopMix?.[side] ?? {}) };
  const leaders = (side === 'player' ? rally.playerLeader : rally.opponentLeader) ?? rally.leader;
  const joiners = side === 'player' ? rally.playerJoiners ?? rally.joiners ?? [] : rally.opponentJoiners ?? [];
  const roleSetting = side === 'player' ? rally.specialWidgetBonus?.player ?? 'attacking' : rally.specialWidgetBonus?.opponent ?? 'defending';
  const role: 'attacker' | 'defender' = roleSetting === 'defending' ? 'defender' : 'attacker';
  const { counts, total } = mixToCounts(mix);

  return {
    role,
    baseStats,
    heroes: {
      infantry: toHeroSelection(leaders.infantry, 'leader'),
      lancer: toHeroSelection(leaders.lancer, 'leader'),
      marksman: toHeroSelection(leaders.marksman, 'leader')
    },
    joiners: joiners
      .filter(Boolean)
      .slice(0, 4)
      .map((joiner) => toHeroSelection(joiner, 'joiner'))
      .filter((entry): entry is HeroSelection => Boolean(entry)),
    troopCounts: counts,
    totalTroops: total
  };
}

function toHeroSelection(hero: RallyHero | null, selectionType: 'leader' | 'joiner'): HeroSelection | null {
  if (!hero || !hero.heroName) {
    return null;
  }
  return {
    heroName: hero.heroName,
    selectionType,
    exclusiveWeaponLevel: hero.exclusiveWeaponLevel,
    skillLevels: hero.skillLevels ?? {},
    starLevel: hero.starLevel,
    xpLevel: hero.xpLevel
  };
}
