import type { RallyConfiguration, RallyHero, TroopMixConfig } from '@/components/types';
import type { HeroSelection } from '../battle';
import type { RallySideConfig, SideBaseStats } from './combat-types';

export const DEFAULT_TROOP_MIX: TroopMixConfig = {
  totalTroops: 0,
  infantryRatio: 33.34,
  lancerRatio: 33.33,
  marksmanRatio: 33.33
};

export function mixToCounts(mix: TroopMixConfig) {
  const safeTotal = Math.max(0, mix.totalTroops || 0);
  const ratios = {
    infantry: Math.max(0, mix.infantryRatio ?? DEFAULT_TROOP_MIX.infantryRatio),
    lancer: Math.max(0, mix.lancerRatio ?? DEFAULT_TROOP_MIX.lancerRatio),
    marksman: Math.max(0, mix.marksmanRatio ?? DEFAULT_TROOP_MIX.marksmanRatio)
  };
  const sum = ratios.infantry + ratios.lancer + ratios.marksman;
  const normalized =
    sum > 0
      ? {
        infantry: ratios.infantry / sum,
        lancer: ratios.lancer / sum,
        marksman: ratios.marksman / sum
      }
      : {
        infantry: 1 / 3,
        lancer: 1 / 3,
        marksman: 1 / 3
      };

  return {
    counts: {
      infantry: Math.round(safeTotal * normalized.infantry),
      lancer: Math.round(safeTotal * normalized.lancer),
      marksman: Math.round(safeTotal * normalized.marksman)
    },
    total: safeTotal
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
