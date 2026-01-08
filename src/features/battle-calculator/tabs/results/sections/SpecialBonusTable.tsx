import { Fragment } from 'react';
import { formatSignedPercent } from '../utils/format';
import type { SpecialBonusSummary } from '@/features/battle-calculator/model/types';

interface SpecialBonusTableProps {
  player: SpecialBonusSummary | null;
  opponent: SpecialBonusSummary | null;
}

export function SpecialBonusTable({ player, opponent }: SpecialBonusTableProps) {
  const rows: Array<{
    label: string;
    get: (s: SpecialBonusSummary) => number;
    group: 'Troops' | 'Enemy' | 'Defender' | 'Rally';
  }> = [
    { label: 'Troops Attack Bonus', get: (s: SpecialBonusSummary) => s.troopsAttack, group: 'Troops' },
    { label: 'Troops Defense Bonus', get: (s: SpecialBonusSummary) => s.troopsDefense, group: 'Troops' },
    { label: 'Troops Lethality Bonus', get: (s: SpecialBonusSummary) => s.troopsLethality, group: 'Troops' },
    { label: 'Troops Health Bonus', get: (s: SpecialBonusSummary) => s.troopsHealth, group: 'Troops' },
    // NOTE: these are applied to ENEMY, so display negative
    { label: 'Enemy Troops Attack Down', get: (s: SpecialBonusSummary) => -s.enemyAttackReduction, group: 'Enemy' },
    { label: 'Enemy Troops Defense Down', get: (s: SpecialBonusSummary) => -s.enemyDefenseReduction, group: 'Enemy' },
  ];

  let lastGroup: string | null = null;

  const formatSourceList = (values: Array<{ label: string; value: number; detail?: string }>) => {
    const filtered = values.filter((v) => Math.abs(v.value) > 0.0001);
    if (filtered.length === 0) return null;
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
  };

  const formatCombatDebuffDetail = (entry?: { combat?: number; pet?: number; manual?: number }) => {
    if (!entry) return undefined;
    const parts: string[] = [];
    // Only show pet and manual - no "stored" value since we calculate from pet + manual
    if (entry.pet !== undefined && Math.abs(entry.pet) > 0.0001) {
      parts.push(`pet: ${formatSignedPercent(entry.pet)}`);
    }
    if (entry.manual !== undefined && Math.abs(entry.manual) > 0.0001) {
      parts.push(`manual: ${formatSignedPercent(entry.manual)}`);
    }
    return parts.length ? parts.join(' | ') : undefined;
  };

  const statKeyForLabel = (label: string): 'attack' | 'defense' | 'lethality' | 'health' | null => {
    if (label.includes('Attack')) return 'attack';
    if (label.includes('Defense')) return 'defense';
    if (label.includes('Lethality')) return 'lethality';
    if (label.includes('Health')) return 'health';
    return null;
  };

  const buildSources = (
    summary: SpecialBonusSummary | null,
    label: string
  ): Array<{ label: string; value: number; detail?: string }> => {
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
  };

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
            {rows.map((row, index) => {
              const showGroupHeader = row.group !== lastGroup;
              lastGroup = row.group;
              const playerValueDisplay = player ? row.get(player) : 0;
              const opponentValueDisplay = opponent ? row.get(opponent) : 0;
              const playerSources = formatSourceList(buildSources(player, row.label));
              const opponentSources = formatSourceList(buildSources(opponent, row.label));

              const hasSources = Boolean(playerSources || opponentSources);
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
                      <td className="py-1 px-2 align-top">{playerSources || <span className="text-gray-600">—</span>}</td>
                      <td className="py-1 px-2 align-top">{opponentSources || <span className="text-gray-600">—</span>}</td>
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
