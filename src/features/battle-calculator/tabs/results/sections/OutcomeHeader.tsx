/**
 * Outcome Header - Sticky Primary Section
 *
 * Battle report headline that stays visible while scrolling.
 * Shows: Result, Win Rate (MC mode), Rounds, Power Ratio, Primary Cause Chips
 */

import { useMemo } from 'react';
import type { BattleReport } from '@/domain/combat/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { resolveOutcome } from '@/features/battle-calculator/utils/rally-outcome';
import { totalCounts } from '@/features/battle-calculator/utils/turn-analytics';
import { formatBigNumber } from '../utils/format';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';

interface OutcomeHeaderProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  battleReport: BattleReport | null;
  simulationMode: 'monteCarlo' | 'expectedValue';
  simulationCount?: number;
}

export function OutcomeHeader({
  player,
  opponent,
  fightResult,
  battleReport,
  simulationMode,
  simulationCount
}: OutcomeHeaderProps) {
  const { winner, label: winnerLabel } = resolveOutcome(player.role, fightResult);
  const playerIsAttacker = player.role === 'attacker';

  const playerInitial = useMemo(() => {
    // Try to get from fighter first, then from battleReport, then estimate
    if (player.fighter?.troopCounts) {
      return totalTroops(player.fighter.troopCounts);
    }
    if (battleReport?.turns?.[0]) {
      const firstTurn = battleReport.turns[0];
      const counts = playerIsAttacker ? firstTurn.startAttackerTroops ?? firstTurn.attackerTroops : firstTurn.startDefenderTroops ?? firstTurn.defenderTroops;
      if (counts) return totalCounts(counts);
    }
    const playerFinal = totalTroops(playerIsAttacker ? fightResult.attackerRemaining : fightResult.defenderRemaining);
    const playerCasualties = fightResult.rounds.reduce((sum, round) => {
      const cas = playerIsAttacker ? round.attackerCasualties : round.defenderCasualties;
      return sum + (cas.infantry ?? 0) + (cas.lancer ?? 0) + (cas.marksman ?? 0);
    }, 0);
    return playerFinal + playerCasualties;
  }, [fightResult, playerIsAttacker, player.fighter, battleReport]);

  const opponentInitial = useMemo(() => {
    if (opponent.fighter?.troopCounts) {
      return totalTroops(opponent.fighter.troopCounts);
    }
    if (battleReport?.turns?.[0]) {
      const firstTurn = battleReport.turns[0];
      const counts = playerIsAttacker ? firstTurn.startDefenderTroops ?? firstTurn.defenderTroops : firstTurn.startAttackerTroops ?? firstTurn.attackerTroops;
      if (counts) return totalCounts(counts);
    }
    const opponentFinal = totalTroops(playerIsAttacker ? fightResult.defenderRemaining : fightResult.attackerRemaining);
    const opponentCasualties = fightResult.rounds.reduce((sum, round) => {
      const cas = playerIsAttacker ? round.defenderCasualties : round.attackerCasualties;
      return sum + (cas.infantry ?? 0) + (cas.lancer ?? 0) + (cas.marksman ?? 0);
    }, 0);
    return opponentFinal + opponentCasualties;
  }, [fightResult, playerIsAttacker, opponent.fighter, battleReport]);

  const powerRatio = opponentInitial > 0 ? playerInitial / opponentInitial : 0;
  const rounds = fightResult.rounds?.length ?? 0;

  // Primary cause chips (simplified - will be enhanced)
  const primaryCauses = useMemo(() => {
    const causes: string[] = [];
    if (powerRatio < 0.5) causes.push('Out-powered');
    if (powerRatio > 2) causes.push('Power advantage');
    // Add more logic based on stats, mix, etc.
    return causes;
  }, [powerRatio]);

  const resultColor = winner === 'player' ? 'text-emerald-300' : winner === 'opponent' ? 'text-rose-300' : 'text-slate-300';
  const resultBg = winner === 'player' ? 'bg-emerald-500/10 border-emerald-400/30' : winner === 'opponent' ? 'bg-rose-500/10 border-rose-400/30' : 'bg-slate-500/10 border-slate-400/30';

  return (
    <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${resultBg}`}>
            <span className="text-xs uppercase tracking-wide text-gray-400">Result:</span>
            <span className={`font-bold ${resultColor}`}>{winnerLabel}</span>
          </div>

          {simulationMode === 'monteCarlo' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/40">
              <span className="text-xs uppercase tracking-wide text-gray-400">Win Rate:</span>
              <span className="font-semibold text-slate-200">
                {(() => {
                  // Check if win rate is available in battleReport
                  const winRate = battleReport?.attackerWinRate;
                  if (winRate !== undefined && winRate !== null && battleReport?.simulationsRun) {
                    // Determine if we should show attacker or player win rate
                    const playerIsAttacker = player.role === 'attacker';
                    const playerWinRate = playerIsAttacker ? winRate : (100 - winRate);
                    return `${playerWinRate.toFixed(1)}%`;
                  }
                  // If simulations were run but win rate not calculated yet, show calculating
                  if (battleReport?.simulationsRun && winRate === undefined) {
                    return 'Calculating...';
                  }
                  // If no simulations run yet, show calculating
                  return simulationCount ? 'Calculating...' : 'N/A';
                })()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/40">
            <span className="text-xs uppercase tracking-wide text-gray-400">Rounds:</span>
            <span className="font-semibold text-slate-200">{rounds}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/50 bg-slate-900/40">
            <span className="text-xs uppercase tracking-wide text-gray-400">Power Ratio:</span>
            <span className="font-semibold text-rose-300">{formatBigNumber(playerInitial)}</span>
            <span className="text-gray-500">vs</span>
            <span className="font-semibold text-sky-300">{formatBigNumber(opponentInitial)}</span>
            <span className="text-gray-500">
              ({powerRatio < 1 ? '≈' : ''}{powerRatio.toFixed(2)}×)
            </span>
          </div>

          {primaryCauses.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {primaryCauses.map((cause, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-full text-xs bg-slate-800/60 text-slate-300 border border-slate-700/40"
                >
                  {cause}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
