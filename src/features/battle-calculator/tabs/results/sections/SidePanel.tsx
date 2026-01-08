import type { FighterSnapshot } from '@/domain/rally/combat-fighter';
import { formatBigNumber } from '../utils/format';
import type { SideBattleStats } from '@/features/battle-calculator/utils/rally-outcome';
import { StatBlock } from './StatBlock';

interface SidePanelProps {
  title: string;
  stats: SideBattleStats;
  fighter: FighterSnapshot;
  align: 'left' | 'right';
}

export function SidePanel({ title, stats, fighter, align }: SidePanelProps) {
  const accent = align === 'left' ? 'text-rose-300' : 'text-sky-300';
  const roleBadge =
    align === 'left'
      ? 'bg-rose-500/15 text-rose-200 border border-rose-400/30'
      : 'bg-sky-500/15 text-sky-200 border border-sky-400/30';
  const lossPct = stats.initial > 0 ? (stats.losses / stats.initial) * 100 : 0;
  const survPct = stats.initial > 0 ? (stats.survivors / stats.initial) * 100 : 0;

  return (
    <div className={`flex flex-col gap-3 ${align === 'right' ? 'items-end text-right' : ''}`}>
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-400">{title}</div>
        <span className={`rounded-full px-2 py-[2px] text-[11px] font-semibold ${roleBadge}`}>
          {fighter.role === 'attacker' ? 'Attacker' : 'Defender'}
        </span>
      </div>

      <div className={`text-3xl font-bold ${accent}`}>
        {formatBigNumber(stats.survivors > 0 ? stats.survivors : stats.initial)}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-400">
        {fighter.name}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-slate-200 dark:text-gray-200 w-full">
        <StatBlock label="Troops" value={stats.initial} align={align} />
        <StatBlock label="Losses" value={stats.losses} align={align} />
        <StatBlock label="Survivors" value={stats.survivors} align={align} />
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="text-gray-500">Losses</span>
          <span className="font-semibold text-rose-200">{lossPct.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-500">Survivors</span>
          <span className="font-semibold text-emerald-200">{survPct.toFixed(1)}%</span>
        </span>
      </div>

      <div className="text-[11px] text-gray-500 dark:text-gray-400">
        Damage dealt {(fighter.summary?.damageDealtMultiplier ?? 1).toFixed(2)}× · Damage taken {(fighter.summary?.damageTakenMultiplier ?? 1).toFixed(2)}×
      </div>

      <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className={`${align === 'left' ? 'bg-rose-400/70' : 'bg-sky-400/70'} h-full transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, survPct))}%` }}
        />
      </div>
    </div>
  );
}
