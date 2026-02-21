'use client';

import type { BattleConfig, BattleReport } from '@/domain/battle/engine/types';
import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import type { TroopMixConfig, UserProfile } from '@/shared/types';
import { useCallback, useMemo, useState } from 'react';
import {
  runSingleScenario,
  SCENARIO_MIX_PRESETS,
  type ScenarioRunInput,
  type ScenarioRunResult
} from '../scenario-runner/scenarioRunnerUtils';

const CHUNK_SIZE = 15;

interface HeatmapTabProps {
  currentProfile: UserProfile;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
  playerCapacityReport: CapacityReport | null;
  opponentCapacityReport: CapacityReport | null;
  simulationMode: BattleConfig['randomMode'];
  simulationCount: number;
}

interface CellData {
  inf: number;
  lanc: number;
  mark: number;
  winRate: number; // 100 = player win, 0 = opponent win, 50 = draw
  result?: ScenarioRunResult;
}

function buildGridCells(step: number, lockMarksmanZero: boolean): { inf: number; lanc: number; mark: number }[] {
  const cells: { inf: number; lanc: number; mark: number }[] = [];
  if (lockMarksmanZero) {
    for (let inf = 0; inf <= 100; inf += step) {
      const lanc = 100 - inf;
      cells.push({ inf, lanc, mark: 0 });
    }
  } else {
    for (let inf = 0; inf <= 100; inf += step) {
      for (let lanc = 0; lanc <= 100 - inf; lanc += step) {
        const mark = 100 - inf - lanc;
        cells.push({ inf, lanc, mark });
      }
    }
  }
  return cells;
}

