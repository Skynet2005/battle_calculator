'use client';

import type { SideCombatSummary } from '@/domain/rally/combat-types';
import type { TroopType } from '@/shared/types';

export interface SideSummaryCardProps {
  title: string;
  role: 'attacker' | 'defender';
  summary: SideCombatSummary | null;
}

function formatMultiplier(multiplier: number) {
  const percent = (multiplier - 1) * 100;
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}% (${multiplier.toFixed(3)}×)`;
}

function formatStat(value: number) {
  return `${value.toFixed(2)}%`;
}

export function SideSummaryCard({ title, role, summary }: SideSummaryCardProps) {
  return (
    <div className="card info-card">
      <div className="flex justify-between items-center mb-4">
        <h4 className="m-0">{title}</h4>
        <span className="badge">{role === 'attacker' ? 'Attacker' : 'Defender'}</span>
      </div>
      {!summary && (
        <p className="text-sm text-gray-400 dark:text-gray-400">
          No combat data available yet.
        </p>
      )}
      {summary && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Troop</th>
                  <th>Attack</th>
                  <th>Defense</th>
                  <th>Health</th>
                  <th>Lethality</th>
                </tr>
              </thead>
              <tbody>
                {(['infantry', 'lancer', 'marksman'] as TroopType[]).map((troop) => (
                  <tr key={troop}>
                    <td className="font-semibold capitalize">{troop}</td>
                    <td>{formatStat(summary.troopStats[troop].attack)}</td>
                    <td>{formatStat(summary.troopStats[troop].defense)}</td>
                    <td>{formatStat(summary.troopStats[troop].health)}</td>
                    <td>{formatStat(summary.troopStats[troop].lethality)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div><strong>Damage Dealt:</strong> {formatMultiplier(summary.damageDealtMultiplier)}</div>
            <div><strong>Damage Taken:</strong> {formatMultiplier(summary.damageTakenMultiplier)}</div>
            {summary.controlSummary.immobilizeChance !== undefined && (
              <div><strong>Control:</strong> {summary.controlSummary.immobilizeChance.toFixed(2)}%</div>
            )}
            {summary.controlSummary.otherControlNotes && (
              <div className="text-xs text-gray-400 dark:text-gray-400">{summary.controlSummary.otherControlNotes}</div>
            )}
            {summary.dotSummary?.hasDot && (
              <div><strong>Damage Over Time:</strong> {summary.dotSummary.approxMagnitude?.toFixed(2) ?? '—'}%</div>
            )}
          </div>
          {summary.debugEffects.length > 0 && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-blue-400">View applied effects ({summary.debugEffects.length})</summary>
              <ul className="mt-2 space-y-1">
                {summary.debugEffects.map((effect, idx) => (
                  <li key={`${effect.sourceName}-${idx}`}>
                    {effect.sourceName}: {effect.target} {effect.stat} {effect.isMultiplicative ? '×' : '+'}{(effect.value * 100).toFixed(2)}%
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
