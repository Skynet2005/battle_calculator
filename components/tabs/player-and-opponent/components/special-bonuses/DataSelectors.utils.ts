import type { AdditiveBonuses, BasicBonuses } from '@/lib/battle/calculations';
import { extractJoinerBonuses, extractLeaderBonuses } from '@/lib/rally/rally-bonus-extractor';
import type { RallyConfiguration } from '@/components/types';

export type DataSelectorsSection = 'experts' | 'skins' | 'daybreakIsland' | 'specialBonuses';

export const STAT_KEYS = ['attack', 'defense', 'lethality', 'health'] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export type FlatStats = Record<StatKey, number>;

export type ContributingHero = { name: string; role: string; class?: string };

export const DEFAULT_EXPERT_SELECTIONS = {
  attack: 0,
  defense: 0,
  lethality: 0,
  health: 0,
  deploymentCapacity: 0,
  rallyCapacity: 0
};

export const DEFAULT_STACKED_SKINS: FlatStats = {
  attack: 0,
  defense: 0,
  lethality: 0,
  health: 0
};

export const DEFAULT_DAYBREAK = {
  infantry: { attack: 0, defense: 0 },
  lancer: { attack: 0, defense: 0 },
  marksman: { attack: 0, defense: 0 },
  troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
  deploymentCapacity: 0,
  rallyCapacity: 0
};

export const DEFAULT_ADDITIVE_BONUSES: AdditiveBonuses = {
  temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
  supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
  specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 }
};

export function deriveVipSelectValue(basicBonuses: BasicBonuses): string {
  const vip = basicBonuses.vipPrestige || { attack: 0, defense: 0, lethality: 0, health: 0 };

  // VIP 12 + Globe Level 1 (encoded in vip values)
  if (vip.attack === 21 && vip.defense === 16 && vip.health === 16 && vip.lethality === 16) return '12-globe1';

  // VIP 12
  if (vip.attack === 16 && vip.defense === 16 && vip.health === 16 && vip.lethality === 16) return '12';

  // VIP 11
  if (vip.attack === 14 && vip.defense === 14 && vip.health === 14 && vip.lethality === 0) return '11';

  // VIP 10
  if (vip.attack === 12 && vip.defense === 12 && vip.health === 0 && vip.lethality === 0) return '10';

  // VIP 9
  if (vip.attack === 0 && vip.defense === 10 && vip.health === 0 && vip.lethality === 0) return '9';

  return 'none';
}

export function vipValuesForSelect(value: string): {
  vipPrestige: FlatStats;
  globe: FlatStats;
} {
  let vipPrestige: FlatStats = { attack: 0, defense: 0, lethality: 0, health: 0 };
  let globe: FlatStats = { attack: 0, defense: 0, lethality: 0, health: 0 };

  if (value === '9') vipPrestige = { attack: 0, defense: 10, lethality: 0, health: 0 };
  else if (value === '10') vipPrestige = { attack: 12, defense: 12, lethality: 0, health: 0 };
  else if (value === '11') vipPrestige = { attack: 14, defense: 14, lethality: 0, health: 14 };
  else if (value === '12') vipPrestige = { attack: 16, defense: 16, lethality: 16, health: 16 };
  else if (value === '12-globe1') {
    // Globe is included in VIP values per your current behavior
    vipPrestige = { attack: 21, defense: 16, lethality: 16, health: 16 };
    globe = { attack: 0, defense: 0, lethality: 0, health: 0 };
  }

  return { vipPrestige, globe };
}

export function computeContributingHeroes(rally?: RallyConfiguration, isOpponent: boolean = false): ContributingHero[] {
  if (!rally) return [];

  const currentLeader = isOpponent ? (rally.opponentLeader || rally.leader) : (rally.playerLeader || rally.leader);

  const mode =
    isOpponent ? (rally.specialWidgetBonus?.opponent || 'defending') : (rally.specialWidgetBonus?.player || 'attacking');

  const contributing: ContributingHero[] = [];

  // Leaders
  if (currentLeader?.infantry) {
    const leaderBonuses = extractLeaderBonuses(currentLeader.infantry as any, mode as any);
    const total =
      leaderBonuses.additive.attack +
      leaderBonuses.additive.defense +
      leaderBonuses.additive.lethality +
      leaderBonuses.additive.health;

    if (total > 0) contributing.push({ name: currentLeader.infantry.heroName, role: 'Leader (Infantry)' });
  }

  if (currentLeader?.lancer) {
    const leaderBonuses = extractLeaderBonuses(currentLeader.lancer as any, mode as any);
    const total =
      leaderBonuses.additive.attack +
      leaderBonuses.additive.defense +
      leaderBonuses.additive.lethality +
      leaderBonuses.additive.health;

    if (total > 0) contributing.push({ name: currentLeader.lancer.heroName, role: 'Leader (Lancer)' });
  }

  if (currentLeader?.marksman) {
    const leaderBonuses = extractLeaderBonuses(currentLeader.marksman as any, mode as any);
    const total =
      leaderBonuses.additive.attack +
      leaderBonuses.additive.defense +
      leaderBonuses.additive.lethality +
      leaderBonuses.additive.health;

    if (total > 0) contributing.push({ name: currentLeader.marksman.heroName, role: 'Leader (Marksman)' });
  }

  // Joiners
  if (rally.joiners && rally.joiners.length > 0) {
    for (const joiner of rally.joiners) {
      const joinerBonuses = extractJoinerBonuses([joiner as any], mode as any);
      const total =
        joinerBonuses.additive.attack +
        joinerBonuses.additive.defense +
        joinerBonuses.additive.lethality +
        joinerBonuses.additive.health;

      if (total > 0) {
        contributing.push({ name: joiner.heroName, role: 'Joiner', class: joiner.heroClass });
      }
    }
  }

  return contributing;
}
