/**
 * Compare Table Component
 *
 * Reusable comparison table with Player vs Opponent columns,
 * delta column, and automatic winner highlighting.
 * Replaces side-by-side column layouts for better scanability.
 */

import { Fragment } from 'react';
import { formatBigNumber, formatPercent, formatSignedPercent } from '../utils/format';

export const PLAYER_COLOR = 'text-rose-300';
export const OPPONENT_COLOR = 'text-sky-300';
export const ADVANTAGE_COLOR = 'text-emerald-300';
export const DISADVANTAGE_COLOR = 'text-rose-300';

interface CompareRow {
  label: string;
  playerValue: number | string;
  opponentValue: number | string;
  format?: 'number' | 'percent' | 'signedPercent';
  showDelta?: boolean;
  winner?: 'player' | 'opponent' | null;
  group?: string;
}

interface CompareTableProps {
  title?: string;
  rows: CompareRow[];
  showDelta?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  groupBy?: boolean;
}

export function CompareTable({
  title,
  rows,
  showDelta = true,
  collapsible = false,
  defaultCollapsed = false,
  groupBy = false
}: CompareTableProps) {
  const formatValue = (value: number | string, format?: 'number' | 'percent' | 'signedPercent'): string => {
    if (typeof value === 'string') return value;
    if (format === 'percent') return formatPercent(value);
    if (format === 'signedPercent') return formatSignedPercent(value);
    return formatBigNumber(value);
  };

  const calculateDelta = (player: number | string, opponent: number | string): number | null => {
    if (typeof player !== 'number' || typeof opponent !== 'number') return null;
    if (opponent === 0) return player > 0 ? 100 : 0;
    return ((player - opponent) / opponent) * 100;
  };

  const groups = groupBy
    ? rows.reduce((acc, row) => {
        const group = row.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(row);
        return acc;
      }, {} as Record<string, CompareRow[]>)
    : { '': rows };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-white/10 bg-slate-900/60">
          <div className="text-sm font-semibold text-slate-200">{title}</div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-white/10 bg-slate-900/40">
              <th className="px-4 py-2">Stat</th>
              <th className="px-4 py-2 text-center">
                <span className={PLAYER_COLOR}>Player</span>
              </th>
              <th className="px-4 py-2 text-center">
                <span className={OPPONENT_COLOR}>Opponent</span>
              </th>
              {showDelta && <th className="px-4 py-2 text-center">Δ</th>}
              <th className="px-4 py-2 text-center">Winner</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([groupName, groupRows]) => (
              <Fragment key={groupName}>
                {groupBy && groupName && (
                  <tr className="bg-slate-900/60">
                    <td colSpan={showDelta ? 5 : 4} className="px-4 py-2 text-xs uppercase tracking-wide text-gray-500">
                      {groupName}
                    </td>
                  </tr>
                )}
                {groupRows.map((row, idx) => {
                  const delta = showDelta ? calculateDelta(row.playerValue, row.opponentValue) : null;
                  const winner = row.winner ?? (delta !== null ? (delta > 0 ? 'player' : delta < 0 ? 'opponent' : null) : null);

                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-slate-900/30">
                      <td className="px-4 py-2 text-gray-300">{row.label}</td>
                      <td className={`px-4 py-2 text-center font-semibold ${PLAYER_COLOR}`}>
                        {formatValue(row.playerValue, row.format)}
                      </td>
                      <td className={`px-4 py-2 text-center font-semibold ${OPPONENT_COLOR}`}>
                        {formatValue(row.opponentValue, row.format)}
                      </td>
                      {showDelta && (
                        <td className={`px-4 py-2 text-center ${
                          delta !== null
                            ? delta > 0
                              ? ADVANTAGE_COLOR
                              : delta < 0
                                ? DISADVANTAGE_COLOR
                                : 'text-gray-400'
                            : 'text-gray-500'
                        }`}>
                          {delta !== null ? formatSignedPercent(delta / 100) : '—'}
                        </td>
                      )}
                      <td className="px-4 py-2 text-center">
                        {winner === 'player' && <span className={`${ADVANTAGE_COLOR} font-semibold`}>Player</span>}
                        {winner === 'opponent' && <span className={`${DISADVANTAGE_COLOR} font-semibold`}>Opponent</span>}
                        {!winner && <span className="text-gray-500">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
