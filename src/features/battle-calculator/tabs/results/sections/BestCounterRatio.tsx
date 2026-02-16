/**
 * Best Counter Ratio Section
 *
 * Displays recommended player troop ratios to counter the opponent's composition.
 */

import { useMemo } from 'react';
import { SectionCard } from '@/shared/ui';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig } from '@/shared/types';
import { computeBestCounterRatio } from '../utils/best-counter-ratio';
import { clientLogger } from '@/shared/utils/clientLogger';

interface BestCounterRatioProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  rallySize: number;
  onApplyRatio?: (ratio: TroopMixConfig) => void;
}

export function BestCounterRatio({
  player,
  opponent,
  rallySize,
  onApplyRatio
}: BestCounterRatioProps) {
  const result = useMemo(() => {
    if (!player.stats || !opponent.stats || !opponent.mix || rallySize <= 0) {
      return null;
    }

    try {
      return computeBestCounterRatio({
        player,
        opponent,
        rallySize,
        constraints: {
          minInfantryPct: 25,
          minLancerPct: 10
        }
      });
    } catch (error) {
      clientLogger.error('Error computing best counter ratio', error, { component: 'BestCounterRatio' });
      return null;
    }
  }, [player, opponent, rallySize]);

  if (!result) {
    return null;
  }

  const formatRatio = (ratio: TroopMixConfig) => {
    return `${ratio.infantryRatio.toFixed(1)}% / ${ratio.lancerRatio.toFixed(1)}% / ${ratio.marksmanRatio.toFixed(1)}%`;
  };

  const getOutcomeLabel = (playerRemaining: number, opponentRemaining: number) => {
    if (playerRemaining > opponentRemaining) {
      return { label: 'Win', color: 'text-emerald-300' };
    } else if (opponentRemaining > playerRemaining) {
      return { label: 'Loss', color: 'text-rose-300' };
    } else {
      return { label: 'Draw', color: 'text-slate-300' };
    }
  };

  return (
    <SectionCard
      title="Best Counter Ratio"
      description="Recommended player troop ratios to maximize advantage against opponent"
      className="mt-6"
      collapsible
      defaultCollapsed={true}
    >
      <div className="space-y-4">
        {/* Best Recommendation */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-emerald-300 mb-1">Best Recommendation</div>
              <div className="text-xs text-gray-400">Infantry / Lancer / Marksman</div>
            </div>
            {onApplyRatio && (
              <button
                onClick={() => onApplyRatio(result.best.ratio)}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-300 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
          <div className="text-lg font-bold text-slate-100 mb-2">
            {formatRatio(result.best.ratio)}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-gray-400">Outcome: </span>
              <span className={getOutcomeLabel(result.best.playerRemaining, result.best.opponentRemaining).color}>
                {getOutcomeLabel(result.best.playerRemaining, result.best.opponentRemaining).label}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Remaining: </span>
              <span className="text-slate-200 font-medium">
                {result.best.playerRemaining.toLocaleString()} vs {result.best.opponentRemaining.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-300">
            {result.best.explanation}
          </div>
        </div>

        {/* Top 3 Alternatives */}
        {result.top.length > 1 && (
          <div>
            <div className="text-sm font-semibold text-slate-300 mb-3">Alternative Options</div>
            <div className="space-y-2">
              {result.top.slice(1).map((option, index) => {
                const outcome = getOutcomeLabel(
                  option.playerRemaining,
                  option.opponentRemaining
                );
                return (
                  <div
                    key={index}
                    className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-slate-200">
                        #{index + 2}: {formatRatio(option.ratio)}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${outcome.color}`}>
                          {outcome.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {option.playerRemaining.toLocaleString()} vs {option.opponentRemaining.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {option.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="text-xs text-gray-500 italic border-t border-slate-700/50 pt-3">
          Recommendations use the same battle simulation engine as the main results. Predictions match Apply button outcomes.
        </div>
      </div>
    </SectionCard>
  );
}
