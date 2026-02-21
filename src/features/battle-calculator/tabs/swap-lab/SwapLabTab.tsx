'use client';

import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { UserProfile } from '@/shared/types';
import { useCallback, useState } from 'react';
import type { ScenarioRunInput } from '../scenario-runner/scenarioRunnerUtils';
import { runSingleScenario, runSingleScenarioWithTrials, type ScenarioRunResult } from '../scenario-runner/scenarioRunnerUtils';
import { getCandidatesForSlot, getSlotLabel, profileWithSlotOverride, type SwapSlot } from './swapLabUtils';

const SLOTS: SwapSlot[] = ['infantry_leader', 'lancer_leader', 'marksman_leader', 'joiner_0', 'joiner_1', 'joiner_2', 'joiner_3'];

type SlotSelection = SwapSlot | 'all';

/** Max candidates per slot (uses class-filtered list). */
const MAX_CANDIDATES_PER_SLOT = 12;

/** Phase 1: one expectedValue run per swap (fast screening). Phase 2: Monte Carlo trials only for top N. */
const TOP_N_TO_REFINE = 20;
const TRIALS_REFINE = 10;

interface SwapLabTabProps {
  currentProfile: UserProfile;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
  playerCapacityReport: CapacityReport | null;
  opponentCapacityReport: CapacityReport | null;
}

interface SwapRow {
  slot: SwapSlot;
  candidate: string;
  /** Delta from phase 1 (expected value), percentage points. */
  deltaWinRate: number;
  baselineWinRate: number;
  swapWinRate: number;
  baselineWinner: string;
  swapWinner: string;
  /** When set, this row was refined with Monte Carlo; use for display/sort. */
  refinedWinRate?: number;
  refinedDelta?: number;
}

