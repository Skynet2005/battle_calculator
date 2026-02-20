'use client';

/**
 * Stats Evolution Panel
 *
 * Visualizes how effective stats change turn-by-turn as buffs activate/expire.
 * Uses startEffectiveStats from TurnLog to build a per-turn stat timeline
 * with annotations for buff applications and expirations.
 *
 * Buff categorization:
 * - Turn 1 receives ALL initial buffs: PassivePermanent skills (infinite duration)
 *   AND first-fire OnTurnStart skills (time-limited). Both are part of battle
 *   initialization. The large turn-1 count is expected behavior.
 * - Turns 2+ only show new buffs from periodic skills or chance-based procs.
 *   In Monte Carlo mode, chance skills may miss, producing 0-1 new buffs per turn.
 */

import { useMemo, useState } from 'react';
import { SectionCard } from '@/shared/ui';
import type { TurnLog, TroopType, StatKey } from '@/domain/battle/engine/types';
import { TROOP_TYPE_VALUES, STAT_KEYS } from '@/domain/battle/engine/types';

interface StatsEvolutionPanelProps {
  turns: TurnLog[];
  playerIsAttacker: boolean;
}

const STAT_COLORS: Record<StatKey, string> = {
  attack: '#f87171',
  defense: '#60a5fa',
  health: '#34d399',
  lethality: '#fbbf24',
};

const STAT_LABELS: Record<StatKey, string> = {
  attack: 'ATK',
  defense: 'DEF',
  health: 'HP',
  lethality: 'LETH',
};

interface BuffBreakdown {
  /** Permanent buffs (no expiration -- hero/troop passives with infinite duration) */
  permanent: number;
  /** Time-limited buffs (have an expiresOnTurn -- OnTurnStart procs, periodic skills) */
  timeLimited: number;
  /** Total buffs applied */
  total: number;
}

interface DataPoint {
  turn: number;
  attack: number;
  defense: number;
  health: number;
  lethality: number;
  buffs: BuffBreakdown;
  buffsExpired: number;
  /** Whether this turn had meaningful new buff activity beyond turn-1 initialization */
  hasNewActivity: boolean;
}

function buildTimeline(
  turns: TurnLog[],
  side: 'attacker' | 'defender',
  troopType: TroopType
): DataPoint[] {
  return turns.map((turn) => {
    const stats = turn.startEffectiveStats?.[side]?.[troopType];
    const allBuffs = turn.buffsApplied ?? [];
    const permanent = allBuffs.filter((b) => b.expiresOnTurn === undefined).length;
    const timeLimited = allBuffs.filter((b) => b.expiresOnTurn !== undefined).length;
    const total = allBuffs.length;
    const buffsExpired = turn.buffsExpired?.length ?? 0;

    // Turn 1 always has the initial burst. For turns 2+, any buff application
    // is meaningful new activity (periodic proc, chance skill hit, etc.)
    const hasNewActivity = turn.turn === 1
      ? false
      : total > 0 || buffsExpired > 0;

    return {
      turn: turn.turn,
      attack: stats?.attack?.effective ?? 0,
      defense: stats?.defense?.effective ?? 0,
      health: stats?.health?.effective ?? 0,
      lethality: stats?.lethality?.effective ?? 0,
      buffs: { permanent, timeLimited, total },
      buffsExpired,
      hasNewActivity,
    };
  });
}

