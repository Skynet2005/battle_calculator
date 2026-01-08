import type { ActionLogEntry, TurnLog } from '@/domain/combat/types';
import { memo, useState } from 'react';
import { formatNumber } from '../utils/format';
import { ModifierList } from './ModifierList';
import { SkillList } from './SkillList';
import { skillsForSide } from './skillUtils';
import { StatBreakdown } from './StatBreakdown';

interface ActionRowProps {
  action: ActionLogEntry;
  turn: TurnLog;
}

export const ActionRow = memo(function ActionRow({ action, turn }: ActionRowProps) {
  const [open, setOpen] = useState(false);
  const kills = action.components?.finalKills ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-slate-200"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {action.side === 'attacker' ? 'Attacker' : 'Defender'} · {action.actor} → {action.target} ({action.actionType})
          </span>
          {action.skillName && <span className="text-[11px] text-slate-400">Skill: {action.skillName}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-300 font-semibold">{kills.toFixed(2)} kills</span>
          <span className="text-[11px] text-slate-400">{open ? 'Hide' : 'Show'} details</span>
        </div>
      </button>
      {open && <ActionDetail action={action} turn={turn} />}
    </div>
  );
});

function ActionDetail({ action, turn }: { action: ActionLogEntry; turn: TurnLog }) {
  const comp = action.components;
  const outgoing = action.outgoingComponents ?? comp?.outgoingComponents ?? [];
  const incoming = action.incomingComponents ?? comp?.incomingComponents ?? [];
  const keptOutgoing = outgoing.filter((m) => m.kept !== false);
  const keptIncoming = incoming.filter((m) => m.kept !== false);
  const discarded = [...outgoing, ...incoming].filter((m) => m.kept === false);

  return (
    <div className="border-t border-white/5 px-3 py-3 space-y-3 text-xs text-slate-200 bg-slate-950/40">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">Formula</div>
      <div className="space-y-1 text-slate-300">
        <div>baseKills = K({formatNumber(comp?.k)}) · N^alpha({formatNumber(comp?.nTerm)}) · ratio({formatNumber(comp?.ratio)}) · matchup({formatNumber(comp?.matchupMultiplier)}) · action({formatNumber(comp?.actionMultiplier)})</div>
        <div>outgoingMultiplier = {formatNumber(comp?.outgoingMultiplier)} · incomingMultiplier = {formatNumber(comp?.incomingMultiplier)}</div>
        <div>rawFinal = {formatNumber(comp?.rawFinal)} · finalKills = {formatNumber(comp?.finalKills)}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatBreakdown title="Attacker stats" detail={action.stats?.attacker} />
        <StatBreakdown title="Defender stats" detail={action.stats?.defender} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ModifierList title="Outgoing modifiers" items={keptOutgoing} multiplier={comp?.outgoingMultiplier} />
        <ModifierList title="Incoming modifiers" items={keptIncoming} multiplier={comp?.incomingMultiplier} />
      </div>

      {discarded.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-300">Discarded (stacking)</div>
          <div className="mt-1 space-y-1 text-xs text-amber-100">
            {discarded.map((d) => (
              <div key={d.id} className="flex justify-between">
                <span>{d.source ?? d.id}</span>
                <span>{d.discardedReason ?? 'discarded'} (stack {d.stackingKey ?? '—'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {action.targeting && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Targeting</div>
          <div className="mt-1 text-slate-300">
            Target: {action.targeting.selected ?? 'None'} · Reason: {action.targeting.reason ?? '—'} · Roll: {formatNumber(action.targeting.roll)}
          </div>
        </div>
      )}

      {action.rngRolls && action.rngRolls.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">RNG</div>
          <div className="mt-1 space-y-1">
            {action.rngRolls.map((roll, idx) => (
              <div key={idx} className="flex justify-between text-slate-300">
                <span>{roll.label}</span>
                <span>{formatNumber(roll.value)} / thresh {formatNumber(roll.threshold)} {roll.succeeded ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <SkillList title="Attacker skills (this turn)" rows={skillsForSide(turn, action.side)} />
        <SkillList title="Defender skills (this turn)" rows={skillsForSide(turn, action.side === 'attacker' ? 'defender' : 'attacker')} />
      </div>
    </div>
  );
}
