import ChiefGearCard from './ChiefGearCard';
import type { ChiefGearSelections } from './chief-gear.utils';

export default function ChiefGearSection({
  gearTypes,
  selections,
  onGearChange,
}: {
  gearTypes: string[];
  selections: ChiefGearSelections;
  onGearChange: (gearType: string, value: string) => void;
}) {
  return (
    <div>
      <h3>Chief Gear (6 Pieces)</h3>
      <p className="section-description">Select tier, stars, and step for each piece of gear. Affects ATK/DEF only.</p>
      <div className="grid">
        {gearTypes.map((gearType) => (
          <ChiefGearCard
            key={gearType}
            gearType={gearType}
            currentSelection={selections[gearType]}
            onGearChange={onGearChange}
          />
        ))}
      </div>
    </div>
  );
}