function MiniLineChart({
  data,
  stat,
  color,
  maxVal,
}: {
  data: DataPoint[];
  stat: StatKey;
  color: string;
  maxVal: number;
}) {
  if (data.length < 2) return null;

  const width = 300;
  const height = 60;
  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;
  const yScale = maxVal > 0 ? chartH / maxVal : 0;

  const points = data.map((d, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH - (d[stat] * yScale);
    return `${x},${y}`;
  });

  // Only annotate turns with new activity after turn 1
  const buffAnnotations = data.filter((d) => d.hasNewActivity);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.join(' ')}
      />
      {buffAnnotations.map((d) => {
        const i = d.turn - 1;
        if (i < 0 || i >= data.length) return null;
        const x = padding.left + i * xStep;
        return (
          <circle
            key={d.turn}
            cx={x}
            cy={padding.top + chartH - (d[stat] * yScale)}
            r="3"
            fill={d.buffs.total > 0 ? '#34d399' : '#f87171'}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}

function TurnBuffSummary({ data }: { data: DataPoint }) {
  const isTurn1 = data.turn === 1;

  if (isTurn1 && data.buffs.total > 0) {
    return (
      <div className="mt-2 space-y-1">
        <div className="text-sky-400 font-medium">
          Battle initialization ({data.buffs.total} buffs)
        </div>
        <div className="text-slate-400 text-[10px] leading-relaxed">
          {data.buffs.permanent > 0 && (
            <span>{data.buffs.permanent} permanent (hero/troop passives)</span>
          )}
          {data.buffs.permanent > 0 && data.buffs.timeLimited > 0 && (
            <span> + </span>
          )}
          {data.buffs.timeLimited > 0 && (
            <span>{data.buffs.timeLimited} time-limited (first OnTurnStart procs)</span>
          )}
        </div>
        <div className="text-gray-600 text-[10px] italic">
          Normal: all hero skills and passives activate at battle start.
        </div>
      </div>
    );
  }

  const hasAny = data.buffs.total > 0 || data.buffsExpired > 0;

  if (!hasAny) {
    return (
      <div className="mt-2">
        <div className="text-gray-500">No buff changes this turn</div>
        <div className="text-gray-600 text-[10px] italic">
          Chance-based skills may not proc every turn in Monte Carlo mode.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-0.5">
      {data.buffs.total > 0 && (
        <div className="text-emerald-400">
          +{data.buffs.total} new buff{data.buffs.total !== 1 ? 's' : ''} (skill procs)
          {data.buffs.permanent > 0 && (
            <span className="text-slate-500 ml-1">
              ({data.buffs.permanent} permanent, {data.buffs.timeLimited} time-limited)
            </span>
          )}
        </div>
      )}
      {data.buffsExpired > 0 && (
        <div className="text-amber-400">
          {data.buffsExpired} buff{data.buffsExpired !== 1 ? 's' : ''} expired
        </div>
      )}
    </div>
  );
}

export function StatsEvolutionPanel({ turns, playerIsAttacker }: StatsEvolutionPanelProps) {
  const [selectedSide, setSelectedSide] = useState<'player' | 'opponent'>('player');
  const [selectedTroopType, setSelectedTroopType] = useState<TroopType>('Infantry');
  const [hoveredTurn, setHoveredTurn] = useState<number | null>(null);

  const side = selectedSide === 'player'
    ? (playerIsAttacker ? 'attacker' : 'defender')
    : (playerIsAttacker ? 'defender' : 'attacker');

  const timeline = useMemo(
    () => buildTimeline(turns, side as 'attacker' | 'defender', selectedTroopType),
    [turns, side, selectedTroopType]
  );

  const hasData = timeline.some((d) => d.attack > 0 || d.defense > 0 || d.health > 0 || d.lethality > 0);

  const maxValues = useMemo(() => {
    const max: Record<StatKey, number> = { attack: 0, defense: 0, health: 0, lethality: 0 };
    for (const d of timeline) {
      for (const stat of STAT_KEYS) {
        if (d[stat] > max[stat]) max[stat] = d[stat];
      }
    }
    return max;
  }, [timeline]);

  const hoveredData = hoveredTurn !== null ? timeline.find((d) => d.turn === hoveredTurn) : null;

  if (!hasData) return null;

  return (
    <SectionCard
      title="Stats Evolution"
      description="Track how effective stats change each turn as buffs activate and expire"
      collapsible
      defaultCollapsed={true}
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(['player', 'opponent'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSide(s)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  selectedSide === s
                    ? 'border-rose-400 bg-rose-500/30 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {s === 'player' ? 'Player' : 'Opponent'}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {TROOP_TYPE_VALUES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTroopType(t)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  selectedTroopType === t
                    ? 'border-sky-400 bg-sky-500/30 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Charts */}
        <div className="grid gap-3 md:grid-cols-2">
          {STAT_KEYS.map((stat) => (
            <div key={stat} className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STAT_COLORS[stat] }}
                  />
                  <span className="text-xs font-medium text-gray-300">{STAT_LABELS[stat]}</span>
                </div>
                <span className="text-[10px] tabular-nums text-gray-500">
                  {timeline.length > 0
                    ? `${timeline[0][stat].toFixed(1)} → ${timeline[timeline.length - 1][stat].toFixed(1)}`
                    : '—'}
                </span>
              </div>
              <MiniLineChart
                data={timeline}
                stat={stat}
                color={STAT_COLORS[stat]}
                maxVal={maxValues[stat] * 1.1 || 1}
              />
            </div>
          ))}
        </div>

        {/* Turn Selector */}
        <div className="flex flex-wrap gap-1 mt-2">
          {timeline.map((d) => {
            const isTurn1 = d.turn === 1;
            return (
              <button
                key={d.turn}
                type="button"
                className={`w-7 h-6 text-[10px] rounded border transition-colors ${
                  hoveredTurn === d.turn
                    ? 'border-rose-400 bg-rose-500/20 text-white'
                    : isTurn1
                      ? 'border-sky-400/30 bg-sky-500/10 text-sky-300'
                      : d.hasNewActivity && d.buffs.total > 0
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                        : d.hasNewActivity && d.buffsExpired > 0
                          ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                          : 'border-slate-700/30 bg-slate-900/30 text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setHoveredTurn(hoveredTurn === d.turn ? null : d.turn)}
                title={
                  isTurn1
                    ? `Turn 1: Battle init (${d.buffs.total} buffs)`
                    : d.hasNewActivity
                      ? `Turn ${d.turn}: ${d.buffs.total} new, ${d.buffsExpired} expired`
                      : `Turn ${d.turn}: No buff changes`
                }
              >
                {d.turn}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-sky-500/40 border border-sky-400/30" />
            Init
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500/40 border border-emerald-400/30" />
            New buffs
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500/40 border border-amber-400/30" />
            Expired
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-slate-700/40 border border-slate-700/30" />
            No change
          </span>
        </div>

        {/* Turn Detail */}
        {hoveredData && (
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/60 p-3 text-xs">
            <div className="font-medium text-slate-200 mb-2">
              Turn {hoveredData.turn} - {selectedTroopType} ({selectedSide})
            </div>
            <div className="grid grid-cols-4 gap-2">
              {STAT_KEYS.map((stat) => (
                <div key={stat}>
                  <span className="text-gray-500">{STAT_LABELS[stat]}:</span>{' '}
                  <span className="text-slate-200 tabular-nums">{hoveredData[stat].toFixed(2)}</span>
                </div>
              ))}
            </div>
            <TurnBuffSummary data={hoveredData} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
