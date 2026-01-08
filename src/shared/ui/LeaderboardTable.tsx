'use client';

import type { FinalStats } from '@/domain/battle/calculations';
import React, { useMemo, useState } from 'react';

type StatKeys = 'attack' | 'defense' | 'lethality' | 'health';

export type LeaderboardRow = {
  profileId: string;
  profileName: string | null;
  updatedAt: Date | null;
  attack: number;
  defense: number;
  lethality: number;
  health: number;
  infantry: FinalStats | null;
  lancer: FinalStats | null;
  marksman: FinalStats | null;
};

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  sortLabel: string;
}

const fmt = (value: number) => {
  const n = Number.isFinite(value) ? value : 0;
  return n.toFixed(2);
};

const fmtStat = (stats: FinalStats | null | undefined, key: StatKeys) => fmt(stats?.[key] ?? 0);

export default function LeaderboardTable({ rows, sortLabel }: LeaderboardTableProps) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const sortedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : null
      })),
    [rows]
  );

  const toggle = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 shadow-xl bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Profile</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Total ATK</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Total DEF</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Total LETH</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Total HP</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Updated</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wide"> </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sortedRows.map((row, idx) => {
            const isOpen = openMap[row.profileId] ?? false;
            return (
              <React.Fragment key={row.profileId}>
                <tr className="bg-slate-900/40 border-t border-slate-800">
                  <td className="px-3 py-3 text-sm text-slate-200 align-top">{idx + 1}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-100 align-top">
                    {row.profileName ?? 'Unnamed profile'}
                  </td>
                  <td className="px-3 py-3 text-sm text-center text-slate-100 align-top">{fmt(row.attack)}</td>
                  <td className="px-3 py-3 text-sm text-center text-slate-100 align-top">{fmt(row.defense)}</td>
                  <td className="px-3 py-3 text-sm text-center text-slate-100 align-top">{fmt(row.lethality)}</td>
                  <td className="px-3 py-3 text-sm text-center text-slate-100 align-top">{fmt(row.health)}</td>
                  <td className="px-3 py-3 text-sm text-center text-slate-300 align-top">
                    {row.updatedAt ? row.updatedAt.toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-slate-200 align-top">
                    <button
                      type="button"
                      onClick={() => toggle(row.profileId)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-700"
                      aria-label={isOpen ? 'Collapse stats' : 'Expand stats'}
                    >
                      {isOpen ? '−' : '+'}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <>
                    <tr className="bg-slate-950/80">
                      <td />
                      <td className="px-3 py-2 text-[11px] text-slate-200 pl-6 font-semibold">Infantry</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-emerald-700/60 bg-emerald-950/50 px-2 py-1 text-[11px] text-emerald-100">
                          ATK {fmtStat(row.infantry, 'attack')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-emerald-700/60 bg-emerald-950/50 px-2 py-1 text-[11px] text-emerald-100">
                          DEF {fmtStat(row.infantry, 'defense')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-emerald-700/60 bg-emerald-950/50 px-2 py-1 text-[11px] text-emerald-100">
                          LETH {fmtStat(row.infantry, 'lethality')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-emerald-700/60 bg-emerald-950/50 px-2 py-1 text-[11px] text-emerald-100">
                          HP {fmtStat(row.infantry, 'health')}
                        </span>
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                    </tr>
                    <tr className="bg-slate-950/75">
                      <td />
                      <td className="px-3 py-2 text-[11px] text-slate-200 pl-6 font-semibold">Lancer</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-sky-700/60 bg-sky-950/50 px-2 py-1 text-[11px] text-sky-100">
                          ATK {fmtStat(row.lancer, 'attack')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-sky-700/60 bg-sky-950/50 px-2 py-1 text-[11px] text-sky-100">
                          DEF {fmtStat(row.lancer, 'defense')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-sky-700/60 bg-sky-950/50 px-2 py-1 text-[11px] text-sky-100">
                          LETH {fmtStat(row.lancer, 'lethality')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-sky-700/60 bg-sky-950/50 px-2 py-1 text-[11px] text-sky-100">
                          HP {fmtStat(row.lancer, 'health')}
                        </span>
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                    </tr>
                    <tr className="bg-slate-950/70">
                      <td />
                      <td className="px-3 py-2 text-[11px] text-slate-200 pl-6 font-semibold">Marksman</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-amber-700/60 bg-amber-950/50 px-2 py-1 text-[11px] text-amber-100">
                          ATK {fmtStat(row.marksman, 'attack')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-amber-700/60 bg-amber-950/50 px-2 py-1 text-[11px] text-amber-100">
                          DEF {fmtStat(row.marksman, 'defense')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-amber-700/60 bg-amber-950/50 px-2 py-1 text-[11px] text-amber-100">
                          LETH {fmtStat(row.marksman, 'lethality')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex rounded border border-amber-700/60 bg-amber-950/50 px-2 py-1 text-[11px] text-amber-100">
                          HP {fmtStat(row.marksman, 'health')}
                        </span>
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                    </tr>
                  </>
                )}
              </React.Fragment>
            );
          })}
          {sortedRows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                No players found yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
