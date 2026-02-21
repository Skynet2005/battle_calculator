'use client';

import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { UserProfile } from '@/shared/types';
import { useCallback, useState } from 'react';
import type { ScenarioRunInput } from '../scenario-runner/scenarioRunnerUtils';
import { runSingleScenario, type ScenarioRunResult } from '../scenario-runner/scenarioRunnerUtils';

interface Candidate {
  id: string;
  label: string;
  cost: number;
  deltaAttack?: number;
  deltaLethality?: number;
}

const DEFAULT_CANDIDATES: Candidate[] = [
  { id: 'atk5', label: '+5% Attack', cost: 100, deltaAttack: 5 },
  { id: 'atk10', label: '+10% Attack', cost: 200, deltaAttack: 10 },
  { id: 'leth5', label: '+5% Lethality', cost: 150, deltaLethality: 5 },
  { id: 'leth10', label: '+10% Lethality', cost: 300, deltaLethality: 10 },
];

interface UpgradeROITabProps {
  currentProfile: UserProfile;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
  playerCapacityReport: CapacityReport | null;
  opponentCapacityReport: CapacityReport | null;
}

export default function UpgradeROITab({
  currentProfile,
  playerBaseStats,
  opponentBaseStats,
  playerCapacityReport,
  opponentCapacityReport
}: UpgradeROITabProps) {
  const [candidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);
  const [running, setRunning] = useState(false);
  const [baselineResult, setBaselineResult] = useState<ScenarioRunResult | null>(null);
  const [rows, setRows] = useState<{ candidate: Candidate; deltaWin: number; roi: number; result?: ScenarioRunResult }[]>([]);
  const capacityTotal = playerCapacityReport?.rally?.total ?? 0;
  const baseMix = { ...(currentProfile.rally?.troopMix?.player ?? { infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 }), totalTroops: capacityTotal };

  const runROI = useCallback(async () => {
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
    setBaselineResult(baseline);
    const baselineScore = baseline.summary.winner === 'Player' ? 1 : baseline.summary.winner === 'Opponent' ? -1 : 0;

    const results: { candidate: Candidate; deltaWin: number; roi: number; result?: ScenarioRunResult }[] = [];
    for (const candidate of candidates) {
      const modifiedStats = JSON.parse(JSON.stringify(playerBaseStats)) as SideBaseStats;
      if (candidate.deltaAttack) {
        for (const k of Object.keys(modifiedStats) as (keyof SideBaseStats)[]) {
          const line = modifiedStats[k] as { attack?: number };
          if (line && typeof line === 'object' && 'attack' in line && typeof line.attack === 'number') {
            (modifiedStats[k] as { attack: number }).attack = line.attack * (1 + candidate.deltaAttack / 100);
          }
        }
      }
      if (candidate.deltaLethality) {
        for (const k of Object.keys(modifiedStats) as (keyof SideBaseStats)[]) {
          const line = modifiedStats[k] as { lethality?: number };
          if (line && typeof line === 'object' && 'lethality' in line && typeof line.lethality === 'number') {
            (modifiedStats[k] as { lethality: number }).lethality = line.lethality * (1 + candidate.deltaLethality / 100);
          }
        }
      }
      const input: ScenarioRunInput = {
        profile: currentProfile,
        playerBaseStats: modifiedStats,
        opponentBaseStats,
        playerCapacityReport,
        opponentCapacityReport,
        playerMixOverride: baseMix,
        battleConfig: { maxTurns: 1000, randomMode: 'expectedValue', rngSeed: 1 }
      };
      const result = runSingleScenario(input);
      const swapScore = result.summary.winner === 'Player' ? 1 : result.summary.winner === 'Opponent' ? -1 : 0;
      const deltaWin = (swapScore - baselineScore) * 100;
      const benefit = deltaWin; // simple: benefit = delta win %
      const roi = candidate.cost > 0 ? benefit / candidate.cost : benefit;
      results.push({ candidate, deltaWin, roi, result });
    }
    results.sort((a, b) => b.roi - a.roi);
    setRows(results);
    setRunning(false);
  }, [currentProfile, playerBaseStats, opponentBaseStats, playerCapacityReport, opponentCapacityReport, baseMix, candidates]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card info-card">
        <h4 className="mb-2">Upgrade ROI Planner</h4>
        <p className="text-sm text-slate-400 mb-3">
          Rank candidate upgrades by benefit / cost. Benefit = Δ win %; cost = user-defined.
        </p>
        <button type="button" onClick={runROI} disabled={running || !currentProfile?.rally} className="btn primary">
          {running ? 'Running…' : 'Run ROI'}
        </button>
        {baselineResult && <p className="text-sm text-slate-300 mt-2">Baseline winner: <strong>{baselineResult.summary.winner}</strong></p>}
      </div>
      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <h4 className="p-3 border-b border-slate-700">Ranked upgrades (ROI)</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="p-2">Upgrade</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Δ Win %</th>
                <th className="p-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="p-2">{r.candidate.label}</td>
                  <td className="p-2">{r.candidate.cost}</td>
                  <td className={`p-2 ${r.deltaWin > 0 ? 'text-emerald-400' : r.deltaWin < 0 ? 'text-rose-400' : ''}`}>{r.deltaWin > 0 ? '+' : ''}{r.deltaWin}</td>
                  <td className="p-2 font-mono">{r.roi.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
