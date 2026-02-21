import type { ExpertSelections } from '@/domain/battle';

export default function ExpertsSection({
  expertSelections,
  onChangeStat,
  onChangeCapacity
}: {
  expertSelections: ExpertSelections;
  onChangeStat: (stat: 'attack' | 'defense' | 'lethality' | 'health', next: number) => void;
  onChangeCapacity: (field: 'deploymentCapacity' | 'rallyCapacity', next: number) => void;
}) {
  return (
    <div>
      <h3>Expert Stat Bonuses</h3>
      <p className="section-description">Enter the total percentage bonuses from all experts combined. All bonuses are additive.</p>

      <div className="card info-card mb-4">
        <h4>Stat Bonuses (%)</h4>
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
                step="0.01"
                value={(expertSelections as unknown as Record<string, number>)[key] ?? 0}
                onChange={(e) => onChangeStat(key, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card info-card mb-4">
        <h4>Capacity Bonuses (Units)</h4>
        <div className="grid">
          <div className="form-group">
            <label aria-label="Troops Deployment Capacity">Troops Deployment Capacity</label>
            <input
              type="number"
              aria-label="Troops Deployment Capacity"
              value={expertSelections.deploymentCapacity || 0}
              onChange={(e) => onChangeCapacity('deploymentCapacity', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="form-group">
            <label aria-label="Rally Capacity">Rally Capacity</label>
            <input
              type="number"
              aria-label="Rally Capacity"
              value={expertSelections.rallyCapacity || 0}
              onChange={(e) => onChangeCapacity('rallyCapacity', parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
