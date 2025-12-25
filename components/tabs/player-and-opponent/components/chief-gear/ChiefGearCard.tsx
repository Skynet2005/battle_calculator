import { getChiefGearOptions } from '@/lib/battle/data-selectors';
import type { ChiefGearSelections, ChiefGearSelection } from './chief-gear.utils';
import { toGearSelectValue } from './chief-gear.utils';

type ChiefGearOption = ReturnType<typeof getChiefGearOptions>[number];

export default function ChiefGearCard({
  gearType,
  currentSelection,
  onGearChange,
}: {
  gearType: string;
  currentSelection: ChiefGearSelection;
  onGearChange: (gearType: string, value: string) => void;
}) {
  const options = getChiefGearOptions(gearType);

  return (
    <div className="card info-card">
      <h4>{gearType}</h4>
      <div className="form-group">
        <label>Selection</label>
        <select value={toGearSelectValue(currentSelection)} onChange={(e) => onGearChange(gearType, e.target.value)}>
          <option value="">Select {gearType}...</option>
          {renderGearOptions(options)}
        </select>
      </div>

      {currentSelection && <GearStats options={options} currentSelection={currentSelection} />}
    </div>
  );
}

function renderGearOptions(options: ChiefGearOption[]) {
  const groupedByTier: Record<string, ChiefGearOption[]> = {};
  for (const opt of options) {
    if (!groupedByTier[opt.tier]) groupedByTier[opt.tier] = [];
    groupedByTier[opt.tier].push(opt);
  }

  return Object.entries(groupedByTier).map(([tier, tierOptions]) => {
    const isRedTierWithSteps =
      tier.includes('Red (Legendary)') && tierOptions.some((opt) => opt.step !== undefined);

    return isRedTierWithSteps ? renderRedTierWithSteps(tier, tierOptions) : renderRegularTier(tier, tierOptions);
  });
}

function renderRedTierWithSteps(tier: string, tierOptions: ChiefGearOption[]) {
  const groupedByStars: Record<number, ChiefGearOption[]> = {};
  for (const opt of tierOptions) {
    const stars = opt.stars ?? 0;
    if (!groupedByStars[stars]) groupedByStars[stars] = [];
    groupedByStars[stars].push(opt);
  }

  return Object.entries(groupedByStars)
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .map(([stars, starOptions]) => {
      const starsNum = parseInt(stars, 10);
      const starLabel = `${tier} - ${stars} Star${starsNum !== 1 ? 's' : ''}`;

      return (
        <optgroup key={`${tier}-${stars}`} label={starLabel}>
          {starOptions
            .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
            .map((opt, idx) => (
              <option key={`${tier}-${stars}-${idx}`} value={`${opt.tier}-${opt.stars}-${opt.step || 0}`}>
                {opt.label}
              </option>
            ))}
        </optgroup>
      );
    });
}

function renderRegularTier(tier: string, tierOptions: ChiefGearOption[]) {
  return (
    <optgroup key={tier} label={tier}>
      {tierOptions.map((opt, idx) => (
        <option key={`${tier}-${idx}`} value={`${opt.tier}-${opt.stars}-${opt.step || 0}`}>
          {opt.label}
        </option>
      ))}
    </optgroup>
  );
}

function GearStats({
  options,
  currentSelection,
}: {
  options: ChiefGearOption[];
  currentSelection: { tier: string; stars: number; step?: number };
}) {
  const selectedOption = options.find((o) => {
    if (o.tier !== currentSelection.tier) return false;
    if (o.stars !== currentSelection.stars) return false;
    if (currentSelection.step === undefined) return o.step === undefined;
    return o.step === currentSelection.step;
  });

  if (!selectedOption) return null;

  return (
    <div className="mt-3 p-3 bg-slate-900/40 dark:bg-slate-900/40 rounded-lg border border-slate-700/60 text-sm text-gray-300 space-y-1">
      <div className="flex justify-between text-xs uppercase tracking-wide text-gray-400">
        <span>Stats</span>
        <span>Power</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>
          ATK: {selectedOption.attack} | DEF: {selectedOption.defense}
        </span>
        <span>{selectedOption.power ? selectedOption.power.toLocaleString() : 'N/A'}</span>
      </div>
      {selectedOption.marchCapacity && selectedOption.marchCapacity > 0 && (
        <div className="text-xs text-blue-300">March Capacity: +{selectedOption.marchCapacity.toLocaleString()}</div>
      )}
    </div>
  );
}
