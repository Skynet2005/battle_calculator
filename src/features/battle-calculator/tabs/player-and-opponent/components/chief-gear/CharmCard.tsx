import { computeCharmTotals, getTroopTypeForPiece } from './chief-gear.utils';
import type { CharmLevelsByPiece } from './chief-gear.utils';

export default function CharmCard({
  gearPiece,
  charmLevels,
  charmData,
  onCharmChange,
}: {
  gearPiece: string;
  charmLevels: CharmLevelsByPiece;
  charmData: Array<{ level: number; lethality: number; health: number }>;
  onCharmChange: (gearPiece: string, charmIndex: number, value: string) => void;
}) {
  const troopType = getTroopTypeForPiece(gearPiece);
  const totals = computeCharmTotals(charmLevels[gearPiece], charmData);

  return (
    <div className="card info-card">
      <h4>
        {gearPiece} ({troopType})
      </h4>
      <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">Affects {troopType} Lethality & Health</p>

      {[0, 1, 2].map((charmIndex) => (
        <div key={charmIndex} className="form-group mb-3 last:mb-0">
          <label>Charm {charmIndex + 1}</label>
          <select
            value={charmLevels[gearPiece]?.[charmIndex] || 0}
            onChange={(e) => onCharmChange(gearPiece, charmIndex, e.target.value)}
          >
            <option value="0">Level 0</option>
            {charmData.map((charm) => (
              <option key={charm.level} value={charm.level}>
                Level {charm.level} (LETH: {charm.lethality.toFixed(2)}%, HP: {charm.health.toFixed(2)}%)
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="mt-4 p-3 rounded-lg bg-slate-900/40 dark:bg-slate-900/40 border border-slate-700/60 text-sm">
        <strong>Total for {gearPiece}:</strong> LETH: +{totals.lethality.toFixed(2)}%, HP: +{totals.health.toFixed(2)}%
      </div>
    </div>
  );
}
