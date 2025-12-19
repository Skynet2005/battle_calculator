'use client';

import { useMemo, useState } from 'react';
import type { ExpertSelections } from '../../lib/battle';
import { getExpertBonuses } from '../../lib/battle';
import type { AdditiveBonuses, BasicBonuses, MultiplicativeBonuses } from '../../lib/battle/calculations';
import { extractJoinerBonuses, extractLeaderBonuses } from '../../lib/rally/rally-bonus-extractor';
import type { RallyConfiguration } from '../types';

interface DataSelectorsProps {
  basicBonuses: BasicBonuses;
  onBasicBonusesChange: (bonuses: BasicBonuses) => void;
  expertSelections: ExpertSelections;
  onExpertSelectionsChange: (selections: ExpertSelections) => void;
  additiveBonuses?: AdditiveBonuses;
  onAdditiveBonusesChange?: (bonuses: AdditiveBonuses) => void;
  multiplicativeBonuses?: MultiplicativeBonuses;
  onMultiplicativeBonusesChange?: (bonuses: MultiplicativeBonuses) => void;
  rally?: RallyConfiguration; // Rally configuration to show contributing heroes
  isOpponent?: boolean; // If true, use max defaults for dropdowns and blank for inputs
}

export default function DataSelectors({
  basicBonuses,
  onBasicBonusesChange,
  expertSelections: initialExpertSelections,
  onExpertSelectionsChange,
  additiveBonuses,
  onAdditiveBonusesChange,
  multiplicativeBonuses,
  onMultiplicativeBonusesChange,
  rally,
  isOpponent = false,
}: DataSelectorsProps) {
  const [activeSection, setActiveSection] = useState<'experts' | 'skins' | 'daybreakIsland' | 'specialBonuses'>('experts');


  // Derive expert selections from props - use useMemo to stabilize like Chief Charms
  // Ensure we always have valid structure with defaults, merging with prop if it exists
  const expertSelections = useMemo(() => {
    const defaultExpertSelections: ExpertSelections = {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      deploymentCapacity: 0,
      rallyCapacity: 0,
    };

    if (!initialExpertSelections) {
      return defaultExpertSelections;
    }

    // Merge with defaults to ensure all properties exist
    return {
      attack: initialExpertSelections.attack ?? 0,
      defense: initialExpertSelections.defense ?? 0,
      lethality: initialExpertSelections.lethality ?? 0,
      health: initialExpertSelections.health ?? 0,
      deploymentCapacity: initialExpertSelections.deploymentCapacity ?? 0,
      rallyCapacity: initialExpertSelections.rallyCapacity ?? 0,
    };
  }, [initialExpertSelections]);

  // Derive stacked skins from basicBonuses - always in sync like Pet Skills
  const stackedSkins = useMemo(() => {
    return basicBonuses.stackedSkins || {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
    };
  }, [basicBonuses.stackedSkins]);

  // Derive daybreak island from basicBonuses - always in sync like Pet Skills
  const daybreakIsland = useMemo(() => {
    const defaultDaybreak = {
      infantry: { attack: 0, defense: 0 },
      lancer: { attack: 0, defense: 0 },
      marksman: { attack: 0, defense: 0 },
      troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
      deploymentCapacity: 0,
      rallyCapacity: 0,
    };

    if (!basicBonuses.daybreakIsland) {
      return defaultDaybreak;
    }

    // Ensure all nested properties exist
    return {
      infantry: basicBonuses.daybreakIsland.infantry || defaultDaybreak.infantry,
      lancer: basicBonuses.daybreakIsland.lancer || defaultDaybreak.lancer,
      marksman: basicBonuses.daybreakIsland.marksman || defaultDaybreak.marksman,
      troops: basicBonuses.daybreakIsland.troops || defaultDaybreak.troops,
      deploymentCapacity: basicBonuses.daybreakIsland.deploymentCapacity ?? defaultDaybreak.deploymentCapacity,
      rallyCapacity: basicBonuses.daybreakIsland.rallyCapacity ?? defaultDaybreak.rallyCapacity,
    };
  }, [basicBonuses.daybreakIsland]);

  // Derive safe additive bonuses structure with defaults
  const safeAdditiveBonuses = useMemo(() => {
    const defaultAdditiveBonuses: AdditiveBonuses = {
      temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    };

    if (!additiveBonuses) {
      return defaultAdditiveBonuses;
    }

    // Ensure all nested properties exist
    return {
      temporaryEvents: additiveBonuses.temporaryEvents || defaultAdditiveBonuses.temporaryEvents,
      supremePresident: additiveBonuses.supremePresident || defaultAdditiveBonuses.supremePresident,
      specialBuffs: additiveBonuses.specialBuffs || defaultAdditiveBonuses.specialBuffs,
    };
  }, [additiveBonuses]);

  return (
    <div>
      <div className="tabs mb-6">
        <button
          className={`tab ${activeSection === 'experts' ? 'active' : ''}`}
          onClick={() => setActiveSection('experts')}
        >
          Experts
        </button>
        <button
          className={`tab ${activeSection === 'skins' ? 'active' : ''}`}
          onClick={() => setActiveSection('skins')}
        >
          Skins
        </button>
        <button
          className={`tab ${activeSection === 'daybreakIsland' ? 'active' : ''}`}
          onClick={() => setActiveSection('daybreakIsland')}
        >
          Daybreak Island
        </button>
        <button
          className={`tab ${activeSection === 'specialBonuses' ? 'active' : ''}`}
          onClick={() => setActiveSection('specialBonuses')}
        >
          Special Bonuses
        </button>
      </div>

      {/* Experts Section */}
      {activeSection === 'experts' && (
        <div>
          <h3>Expert Stat Bonuses</h3>
          <p className="section-description">
            Enter the total percentage bonuses from all experts combined. All bonuses are additive.
          </p>

          <div className="card info-card mb-4">
            <h4>Stat Bonuses (%)</h4>
            <div className="grid">
              <div className="form-group">
                <label>Troops Attack (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expertSelections.attack || 0}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    const updated: ExpertSelections = {
                      ...expertSelections,
                      attack: newValue,
                    };
                    // Update expert bonuses first, then notify parent
                    const expertBonuses = getExpertBonuses(updated);
                    if (onBasicBonusesChange) {
                      onBasicBonusesChange({
                        ...basicBonuses,
                        experts: expertBonuses,
                      });
                    }
                    // Then notify parent to save expert selections
                    if (onExpertSelectionsChange) {
                      onExpertSelectionsChange(updated);
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Troops Defense (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expertSelections.defense || 0}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    const updated: ExpertSelections = {
                      ...expertSelections,
                      defense: newValue,
                    };
                    // Update expert bonuses first, then notify parent
                    const expertBonuses = getExpertBonuses(updated);
                    if (onBasicBonusesChange) {
                      onBasicBonusesChange({
                        ...basicBonuses,
                        experts: expertBonuses,
                      });
                    }
                    // Then notify parent to save expert selections
                    if (onExpertSelectionsChange) {
                      onExpertSelectionsChange(updated);
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Troops Lethality (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expertSelections.lethality || 0}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    const updated: ExpertSelections = {
                      ...expertSelections,
                      lethality: newValue,
                    };
                    // Update expert bonuses first, then notify parent
                    const expertBonuses = getExpertBonuses(updated);
                    if (onBasicBonusesChange) {
                      onBasicBonusesChange({
                        ...basicBonuses,
                        experts: expertBonuses,
                      });
                    }
                    // Then notify parent to save expert selections
                    if (onExpertSelectionsChange) {
                      onExpertSelectionsChange(updated);
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Troops Health (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expertSelections.health || 0}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    const updated: ExpertSelections = {
                      ...expertSelections,
                      health: newValue,
                    };
                    // Update expert bonuses first, then notify parent
                    const expertBonuses = getExpertBonuses(updated);
                    if (onBasicBonusesChange) {
                      onBasicBonusesChange({
                        ...basicBonuses,
                        experts: expertBonuses,
                      });
                    }
                    // Then notify parent to save expert selections
                    if (onExpertSelectionsChange) {
                      onExpertSelectionsChange(updated);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card info-card mb-4">
            <h4>Capacity Bonuses (Units)</h4>
            <div className="grid">
              <div className="form-group">
                <label>Troops Deployment Capacity</label>
                <input
                  type="number"
                  value={expertSelections.deploymentCapacity || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    const updated: ExpertSelections = {
                      ...expertSelections,
                      deploymentCapacity: newValue,
                    };
                    // Notify parent to save expert selections
                    if (onExpertSelectionsChange) {
                      onExpertSelectionsChange(updated);
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Rally Capacity</label>
                <input
                  type="number"
                  value={expertSelections.rallyCapacity || 0}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    const updated: ExpertSelections = {
                      ...expertSelections,
                      rallyCapacity: newValue,
                    };
                    // Notify parent to save expert selections
                    if (onExpertSelectionsChange) {
                      onExpertSelectionsChange(updated);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skins Section */}
      {activeSection === 'skins' && (
        <div>
          <h3>Stacked Skins</h3>
          <p className="section-description">
            Enter stacked skin bonuses from the Bonus Details window (Skin Bonus tab). These bonuses come from City, Marching, Avatar, Relocation, Chat, and other skins. Values should be entered as percentages (e.g., 35.0 for +35.0%). Skin bonuses can be stacked up to the bonus maximum.
          </p>

          <div className="card info-card">
            <h4>Troops Bonuses</h4>
            <div className="grid">
              <div className="form-group">
                <label>Troops Attack (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stackedSkins.attack}
                  onChange={(e) => {
                    const updated = {
                      ...stackedSkins,
                      attack: parseFloat(e.target.value) || 0,
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      stackedSkins: updated,
                    });
                  }}
                />
                <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                  Max: 150.0%
                </div>
              </div>
              <div className="form-group">
                <label>Troops Defense (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stackedSkins.defense}
                  onChange={(e) => {
                    const updated = {
                      ...stackedSkins,
                      defense: parseFloat(e.target.value) || 0,
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      stackedSkins: updated,
                    });
                  }}
                />
                <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                  Max: 150.0%
                </div>
              </div>
              <div className="form-group">
                <label>Troops Lethality (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stackedSkins.lethality}
                  onChange={(e) => {
                    const updated = {
                      ...stackedSkins,
                      lethality: parseFloat(e.target.value) || 0,
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      stackedSkins: updated,
                    });
                  }}
                />
                <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                  Max: 150.0%
                </div>
              </div>
              <div className="form-group">
                <label>Troops Health (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={stackedSkins.health}
                  onChange={(e) => {
                    const updated = {
                      ...stackedSkins,
                      health: parseFloat(e.target.value) || 0,
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      stackedSkins: updated,
                    });
                  }}
                />
                <div className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                  Max: 150.0%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daybreak Island Section */}
      {activeSection === 'daybreakIsland' && (
        <div>
          <h3>Daybreak Island</h3>
          <p className="section-description">
            Enter Daybreak Island decoration bonuses from the Daybreak Island Bonus window. Values should be entered as percentages (e.g., 12.5 for +12.5%).
          </p>

          {/* Infantry */}
          <div className="card info-card mb-4">
            <h4>Infantry</h4>
            <div className="grid">
              <div className="form-group">
                <label>Infantry Attack (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.infantry.attack}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      infantry: {
                        ...daybreakIsland.infantry,
                        attack: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Infantry Defense (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.infantry.defense}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      infantry: {
                        ...daybreakIsland.infantry,
                        defense: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Lancer */}
          <div className="card info-card mb-4">
            <h4>Lancer</h4>
            <div className="grid">
              <div className="form-group">
                <label>Lancer Attack (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.lancer.attack}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      lancer: {
                        ...daybreakIsland.lancer,
                        attack: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Lancer Defense (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.lancer.defense}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      lancer: {
                        ...daybreakIsland.lancer,
                        defense: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Marksman */}
          <div className="card info-card mb-4">
            <h4>Marksman</h4>
            <div className="grid">
              <div className="form-group">
                <label>Marksman Attack (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.marksman.attack}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      marksman: {
                        ...daybreakIsland.marksman,
                        attack: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Marksman Defense (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.marksman.defense}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      marksman: {
                        ...daybreakIsland.marksman,
                        defense: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Troops (All Types) */}
          <div className="card info-card mb-4">
            <h4>Troops (All Types)</h4>
            <div className="grid">
              <div className="form-group">
                <label>Troops Attack (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.troops.attack}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      troops: {
                        ...daybreakIsland.troops,
                        attack: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Troops Defense (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.troops.defense}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      troops: {
                        ...daybreakIsland.troops,
                        defense: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Troops Lethality (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.troops.lethality}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      troops: {
                        ...daybreakIsland.troops,
                        lethality: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Troops Health (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.troops.health}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      troops: {
                        ...daybreakIsland.troops,
                        health: parseFloat(e.target.value) || 0,
                      },
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Capacity Bonuses */}
          <div className="card info-card mb-4">
            <h4>Capacity Bonuses</h4>
            <div className="grid">
              <div className="form-group">
                <label>Troops Deployment Capacity (Units)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.deploymentCapacity || 0}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      deploymentCapacity: parseFloat(e.target.value) || 0,
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Rally Capacity (Units)</label>
                <input
                  type="number"
                  step="0.1"
                  value={daybreakIsland.rallyCapacity || 0}
                  onChange={(e) => {
                    const updated = {
                      ...daybreakIsland,
                      rallyCapacity: parseFloat(e.target.value) || 0,
                    };
                    // Directly update basicBonuses - like Pet Skills
                    onBasicBonusesChange({
                      ...basicBonuses,
                      daybreakIsland: updated,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Bonuses Section */}
      {activeSection === 'specialBonuses' && (
        <div>
          <h3>Special Bonuses</h3>
          <p className="section-description">
            Configure VIP Prestige, Special Heroes, Globe, Temporary Events, Supreme President, and Special Buffs (from Rally Configuration).
          </p>

          {/* VIP Prestige & Globe */}
          <div className="card info-card mb-4">
            <h4>VIP Prestige & Globe (VIP Skin)</h4>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
              Select VIP level and Globe skin level. Globe Level 1 only applies when VIP 12 is selected.
            </p>
            <div className="grid">
              <div className="form-group">
                <label>VIP Prestige Level</label>
                <select
                  value={(() => {
                    // Determine current VIP level from values
                    const vip = basicBonuses.vipPrestige || { attack: 0, defense: 0, lethality: 0, health: 0 };
                    const globe = basicBonuses.globe || { attack: 0, defense: 0, lethality: 0, health: 0 };

                    // Check for VIP 12 + Globe Level 1 (21% Attack)
                    if (vip.attack === 21 && vip.defense === 16 && vip.health === 16 && vip.lethality === 16) {
                      return '12-globe1';
                    }
                    // Check for VIP 12 (16% all stats)
                    if (vip.attack === 16 && vip.defense === 16 && vip.health === 16 && vip.lethality === 16) {
                      return '12';
                    }
                    // Check for VIP 11 (14% Defense, Attack, Health)
                    if (vip.attack === 14 && vip.defense === 14 && vip.health === 14 && vip.lethality === 0) {
                      return '11';
                    }
                    // Check for VIP 10 (12% Defense, Attack)
                    if (vip.attack === 12 && vip.defense === 12 && vip.health === 0 && vip.lethality === 0) {
                      return '10';
                    }
                    // Check for VIP 9 (10% Defense)
                    if (vip.attack === 0 && vip.defense === 10 && vip.health === 0 && vip.lethality === 0) {
                      return '9';
                    }
                    return 'none';
                  })()}
                  onChange={(e) => {
                    const value = e.target.value;
                    let vipValues = { attack: 0, defense: 0, lethality: 0, health: 0 };
                    let globeValues = { attack: 0, defense: 0, lethality: 0, health: 0 };

                    if (value === '9') {
                      vipValues = { attack: 0, defense: 10, lethality: 0, health: 0 };
                    } else if (value === '10') {
                      vipValues = { attack: 12, defense: 12, lethality: 0, health: 0 };
                    } else if (value === '11') {
                      vipValues = { attack: 14, defense: 14, lethality: 0, health: 14 };
                    } else if (value === '12') {
                      vipValues = { attack: 16, defense: 16, lethality: 16, health: 16 };
                    } else if (value === '12-globe1') {
                      vipValues = { attack: 21, defense: 16, lethality: 16, health: 16 };
                      globeValues = { attack: 0, defense: 0, lethality: 0, health: 0 }; // Globe is included in VIP values
                    }

                    onBasicBonusesChange({
                      ...basicBonuses,
                      vipPrestige: vipValues,
                      globe: globeValues,
                    });
                  }}
                >
                  <option value="none">None</option>
                  <option value="9">VIP 9 (10% Defense)</option>
                  <option value="10">VIP 10 (12% Defense, 12% Attack)</option>
                  <option value="11">VIP 11 (14% Defense, 14% Attack, 14% Health)</option>
                  <option value="12">VIP 12 (16% Defense, 16% Attack, 16% Health, 16% Lethality)</option>
                  <option value="12-globe1">VIP 12 + Globe Level 1 (16% Defense, 21% Attack, 16% Health, 16% Lethality)</option>
                </select>
              </div>
            </div>
            {/* Display current values */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2">Current Values:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => {
                  const vipValue = basicBonuses.vipPrestige?.[stat] || 0;
                  const globeValue = basicBonuses.globe?.[stat] || 0;
                  const totalValue = vipValue + globeValue;
                  return (
                    <div key={stat} className="text-gray-400 dark:text-gray-400">
                      <span className="capitalize">{stat}:</span> {totalValue > 0 ? '+' : ''}{totalValue.toFixed(0)}%
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Special Heroes */}
          <div className="card info-card mb-4">
            <h4>Special Heroes</h4>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
              Jeronimo: +15% LETH & HP | Natalia: +10% ATK & DEF (always active)
            </p>
            <div className="grid">
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={basicBonuses.specialHeroes?.jeronimo || false}
                    onChange={(e) => {
                      onBasicBonusesChange({
                        ...basicBonuses,
                        specialHeroes: {
                          ...basicBonuses.specialHeroes,
                          jeronimo: e.target.checked,
                        },
                      });
                    }}
                  />
                  <span>Jeronimo (+15% LETH & HP)</span>
                </label>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={basicBonuses.specialHeroes?.natalia || false}
                    onChange={(e) => {
                      onBasicBonusesChange({
                        ...basicBonuses,
                        specialHeroes: {
                          ...basicBonuses.specialHeroes,
                          natalia: e.target.checked,
                        },
                      });
                    }}
                  />
                  <span>Natalia (+10% ATK & DEF)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Additive Bonuses */}
          {additiveBonuses && onAdditiveBonusesChange && (
            <>
              {/* Temporary Events */}
              <div className="card info-card mb-4">
                <h4>Temporary Events</h4>
                <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
                  Temporary event bonuses (e.g., weekend events, special promotions)
                </p>
                <div className="grid">
                  {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
                    <div key={stat} className="form-group">
                      <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={safeAdditiveBonuses.temporaryEvents[stat] || 0}
                        onChange={(e) => {
                          onAdditiveBonusesChange({
                            ...safeAdditiveBonuses,
                            temporaryEvents: {
                              ...safeAdditiveBonuses.temporaryEvents,
                              [stat]: parseFloat(e.target.value) || 0,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Supreme President */}
              <div className="card info-card mb-4">
                <h4>Supreme President Skills</h4>
                <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
                  Bonuses from Supreme President expedition skills
                </p>
                <div className="grid">
                  {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
                    <div key={stat} className="form-group">
                      <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={safeAdditiveBonuses.supremePresident[stat] || 0}
                        onChange={(e) => {
                          onAdditiveBonusesChange({
                            ...safeAdditiveBonuses,
                            supremePresident: {
                              ...safeAdditiveBonuses.supremePresident,
                              [stat]: parseFloat(e.target.value) || 0,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Buffs (Read-only, from Rally Configuration) */}
              <div className="card info-card mb-4">
                <h4>Special Buffs</h4>
                <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
                  Auto-calculated from Rally Configuration (Leader skills and Joiner bonuses). This value is read-only.
                </p>
                <div className="grid">
                  {(['attack', 'defense', 'lethality', 'health'] as const).map(stat => (
                    <div key={stat} className="form-group">
                      <label>{stat.charAt(0).toUpperCase() + stat.slice(1)} (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={safeAdditiveBonuses.specialBuffs[stat] || 0}
                        readOnly
                        className="bg-slate-900/40 dark:bg-slate-900/40 cursor-not-allowed text-gray-400"
                        title="This value is auto-calculated from Rally Configuration"
                      />
                    </div>
                  ))}
                </div>
                {/* Display contributing heroes */}
                {rally && (() => {
                  // Use the correct leader based on whether this is Player or Opponent
                  const currentLeader = isOpponent
                    ? (rally.opponentLeader || rally.leader)
                    : (rally.playerLeader || rally.leader);

                  // Determine the mode for calculating bonuses
                  const mode = isOpponent
                    ? (rally.specialWidgetBonus?.opponent || 'defending')
                    : (rally.specialWidgetBonus?.player || 'attacking');

                  // Calculate which heroes actually contribute non-zero special buffs
                  const contributingHeroes: Array<{ name: string; role: string; class?: string }> = [];

                  // Check each leader
                  if (currentLeader.infantry) {
                    const leaderBonuses = extractLeaderBonuses(currentLeader.infantry, mode);
                    const totalSpecialBuffs = leaderBonuses.additive.attack + leaderBonuses.additive.defense +
                      leaderBonuses.additive.lethality + leaderBonuses.additive.health;
                    if (totalSpecialBuffs > 0) {
                      contributingHeroes.push({
                        name: currentLeader.infantry.heroName,
                        role: 'Leader (Infantry)',
                      });
                    }
                  }

                  if (currentLeader.lancer) {
                    const leaderBonuses = extractLeaderBonuses(currentLeader.lancer, mode);
                    const totalSpecialBuffs = leaderBonuses.additive.attack + leaderBonuses.additive.defense +
                      leaderBonuses.additive.lethality + leaderBonuses.additive.health;
                    if (totalSpecialBuffs > 0) {
                      contributingHeroes.push({
                        name: currentLeader.lancer.heroName,
                        role: 'Leader (Lancer)',
                      });
                    }
                  }

                  if (currentLeader.marksman) {
                    const leaderBonuses = extractLeaderBonuses(currentLeader.marksman, mode);
                    const totalSpecialBuffs = leaderBonuses.additive.attack + leaderBonuses.additive.defense +
                      leaderBonuses.additive.lethality + leaderBonuses.additive.health;
                    if (totalSpecialBuffs > 0) {
                      contributingHeroes.push({
                        name: currentLeader.marksman.heroName,
                        role: 'Leader (Marksman)',
                      });
                    }
                  }

                  // Check each joiner
                  if (rally.joiners && rally.joiners.length > 0) {
                    rally.joiners.forEach((joiner) => {
                      // Calculate bonuses for this single joiner
                      const joinerBonuses = extractJoinerBonuses([joiner], mode);
                      const totalSpecialBuffs = joinerBonuses.additive.attack + joinerBonuses.additive.defense +
                        joinerBonuses.additive.lethality + joinerBonuses.additive.health;
                      if (totalSpecialBuffs > 0) {
                        contributingHeroes.push({
                          name: joiner.heroName,
                          role: 'Joiner',
                          class: joiner.heroClass,
                        });
                      }
                    });
                  }

                  return (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2">
                        Contributing Heroes:
                      </p>
                      <div className="text-sm text-gray-400 dark:text-gray-400 space-y-1">
                        {contributingHeroes.length > 0 ? (
                          contributingHeroes.map((hero, index) => (
                            <div key={index}>
                              • {hero.role}: {hero.name}
                              {hero.class && ` (${hero.class})`}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 italic">No heroes contributing special buffs</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
