'use client';

import type { BattleReport } from '@/domain/battle/engine/types';
import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig, UserProfile } from '@/shared/types';
import { useCallback, useState } from 'react';
import type { ScenarioRunInput } from '../scenario-runner/scenarioRunnerUtils';
import { runSingleScenario, type ScenarioRunResult } from '../scenario-runner/scenarioRunnerUtils';

interface Lever {
  id: string;
  label: string;
  deltaWin: number;
  baselineWinner: string;
  leverWinner: string;
  result?: ScenarioRunResult;
}

const MIX_PERTURBATIONS: { label: string; delta: Partial<TroopMixConfig> }[] = [
  { label: 'Inf +5%', delta: { infantryRatio: 5, lancerRatio: -5, marksmanRatio: 0 } },
  { label: 'Inf -5%', delta: { infantryRatio: -5, lancerRatio: 5, marksmanRatio: 0 } },
  { label: 'Lanc +5%', delta: { infantryRatio: -5, lancerRatio: 5, marksmanRatio: 0 } },
  { label: 'Lanc -5%', delta: { infantryRatio: 5, lancerRatio: -5, marksmanRatio: 0 } },
  { label: 'Mark +5%', delta: { infantryRatio: -5, lancerRatio: 0, marksmanRatio: 5 } },
  { label: 'Mark -5%', delta: { infantryRatio: 5, lancerRatio: 0, marksmanRatio: -5 } }
];

function applyMixDelta(base: TroopMixConfig, delta: Partial<TroopMixConfig>): TroopMixConfig {
  return {
    totalTroops: base.totalTroops,
    infantryRatio: Math.max(0, Math.min(100, (base.infantryRatio ?? 0) + (delta.infantryRatio ?? 0))),
    lancerRatio: Math.max(0, Math.min(100, (base.lancerRatio ?? 0) + (delta.lancerRatio ?? 0))),
    marksmanRatio: Math.max(0, Math.min(100, (base.marksmanRatio ?? 0) + (delta.marksmanRatio ?? 0)))
  };
}

interface FlipLeversTabProps {
  currentProfile: UserProfile;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
  playerCapacityReport: CapacityReport | null;
  opponentCapacityReport: CapacityReport | null;
}

export default function FlipLeversTab({
  currentProfile,
  playerBaseStats,
  opponentBaseStats,
  playerCapacityReport,
  opponentCapacityReport
}: FlipLeversTabProps) {
  const [running, setRunning] = useState(false);
  const [levers, setLevers] = useState<Lever[]>([]);
  const [detailReport, setDetailReport] = useState<BattleReport | null>(null);
  const [detailLabel, setDetailLabel] = useState<string | null>(null);
  const capacityTotal = playerCapacityReport?.rally?.total ?? 0;
  const baseMix: TroopMixConfig = {
    ...(currentProfile.rally?.troopMix?.player ?? { infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 }),
    totalTroops: capacityTotal
  };

  const runPerturbations = useCallback(async () => {
    if (!currentProfile?.rally) return;
    setRunning(true);
    const baselineInput: ScenarioRunInput = {
      profile: currentProfile,
      playerBaseStats,
      opponentBaseStats,
      playerCapacityReport,
      opponentCapacityReport,
      playerMixOverride: baseMix,
      battleConfig: { maxTurns: 1000, randomMode: 'expectedValue', rngSeed: 1 }
    };
    const baseline = runSingleScenario(baselineInput);
    const baselineScore = baseline.summary.winner === 'Player' ? 1 : baseline.summary.winner === 'Opponent' ? -1 : 0;

    const results: Lever[] = [];
    for (const { label, delta } of MIX_PERTURBATIONS) {
      const mix = applyMixDelta(baseMix, delta);
      const sum = mix.infantryRatio + mix.lancerRatio + mix.marksmanRatio;
      const normalized = sum > 0 ? { ...mix, infantryRatio: (mix.infantryRatio / sum) * 100, lancerRatio: (mix.lancerRatio / sum) * 100, marksmanRatio: (mix.marksmanRatio / sum) * 100 } : mix;
      const input: ScenarioRunInput = {
        profile: currentProfile,
        playerBaseStats,
        opponentBaseStats,
        playerCapacityReport,
        opponentCapacityReport,
        playerMixOverride: { ...normalized, totalTroops: capacityTotal },
        battleConfig: { maxTurns: 1000, randomMode: 'expectedValue', rngSeed: 1 }
      };
      const result = runSingleScenario(input);
      const leverScore = result.summary.winner === 'Player' ? 1 : result.summary.winner === 'Opponent' ? -1 : 0;
      const deltaWin = (leverScore - baselineScore) * 100;
      results.push({
        id: label,
        label,
        deltaWin,
        baselineWinner: baseline.summary.winner,
        leverWinner: result.summary.winner,
        result
      });
      await new Promise((r) => setTimeout(r, 0));
    }
    results.sort((a, b) => b.deltaWin - a.deltaWin);
    setLevers(results.slice(0, 10));
    setRunning(false);
  }, [currentProfile, playerBaseStats, opponentBaseStats, playerCapacityReport, opponentCapacityReport, baseMix, capacityTotal]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card info-card">
        <h4 className="mb-2">Flip Levers (sensitivity)</h4>
        <p className="text-sm text-slate-400 mb-3">
          Run small perturbations vs baseline; top 10 levers by Δ win rate. Run now to see that scenario.
        </p>
        <button
          type="button"
          onClick={runPerturbations}
          disabled={running || !currentProfile?.rally}
          className="btn primary"
        >
          {running ? 'Running…' : 'Run perturbations'}
        </button>
      </div>

      {levers.length > 0 && (
        <div className="card overflow-hidden">
          <h4 className="p-3 border-b border-slate-700">Top 10 levers</h4>
          <ul className="divide-y divide-slate-700">
            {levers.map((l) => (
              <li key={l.id} className="flex items-center justify-between p-3 hover:bg-slate-700/20">
                <div>
                  <span className="font-medium">{l.label}</span>
                  <span className={`ml-2 text-sm ${l.deltaWin > 0 ? 'text-emerald-400' : l.deltaWin < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    Δ {l.deltaWin > 0 ? '+' : ''}{l.deltaWin}
                  </span>
                  <span className="ml-2 text-slate-400 text-sm">{l.baselineWinner} → {l.leverWinner}</span>
                </div>
                <button
                  type="button"
                  className="btn ghost text-sm"
                  onClick={() => {
                    if (l.result?.report) {
                      setDetailReport(l.result.report);
                      setDetailLabel(l.label);
                    }
                  }}
                >
                  Run now
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {detailReport && detailLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setDetailReport(null); setDetailLabel(null); }}>
          <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">{detailLabel}</h3>
            <p><strong>Winner:</strong> {detailReport.winner} | <strong>Turns:</strong> {detailReport.turns?.length ?? 0}</p>
            <p className="text-sm text-slate-400 mt-2">Attacker remaining: Inf {detailReport.attackerRemaining?.Infantry ?? 0}, Lanc {detailReport.attackerRemaining?.Lancer ?? 0}, Mark {detailReport.attackerRemaining?.Marksman ?? 0}</p>
            <button type="button" onClick={() => { setDetailReport(null); setDetailLabel(null); }} className="btn ghost mt-3">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
