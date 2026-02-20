'use client';

/**
 * Skill Scorecard
 *
 * Aggregates skill performance across all battle turns:
 * - Total activations per skill
 * - Success rate (from skillRolls)
 * - Stats affected
 * - Estimated kill contribution
 * - Sorted by impact
 */

import { useMemo, useState } from 'react';
import { SectionCard } from '@/shared/ui';
import type { TurnLog, BattleRole } from '@/domain/battle/engine/types';

interface SkillScorecardProps {
  turns: TurnLog[];
  playerIsAttacker: boolean;
}

interface SkillEntry {
  name: string;
  heroId?: string;
  activations: number;
  successes: number;
  failures: number;
  successRate: number;
  statsAffected: Set<string>;
  hasDamageMod: boolean;
  estimatedKills: number;
  sourceType?: 'hero' | 'troop';
}

function aggregateSkills(turns: TurnLog[], side: BattleRole): SkillEntry[] {
  const map = new Map<string, SkillEntry>();

  for (const turn of turns) {
    // Count activations from skillRolls
    const rolls = turn.skillRolls?.filter((r) => r.side === side) ?? [];
    for (const roll of rolls) {
      const key = `${roll.heroId ?? '__'}:${roll.name}`;
      const entry = map.get(key) ?? {
        name: roll.name,
        heroId: roll.heroId,
        activations: 0,
        successes: 0,
        failures: 0,
        successRate: 0,
        statsAffected: new Set<string>(),
        hasDamageMod: false,
        estimatedKills: 0,
        sourceType: roll.sourceType,
      };
      entry.activations++;
      if (roll.succeeded) {
        entry.successes++;
      } else {
        entry.failures++;
      }
      map.set(key, entry);
    }

    // Gather stats affected from skillImpacts
    const impacts = turn.skillImpacts?.filter((s) => s.side === side) ?? [];
    for (const impact of impacts) {
      const key = `${impact.heroId ?? '__'}:${impact.name}`;
      const entry = map.get(key);
      if (entry) {
        impact.stats?.forEach((s) => entry.statsAffected.add(s));
        impact.specialStats?.forEach((s) => entry.statsAffected.add(s));
        if (impact.damageModifier) entry.hasDamageMod = true;
      }
    }

    // Estimate kills from skill actions
    for (const action of turn.actions) {
      if (action.side !== side || action.actionType !== 'Skill') continue;
      const key = `${action.sourceName ?? '__'}:${action.skillName ?? 'Unknown'}`;
      const entry = map.get(key);
      if (entry) {
        entry.estimatedKills += action.components.finalKills;
      }
    }
  }

  // Compute success rates
  for (const entry of map.values()) {
    entry.successRate = entry.activations > 0 ? entry.successes / entry.activations : 0;
  }

  return Array.from(map.values()).sort((a, b) => {
    const scoreA = a.estimatedKills + a.successes * 10;
    const scoreB = b.estimatedKills + b.successes * 10;
    return scoreB - scoreA;
  });
}

