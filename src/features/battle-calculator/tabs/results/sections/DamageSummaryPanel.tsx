'use client';

/**
 * Damage & Skill Summary Dashboard
 *
 * Aggregates damage data from battle turns to show:
 * - Damage dealt by troop type (stacked horizontal bars)
 * - Normal attack vs skill damage split
 * - Top skills ranked by total kills
 * - Efficiency metrics (kills-per-troop ratio)
 */

import { useMemo } from 'react';
import { SectionCard } from '@/shared/ui';
import type { BattleReport, TroopType } from '@/domain/battle/engine/types';
import { TROOP_TYPE_VALUES } from '@/domain/battle/engine/types';
import { formatBigNumber } from '../utils/format';

const TROOP_COLORS: Record<TroopType, string> = {
  Infantry: 'bg-blue-500',
  Lancer: 'bg-green-500',
  Marksman: 'bg-orange-500',
};

interface DamageSummaryPanelProps {
  battleReport: BattleReport;
  playerIsAttacker: boolean;
}

interface SideDamageStats {
  byTroopType: Record<TroopType, number>;
  byActionType: { normal: number; skill: number };
  bySkill: Map<string, { name: string; kills: number; source?: string }>;
  totalKills: number;
  initialTroops: number;
}

function computeSideDamage(
  report: BattleReport,
  side: 'attacker' | 'defender'
): SideDamageStats {
  const byTroopType: Record<TroopType, number> = { Infantry: 0, Lancer: 0, Marksman: 0 };
  const byActionType = { normal: 0, skill: 0 };
  const bySkill = new Map<string, { name: string; kills: number; source?: string }>();
  let totalKills = 0;

  for (const turn of report.turns) {
    for (const action of turn.actions) {
      if (action.side !== side) continue;
      const kills = action.components.finalKills;
      totalKills += kills;
      byTroopType[action.actor] += kills;

      if (action.actionType === 'Skill') {
        byActionType.skill += kills;
        const key = action.skillId ?? action.skillName ?? 'Unknown Skill';
        const existing = bySkill.get(key);
        bySkill.set(key, {
          name: action.skillName ?? key,
          kills: (existing?.kills ?? 0) + kills,
          source: action.sourceName ?? existing?.source,
        });
      } else {
        byActionType.normal += kills;
      }
    }
  }

  const firstTurn = report.turns[0];
  const startTroops = side === 'attacker'
    ? (firstTurn?.startAttackerTroops ?? firstTurn?.attackerTroops)
    : (firstTurn?.startDefenderTroops ?? firstTurn?.defenderTroops);
  const initialTroops = startTroops
    ? startTroops.Infantry + startTroops.Lancer + startTroops.Marksman
    : 0;

  return { byTroopType, byActionType, bySkill, totalKills, initialTroops };
}

function HorizontalBar({
  segments,
  maxValue,
}: {
  segments: { value: number; color: string; label: string }[];
  maxValue: number;
}) {
  return (
    <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-800">
      {segments.map((seg) => {
        const pct = maxValue > 0 ? (seg.value / maxValue) * 100 : 0;
        if (pct < 0.5) return null;
        return (
          <div
            key={seg.label}
            ref={(el) => {
              if (el) {
                el.style.setProperty('--segment-width', `${pct}%`);
              }
            }}
            className={`damage-segment h-full ${seg.color} transition-all duration-300`}
            title={`${seg.label}: ${formatBigNumber(seg.value)}`}
          />
        );
      })}
    </div>
  );
}

