/**
 * Basic render and run trigger test for Scenario Runner tab.
 */
// @vitest-environment jsdom

import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ScenarioRunnerTab from '../ScenarioRunnerTab';

const emptyStats: SideBaseStats = {
  infantry: { attack: 0, defense: 0, health: 0, lethality: 0 },
  lancer: { attack: 0, defense: 0, health: 0, lethality: 0 },
  marksman: { attack: 0, defense: 0, health: 0, lethality: 0 },
};

const minimalProfile = {
  id: 'test',
  name: 'Test',
  rally: {
    leader: { infantry: null, lancer: null, marksman: null },
    playerLeader: { infantry: null, lancer: null, marksman: null },
    opponentLeader: { infantry: null, lancer: null, marksman: null },
    joiners: [],
    playerJoiners: [],
    opponentJoiners: [],
    capacity: { infantry: [], lancer: [], marksman: [] },
    troopMix: { player: { totalTroops: 1000, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 }, opponent: { totalTroops: 1000, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 } },
  },
} as unknown as Parameters<typeof ScenarioRunnerTab>[0]['currentProfile'];

const capacityReport: CapacityReport = {
  rally: { total: 1000, base: 1000, temporary: 0, manualOverride: false, breakdown: [], temporaryBreakdown: [] },
  deployment: { total: 0, base: 0, temporary: 0, manualOverride: false, breakdown: [], temporaryBreakdown: [] },
};

describe('ScenarioRunnerTab', () => {
  it('renders presets and Run button', () => {
    render(
      <ScenarioRunnerTab
        currentProfile={minimalProfile}
        playerBaseStats={emptyStats}
        opponentBaseStats={emptyStats}
        playerCapacityReport={capacityReport}
        opponentCapacityReport={capacityReport}
        simulationMode="expectedValue"
        simulationCount={50}
      />
    );
    expect(screen.getByText(/Troop mix presets/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Run scenarios/i })).toBeDefined();
  });

  it('Run button is disabled when profile has no rally', () => {
    render(
      <ScenarioRunnerTab
        currentProfile={{ ...minimalProfile, rally: undefined } as typeof minimalProfile}
        playerBaseStats={emptyStats}
        opponentBaseStats={emptyStats}
        playerCapacityReport={capacityReport}
        opponentCapacityReport={capacityReport}
        simulationMode="expectedValue"
        simulationCount={50}
      />
    );
    const btn = screen.getByRole('button', { name: /Run scenarios/i });
    expect(btn).toBeDisabled();
  });
});
