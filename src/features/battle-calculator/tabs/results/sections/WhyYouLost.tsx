/**
 * Why You Lost - Hero Section (Primary Tier)
 *
 * Top 3 drivers with numbers, plus "What flips the outcome fastest" suggestions.
 * This is the centerpiece of the results page.
 */

import { useMemo } from 'react';
import type { FightResult } from '@/domain/rally/combat-fight';
import type { BattleReport } from '@/domain/battle/engine/types';
import { resolveOutcome } from '@/features/battle-calculator/utils/rally-outcome';
import type { BattleSideContext, CapacityReport } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig } from '@/shared/types';
import { buildOutcomeSummary } from '@/features/battle-calculator/utils/outcomeSummary';

interface WhyYouLostProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  battleReport: BattleReport | null;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
  playerMix: TroopMixConfig;
  opponentMix: TroopMixConfig;
}

export function WhyYouLost({
  player,
  opponent,
  fightResult,
  battleReport,
  playerCapacity,
  opponentCapacity,
  playerMix,
  opponentMix
}: WhyYouLostProps) {
  const { winner } = resolveOutcome(player.role, fightResult);
  const summary = useMemo(() => buildOutcomeSummary({
    player,
    opponent,
    fightResult,
    battleReport,
    playerCapacity,
    opponentCapacity,
    playerMix,
    opponentMix
  }), [player, opponent, fightResult, battleReport, playerCapacity, opponentCapacity, playerMix, opponentMix]);

  if (winner === 'player') {
    // Show "Why you won" instead
    return (
      <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-emerald-300">Victory</div>
          <div className="text-sm text-gray-300">Your rally prevailed</div>
        </div>
        <div className="space-y-3">
          {summary.reasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-200">
              <span className="text-emerald-300 mt-0.5">✓</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (winner === 'stalemate') {
    return (
      <div className="bg-slate-500/10 border border-slate-400/30 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-slate-300">Stalemate</div>
          <div className="text-sm text-gray-300">Evenly matched</div>
        </div>
        <div className="space-y-3">
          {summary.reasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-gray-200">
              <span className="text-slate-300 mt-0.5">•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Defeat case - the main focus
  return (
    <div className="bg-rose-500/10 border border-rose-400/30 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold text-rose-300">Defeat</div>
        <div className="text-sm text-gray-300">Top drivers of this outcome</div>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Top 3 Drivers</div>
        <div className="space-y-3">
          {summary.reasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
              <div className="shrink-0 w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 text-sm text-gray-200">{reason}</div>
            </div>
          ))}
        </div>
      </div>

      {summary.actions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-700/50">
          <div className="text-sm font-semibold text-emerald-300 uppercase tracking-wide">What Flips the Outcome Fastest</div>
          <div className="space-y-2">
            {summary.actions.slice(0, 4).map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-200">
                <span className="text-emerald-300 mt-0.5">→</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