function SkillRow({ skill }: { skill: SkillEntry }) {
  const statsStr = Array.from(skill.statsAffected).slice(0, 4).join(', ');

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/30 bg-slate-900/30 px-3 py-2 text-xs">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium truncate">{skill.name}</span>
          {skill.heroId && (
            <span className="text-gray-500 text-[10px] truncate">({skill.heroId})</span>
          )}
          {skill.sourceType === 'troop' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700/30">troop</span>
          )}
        </div>
        {statsStr && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {skill.hasDamageMod && <span className="text-violet-400 mr-1">DMG MOD</span>}
            {statsStr}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-center">
          <div className="text-[10px] text-gray-500">Procs</div>
          <div className="text-slate-200 font-medium tabular-nums">{skill.successes}/{skill.activations}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500">Rate</div>
          <div className={`font-medium tabular-nums ${
            skill.successRate >= 0.7 ? 'text-emerald-400' :
            skill.successRate >= 0.4 ? 'text-amber-400' :
            'text-rose-400'
          }`}>
            {(skill.successRate * 100).toFixed(0)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500">Kills</div>
          <div className="text-slate-200 font-medium tabular-nums">
            {skill.estimatedKills > 0 ? skill.estimatedKills.toLocaleString() : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkillScorecard({ turns, playerIsAttacker }: SkillScorecardProps) {
  const [selectedSide, setSelectedSide] = useState<'player' | 'opponent'>('player');

  const playerSideRole: BattleRole = playerIsAttacker ? 'attacker' : 'defender';
  const opponentSideRole: BattleRole = playerIsAttacker ? 'defender' : 'attacker';

  const playerSkills = useMemo(() => aggregateSkills(turns, playerSideRole), [turns, playerSideRole]);
  const opponentSkills = useMemo(() => aggregateSkills(turns, opponentSideRole), [turns, opponentSideRole]);

  // Auto-switch to the side that has skills if the selected side has none
  const effectiveSide = selectedSide === 'player' && playerSkills.length === 0 && opponentSkills.length > 0
    ? 'opponent'
    : selectedSide === 'opponent' && opponentSkills.length === 0 && playerSkills.length > 0
      ? 'player'
      : selectedSide;

  const skills = effectiveSide === 'player' ? playerSkills : opponentSkills;

  if (playerSkills.length === 0 && opponentSkills.length === 0) return null;

  // Separate skills into troop and hero skills
  const troopSkills = skills.filter(skill => skill.sourceType === 'troop' || (!skill.sourceType && !skill.heroId));
  const heroSkills = skills.filter(skill => skill.sourceType === 'hero' || (skill.sourceType !== 'troop' && skill.heroId));

  const totalProcs = skills.reduce((s, sk) => s + sk.successes, 0);
  const totalAttempts = skills.reduce((s, sk) => s + sk.activations, 0);
  const overallRate = totalAttempts > 0 ? totalProcs / totalAttempts : 0;
  const totalSkillKills = skills.reduce((s, sk) => s + sk.estimatedKills, 0);

  return (
    <SectionCard
      title="Skill Scorecard"
      description="Skill activations, success rates, and kill contributions"
      collapsible
      defaultCollapsed={true}
    >
      <div className="space-y-4">
        {/* Side Toggle */}
        <div className="flex gap-1">
          {(['player', 'opponent'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSide(s)}
              className={`px-3 py-1 rounded-full text-xs border ${
                effectiveSide === s
                  ? 'border-rose-400 bg-rose-500/30 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {s === 'player' ? 'Player' : 'Opponent'}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Total Procs</div>
            <div className="text-lg font-bold text-slate-200">{totalProcs}/{totalAttempts}</div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Overall Rate</div>
            <div className={`text-lg font-bold ${
              overallRate >= 0.7 ? 'text-emerald-400' :
              overallRate >= 0.4 ? 'text-amber-400' :
              'text-rose-400'
            }`}>
              {(overallRate * 100).toFixed(0)}%
            </div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Skill Kills</div>
            <div className="text-lg font-bold text-violet-300">{totalSkillKills.toLocaleString()}</div>
          </div>
        </div>

        {/* Two Column Layout: Troop Skills (left) and Hero Skills (right) */}
        {troopSkills.length === 0 && heroSkills.length === 0 ? (
          <div className="text-sm text-gray-500">No skill activations recorded.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Troop Skills Column */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
                Troop Skills
              </div>
              {troopSkills.length === 0 ? (
                <div className="text-xs text-gray-500 italic">No troop skills</div>
              ) : (
                <div className="space-y-1.5">
                  {troopSkills.map((skill) => (
                    <SkillRow key={`${skill.heroId ?? ''}:${skill.name}`} skill={skill} />
                  ))}
                </div>
              )}
            </div>

            {/* Hero Skills Column */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
                Hero Skills
              </div>
              {heroSkills.length === 0 ? (
                <div className="text-xs text-gray-500 italic">No hero skills</div>
              ) : (
                <div className="space-y-1.5">
                  {heroSkills.map((skill) => (
                    <SkillRow key={`${skill.heroId ?? ''}:${skill.name}`} skill={skill} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
