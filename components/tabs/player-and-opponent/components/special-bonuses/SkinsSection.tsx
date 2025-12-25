import type { FlatStats, StatKey } from './DataSelectors.utils';

export default function SkinsSection({
  stackedSkins,
  onChange
}: {
  stackedSkins: FlatStats;
  onChange: (stat: StatKey, next: number) => void;
}) {
  return (
    <div>
      <h3>Stacked Skins</h3>
      <p className="section-description">
        Enter stacked skin bonuses from the Bonus Details window (Skin Bonus tab). These bonuses come from City, Marching,
        Avatar, Relocation, Chat, and other skins. Values should be entered as percentages (e.g., 35.0 for +35.0%).
        Skin bonuses can be stacked up to the bonus maximum.
      </p>

      <div className="card info-card">
        <h4>Troops Bonuses</h4>
        <div className="grid">
          {(
            [
              { key: 'attack', label: 'Troops Attack (%)' },
              { key: 'defense', label: 'Troops Defense (%)' },
              { key: 'lethality', label: 'Troops Lethality (%)' },
              { key: 'health', label: 'Troops Health (%)' }
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <input
                type="number"
                step="0.1"
                value={stackedSkins[key]}
                onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
              />
              <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">Max: 150.0%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
