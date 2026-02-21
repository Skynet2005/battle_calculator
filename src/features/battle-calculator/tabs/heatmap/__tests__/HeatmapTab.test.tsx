/**
 * Basic render and run trigger test for Heatmap tab.
 */
// @vitest-environment jsdom

import type { SideBaseStats } from '@/domain/rally/combat-types';
import type { CapacityReport } from '@/features/battle-calculator/model/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HeatmapTab from '../HeatmapTab';

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
} as unknown as Parameters<typeof HeatmapTab>[0]['currentProfile'];

const capacityReport: CapacityReport = {
  rally: { total: 1000, base: 1000, temporary: 0, manualOverride: false, breakdown: [], temporaryBreakdown: [] },
  deployment: { total: 0, base: 0, temporary: 0, manualOverride: false, breakdown: [], temporaryBreakdown: [] },
};

describe('HeatmapTab', () => {
  it('renders sweep config and Run sweep button', () => {
    render(
      <HeatmapTab
        currentProfile={minimalProfile}
        playerBaseStats={emptyStats}
        opponentBaseStats={emptyStats}
        playerCapacityReport={capacityReport}
        opponentCapacityReport={capacityReport}
        simulationMode="expectedValue"
        simulationCount={50}
      />
    );
    expect(screen.getByText(/2D Troop Mix Sweep/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Run sweep/i })).toBeDefined();
  });

  it('Run sweep button is disabled when profile has no rally', () => {
    render(
      <HeatmapTab
        currentProfile={{ ...minimalProfile, rally: undefined } as typeof minimalProfile}
        playerBaseStats={emptyStats}
        opponentBaseStats={emptyStats}
        playerCapacityReport={capacityReport}
        opponentCapacityReport={capacityReport}
        simulationMode="expectedValue"
        simulationCount={50}
      />
    );
    const btn = screen.getByRole('button', { name: /Run sweep/i });
    expect(btn).toBeDisabled();
  });
});
