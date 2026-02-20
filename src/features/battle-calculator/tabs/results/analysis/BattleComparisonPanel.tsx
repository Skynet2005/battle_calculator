'use client';

import { useMemo } from 'react';
import { SectionCard } from '@/shared/ui';
import type { BattleReport, TroopType } from '@/domain/battle/engine/types';
import { TROOP_TYPE_VALUES } from '@/domain/battle/engine/types';

interface BattleComparisonPanelProps {
  battleA: BattleReport | null;
  battleB: BattleReport | null;
  labelA?: string;
  labelB?: string;
}

interface ComparisonRow {
  label: string;
  valueA: string | number;
  valueB: string | number;
  delta: number | null;
  /** true when higher-is-better (green for positive delta) */
  higherIsBetter: boolean;
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

function buildRows(a: BattleReport, b: BattleReport): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // Winner
  rows.push({
    label: 'Winner',
    valueA: a.winner,
    valueB: b.winner,
    delta: null,
    higherIsBetter: true,
  });

  // Total turns
  const turnsA = a.totalTurns ?? a.turns.length;
  const turnsB = b.totalTurns ?? b.turns.length;
  rows.push({
    label: 'Total Turns',
    valueA: turnsA,
    valueB: turnsB,
    delta: turnsA - turnsB,
    higherIsBetter: false,
  });

  // Attacker remaining by troop type
  for (const t of TROOP_TYPE_VALUES) {
    const countA = a.attackerRemaining[t];
    const countB = b.attackerRemaining[t];
    rows.push({
      label: `Atk Remaining ${t}`,
      valueA: formatNum(countA),
      valueB: formatNum(countB),
      delta: countA - countB,
      higherIsBetter: true,
    });
  }

  // Defender remaining by troop type
  for (const t of TROOP_TYPE_VALUES) {
    const countA = a.defenderRemaining[t];
    const countB = b.defenderRemaining[t];
    rows.push({
      label: `Def Remaining ${t}`,
      valueA: formatNum(countA),
      valueB: formatNum(countB),
      delta: countA - countB,
      higherIsBetter: false,
    });
  }

  // Win rate (Monte Carlo)
  if (a.attackerWinRate != null || b.attackerWinRate != null) {
    const wrA = a.attackerWinRate ?? 0;
    const wrB = b.attackerWinRate ?? 0;
    rows.push({
      label: 'Attacker Win Rate',
      valueA: `${wrA.toFixed(1)}%`,
      valueB: `${wrB.toFixed(1)}%`,
      delta: wrA - wrB,
      higherIsBetter: true,
    });
  }

  // Kills StdDev (Monte Carlo)
  if (a.killsStdDev != null || b.killsStdDev != null) {
    const sdA = a.killsStdDev ?? 0;
    const sdB = b.killsStdDev ?? 0;
    rows.push({
      label: 'Kills StdDev',
      valueA: sdA.toFixed(1),
      valueB: sdB.toFixed(1),
      delta: sdA - sdB,
      higherIsBetter: false,
    });
  }

  return rows;
}

function DeltaCell({ delta, higherIsBetter }: { delta: number | null; higherIsBetter: boolean }) {
  if (delta == null) {
    return <td className="px-3 py-2 text-center text-slate-500">—</td>;
  }

  if (delta === 0) {
    return <td className="px-3 py-2 text-center text-slate-400">0</td>;
  }

  const isPositive = delta > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  const color = isGood ? 'text-emerald-400' : 'text-red-400';
  const sign = isPositive ? '+' : '';

  return (
    <td className={`px-3 py-2 text-center font-medium ${color}`}>
      {sign}{typeof delta === 'number' && Math.abs(delta) > 999 ? formatNum(delta) : delta.toFixed(1)}
    </td>
  );
}

export function BattleComparisonPanel({ battleA, battleB, labelA = 'Current', labelB = 'Previous' }: BattleComparisonPanelProps) {
  if (!battleA || !battleB) {
    return (
      <SectionCard
        title="Compare Battles"
        description="Run two battles to compare results side by side."
        collapsible
        defaultCollapsed={false}
      >
        <p className="text-sm text-slate-400">
          {!battleA && !battleB
            ? 'No battle results to compare. Run at least two battles to see a comparison.'
            : 'Run a second battle to enable comparison.'}
        </p>
      </SectionCard>
    );
  }

  const rows = useMemo(() => buildRows(battleA, battleB), [battleA, battleB]);

  return (
    <SectionCard
      title="Compare Battles"
      description="Side-by-side comparison of two battle results."
      collapsible
      defaultCollapsed={false}
    >
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left px-3 py-2 font-medium">Metric</th>
              <th className="text-center px-3 py-2 font-medium">{labelA}</th>
              <th className="text-center px-3 py-2 font-medium">{labelB}</th>
              <th className="text-center px-3 py-2 font-medium">Delta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                <td className="px-3 py-2 text-slate-300">{row.label}</td>
                <td className="px-3 py-2 text-center text-slate-100">{row.valueA}</td>
                <td className="px-3 py-2 text-center text-slate-100">{row.valueB}</td>
                <DeltaCell delta={row.delta} higherIsBetter={row.higherIsBetter} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
