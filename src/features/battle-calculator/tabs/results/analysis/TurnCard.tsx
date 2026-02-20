/**
 * Turn Card Component
 *
 * Expandable card showing detailed turn information including troop states,
 * actions, and skill activations. Engine explanation: Displays per-turn battle
 * state with full action breakdowns and modifier tracking.
 */

import type { TroopCounts as CombatTroopCounts, TurnLog, ModifierComponentLog } from '@/domain/battle/engine/types';
import { memo, useMemo, useState } from 'react';
import { formatTroopCounts } from '../utils/format';
import { ActionRow } from './ActionRow';
import { SkillTable } from './SkillTable';
import { collectSkillActivations } from './skillUtils';

interface TurnCardProps {
  turn: TurnLog;
}

function TurnStateSummary({ label, attacker, defender }: { label: string; attacker: CombatTroopCounts; defender: CombatTroopCounts }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xs text-gray-300">
        <div className="flex justify-between"><span>Attacker</span><span>{formatTroopCounts(attacker)}</span></div>
        <div className="flex justify-between"><span>Defender</span><span>{formatTroopCounts(defender)}</span></div>
      </div>
    </div>
  );
}

function StackingInsights({ label, modifiers }: { label: string; modifiers: ModifierComponentLog[] }) {
  const [expanded, setExpanded] = useState(false);
  const kept = modifiers.filter((m) => m.kept !== false);
  const discarded = modifiers.filter((m) => m.kept === false);

  if (modifiers.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
      <button
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-gray-500">{label} Stacking</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-400/30">
            {kept.length} kept
          </span>
          {discarded.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-400 border border-rose-400/30">
              {discarded.length} discarded
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {kept.map((mod, idx) => (
            <div key={`k-${idx}`} className="flex items-center gap-2 text-[10px]">
              <span className="text-emerald-400 shrink-0">KEPT</span>
              <span className="text-gray-300 truncate">{mod.source}</span>
              <span className="text-gray-500">{mod.subject} {mod.appliesTo}</span>
              <span className="text-slate-200 tabular-nums ml-auto">
                {mod.magnitude >= 0 ? '+' : ''}{(mod.magnitude * 100).toFixed(1)}%
              </span>
            </div>
          ))}
          {discarded.map((mod, idx) => (
            <div key={`d-${idx}`} className="flex items-center gap-2 text-[10px]">
              <span className="text-rose-400 shrink-0">DROP</span>
              <span className="text-gray-500 truncate line-through">{mod.source}</span>
              <span className="text-gray-600">{mod.subject} {mod.appliesTo}</span>
              <span className="text-gray-600 tabular-nums ml-auto">
                {mod.magnitude >= 0 ? '+' : ''}{(mod.magnitude * 100).toFixed(1)}%
              </span>
              {mod.discardedReason && (
                <span className="text-[9px] text-amber-400 italic ml-1">{mod.discardedReason}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const TurnCard = memo(function TurnCard({ turn }: TurnCardProps) {
  const [open, setOpen] = useState(turn.turn === 1);
  const startAttacker = turn.startAttackerTroops ?? turn.attackerTroops;
  const startDefender = turn.startDefenderTroops ?? turn.defenderTroops;
  const startAttackerMods = turn.startModifiers?.attacker?.length ?? 0;
  const startDefenderMods = turn.startModifiers?.defender?.length ?? 0;
  const attackerSkills = useMemo(() => collectSkillActivations(turn, "attacker"), [turn]);
  const defenderSkills = useMemo(() => collectSkillActivations(turn, "defender"), [turn]);
  const attackerStacking = turn.stacking?.attacker ?? [];
  const defenderStacking = turn.stacking?.defender ?? [];
  const hasStacking = attackerStacking.length > 0 || defenderStacking.length > 0;
  const discardedCount = useMemo(() => {
    if (!hasStacking) return 0;
    let count = 0;
    for (const m of attackerStacking) if (m.kept === false) count++;
    for (const m of defenderStacking) if (m.kept === false) count++;
    return count;
  }, [hasStacking, attackerStacking, defenderStacking]);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs uppercase tracking-wide text-gray-400">Turn {turn.turn}</span>
          <span className="text-sm text-gray-300">
            Start A: {formatTroopCounts(startAttacker)} · D: {formatTroopCounts(startDefender)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Mods A:{startAttackerMods}</span>
          <span>D:{startDefenderMods}</span>
          {hasStacking && discardedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-400/30">
              {discardedCount} overridden
            </span>
          )}
          <span className="text-lg text-gray-400">{open ? '−' : '+'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <TurnStateSummary
              label="Start of turn"
              attacker={startAttacker as CombatTroopCounts}
              defender={startDefender as CombatTroopCounts}
            />
            <TurnStateSummary
              label="End of turn"
              attacker={turn.attackerTroops as CombatTroopCounts}
              defender={turn.defenderTroops as CombatTroopCounts}
            />
          </div>
          {hasStacking && (
            <div className="grid gap-3 md:grid-cols-2">
              <StackingInsights label="Attacker" modifiers={attackerStacking} />
              <StackingInsights label="Defender" modifiers={defenderStacking} />
            </div>
          )}
          <div className="space-y-2">
            {turn.actions.map((action) => (
              <ActionRow key={action.id} action={action} turn={turn} />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SkillTable label="Attacker skills" rows={attackerSkills} />
            <SkillTable label="Defender skills" rows={defenderSkills} />
          </div>
        </div>
      )}
    </div>
  );
});
