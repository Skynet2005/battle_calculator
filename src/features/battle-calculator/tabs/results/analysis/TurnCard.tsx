/**
 * Turn Card Component
 *
 * Expandable card showing detailed turn information including troop states,
 * actions, and skill activations. Engine explanation: Displays per-turn battle
 * state with full action breakdowns and modifier tracking.
 */

import type { TroopCounts as CombatTroopCounts, TurnLog } from '@/domain/combat/types';
import { memo, useState } from 'react';
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

export const TurnCard = memo(function TurnCard({ turn }: TurnCardProps) {
  const [open, setOpen] = useState(turn.turn === 1);
  const startAttacker = turn.startAttackerTroops ?? turn.attackerTroops;
  const startDefender = turn.startDefenderTroops ?? turn.defenderTroops;
  const startAttackerMods = turn.startModifiers?.attacker?.length ?? 0;
  const startDefenderMods = turn.startModifiers?.defender?.length ?? 0;
  const attackerSkills = collectSkillActivations(turn, "attacker");
  const defenderSkills = collectSkillActivations(turn, "defender");

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
