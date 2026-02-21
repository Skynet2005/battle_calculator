'use client';

import type { BattleConfig, BattleReport } from '@/domain/battle/engine/types';
import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig, UserProfile } from '@/shared/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  runScenarioBatch,
  SCENARIO_MIX_PRESETS,
  type ScenarioRunResult
} from './scenarioRunnerUtils';

const ROW_HEIGHT = 44;

interface ScenarioRunnerTabProps {
  currentProfile: UserProfile;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
  playerCapacityReport: CapacityReport | null;
  opponentCapacityReport: CapacityReport | null;
  simulationMode: BattleConfig['randomMode'];
  simulationCount: number;
}

export default function ScenarioRunnerTab({
  currentProfile,
  playerBaseStats,
  opponentBaseStats,
  playerCapacityReport,
  opponentCapacityReport,
  simulationMode,
  simulationCount
}: ScenarioRunnerTabProps) {
  const [selectedPresets, setSelectedPresets] = useState<number[]>(() => [0, 1, 2]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [results, setResults] = useState<ScenarioRunResult[]>([]);
  const [detailReport, setDetailReport] = useState<BattleReport | null>(null);
  const [detailMix, setDetailMix] = useState<TroopMixConfig | null>(null);
  const tableParentRef = useRef<HTMLDivElement>(null);

  const presetsToRun = useMemo(
    () => selectedPresets.map((i) => SCENARIO_MIX_PRESETS[i] ?? SCENARIO_MIX_PRESETS[0]),
    [selectedPresets]
  );

  const runScenarios = useCallback(async () => {
    if (!currentProfile?.rally) return;
    setRunning(true);
    setProgress({ completed: 0, total: presetsToRun.length });
    setResults([]);

    const capacityTotal = playerCapacityReport?.rally?.total ?? 0;
    const inputs = presetsToRun.map((mix) => ({
      profile: currentProfile,
      playerBaseStats,
      opponentBaseStats,
      playerCapacityReport,
      opponentCapacityReport,
      playerMixOverride: { ...mix, totalTroops: mix.totalTroops || capacityTotal },
      battleConfig: {
        maxTurns: 1000,
        randomMode: simulationMode,
        simulations: simulationMode === 'monteCarlo' ? simulationCount : undefined
      }
    }));

    const batchResults = await runScenarioBatch(inputs, (completed, total) => {
      setProgress({ completed, total });
    });

    const ranked = [...batchResults].sort((a, b) => {
      const scoreA = a.summary.winner === 'Player' ? 2 : a.summary.winner === 'Draw' ? 1 : 0;
      const scoreB = b.summary.winner === 'Player' ? 2 : b.summary.winner === 'Draw' ? 1 : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const remA = Object.values(a.summary.attackerRemaining).reduce((s, n) => s + n, 0);
      const remB = Object.values(b.summary.attackerRemaining).reduce((s, n) => s + n, 0);
      return remB - remA;
    });

    setResults(ranked);
    setProgress({ completed: ranked.length, total: ranked.length });
    setRunning(false);
  }, [
    currentProfile,
    playerBaseStats,
    opponentBaseStats,
    playerCapacityReport,
    opponentCapacityReport,
    presetsToRun,
    simulationMode,
    simulationCount
  ]);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => tableParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5
  });

  const togglePreset = (index: number) => {
    setSelectedPresets((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card info-card">
        <h4 className="mb-2">Troop mix presets</h4>
        <p className="text-sm text-slate-400 mb-3">
          Select presets to compare. Run runs each scenario (deterministic) and ranks by outcome.
        </p>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_MIX_PRESETS.map((mix, i) => (
            <label key={i} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPresets.includes(i)}
                onChange={() => togglePreset(i)}
                disabled={running}
                className="rounded border-slate-600"
              />
              <span className="text-sm">
                {mix.infantryRatio}:{mix.lancerRatio}:{mix.marksmanRatio}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={runScenarios}
            disabled={running || !currentProfile?.rally || presetsToRun.length === 0}
            className="btn primary"
          >
            {running ? `Running ${progress.completed}/${progress.total}…` : 'Run scenarios'}
          </button>
        </div>
        {running && (
          <div className="mt-2 h-2 w-full max-w-md bg-slate-700 rounded overflow-hidden flex">
            {Array.from({ length: 100 }, (_, i) => {
              const pct = progress.total ? (100 * progress.completed) / progress.total : 0;
              const filled = i < pct;
              return (
                <div
                  key={i}
                  className={`h-full flex-1 transition-colors duration-200 ${filled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="card overflow-hidden flex flex-col">
          <h4 className="p-3 border-b border-slate-700">Ranked results (click row for detail)</h4>
          <div ref={tableParentRef} className="overflow-auto flex-1 min-h-[320px] max-h-[480px]">
            <style
              dangerouslySetInnerHTML={{
                __html: [
                  `.scenario-runner-virtual-total { height: ${virtualizer.getTotalSize()}px; width: 100%; position: relative; }`,
                  ...virtualizer.getVirtualItems().map(
                    (vr) => `.scenario-runner-row-${vr.key} { transform: translateY(${vr.start}px); }`
                  )
                ].join('\n')
              }}
            />
            <div className="scenario-runner-virtual-total w-full relative">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const r = results[virtualRow.index];
                const hasReport = r.report != null;
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={`absolute left-0 top-0 w-full border-b border-slate-700/50 flex items-center gap-4 px-3 py-2 hover:bg-slate-700/30 cursor-pointer scenario-runner-row-${virtualRow.key}`}
                    onClick={() => {
                      if (r.report) {
                        setDetailReport(r.report);
                        setDetailMix(r.playerMix);
                      }
                    }}
                  >
                    <span className="w-28 font-mono text-sm">
                      {r.playerMix.infantryRatio}:{r.playerMix.lancerRatio}:{r.playerMix.marksmanRatio}
                    </span>
                    <span className={`w-20 font-medium ${r.summary.winner === 'Player' ? 'text-emerald-400' : r.summary.winner === 'Draw' ? 'text-amber-400' : 'text-rose-400'}`}>
                      {r.summary.winner}
                    </span>
                    <span className="text-slate-400 text-sm">
                      Att rem: {Object.values(r.summary.attackerRemaining).reduce((s, n) => s + n, 0)} | Def rem: {Object.values(r.summary.defenderRemaining).reduce((s, n) => s + n, 0)}
                    </span>
                    <span className="text-slate-500 text-sm">{r.summary.turns} turns</span>
                    {r.error && <span className="text-rose-400 text-sm">{r.error}</span>}
                    {!hasReport && !r.error && <span className="text-slate-500 text-sm">—</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {detailReport && detailMix && (
        <ScenarioDetailModal
          report={detailReport}
          mix={detailMix}
          onClose={() => {
            setDetailReport(null);
            setDetailMix(null);
          }}
        />
      )}
    </div>
  );
}

function ScenarioDetailModal({
  report,
  mix,
  onClose
}: {
  report: BattleReport;
  mix: TroopMixConfig;
  onClose: () => void;
}) {
  const turns = report.turns ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Detail — Mix {mix.infantryRatio}:{mix.lancerRatio}:{mix.marksmanRatio}
          </h3>
          <button type="button" onClick={onClose} className="btn ghost text-slate-300 hover:text-white">
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto space-y-3 text-sm">
          <p>
            <strong>Winner:</strong> {report.winner} | <strong>Turns:</strong> {turns.length}
          </p>
          <p>
            <strong>Attacker remaining:</strong> Inf {report.attackerRemaining?.Infantry ?? 0}, Lanc {report.attackerRemaining?.Lancer ?? 0}, Mark {report.attackerRemaining?.Marksman ?? 0}
          </p>
          <p>
            <strong>Defender remaining:</strong> Inf {report.defenderRemaining?.Infantry ?? 0}, Lanc {report.defenderRemaining?.Lancer ?? 0}, Mark {report.defenderRemaining?.Marksman ?? 0}
          </p>
          {report.casualties && (
            <p>
              <strong>Casualties:</strong> Attacker — Inf {report.casualties.attacker?.Infantry ?? 0}, Lanc {report.casualties.attacker?.Lancer ?? 0}, Mark {report.casualties.attacker?.Marksman ?? 0}; Defender — Inf {report.casualties.defender?.Infantry ?? 0}, Lanc {report.casualties.defender?.Lancer ?? 0}, Mark {report.casualties.defender?.Marksman ?? 0}
            </p>
          )}
          {turns.length > 0 && (
            <div>
              <strong>Turn log (first 5):</strong>
              <ul className="list-disc list-inside mt-1 text-slate-400">
                {turns.slice(0, 5).map((t, i) => (
                  <li key={i}>Turn {t.turn}</li>
                ))}
                {turns.length > 5 && <li className="text-slate-500">… and {turns.length - 5} more</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