function DamageSplitRing({ normal, skill }: { normal: number; skill: number }) {
  const total = normal + skill;
  const normalPct = total > 0 ? (normal / total) * 100 : 0;
  const skillPct = total > 0 ? (skill / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18" cy="18" r="15.91549"
            fill="none" stroke="currentColor"
            className="text-slate-700" strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15.91549"
            fill="none" stroke="currentColor"
            className="text-amber-400"
            strokeWidth="3"
            strokeDasharray={`${normalPct} ${100 - normalPct}`}
            strokeDashoffset="0"
          />
          <circle
            cx="18" cy="18" r="15.91549"
            fill="none" stroke="currentColor"
            className="text-violet-400"
            strokeWidth="3"
            strokeDasharray={`${skillPct} ${100 - skillPct}`}
            strokeDashoffset={`${-normalPct}`}
          />
        </svg>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-gray-300">Normal: {normalPct.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-gray-300">Skill: {skillPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export function DamageSummaryPanel({ battleReport, playerIsAttacker }: DamageSummaryPanelProps) {
  const { playerStats, opponentStats } = useMemo(() => {
    const atkStats = computeSideDamage(battleReport, 'attacker');
    const defStats = computeSideDamage(battleReport, 'defender');
    return {
      playerStats: playerIsAttacker ? atkStats : defStats,
      opponentStats: playerIsAttacker ? defStats : atkStats,
    };
  }, [battleReport, playerIsAttacker]);

  const maxDamage = useMemo(
    () => Math.max(playerStats.totalKills, opponentStats.totalKills, 1),
    [playerStats.totalKills, opponentStats.totalKills]
  );

  const topPlayerSkills = useMemo(() =>
    Array.from(playerStats.bySkill.values())
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 5),
    [playerStats.bySkill]
  );

  const topOpponentSkills = useMemo(() =>
    Array.from(opponentStats.bySkill.values())
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 5),
    [opponentStats.bySkill]
  );

  const efficiencyMetrics = useMemo(() => {
    const firstTurn = battleReport.turns[0];
    return TROOP_TYPE_VALUES.map((t) => {
      const playerInit = playerIsAttacker
        ? (firstTurn?.startAttackerTroops?.[t] ?? 0)
        : (firstTurn?.startDefenderTroops?.[t] ?? 0);
      const oppInit = playerIsAttacker
        ? (firstTurn?.startDefenderTroops?.[t] ?? 0)
        : (firstTurn?.startAttackerTroops?.[t] ?? 0);
      return {
        type: t,
        playerEff: playerInit > 0 ? (playerStats.byTroopType[t] / playerInit) * 1000 : 0,
        oppEff: oppInit > 0 ? (opponentStats.byTroopType[t] / oppInit) * 1000 : 0,
      };
    });
  }, [battleReport.turns, playerIsAttacker, playerStats.byTroopType, opponentStats.byTroopType]);

  return (
    <SectionCard
      title="Damage Summary"
      description="Kill distribution by troop type, action type, and skill"
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-5">
        {/* Damage by Troop Type */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Kills by Troop Type
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-300">Player</span>
                <span className="text-gray-400">{formatBigNumber(playerStats.totalKills)} kills</span>
              </div>
              <HorizontalBar
                maxValue={maxDamage}
                segments={TROOP_TYPE_VALUES.map((t) => ({
                  value: playerStats.byTroopType[t],
                  color: TROOP_COLORS[t],
                  label: t,
                }))}
              />
              <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                {TROOP_TYPE_VALUES.map((t) => (
                  <span key={t}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${TROOP_COLORS[t]} mr-0.5`} />
                    {t}: {formatBigNumber(playerStats.byTroopType[t])}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-sky-300">Opponent</span>
                <span className="text-gray-400">{formatBigNumber(opponentStats.totalKills)} kills</span>
              </div>
              <HorizontalBar
                maxValue={maxDamage}
                segments={TROOP_TYPE_VALUES.map((t) => ({
                  value: opponentStats.byTroopType[t],
                  color: TROOP_COLORS[t],
                  label: t,
                }))}
              />
              <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                {TROOP_TYPE_VALUES.map((t) => (
                  <span key={t}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${TROOP_COLORS[t]} mr-0.5`} />
                    {t}: {formatBigNumber(opponentStats.byTroopType[t])}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Normal vs Skill Split */}
        <div className="space-y-3">
          <div className="text-xs text-gray-400">
            <div className="mb-1">Skill damage is calculated from normal damage as extra damage:</div>
            <div className="text-[10px] pl-2 space-y-0.5">
              <div>• Normal Attack Damage% affects normal attacks only</div>
              <div>• Damage Dealt% affects all damage sources (normal + skill)</div>
              <div>• Skill damage = normal damage base × (SkillDamage% + DamageDealt%)</div>
              <div>• Skill-specific chance to double normal damage (extra, no modifiers)</div>
              <div className="text-amber-300 mt-0.5">Note: Doubling chance varies by skill source (e.g., Crystal Lance: 15%, some heroes: 25%)</div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
              <div className="text-xs font-semibold text-rose-300 mb-2">Player Damage Split</div>
              <DamageSplitRing
                normal={playerStats.byActionType.normal}
                skill={playerStats.byActionType.skill}
              />
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
              <div className="text-xs font-semibold text-sky-300 mb-2">Opponent Damage Split</div>
              <DamageSplitRing
                normal={opponentStats.byActionType.normal}
                skill={opponentStats.byActionType.skill}
              />
            </div>
          </div>
        </div>

        {/* Top Skills */}
        {(topPlayerSkills.length > 0 || topOpponentSkills.length > 0) && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Top Skills by Kills
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <div className="text-xs text-rose-300 font-medium">Player</div>
                {topPlayerSkills.length === 0 ? (
                  <div className="text-xs text-gray-500">No skill damage</div>
                ) : (
                  topPlayerSkills.map((skill, idx) => (
                    <div key={skill.name} className="flex items-center justify-between text-xs rounded-md bg-slate-900/40 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-4 text-right">{idx + 1}.</span>
                        <span className="text-gray-200 truncate max-w-[140px]">{skill.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 tabular-nums">{formatBigNumber(skill.kills)}</span>
                        <span className="text-gray-500 text-[10px]">
                          {playerStats.totalKills > 0 ? `${((skill.kills / playerStats.totalKills) * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-sky-300 font-medium">Opponent</div>
                {topOpponentSkills.length === 0 ? (
                  <div className="text-xs text-gray-500">No skill damage</div>
                ) : (
                  topOpponentSkills.map((skill, idx) => (
                    <div key={skill.name} className="flex items-center justify-between text-xs rounded-md bg-slate-900/40 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-4 text-right">{idx + 1}.</span>
                        <span className="text-gray-200 truncate max-w-[140px]">{skill.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 tabular-nums">{formatBigNumber(skill.kills)}</span>
                        <span className="text-gray-500 text-[10px]">
                          {opponentStats.totalKills > 0 ? `${((skill.kills / opponentStats.totalKills) * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Efficiency Metrics */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Efficiency (Kills per 1K Troops)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {efficiencyMetrics.map(({ type, playerEff, oppEff }) => (
              <div key={type} className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-gray-500">{type}</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-sm font-bold text-rose-300">{playerEff.toFixed(0)}</span>
                  <span className="text-gray-500 text-[10px]">vs</span>
                  <span className="text-sm font-bold text-sky-300">{oppEff.toFixed(0)}</span>
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Overall</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-bold text-rose-300">
                  {playerStats.initialTroops > 0
                    ? ((playerStats.totalKills / playerStats.initialTroops) * 1000).toFixed(0)
                    : '0'}
                </span>
                <span className="text-gray-500 text-[10px]">vs</span>
                <span className="text-sm font-bold text-sky-300">
                  {opponentStats.initialTroops > 0
                    ? ((opponentStats.totalKills / opponentStats.initialTroops) * 1000).toFixed(0)
                    : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
