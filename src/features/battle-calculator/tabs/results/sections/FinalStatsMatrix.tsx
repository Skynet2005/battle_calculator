import type { SideBaseStats } from '@/domain/rally/combat-types';
import { formatStatValue } from '../utils/format';
import { TROOP_TYPES } from '@/features/battle-calculator/model/types';

interface FinalStatsMatrixProps {
  playerStats: SideBaseStats | null;
  opponentStats: SideBaseStats | null;
}

export function FinalStatsMatrix({ playerStats, opponentStats }: FinalStatsMatrixProps) {
  if (!playerStats && !opponentStats) {
    return null;
  }

  return (
    <div className="px-4 pb-4">
      <div className="text-sm font-semibold text-slate-200 mb-2">Final Troop Stats</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-200">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wide">
              <th className="py-2 text-left">Troop</th>
              <th className="py-2 text-center" colSpan={4}>Player</th>
              <th className="py-2 text-center" colSpan={4}>Opponent</th>
            </tr>
            <tr className="text-[10px] uppercase text-slate-500">
              <th />
              {['Atk', 'Def', 'Leth', 'HP'].map((label) => (
                <th key={`player-${label}`} className="py-1 text-center">{label}</th>
              ))}
              {['Atk', 'Def', 'Leth', 'HP'].map((label) => (
                <th key={`opponent-${label}`} className="py-1 text-center">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TROOP_TYPES.map((type) => (
              <tr key={type} className="border-t border-white/10">
                <td className="py-2 font-semibold capitalize">{type}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.attack)}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.defense)}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.lethality)}</td>
                <td className="py-2 text-center">{formatStatValue(playerStats?.[type]?.health)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.attack)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.defense)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.lethality)}</td>
                <td className="py-2 text-center">{formatStatValue(opponentStats?.[type]?.health)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
