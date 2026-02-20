/**
 * Outcome Header - Sticky Primary Section
 *
 * Battle report headline that stays visible while scrolling.
 * Shows: Result, Win Rate (MC mode), Rounds, Power Ratio, Primary Cause Chips
 */

import { useMemo } from 'react';
import type { BattleReport } from '@/domain/battle/engine/types';
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

  const primaryCauses = useMemo(() => {
    const chips: { label: string; tone: 'positive' | 'negative' | 'neutral' }[] = [];

    // Power ratio
    if (powerRatio < 0.5) chips.push({ label: 'Out-powered', tone: 'negative' });
    else if (powerRatio > 2) chips.push({ label: 'Power advantage', tone: 'positive' });

    // Stat differentials
    if (player.stats && opponent.stats) {
      const avgStat = (stats: Record<string, { attack: number; defense: number; lethality: number; health: number }> | null) => {
        if (!stats) return null;
        const keys = Object.keys(stats);
        if (!keys.length) return null;
        const agg = keys.reduce(
          (acc, k) => {
            acc.attack += stats[k].attack;
            acc.defense += stats[k].defense;
            acc.lethality += stats[k].lethality;
            acc.health += stats[k].health;
            return acc;
          },
          { attack: 0, defense: 0, lethality: 0, health: 0 }
        );
        return {
          attack: agg.attack / keys.length,
          defense: agg.defense / keys.length,
          lethality: agg.lethality / keys.length,
          health: agg.health / keys.length,
        };
      };
      const pAvg = avgStat(player.stats);
      const oAvg = avgStat(opponent.stats);
      if (pAvg && oAvg) {
        const atkDelta = pAvg.attack - oAvg.attack;
        const defDelta = pAvg.defense - oAvg.defense;
        if (atkDelta > 5) chips.push({ label: 'ATK edge', tone: 'positive' });
        else if (atkDelta < -5) chips.push({ label: 'ATK deficit', tone: 'negative' });
        if (defDelta > 5) chips.push({ label: 'DEF edge', tone: 'positive' });
        else if (defDelta < -5) chips.push({ label: 'DEF deficit', tone: 'negative' });
      }
    }

    // Skill advantage from battle report
    if (battleReport?.turns?.length) {
      const rolls = battleReport.turns.flatMap((t) => t.skillRolls ?? []);
      const playerSide = playerIsAttacker ? 'attacker' : 'defender';
      const oppSide = playerIsAttacker ? 'defender' : 'attacker';
      const playerProcs = rolls.filter((r) => r.side === playerSide && r.succeeded).length;
      const oppProcs = rolls.filter((r) => r.side === oppSide && r.succeeded).length;
      if (playerProcs > oppProcs + 3) chips.push({ label: 'Skill advantage', tone: 'positive' });
      else if (oppProcs > playerProcs + 3) chips.push({ label: 'Skill disadvantage', tone: 'negative' });

      // Buff stacking edge
      const lastTurn = battleReport.turns[battleReport.turns.length - 1];
      const atkMods = lastTurn?.startModifiers?.attacker?.length ?? 0;
      const defMods = lastTurn?.startModifiers?.defender?.length ?? 0;
      const playerMods = playerIsAttacker ? atkMods : defMods;
      const oppMods = playerIsAttacker ? defMods : atkMods;
      if (playerMods > oppMods + 2) chips.push({ label: 'Buff stacking edge', tone: 'positive' });
      else if (oppMods > playerMods + 2) chips.push({ label: 'Buff stacking deficit', tone: 'negative' });
    }

    // Monte Carlo variance note
    if (battleReport?.killsStdDev && battleReport.meanFinalKills) {
      const cv = battleReport.meanFinalKills.finalKills > 0
        ? battleReport.killsStdDev / battleReport.meanFinalKills.finalKills
        : 0;
      if (cv > 0.3) chips.push({ label: 'High variance', tone: 'neutral' });
    }

    return chips.slice(0, 5);
  }, [powerRatio, player.stats, opponent.stats, battleReport, playerIsAttacker]);

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
              {primaryCauses.map((chip, idx) => {
                const toneClass =
                  chip.tone === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
                    : chip.tone === 'negative'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/40';
                return (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded-full text-xs border ${toneClass}`}
                  >
                    {chip.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
