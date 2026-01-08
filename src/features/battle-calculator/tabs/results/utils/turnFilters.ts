/**
 * Turn Filters Utility
 *
 * Filters turn logs based on various criteria for the combat log.
 */

import type { TurnLog } from '@/domain/combat/types';
import { extractKeyMoments } from './keyMoments';

export interface TurnFilterOptions {
  onlyKeyMoments: boolean;
  onlySkillProcs: boolean;
  onlyDeathsAbove: number | null;
  onlyBuffsDebuffs: boolean;
  searchText: string;
}

export function filterTurns(
  turns: TurnLog[],
  options: TurnFilterOptions,
  playerIsAttacker: boolean
): TurnLog[] {
  let filtered = [...turns];

  // Only key moments
  if (options.onlyKeyMoments) {
    const keyMoments = extractKeyMoments(turns, playerIsAttacker);
    const keyTurnNumbers = new Set(keyMoments.map(m => m.turn));
    filtered = filtered.filter(t => keyTurnNumbers.has(t.turn));
  }

  // Only skill procs
  if (options.onlySkillProcs) {
    filtered = filtered.filter(turn => {
      return turn.actions.some(action => action.actionType === 'Skill');
    });
  }

  // Only deaths above threshold
  if (options.onlyDeathsAbove !== null && options.onlyDeathsAbove > 0) {
    filtered = filtered.filter(turn => {
      const totalDeaths = turn.actions.reduce((sum, action) => {
        return sum + (action.components.finalKills ?? 0);
      }, 0);
      return totalDeaths >= options.onlyDeathsAbove!;
    });
  }

  // Only buffs/debuffs
  if (options.onlyBuffsDebuffs) {
    filtered = filtered.filter(turn => {
      const hasModifiers =
        (turn.startModifiers?.attacker?.length ?? 0) > 0 ||
        (turn.startModifiers?.defender?.length ?? 0) > 0;
      return hasModifiers;
    });
  }

  // Search text (hero names, buff names, skill names)
  if (options.searchText.trim()) {
    const searchLower = options.searchText.toLowerCase().trim();
    filtered = filtered.filter(turn => {
      // Search in source names (from actions)
      const sourceMatch = turn.actions.some(action => {
        const sourceName = action.sourceName?.toLowerCase() ?? '';
        return sourceName.includes(searchLower);
      });

      // Search in skill names
      const skillMatch = turn.actions.some(action => {
        const skillName = action.skillName?.toLowerCase() ?? '';
        return skillName.includes(searchLower);
      });

      // Search in modifier source names
      const modifierMatch = [
        ...(turn.startModifiers?.attacker ?? []),
        ...(turn.startModifiers?.defender ?? [])
      ].some(mod => {
        const modSource = mod.source?.toLowerCase() ?? '';
        return modSource.includes(searchLower);
      });

      return sourceMatch || skillMatch || modifierMatch;
    });
  }

  return filtered;
}

export function getTurnHighlights(turns: TurnLog[], playerIsAttacker: boolean): Set<number> {
  const keyMoments = extractKeyMoments(turns, playerIsAttacker);
  return new Set(keyMoments.map(m => m.turn));
}