export default function HeatmapTab({
  currentProfile,
  playerBaseStats,
  opponentBaseStats,
  playerCapacityReport,
  opponentCapacityReport,
  simulationMode,
  simulationCount
}: HeatmapTabProps) {
  const [step, setStep] = useState(10);
  const [lockMarksmanZero, setLockMarksmanZero] = useState(false);
  const [presetIndex, setPresetIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [cells, setCells] = useState<CellData[]>([]);
  const [detailReport, setDetailReport] = useState<BattleReport | null>(null);
  const [detailMix, setDetailMix] = useState<TroopMixConfig | null>(null);

  const capacityTotal = playerCapacityReport?.rally?.total ?? 0;

  const runSweep = useCallback(async () => {
    if (!currentProfile?.rally) return;
    const cellSpecs: { inf: number; lanc: number; mark: number }[] =
      presetIndex != null
        ? (() => {
          const p = SCENARIO_MIX_PRESETS[presetIndex]!;
          return [{ inf: p.infantryRatio, lanc: p.lancerRatio, mark: p.marksmanRatio }];
        })()
        : buildGridCells(step, lockMarksmanZero);
    setRunning(true);
    setProgress({ completed: 0, total: cellSpecs.length });
    setCells([]);

    const results: CellData[] = [];
    for (let i = 0; i < cellSpecs.length; i += CHUNK_SIZE) {
      const chunk = cellSpecs.slice(i, i + CHUNK_SIZE);
      for (const { inf, lanc, mark } of chunk) {
        const mix: TroopMixConfig = {
          totalTroops: capacityTotal,
          infantryRatio: inf,
          lancerRatio: lanc,
          marksmanRatio: mark
        };
        const input: ScenarioRunInput = {
          profile: currentProfile,
          playerBaseStats,
          opponentBaseStats,
          playerCapacityReport,
          opponentCapacityReport,
          playerMixOverride: mix,
          battleConfig: {
            maxTurns: 1000,
            randomMode: 'expectedValue',
            rngSeed: 1
          }
        };
        const result = runSingleScenario(input);
        const winRate =
          result.summary.winner === 'Player' ? 100 : result.summary.winner === 'Draw' ? 50 : 0;
        results.push({ inf, lanc, mark, winRate, result });
      }
      setProgress({ completed: results.length, total: cellSpecs.length });
      setCells([...results]);
      if (i + CHUNK_SIZE < cellSpecs.length) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    setRunning(false);
  }, [
    currentProfile,
    playerBaseStats,
    opponentBaseStats,
    playerCapacityReport,
    opponentCapacityReport,
    step,
    lockMarksmanZero,
    presetIndex,
    capacityTotal
  ]);

  const gridSize = useMemo(() => {
    if (lockMarksmanZero) return { rows: 1, cols: Math.ceil(100 / step) + 1 };
    const cols = Math.ceil(100 / step) + 1;
    const rows = cols;
    return { rows, cols };
  }, [step, lockMarksmanZero]);

  const cellKey = (c: CellData) => `${c.inf}-${c.lanc}-${c.mark}`;
  const cellMap = useMemo(() => {
    const m = new Map<string, CellData>();
    cells.forEach((c) => m.set(cellKey(c), c));
    return m;
  }, [cells]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card info-card">
        <h4 className="mb-2">2D Troop Mix Sweep</h4>
        <p className="text-sm text-slate-400 mb-3">
          Sweep Infantry % vs Lancer % (Marksman = remainder). Cells colored by player win rate (green = win, red = loss). Click a cell for full results.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Step %</label>
            <input
              type="number"
              title="Select a step size"
              min={5}
              max={50}
              step={5}
              value={step}
              onChange={(e) => setStep(Math.max(5, Math.min(50, Number(e.target.value) || 10)))}
              disabled={running}
              className="w-16 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm"
            />
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lockMarksmanZero}
              onChange={(e) => setLockMarksmanZero(e.target.checked)}
              disabled={running}
              className="rounded border-slate-600"
            />
            <span className="text-sm">Lock Marksman 0</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Preset (optional):</span>
            <select
              title="Select a preset"
              value={presetIndex ?? ''}
              onChange={(e) => setPresetIndex(e.target.value === '' ? null : Number(e.target.value))}
              disabled={running}
              className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm"
            >
              <option value="">Full grid</option>
              {SCENARIO_MIX_PRESETS.map((m, i) => (
                <option key={i} value={i}>
                  {m.infantryRatio}:{m.lancerRatio}:{m.marksmanRatio}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={runSweep}
            disabled={running || !currentProfile?.rally}
            className="btn primary"
          >
            {running ? `Running ${progress.completed}/${progress.total}…` : 'Run sweep'}
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

      {cells.length > 0 && (
        <div className="card overflow-hidden">
          {lockMarksmanZero && (
            <style
              dangerouslySetInnerHTML={{
                __html: `.heatmap-grid-2d { grid-template-columns: repeat(${gridSize.cols}, minmax(28px, 1fr)); }`
              }}
            />
          )}
          <h4 className="p-3 border-b border-slate-700">Heatmap (Inf % → rows, Lanc % → cols when 2D)</h4>
          <div
            className={`p-4 gap-1 justify-start items-start ${lockMarksmanZero ? 'grid heatmap-grid-2d' : 'flex flex-wrap'}`}
          >
            {lockMarksmanZero
              ? Array.from({ length: gridSize.cols }, (_, i) => {
                const inf = i * step;
                const lanc = 100 - inf;
                const mark = 0;
                const c = cellMap.get(`${inf}-${lanc}-${mark}`);
                const winRate = c?.winRate ?? -1;
                return (
                  <button
                    key={`${inf}-${lanc}`}
                    type="button"
                    className={`min-w-[24px] min-h-[24px] rounded text-[10px] font-mono border border-slate-600 hover:ring-2 ring-rose-400 transition-all ${winRate < 0
                        ? 'bg-slate-800'
                        : winRate >= 100
                          ? 'bg-emerald-500'
                          : winRate >= 50
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                      }`}
                    onClick={() => {
                      if (c?.result?.report) {
                        setDetailReport(c.result.report);
                        setDetailMix({ totalTroops: capacityTotal, infantryRatio: inf, lancerRatio: lanc, marksmanRatio: mark });
                      }
                    }}
                    title={`${inf}:${lanc}:${mark} ${winRate >= 0 ? winRate + '%' : ''}`}
                  >
                    {winRate >= 0 ? (winRate === 100 ? 'W' : winRate === 0 ? 'L' : 'D') : ''}
                  </button>
                );
              })
              : cells.map((c) => {
                const key = cellKey(c);
                const winRate = c.winRate;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`min-w-[22px] min-h-[22px] rounded-sm text-[9px] border border-slate-600 hover:ring-2 ring-rose-400 transition-all ${winRate >= 100 ? 'bg-emerald-500' : winRate >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                    onClick={() => {
                      if (c.result?.report) {
                        setDetailReport(c.result.report);
                        setDetailMix({
                          totalTroops: capacityTotal,
                          infantryRatio: c.inf,
                          lancerRatio: c.lanc,
                          marksmanRatio: c.mark
                        });
                      }
                    }}
                    title={`${c.inf}:${c.lanc}:${c.mark} ${winRate}%`}
                  >
                    {winRate === 100 ? 'W' : winRate === 0 ? 'L' : 'D'}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {detailReport && detailMix && (
        <HeatmapDetailModal
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

function HeatmapDetailModal({
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