export default function SwapLabTab({
  currentProfile,
  playerBaseStats,
  opponentBaseStats,
  playerCapacityReport,
  opponentCapacityReport
}: SwapLabTabProps) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, phase: 'screening' as 'screening' | 'refining' });
  const [baselineResult, setBaselineResult] = useState<ScenarioRunResult | null>(null);
  const [rows, setRows] = useState<SwapRow[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection>('infantry_leader');
  const capacityTotal = playerCapacityReport?.rally?.total ?? 0;

  const toWinRate = (r: ScenarioRunResult): number => {
    if (r.summary.playerWinRate != null) return r.summary.playerWinRate;
    if (r.summary.winner === 'Player') return 1;
    if (r.summary.winner === 'Opponent') return 0;
    return 0.5;
  };

  const runSwaps = useCallback(async () => {
    if (!currentProfile?.rally) return;

    setRunning(true);

    const mix = {
      ...(currentProfile.rally.troopMix?.player ?? { infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 }),
      totalTroops: capacityTotal
    };

    // Only run the selected slot unless "All slots" is chosen.
    const slotsToRun: SwapSlot[] = selectedSlot === 'all' ? SLOTS : [selectedSlot];

    const slotCandidatePairs: { slot: SwapSlot; candidate: string }[] = [];
    for (const slot of slotsToRun) {
      const candidates = getCandidatesForSlot(slot).slice(0, MAX_CANDIDATES_PER_SLOT);
      for (const candidate of candidates) {
        slotCandidatePairs.push({ slot, candidate });
      }
    }

    const totalSwaps = slotCandidatePairs.length;

    // ——— Phase 1: Fast screening ———
    setProgress({ completed: 0, total: totalSwaps + 1, phase: 'screening' });

    const baselineInput: ScenarioRunInput = {
      profile: currentProfile,
      playerBaseStats,
      opponentBaseStats,
      playerCapacityReport,
      opponentCapacityReport,
      playerMixOverride: {
        ...(currentProfile.rally?.troopMix?.player ?? { infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 }),
        totalTroops: capacityTotal
      }
    };

    const baselinePhase1 = runSingleScenario(baselineInput);
    setBaselineResult(baselinePhase1);
    const baselineWinRatePhase1 = toWinRate(baselinePhase1);

    const results: SwapRow[] = [];

    for (let i = 0; i < slotCandidatePairs.length; i++) {
      const { slot, candidate } = slotCandidatePairs[i];

      const modifiedProfile = profileWithSlotOverride(currentProfile, slot, candidate);

      const input: ScenarioRunInput = {
        profile: modifiedProfile,
        playerBaseStats,
        opponentBaseStats,
        playerCapacityReport,
        opponentCapacityReport,
        playerMixOverride: mix
      };

      const result = runSingleScenario(input);
      const swapWinRatePhase1 = toWinRate(result);

      results.push({
        slot,
        candidate,
        deltaWinRate: (swapWinRatePhase1 - baselineWinRatePhase1) * 100,
        baselineWinRate: baselineWinRatePhase1,
        swapWinRate: swapWinRatePhase1,
        baselineWinner: baselinePhase1.summary.winner,
        swapWinner: result.summary.winner
      });

      // Don't spam React state; update UI every few iterations.
      if ((i + 1) % 4 === 0 || i === slotCandidatePairs.length - 1) {
        setProgress({ completed: i + 1, total: totalSwaps + 1, phase: 'screening' });
        setRows([...results]);
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    results.sort((a, b) => b.deltaWinRate - a.deltaWinRate);
    setRows(results);
    await new Promise((r) => setTimeout(r, 0));

    // ——— Phase 2: Monte Carlo refinement for top N only ———
    const toRefine = results.slice(0, TOP_N_TO_REFINE);
    setProgress({ completed: 0, total: toRefine.length + 1, phase: 'refining' });

    const baselineRefined = await runSingleScenarioWithTrials(baselineInput, TRIALS_REFINE);
    setBaselineResult(baselineRefined);
    const baselineWinRate = toWinRate(baselineRefined);

    for (let i = 0; i < toRefine.length; i++) {
      const row = toRefine[i];

      const modifiedProfile = profileWithSlotOverride(currentProfile, row.slot, row.candidate);

      const input: ScenarioRunInput = {
        profile: modifiedProfile,
        playerBaseStats,
        opponentBaseStats,
        playerCapacityReport,
        opponentCapacityReport,
        playerMixOverride: mix
      };

      const result = await runSingleScenarioWithTrials(input, TRIALS_REFINE);
      const swapWinRate = toWinRate(result);

      const idx = results.findIndex((r) => r.slot === row.slot && r.candidate === row.candidate);
      if (idx !== -1) {
        results[idx] = {
          ...results[idx],
          refinedWinRate: swapWinRate,
          refinedDelta: (swapWinRate - baselineWinRate) * 100,
          swapWinner: result.summary.winner
        };
      }

      setProgress({ completed: i + 1, total: toRefine.length + 1, phase: 'refining' });
      setRows([...results].sort((a, b) => (b.refinedDelta ?? b.deltaWinRate) - (a.refinedDelta ?? a.deltaWinRate)));
      await new Promise((r) => setTimeout(r, 0));
    }

    setRows([...results].sort((a, b) => (b.refinedDelta ?? b.deltaWinRate) - (a.refinedDelta ?? a.deltaWinRate)));
    setRunning(false);
  }, [currentProfile, playerBaseStats, opponentBaseStats, playerCapacityReport, opponentCapacityReport, capacityTotal, selectedSlot]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card info-card">
        <h4 className="mb-2">Lineup Swap Lab</h4>
        <p className="text-sm text-slate-400 mb-3">
          Phase 1: screen swaps with one battle each. Phase 2: run {TRIALS_REFINE} Monte Carlo trials for the top {TOP_N_TO_REFINE} only.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">Slot:</span>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value as SlotSelection)}
            disabled={running}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm"
            aria-label="Choose slot to test"
          >
            <option value="all">All slots</option>
            {SLOTS.map((s) => (
              <option key={s} value={s}>{getSlotLabel(s)}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={runSwaps}
            disabled={running || !currentProfile?.rally}
            className="btn primary"
          >
            {running
              ? progress.phase === 'screening'
                ? `Screening ${progress.completed}/${progress.total}…`
                : `Refining top ${TOP_N_TO_REFINE}… ${progress.completed}/${progress.total}`
              : 'Auto rank best swaps'}
          </button>
        </div>

        {baselineResult && (
          <p className="text-sm text-slate-300 mt-2">
            Baseline: <strong>{baselineResult.summary.winner}</strong>
            {baselineResult.summary.playerWinRate != null && (
              <span className="ml-2">({(baselineResult.summary.playerWinRate * 100).toFixed(0)}% win over {TRIALS_REFINE} trials)</span>
            )}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <h4 className="p-3 border-b border-slate-700">Swap results (ranked by Δ win rate; skills included)</h4>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="p-2">Slot</th>
                  <th className="p-2">Candidate</th>
                  <th className="p-2">Δ Win%</th>
                  <th className="p-2">Win%</th>
                  <th className="p-2">Majority</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const delta = r.refinedDelta ?? r.deltaWinRate;
                  const winPct = r.refinedWinRate != null ? (r.refinedWinRate * 100).toFixed(0) + '%' : '—';
                  return (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="p-2">{getSlotLabel(r.slot)}</td>
                      <td className="p-2 font-mono">{r.candidate}</td>
                      <td className={`p-2 font-medium ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                      </td>
                      <td className="p-2 text-slate-300">{winPct}</td>
                      <td className="p-2">{r.swapWinner}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
