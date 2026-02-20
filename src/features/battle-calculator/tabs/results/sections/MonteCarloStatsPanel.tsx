'use client';

/**
 * Monte Carlo Statistics Panel
 *
 * Surfaces hidden engine statistics from Monte Carlo simulations:
 * - Win/Draw/Loss rate visualization (three-way split bar)
 * - Confidence interval for kills
 * - Remaining troops distribution (min/mean/max per type)
 * - Outcome variance indicator
 */

import { useMemo } from 'react';
import { SectionCard } from '@/shared/ui';
import type { BattleReport, TroopCounts } from '@/domain/battle/engine/types';
import { TROOP_TYPE_VALUES } from '@/domain/battle/engine/types';
import { formatBigNumber } from '../utils/format';

interface MonteCarloStatsPanelProps {
  battleReport: BattleReport;
  playerIsAttacker: boolean;
}

function DistributionBar({
  winPct,
  drawPct,
  lossPct,
}: {
  winPct: number;
  drawPct: number;
  lossPct: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="text-emerald-400">Win {winPct.toFixed(1)}%</span>
        {drawPct > 0 && <span className="text-slate-400">Draw {drawPct.toFixed(1)}%</span>}
        <span className="text-rose-400">Loss {lossPct.toFixed(1)}%</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
        {winPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${winPct}%` }}
          />
        )}
        {drawPct > 0 && (
          <div
            className="h-full bg-slate-500 transition-all duration-300"
            style={{ width: `${drawPct}%` }}
          />
        )}
        {lossPct > 0 && (
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${lossPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

function ConfidenceIntervalBar({
  lower,
  upper,
  mean,
  maxPossible,
}: {
  lower: number;
  upper: number;
  mean: number;
  maxPossible: number;
}) {
  const scale = maxPossible > 0 ? 100 / maxPossible : 0;
  const leftPct = Math.max(0, lower * scale);
  const rightPct = Math.min(100, upper * scale);
  const meanPct = Math.min(100, mean * scale);
  const widthPct = Math.max(1, rightPct - leftPct);

  return (
    <div className="space-y-1">
      <div className="relative h-4 w-full rounded-full bg-slate-800">
        <div
          className="absolute top-0 h-full rounded-full bg-sky-500/30 border border-sky-400/40"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-sky-400"
          style={{ left: `${meanPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{formatBigNumber(lower)}</span>
        <span className="text-sky-400">{formatBigNumber(mean)}</span>
        <span>{formatBigNumber(upper)}</span>
      </div>
    </div>
  );
}

function TroopDistRow({
  label,
  min,
  mean,
  max,
}: {
  label: string;
  min: number;
  mean: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-20 text-gray-400 shrink-0">{label}</span>
      <span className="w-16 text-right tabular-nums text-gray-500">{formatBigNumber(min)}</span>
      <span className="w-16 text-right tabular-nums text-slate-200 font-medium">{formatBigNumber(mean)}</span>
      <span className="w-16 text-right tabular-nums text-gray-500">{formatBigNumber(max)}</span>
    </div>
  );
}

function VarianceIndicator({ stdDev, meanKills }: { stdDev: number; meanKills: number }) {
  const cv = meanKills > 0 ? stdDev / meanKills : 0;
  let level: 'Low' | 'Medium' | 'High';
  let color: string;
  if (cv < 0.1) {
    level = 'Low';
    color = 'text-emerald-400 bg-emerald-500/10 border-emerald-400/30';
  } else if (cv < 0.3) {
    level = 'Medium';
    color = 'text-amber-400 bg-amber-500/10 border-amber-400/30';
  } else {
    level = 'High';
    color = 'text-rose-400 bg-rose-500/10 border-rose-400/30';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level} variance
    </div>
  );
}

function totalTroopCounts(counts: TroopCounts): number {
  return counts.Infantry + counts.Lancer + counts.Marksman;
}

export function MonteCarloStatsPanel({ battleReport, playerIsAttacker }: MonteCarloStatsPanelProps) {
  const stats = useMemo(() => {
    const atkWinRate = battleReport.attackerWinRate ?? 0;
    const drawRate = battleReport.drawRate ?? 0;
    const playerWinRate = playerIsAttacker ? atkWinRate : (100 - atkWinRate - drawRate);
    const playerLossRate = 100 - playerWinRate - drawRate;

    const stdDev = battleReport.killsStdDev ?? 0;
    const ci = battleReport.killsConfidenceInterval;
    const meanKills = battleReport.meanFinalKills?.finalKills ?? 0;
    const dist = battleReport.remainingDistribution;
    const sims = battleReport.simulationsRun ?? 0;

    return { playerWinRate, drawRate, playerLossRate, stdDev, ci, meanKills, dist, sims };
  }, [battleReport, playerIsAttacker]);

  const hasDistribution = Boolean(stats.dist);

  return (
    <SectionCard
      title="Monte Carlo Statistics"
      description={`${stats.sims} simulations analyzed`}
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-5">
        {/* Win Rate Distribution Bar */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Outcome Probability
          </div>
          <DistributionBar
            winPct={stats.playerWinRate}
            drawPct={stats.drawRate}
            lossPct={stats.playerLossRate}
          />
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Win Rate</div>
            <div className="text-lg font-bold text-emerald-400">{stats.playerWinRate.toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Draw Rate</div>
            <div className="text-lg font-bold text-slate-300">{stats.drawRate.toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Kills StdDev</div>
            <div className="text-lg font-bold text-sky-300">{formatBigNumber(stats.stdDev)}</div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Variance</div>
            <div className="mt-0.5">
              <VarianceIndicator stdDev={stats.stdDev} meanKills={stats.meanKills} />
            </div>
          </div>
        </div>

        {/* Confidence Interval */}
        {stats.ci && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              95% Confidence Interval (Kills)
            </div>
            <ConfidenceIntervalBar
              lower={stats.ci[0]}
              upper={stats.ci[1]}
              mean={stats.meanKills}
              maxPossible={stats.ci[1] * 1.2 || 1}
            />
          </div>
        )}

        {/* Remaining Troops Distribution */}
        {hasDistribution && stats.dist && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Remaining Troops Distribution
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Player side */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
                <div className="text-xs font-semibold text-rose-300 mb-2">Player</div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1">
                  <span className="w-20" />
                  <span className="w-16 text-right">Min</span>
                  <span className="w-16 text-right">Mean</span>
                  <span className="w-16 text-right">Max</span>
                </div>
                {(() => {
                  const side = playerIsAttacker ? stats.dist.attacker : stats.dist.defender;
                  return TROOP_TYPE_VALUES.map((t) => (
                    <TroopDistRow
                      key={t}
                      label={t}
                      min={side.min[t]}
                      mean={Math.round(side.mean[t])}
                      max={side.max[t]}
                    />
                  ));
                })()}
                <div className="border-t border-slate-700/30 mt-1 pt-1">
                  <TroopDistRow
                    label="Total"
                    min={totalTroopCounts(playerIsAttacker ? stats.dist.attacker.min : stats.dist.defender.min)}
                    mean={Math.round(totalTroopCounts(playerIsAttacker ? stats.dist.attacker.mean : stats.dist.defender.mean))}
                    max={totalTroopCounts(playerIsAttacker ? stats.dist.attacker.max : stats.dist.defender.max)}
                  />
                </div>
              </div>

              {/* Opponent side */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
                <div className="text-xs font-semibold text-sky-300 mb-2">Opponent</div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1">
                  <span className="w-20" />
                  <span className="w-16 text-right">Min</span>
                  <span className="w-16 text-right">Mean</span>
                  <span className="w-16 text-right">Max</span>
                </div>
                {(() => {
                  const side = playerIsAttacker ? stats.dist.defender : stats.dist.attacker;
                  return TROOP_TYPE_VALUES.map((t) => (
                    <TroopDistRow
                      key={t}
                      label={t}
                      min={side.min[t]}
                      mean={Math.round(side.mean[t])}
                      max={side.max[t]}
                    />
                  ));
                })()}
                <div className="border-t border-slate-700/30 mt-1 pt-1">
                  <TroopDistRow
                    label="Total"
                    min={totalTroopCounts(playerIsAttacker ? stats.dist.defender.min : stats.dist.attacker.min)}
                    mean={Math.round(totalTroopCounts(playerIsAttacker ? stats.dist.defender.mean : stats.dist.attacker.mean))}
                    max={totalTroopCounts(playerIsAttacker ? stats.dist.defender.max : stats.dist.attacker.max)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
