import { useMemo } from 'react';
import { getCharmData } from './chief-gear.utils';
import CharmCard from './CharmCard';
import type { CharmLevelsByPiece } from './chief-gear.utils';

const GEAR_PIECES = ['Cap', 'Watch', 'Coat', 'Pants', 'Ring', 'Weapon'] as const;

interface CharmsSectionProps {
  charmLevels: CharmLevelsByPiece;
  onCharmChange: (gearPiece: string, charmIndex: number, value: string) => void;
}

export default function CharmsSection({
  charmLevels,
  onCharmChange,
}: CharmsSectionProps) {
  const charmData = useMemo(() => getCharmData(), []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Chief Charms (3 per Gear Piece)</h3>
        <p className="section-description">
          Configure charm levels for each gear piece. Each piece supports 3 charms that affect Lethality and Health bonuses for specific troop types.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-blue-900/20 border border-blue-700/30">
          <p className="text-sm font-medium mb-1">Troop Type Mapping:</p>
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">Lancer:</span> Cap & Watch</div>
            <div><span className="font-semibold">Infantry:</span> Coat & Pants</div>
            <div><span className="font-semibold">Marksman:</span> Ring & Weapon</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GEAR_PIECES.map((gearPiece) => (
          <CharmCard
            key={gearPiece}
            gearPiece={gearPiece}
            charmLevels={charmLevels}
            charmData={charmData}
            onCharmChange={onCharmChange}
          />
        ))}
      </div>
    </div>
  );
}
