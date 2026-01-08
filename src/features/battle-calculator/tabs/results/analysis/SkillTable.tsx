/**
 * Skill Table Component
 *
 * Displays skill activations grouped by passive/ongoing vs turn-based/chance.
 * Engine explanation: Processes skill activation logs and impacts to show
 * which skills triggered, their targets, and success rates.
 */

import { memo } from 'react';
import { collectSkillActivations } from './skillUtils';

interface SkillTableProps {
  label: string;
  rows: ReturnType<typeof collectSkillActivations>;
}

export const SkillTable = memo(function SkillTable({ label, rows }: SkillTableProps) {
  const impactMap = new Map<
    string,
    { target?: string; trigger?: string; sourceType?: 'Hero' | 'Troop'; succeeded?: boolean }
  >();
  rows.impacts.forEach((i) =>
    impactMap.set(`${i.heroId ?? '__troop'}:${i.name}`, {
      target: i.target,
      trigger: i.trigger,
      sourceType: i.sourceType === 'hero' ? 'Hero' : 'Troop',
      succeeded:
        i.damageModifier !== undefined || i.stats?.length || i.specialStats?.length ? true : i.succeeded
    })
  );

  const merged: Array<{
    name: string;
    heroId?: string;
    count: number;
    trigger?: string;
    target?: string;
    sourceType: 'Hero' | 'Troop';
    succeeded?: boolean;
  }> = [
      ...rows.hero.map((h) => {
        const meta = impactMap.get(`${h.heroId ?? '__troop'}:${h.name}`);
        return {
          name: h.name,
          heroId: h.heroId,
          count: h.count,
          trigger: h.trigger ?? meta?.trigger,
          target: h.target ?? meta?.target,
          sourceType: (h.sourceType === 'hero' ? 'Hero' : 'Troop') as 'Hero' | 'Troop',
          succeeded: meta?.succeeded ?? true
        };
      }),
      ...rows.troop.map((t) => {
        const meta = impactMap.get(`__troop:${t.name}`);
        return {
          name: t.name,
          count: t.count,
          trigger: t.trigger ?? meta?.trigger,
          target: t.target ?? meta?.target,
          sourceType: (t.sourceType === 'hero' ? 'Hero' : 'Troop') as 'Hero' | 'Troop',
          succeeded: meta?.succeeded ?? true
        };
      })
    ];

  const allRows = merged.sort((a, b) => (a.name > b.name ? 1 : -1));
  const passives = allRows.filter((r) => (r.trigger ?? '').toLowerCase().includes('passive'));
  const triggered = allRows.filter((r) => !passives.includes(r));

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      {allRows.length === 0 && <div className="text-xs text-gray-500">No skills recorded this turn.</div>}

      {passives.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Passive / Ongoing</div>
          <div className="divide-y divide-white/5">
            {passives.map((row, idx) => (
              <div key={`p-${row.name}-${idx}`} className="flex items-center justify-between py-1 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">
                    {row.sourceType === 'Hero' && row.heroId ? `${row.heroId} - ${row.name}` : row.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{row.target ?? 'General'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200">
                    passive
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {triggered.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Turn-based / Chance</div>
          <div className="divide-y divide-white/5">
            {triggered.map((row, idx) => (
              <div key={`t-${row.name}-${idx}`} className="flex items-center justify-between py-1 text-xs text-slate-200">
                <div>
                  <div className="font-semibold">
                    {row.sourceType === 'Hero' && row.heroId ? `${row.heroId} - ${row.name}` : row.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{row.target ?? 'General'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200">
                    {row.trigger ?? 'OnTurn'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${row.succeeded === false
                        ? 'bg-rose-500/20 text-rose-200'
                        : row.succeeded === true
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : 'bg-slate-700/60 text-slate-200'
                      }`}
                  >
                    {row.succeeded === false ? 'miss' : row.succeeded === true ? 'hit' : 'expected'}
                  </span>
                  {row.count > 1 && (
                    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] text-emerald-300">
                      {row.count}x
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
