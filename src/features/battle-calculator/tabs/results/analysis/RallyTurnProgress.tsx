/**
 * Rally Turn Progress Component
 *
 * Turn-by-turn progress visualization showing troop counts by type.
 * Displays defender and rally troops remaining for each turn.
 * Engine explanation: Single-pass O(n) algorithm that tracks previous turn totals
 * to calculate casualties per turn efficiently.
 */

import type { TurnLog } from '@/domain/battle/engine/types';

interface RallyTurnProgressProps {
  turns: TurnLog[];
  playerIsAttacker: boolean;
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-300">{label}:</span>
      <span className="text-slate-200">{value.toLocaleString()}</span>
    </div>
  );
}

export function RallyTurnProgress({ turns, playerIsAttacker }: RallyTurnProgressProps) {
  if (!turns.length) return null;

  let prevRallyTotal = 0;
  let prevDefTotal = 0;

  return (
    <div className="mt-6 space-y-4">
      <div className="text-sm font-semibold text-slate-200">Turn-by-Turn Progress</div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {turns.map((turn, idx) => {
          const rallyTroops = playerIsAttacker ? turn.attackerTroops : turn.defenderTroops;
          const defenderTroops = playerIsAttacker ? turn.defenderTroops : turn.attackerTroops;

          const rallyTotal =
            (rallyTroops?.Infantry ?? 0) + (rallyTroops?.Lancer ?? 0) + (rallyTroops?.Marksman ?? 0);
          const defTotal =
            (defenderTroops?.Infantry ?? 0) + (defenderTroops?.Lancer ?? 0) + (defenderTroops?.Marksman ?? 0);

          const rallyCasualties = idx === 0 ? 0 : Math.max(0, prevRallyTotal - rallyTotal);
          const defCasualties = idx === 0 ? 0 : Math.max(0, prevDefTotal - defTotal);

          prevRallyTotal = rallyTotal;
          prevDefTotal = defTotal;

          return (
            <div key={turn.turn} className="border border-slate-700/50 rounded-lg p-3 bg-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Turn {turn.turn}</span>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Rally: {rallyTotal.toLocaleString()}</span>
                  <span>Defender: {defTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">Rally Troops</div>
                  <div className="text-xs space-y-1">
                    <Row label="Infantry" value={rallyTroops?.Infantry ?? 0} />
                    <Row label="Lancer" value={rallyTroops?.Lancer ?? 0} />
                    <Row label="Marksman" value={rallyTroops?.Marksman ?? 0} />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 mb-1">Defender Troops</div>
                  <div className="text-xs space-y-1">
                    <Row label="Infantry" value={defenderTroops?.Infantry ?? 0} />
                    <Row label="Lancer" value={defenderTroops?.Lancer ?? 0} />
                    <Row label="Marksman" value={defenderTroops?.Marksman ?? 0} />
                  </div>
                </div>
              </div>

              {(rallyCasualties > 0 || defCasualties > 0) && (
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-700/30">
                  Casualties this turn: Rally lost {rallyCasualties.toLocaleString()}, Defender lost {defCasualties.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
