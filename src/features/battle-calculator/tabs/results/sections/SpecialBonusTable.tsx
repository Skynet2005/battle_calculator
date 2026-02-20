import { Fragment } from 'react';
import { formatSignedPercent } from '../utils/format';
import type { SpecialBonusSummary } from '@/features/battle-calculator/model/types';

const BONUS_ROWS: Array<{
  label: string;
  get: (s: SpecialBonusSummary) => number;
  group: 'Troops' | 'Enemy' | 'Defender' | 'Rally';
}> = [
  { label: 'Troops Attack Bonus', get: (s) => s.troopsAttack, group: 'Troops' },
  { label: 'Troops Defense Bonus', get: (s) => s.troopsDefense, group: 'Troops' },
  { label: 'Troops Lethality Bonus', get: (s) => s.troopsLethality, group: 'Troops' },
  { label: 'Troops Health Bonus', get: (s) => s.troopsHealth, group: 'Troops' },
  { label: 'Enemy Troops Attack Down', get: (s) => -s.enemyAttackReduction, group: 'Enemy' },
  { label: 'Enemy Troops Defense Down', get: (s) => -s.enemyDefenseReduction, group: 'Enemy' },
];

function formatCombatDebuffDetail(entry?: { combat?: number; pet?: number; manual?: number }) {
  if (!entry) return undefined;
  const parts: string[] = [];
  if (entry.pet !== undefined && Math.abs(entry.pet) > 0.0001) {
    parts.push(`pet: ${formatSignedPercent(entry.pet)}`);
  }
  if (entry.manual !== undefined && Math.abs(entry.manual) > 0.0001) {
    parts.push(`manual: ${formatSignedPercent(entry.manual)}`);
  }
  return parts.length ? parts.join(' | ') : undefined;
}

function statKeyForLabel(label: string): 'attack' | 'defense' | 'lethality' | 'health' | null {
  if (label.includes('Attack')) return 'attack';
  if (label.includes('Defense')) return 'defense';
  if (label.includes('Lethality')) return 'lethality';
  if (label.includes('Health')) return 'health';
  return null;
}

function buildSources(
  summary: SpecialBonusSummary | null,
  label: string
): Array<{ label: string; value: number; detail?: string }> {
  if (!summary?.breakdown) return [];
  const key = statKeyForLabel(label);
  if (label === 'Enemy Troops Attack Down') {
    const combatDetail = formatCombatDebuffDetail(summary.breakdown.enemyAttack);
    const joinerDetail =
      summary.breakdown.joiner.names.length && summary.breakdown.enemyAttack.joiner !== 0
        ? summary.breakdown.joiner.names.join(', ')
        : undefined;
    return [
      { label: 'City', value: summary.breakdown.enemyAttack.city },
      { label: 'Combat Debuffs / Pets', value: summary.breakdown.enemyAttack.combat, detail: combatDetail },
      { label: 'Joiners', value: summary.breakdown.enemyAttack.joiner, detail: joinerDetail },
    ];
  }
  if (label === 'Enemy Troops Defense Down') {
    const combatDetail = formatCombatDebuffDetail(summary.breakdown.enemyDefense);
    const joinerDetail =
      summary.breakdown.joiner.names.length && summary.breakdown.enemyDefense.joiner !== 0
        ? summary.breakdown.joiner.names.join(', ')
        : undefined;
    return [
      { label: 'City', value: summary.breakdown.enemyDefense.city },
      { label: 'Combat Debuffs / Pets', value: summary.breakdown.enemyDefense.combat, detail: combatDetail },
      { label: 'Joiners', value: summary.breakdown.enemyDefense.joiner, detail: joinerDetail },
    ];
  }
  if (!key) return [];
  const joinerDetail =
    summary.breakdown.joiner.names.length && summary.breakdown.joiner[key] !== 0
      ? summary.breakdown.joiner.names.join(', ')
      : undefined;
  return [
    { label: 'Pet Skills', value: summary.breakdown.pet[key] || 0 },
    { label: 'City Bonuses', value: summary.breakdown.city[key] || 0 },
    { label: 'Combat Buffs', value: summary.breakdown.combat[key] || 0 },
    { label: 'Special Buffs', value: summary.breakdown.special?.[key] || 0 },
    { label: 'Joiners', value: summary.breakdown.joiner[key] || 0, detail: joinerDetail },
  ];
}

function SourceList({ values }: { values: Array<{ label: string; value: number; detail?: string }> }) {
  const filtered = values.filter((v) => Math.abs(v.value) > 0.0001);
  if (filtered.length === 0) return <span className="text-gray-600">&mdash;</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {filtered.map((v) => (
        <div key={v.label} className="flex flex-col gap-0.5">
          <div className="flex justify-between">
            <span className="text-gray-500">{v.label}</span>
            <span className="text-gray-400">{formatSignedPercent(v.value)}</span>
          </div>
          {v.detail && <div className="text-[10px] text-gray-600">{v.detail}</div>}
        </div>
      ))}
    </div>
  );
}

interface SpecialBonusTableProps {
  player: SpecialBonusSummary | null;
  opponent: SpecialBonusSummary | null;
}

export function SpecialBonusTable({ player, opponent }: SpecialBonusTableProps) {

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="text-sm font-semibold text-white mb-2">Special Bonuses</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 dark:text-gray-400 text-xs uppercase tracking-wide">
              <th className="py-2">Bonus</th>
              <th className="py-2 text-center">Player</th>
              <th className="py-2 text-center">Opponent</th>
            </tr>
          </thead>
          <tbody>
            {BONUS_ROWS.map((row, index) => {
              const prevGroup = index > 0 ? BONUS_ROWS[index - 1].group : null;
              const showGroupHeader = row.group !== prevGroup;
              const playerValueDisplay = player ? row.get(player) : 0;
              const opponentValueDisplay = opponent ? row.get(opponent) : 0;
              const pSources = buildSources(player, row.label);
              const oSources = buildSources(opponent, row.label);
              const hasSources = pSources.some(v => Math.abs(v.value) > 0.0001) || oSources.some(v => Math.abs(v.value) > 0.0001);

              return (
                <Fragment key={`${row.label}-${index}`}>
                  {showGroupHeader && (
                    <tr className="bg-slate-900/60 border-t border-slate-800/80">
                      <td colSpan={3} className="py-2 px-2 text-[10px] uppercase tracking-wide text-gray-500">
                        {row.group} Bonuses
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-800/60">
                    <td className="py-2 px-2">{row.label}</td>
                    <td className="py-2 text-center font-semibold text-rose-200">
                      {formatSignedPercent(playerValueDisplay)}
                    </td>
                    <td className="py-2 text-center font-semibold text-sky-200">
                      {formatSignedPercent(opponentValueDisplay)}
                    </td>
                  </tr>
                  {hasSources && (
                    <tr className="text-[11px] text-gray-500 align-top">
                      <td className="py-1 px-4 text-gray-500">Sources</td>
                      <td className="py-1 px-2 align-top"><SourceList values={pSources} /></td>
                      <td className="py-1 px-2 align-top"><SourceList values={oSources} /></td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
