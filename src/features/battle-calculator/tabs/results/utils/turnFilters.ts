/**
 * Turn Filters Utility
 *
 * Filters turn logs based on various criteria for the combat log.
 */

import type { TurnLog } from '@/domain/battle/engine/types';
import { extractKeyMoments, type KeyMoment } from './keyMoments';

export interface TurnFilterOptions {
  onlyKeyMoments: boolean;
  onlySkillProcs: boolean;
  onlyDeathsAbove: number | null;
  onlyBuffsDebuffs: boolean;
  searchText: string;
}

/**
 * Filter turns in a single pass using all active filter conditions.
 * Accepts optional precomputed keyMoments to avoid recomputing.
 */
export function filterTurns(
  turns: TurnLog[],
  options: TurnFilterOptions,
  playerIsAttacker: boolean,
  precomputedKeyMoments?: KeyMoment[]
): TurnLog[] {
  const noFiltersActive =
    !options.onlyKeyMoments &&
    !options.onlySkillProcs &&
    (options.onlyDeathsAbove === null || options.onlyDeathsAbove <= 0) &&
    !options.onlyBuffsDebuffs &&
    !options.searchText.trim();

  if (noFiltersActive) return turns;

  // Build key turn set lazily (only if needed)
  let keyTurnNumbers: Set<number> | null = null;
  if (options.onlyKeyMoments) {
    const moments = precomputedKeyMoments ?? extractKeyMoments(turns, playerIsAttacker);
    keyTurnNumbers = new Set(moments.map(m => m.turn));
  }

  const searchLower = options.searchText.trim().toLowerCase();
  const hasSearch = searchLower.length > 0;
  const deathThreshold = options.onlyDeathsAbove;

  // Single-pass filter
  return turns.filter(turn => {
    if (keyTurnNumbers && !keyTurnNumbers.has(turn.turn)) return false;

    if (options.onlySkillProcs) {
      if (!turn.actions.some(a => a.actionType === 'Skill')) return false;
    }

    if (deathThreshold !== null && deathThreshold > 0) {
      let totalDeaths = 0;
      for (const a of turn.actions) totalDeaths += a.components.finalKills ?? 0;
      if (totalDeaths < deathThreshold) return false;
    }

    if (options.onlyBuffsDebuffs) {
      const hasMods =
        (turn.startModifiers?.attacker?.length ?? 0) > 0 ||
        (turn.startModifiers?.defender?.length ?? 0) > 0;
      if (!hasMods) return false;
    }

    if (hasSearch) {
      const matchesAction = turn.actions.some(a =>
        (a.sourceName?.toLowerCase().includes(searchLower)) ||
        (a.skillName?.toLowerCase().includes(searchLower))
      );
      if (matchesAction) return true;

      const allMods = [
        ...(turn.startModifiers?.attacker ?? []),
        ...(turn.startModifiers?.defender ?? [])
      ];
      const matchesMod = allMods.some(m => m.source?.toLowerCase().includes(searchLower));
      if (!matchesMod) return false;
    }

    return true;
  });
}

export function getTurnHighlights(keyMoments: KeyMoment[]): Set<number> {
  return new Set(keyMoments.map(m => m.turn));
}
