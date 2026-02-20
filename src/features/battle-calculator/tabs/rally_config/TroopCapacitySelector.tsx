'use client';

import { getTroopDefinitionOptions } from '@/domain/battle/data-selectors';
import type { FireCrystalLevel, TroopConfiguration, TroopTier, TroopType } from '@/shared/types';

export interface TroopCapacitySelectorProps {
  type: TroopType;
  configurations: TroopConfiguration[];
  onConfigurationsChange: (configs: TroopConfiguration[]) => void;
}

export function TroopCapacitySelector({ type, configurations, onConfigurationsChange }: TroopCapacitySelectorProps) {
  const addConfiguration = () => {
    onConfigurationsChange([
      ...configurations,
      {
        type,
        tier: 'normal',
        fireCrystalLevel: 10,
        count: 0,
      },
    ]);
  };

  const updateConfiguration = (index: number, config: TroopConfiguration | null) => {
    const newConfigs = [...configurations];
    if (config) {
      newConfigs[index] = config;
    } else {
      newConfigs.splice(index, 1);
    }
    onConfigurationsChange(newConfigs);
  };

  const getTotalPower = () => {
    return configurations.reduce((total, config) => {
      const troopDef = getTroopDefinitionOptions(config.type, config.tier, config.fireCrystalLevel);
      if (troopDef) {
        return total + troopDef.Power * config.count;
      }
      return total;
    }, 0);
  };

  const getTotalCount = () => {
    return configurations.reduce((total, config) => total + config.count, 0);
  };

  return (
    <div className="card info-card mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Troops</h4>
        <button className="button" onClick={addConfiguration}>
          + Add Group
        </button>
      </div>

      {configurations.map((config, index) => (
        <TroopConfigEditor
          key={index}
          config={config}
          onConfigChange={(newConfig) => updateConfiguration(index, newConfig)}
          onRemove={() => updateConfiguration(index, null)}
        />
      ))}

      {configurations.length > 0 && (
        <div className="callout callout-muted text-sm mt-4 flex flex-wrap gap-2">
          <span><strong>Total {type}:</strong> {getTotalCount().toLocaleString()} troops</span>
          <span>|</span>
          <span><strong>Total Power:</strong> {getTotalPower().toLocaleString()}</span>
        </div>
      )}

      {configurations.length === 0 && (
        <div className="text-center py-4 text-gray-400 dark:text-gray-400">
          No {type} troops configured. Click &quot;+ Add Group&quot; to add.
        </div>
      )}
    </div>
  );
}

interface TroopConfigEditorProps {
  config: TroopConfiguration;
  onConfigChange: (config: TroopConfiguration) => void;
  onRemove: () => void;
}

function TroopConfigEditor({ config, onConfigChange, onRemove }: TroopConfigEditorProps) {
  const troopDef = getTroopDefinitionOptions(config.type, config.tier, config.fireCrystalLevel);
  const totalPower = troopDef ? troopDef.Power * config.count : 0;

  return (
    <div className="card info-card bg-white/95 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 mb-3">
      <div className="flex justify-between items-center mb-3">
        <strong>
          {config.tier === 'helios' ? 'Helios ' : ''}{config.type} FC{config.fireCrystalLevel}
        </strong>
        <button className="button bg-red-600 hover:bg-red-700 px-3 py-1 text-sm" onClick={onRemove}>
          Remove
        </button>
      </div>

      <div className="grid">
        <div className="form-group">
          <label>Tier</label>
          <select
            title="Tier"
            value={config.tier}
            onChange={(e) => onConfigChange({ ...config, tier: e.target.value as TroopTier })}
          >
            <option value="normal">Normal</option>
            <option value="helios">Helios</option>
          </select>
        </div>
        <div className="form-group">
          <label>Fire Crystal Level</label>
          <select
            title="Fire Crystal Level"
            value={config.fireCrystalLevel}
            onChange={(e) => onConfigChange({ ...config, fireCrystalLevel: parseInt(e.target.value) as FireCrystalLevel })}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>FC{level}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Troop Count</label>
          <input
            title="Troop Count"
            type="number"
            min="0"
            value={config.count}
            onChange={(e) => onConfigChange({ ...config, count: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {troopDef && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 space-y-1">
          <div>
            Base Stats: ATK {troopDef.Attack} | DEF {troopDef.Defense} | LETH {troopDef.Lethality} | HP {troopDef.Health}
          </div>
          <div>
            <strong>Group Power:</strong> {totalPower.toLocaleString()} ({troopDef.Power} × {config.count.toLocaleString()})
          </div>
        </div>
      )}
    </div>
  );
}
