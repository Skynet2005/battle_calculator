/**
 * Casualty Chart Component
 *
 * Interactive line chart visualizing casualties per turn by troop type.
 * Supports losses/kills view, percent/absolute scaling, and cumulative mode.
 * Engine explanation: Processes turn logs to extract per-turn casualty data,
 * normalizes for display, and renders SVG line charts with hover tooltips.
 */

import type { TroopCounts as CombatTroopCounts, TurnLog } from '@/domain/battle/engine/types';
import { buildCasualtySeries, totalCounts, type CasualtySeriesEntry } from '@/features/battle-calculator/utils/turn-analytics';
import { useCallback, useMemo, useState } from 'react';
import { formatBigNumber, formatTroopCounts } from '../utils/format';
import type { KeyMoment } from '../utils/keyMoments';
import { renderByType, renderTypeLines } from './CasualtyChartHelpers';

interface CasualtyChartProps {
  turns: TurnLog[];
  keyMoments?: KeyMoment[];
  playerIsAttacker?: boolean;
}

export function CasualtyChart({ turns, keyMoments = [], playerIsAttacker = true }: CasualtyChartProps) {
  const [hover, setHover] = useState<{
    side: "attacker" | "defender";
    turn: number;
    losses: number;
    byType: Partial<CombatTroopCounts>;
    topSkill?: string;
    pairedLosses?: number;
    pairedByType?: Partial<CombatTroopCounts>;
    pairedSkill?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"losses" | "kills">("losses");
  const [usePercentScale, setUsePercentScale] = useState<boolean>(false);
  const [cumulative, setCumulative] = useState<boolean>(false);

  const hasTurns = turns.length > 0;

  const baseSeries = useMemo(() => {
    return hasTurns ? buildCasualtySeries(turns) : [];
  }, [hasTurns, turns]);

  const makeCumulative = useCallback((series: CasualtySeriesEntry[]) => {
    return series.reduce<CasualtySeriesEntry[]>((acc, curr, idx) => {
      const prev = acc[idx - 1];
      acc.push({
        ...curr,
        attackerLosses: (prev?.attackerLosses ?? 0) + curr.attackerLosses,
        defenderLosses: (prev?.defenderLosses ?? 0) + curr.defenderLosses,
        attackerLossesByType: {
          Infantry: (prev?.attackerLossesByType.Infantry ?? 0) + (curr.attackerLossesByType.Infantry ?? 0),
          Lancer: (prev?.attackerLossesByType.Lancer ?? 0) + (curr.attackerLossesByType.Lancer ?? 0),
          Marksman: (prev?.attackerLossesByType.Marksman ?? 0) + (curr.attackerLossesByType.Marksman ?? 0),
        },
        defenderLossesByType: {
          Infantry: (prev?.defenderLossesByType.Infantry ?? 0) + (curr.defenderLossesByType.Infantry ?? 0),
          Lancer: (prev?.defenderLossesByType.Lancer ?? 0) + (curr.defenderLossesByType.Lancer ?? 0),
          Marksman: (prev?.defenderLossesByType.Marksman ?? 0) + (curr.defenderLossesByType.Marksman ?? 0),
        },
      });
      return acc;
    }, []);
  }, []);

  const chartSeries = useMemo(() => {
    return cumulative ? makeCumulative(baseSeries) : baseSeries;
  }, [cumulative, baseSeries, makeCumulative]);

  const initialAtt = hasTurns ? (turns[0]?.startAttackerTroops ?? turns[0]?.attackerTroops) : undefined;
  const initialDef = hasTurns ? (turns[0]?.startDefenderTroops ?? turns[0]?.defenderTroops) : undefined;

  const initialTotals = useMemo(() => {
    if (!hasTurns) {
      return { attacker: 1, defender: 1 };
    }
    return {
      attacker: Math.max(1, totalCounts(initialAtt)),
      defender: Math.max(1, totalCounts(initialDef)),
    };
  }, [hasTurns, initialAtt, initialDef]);

  const initialByType = useMemo(() => {
    if (!hasTurns) {
      return {
        attacker: { Infantry: 0, Lancer: 0, Marksman: 0 },
        defender: { Infantry: 0, Lancer: 0, Marksman: 0 },
      };
    }
    return {
      attacker: initialAtt ?? { Infantry: 0, Lancer: 0, Marksman: 0 },
      defender: initialDef ?? { Infantry: 0, Lancer: 0, Marksman: 0 },
    };
  }, [hasTurns, initialAtt, initialDef]);

  if (!hasTurns) return null;

  const mapLoss = (p: CasualtySeriesEntry, side: "attacker" | "defender") => {
    if (viewMode === "losses") {
      return side === "attacker" ? p.attackerLosses : p.defenderLosses;
    }
    // kills: flip perspective
    return side === "attacker" ? p.defenderLosses : p.attackerLosses;
  };
  const mapLossByType = (p: CasualtySeriesEntry, side: "attacker" | "defender") => {
    if (viewMode === "losses") {
      return side === "attacker" ? p.attackerLossesByType : p.defenderLossesByType;
    }
    return side === "attacker" ? p.defenderLossesByType : p.attackerLossesByType;
  };
  const normalizeValue = (value: number, side: "attacker" | "defender") =>
    usePercentScale ? (value / initialTotals[side]) * 100 : value;
  const normalizeByType = (value: number | undefined, side: "attacker" | "defender", type: keyof CombatTroopCounts) => {
    const denom = usePercentScale ? (initialByType[side]?.[type] || initialTotals[side]) : 1;
    if (!denom) return 0;
    return usePercentScale ? (value ?? 0) / denom * 100 : value ?? 0;
  };

  const normalizeTypeLoss = (raw: number, side: "attacker" | "defender", type: keyof CombatTroopCounts) => {
    if (!usePercentScale) return raw;
    const denom = initialByType[side]?.[type] || initialTotals[side] || 1;
    return (raw / denom) * 100;
  };

  const maxDef = Math.max(...chartSeries.map((p) => normalizeValue(mapLoss(p, "defender"), "defender")), 1);
  const maxAtt = Math.max(...chartSeries.map((p) => normalizeValue(mapLoss(p, "attacker"), "attacker")), 1);
  const maxLoss = Math.max(maxDef, maxAtt);
  // Fit chart width to number of turns so points are spaced and readable on small screens.
  // Use a minimum step per turn and allow horizontal scrolling when many turns exist.
  const padX = 14;
  const padY = 14;
  const minStep = 28; // spacing per turn to keep labels readable on mobile
  const turnsCount = Math.max(chartSeries.length, 1);
  const width = Math.max(360, padX * 2 + (turnsCount - 1) * minStep);
  const height = 180;
  const step = turnsCount > 1 ? (width - padX * 2) / (turnsCount - 1) : 0;

  // Avoid flat lines when values are tiny; enforce a minimal vertical range in percent mode.
  const scaleMax =
    usePercentScale && maxLoss > 0
      ? Math.max(maxLoss, 5) // at least 5% range so small losses are visible
      : Math.max(maxLoss, 1);

  const toPoint = (value: number, idx: number) => {
    const x = padX + idx * step;
    const y = padY + (height - padY * 2) * (1 - value / scaleMax);
    return { x, y };
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs uppercase tracking-wide text-gray-400">
        <div className="flex items-center gap-2">
          <span>Casualties per turn</span>
          <span className="text-[11px] text-slate-500">Attacker vs Defender {viewMode === "losses" ? "losses" : "kills"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 normal-case">
          <div className="text-[11px] text-gray-400 mr-2">Scale: {usePercentScale ? "% of starting troops" : "absolute count"}</div>
          <div className="flex rounded-full border border-white/10 bg-slate-900/40 overflow-hidden">
            {(["losses", "kills"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 text-[11px] ${viewMode === mode ? "bg-rose-500/40 text-white" : "text-gray-300"}`}
              >
                {mode === "losses" ? "Casualties" : "Kills"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[11px] text-gray-300">
            <input
              type="checkbox"
              checked={usePercentScale}
              onChange={(e) => setUsePercentScale(e.target.checked)}
              className="h-3 w-3 accent-rose-400"
            />
            % scale
          </label>
          <label className="flex items-center gap-1 text-[11px] text-gray-300">
            <input
              type="checkbox"
              checked={cumulative}
              onChange={(e) => setCumulative(e.target.checked)}
              className="h-3 w-3 accent-rose-400"
            />
            Cumulative
          </label>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-white/5 bg-slate-900/40 p-3 relative overflow-x-auto casualty-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label="Casualties line chart"
          className="h-48 min-w-full"
        >
          {renderTypeLines(chartSeries, toPoint, "defender", normalizeTypeLoss, setHover, playerIsAttacker)}
          {renderTypeLines(chartSeries, toPoint, "attacker", normalizeTypeLoss, setHover, playerIsAttacker)}
          {/* Key moment annotations */}
          {keyMoments.map((moment, idx) => {
            const turnIdx = chartSeries.findIndex((s) => s.turn === moment.turn);
            if (turnIdx === -1) return null;
            const x = padX + turnIdx * step;
            const y = padY + (height - padY * 2) * 0.5; // Middle of chart
            const color =
              moment.type === 'bigSkill'
                ? 'rgba(250, 204, 21, 0.8)'
                : moment.type === 'damageReduction'
                  ? 'rgba(59, 130, 246, 0.8)'
                  : 'rgba(249, 115, 22, 0.8)';
            return (
              <g key={`moment-${idx}`}>
                <line
                  x1={x}
                  y1={padY}
                  x2={x}
                  y2={height - padY}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <circle cx={x} cy={y} r={4} fill={color} />
                <text
                  x={x}
                  y={y - 8}
                  fontSize="10"
                  fill={color}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {moment.turn}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
          <span className="text-rose-300">
            Defender max: {usePercentScale ? `${maxLoss.toFixed(1)}%` : formatBigNumber(maxLoss)}
          </span>
          <span className="text-sky-300">
            Attacker max: {usePercentScale
              ? `${maxAtt.toFixed(1)}%`
              : formatBigNumber(Math.max(...chartSeries.map((p) => mapLoss(p, "attacker")), 1))}
          </span>
          <span className="text-slate-300">Turns: {chartSeries.length}</span>
        </div>
        {hover && (
          <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                Turn {hover.turn} · {hover.side === "defender" ? "Defender" : "Attacker"} {viewMode === "losses" ? "losses" : "kills"}:{" "}
                {usePercentScale
                  ? `${normalizeValue(hover.losses, hover.side).toFixed(2)}%`
                  : formatBigNumber(hover.losses)}
              </span>
              {hover.topSkill && <span className="text-[11px] text-emerald-300">Skill vs {hover.side === "defender" ? "Def" : "Att"}: {hover.topSkill}</span>}
            </div>
            <div className="mt-1 text-[11px] text-slate-300">
              {renderByType("Infantry", hover.byType.Infantry, hover.side, usePercentScale, normalizeByType)}
              {renderByType("Lancer", hover.byType.Lancer, hover.side, usePercentScale, normalizeByType)}
              {renderByType("Marksman", hover.byType.Marksman, hover.side, usePercentScale, normalizeByType)}
            </div>
            {hover.pairedLosses !== undefined && (
              <div className="mt-3 border-t border-white/10 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Opposite side {viewMode === "losses" ? "losses" : "kills"}:{" "}
                    {usePercentScale
                      ? `${normalizeValue(hover.pairedLosses, hover.side === "defender" ? "attacker" : "defender").toFixed(2)}%`
                      : formatBigNumber(hover.pairedLosses)}
                  </span>
                  {hover.pairedSkill && <span className="text-[11px] text-sky-300">Skill vs {hover.side === "defender" ? "Att" : "Def"}: {hover.pairedSkill}</span>}
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  {renderByType("Infantry", hover.pairedByType?.Infantry, hover.side === "defender" ? "attacker" : "defender", usePercentScale, normalizeByType)}
                  {renderByType("Lancer", hover.pairedByType?.Lancer, hover.side === "defender" ? "attacker" : "defender", usePercentScale, normalizeByType)}
                  {renderByType("Marksman", hover.pairedByType?.Marksman, hover.side === "defender" ? "attacker" : "defender", usePercentScale, normalizeByType)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[11px] text-slate-300">
        <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
          <div className="uppercase tracking-wide text-gray-500">Defender remaining (end)</div>
          <div className="font-semibold text-white mt-1">{formatTroopCounts(chartSeries[chartSeries.length - 1].defenderRemaining)}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-900/30 p-2">
          <div className="uppercase tracking-wide text-gray-500">Attacker remaining (end)</div>
          <div className="font-semibold text-white mt-1">{formatTroopCounts(chartSeries[chartSeries.length - 1].attackerRemaining)}</div>
        </div>
      </div>
      {/* Scrollbar theme (light/dark aware) scoped to casualty chart container */}
      <style jsx global>{`
        .casualty-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.5) rgba(15, 23, 42, 0.6);
        }
        .casualty-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .casualty-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 9999px;
        }
        .casualty-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.65), rgba(99, 102, 241, 0.75));
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .casualty-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, rgba(226, 232, 240, 0.8), rgba(94, 234, 212, 0.85));
        }
        @media (prefers-color-scheme: light) {
          .casualty-scroll {
            scrollbar-color: rgba(100, 116, 139, 0.55) rgba(226, 232, 240, 0.8);
          }
          .casualty-scroll::-webkit-scrollbar-track {
            background: rgba(226, 232, 240, 0.8);
          }
          .casualty-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg, rgba(100, 116, 139, 0.7), rgba(59, 130, 246, 0.75));
            border: 1px solid rgba(148, 163, 184, 0.35);
          }
          .casualty-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(90deg, rgba(79, 70, 229, 0.85), rgba(16, 185, 129, 0.85));
          }
        }
      `}</style>
    </div>
  );
}
