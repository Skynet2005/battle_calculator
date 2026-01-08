import type { StatKey } from './DataSelectors.utils';

type DaybreakState = {
  infantry: { attack: number; defense: number };
  lancer: { attack: number; defense: number };
  marksman: { attack: number; defense: number };
  troops: { attack: number; defense: number; lethality: number; health: number };
  deploymentCapacity: number;
  rallyCapacity: number;
};

export default function DaybreakIslandSection({
  daybreakIsland,
  onChangeStat,
  onChangeCapacity
}: {
  daybreakIsland: DaybreakState;
  onChangeStat: (
    section: 'infantry' | 'lancer' | 'marksman' | 'troops',
    stat: 'attack' | 'defense' | 'lethality' | 'health',
    next: number
  ) => void;
  onChangeCapacity: (field: 'deploymentCapacity' | 'rallyCapacity', next: number) => void;
}) {
  return (
    <div>
      <h3>Daybreak Island</h3>
      <p className="section-description">
        Enter Daybreak Island decoration bonuses from the Daybreak Island Bonus window. Values should be entered as
        percentages (e.g., 12.5 for +12.5%).
      </p>

      {/* Infantry */}
      <div className="card info-card mb-4">
        <h4>Infantry</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Infantry Attack (%)">Infantry Attack (%)</label>
            <input
              type="number"
              aria-label="Infantry Attack (%)"
              step="0.1"
              value={daybreakIsland.infantry.attack}
              onChange={(e) => onChangeStat('infantry', 'attack', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label aria-label="Infantry Defense (%)">Infantry Defense (%)</label>
            <input
              type="number"
              aria-label="Infantry Defense (%)"
              step="0.1"
              value={daybreakIsland.infantry.defense}
              onChange={(e) => onChangeStat('infantry', 'defense', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Lancer */}
      <div className="card info-card mb-4">
        <h4>Lancer</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Lancer Attack (%)">Lancer Attack (%)</label>
            <input
              type="number"
              aria-label="Lancer Attack (%)"
              step="0.1"
              value={daybreakIsland.lancer.attack}
              onChange={(e) => onChangeStat('lancer', 'attack', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label aria-label="Lancer Defense (%)">Lancer Defense (%)</label>
            <input
              type="number"
              aria-label="Lancer Defense (%)"
              step="0.1"
              value={daybreakIsland.lancer.defense}
              onChange={(e) => onChangeStat('lancer', 'defense', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Marksman */}
      <div className="card info-card mb-4">
        <h4>Marksman</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Marksman Attack (%)">Marksman Attack (%)</label>
            <input
              type="number"
              aria-label="Marksman Attack (%)"
              step="0.1"
              value={daybreakIsland.marksman.attack}
              onChange={(e) => onChangeStat('marksman', 'attack', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label aria-label="Marksman Defense (%)">Marksman Defense (%)</label>
            <input
              type="number"
              aria-label="Marksman Defense (%)"
              step="0.1"
              value={daybreakIsland.marksman.defense}
              onChange={(e) => onChangeStat('marksman', 'defense', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Troops */}
      <div className="card info-card mb-4">
        <h4>Troops (All Types)</h4>
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
              <label aria-label={label}>{label}</label>
              <input
                type="number"
                aria-label={label}
                step="0.1"
                value={(daybreakIsland.troops as any)[key]}
                onChange={(e) => onChangeStat('troops', key as StatKey, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Capacities */}
      <div className="card info-card mb-4">
        <h4>Capacity Bonuses</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Troops Deployment Capacity (Units)">Troops Deployment Capacity (Units)</label>
            <input
              type="number"
              aria-label="Troops Deployment Capacity (Units)"
              step="0.1"
              value={daybreakIsland.deploymentCapacity || 0}
              onChange={(e) => onChangeCapacity('deploymentCapacity', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label aria-label="Rally Capacity (Units)">Rally Capacity (Units)</label>
            <input
              type="number"
              aria-label="Rally Capacity (Units)"
              step="0.1"
              value={daybreakIsland.rallyCapacity || 0}
              onChange={(e) => onChangeCapacity('rallyCapacity', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
