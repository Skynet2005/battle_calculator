import { getCommandCenterCapacityBonuses } from '@/lib/battle/data/capacity/command-center-capacity';

export default function CommandCenterSection({
  currentCommandCenterLevel,
  commandCenterLevels,
  onCommandCenterLevelChange,
}: {
  currentCommandCenterLevel: string;
  commandCenterLevels: Array<{ level: string }>;
  onCommandCenterLevelChange?: (level: string) => void;
}) {
  const commandCenterCapacity = getCommandCenterCapacityBonuses(currentCommandCenterLevel);

  return (
    <div>
      <h3>Command Center Building</h3>
      <p className="section-description">
        Select the Command Center building level. Affects Rally Capacity and Troops Deployment Capacity.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card info-card">
          <h4>Building Level</h4>
          <div className="form-group">
            <label>Level</label>
            <select
              value={currentCommandCenterLevel}
              onChange={(e) => onCommandCenterLevelChange?.(e.target.value)}
            >
              <option value="">Select Level...</option>
              {commandCenterLevels.map((level) => (
                <option key={level.level} value={level.level}>
                  Level {level.level}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card info-card">
          <h4>Capacity Bonuses</h4>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2 block">Total Rally Capacity</label>
              <div className="p-3 rounded-lg bg-slate-900/40 dark:bg-slate-900/40 border border-slate-700/60 text-xl font-bold text-gray-100">
                +{commandCenterCapacity.rallyCapacity.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2 block">Troops Deployment Capacity</label>
              <div className="p-3 rounded-lg bg-slate-900/40 dark:bg-slate-900/40 border border-slate-700/60 text-xl font-bold text-gray-100">
                +{commandCenterCapacity.deploymentCapacity.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
