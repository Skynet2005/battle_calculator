import BattleResultsPanel from '@/features/battle-results/BattleResultsPanel';
import type { BattleResultsViewModel } from '@/features/battle-results/viewmodel/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('BattleResultsPanel', () => {
  const mockViewModel: BattleResultsViewModel = {
    summary: {
      winner: 'attacker',
      score: { player: 1000, opponent: 500 },
      battleType: 'Rally',
      turnsElapsed: 10,
    },
    metrics: [
      {
        label: 'Total Damage',
        playerValue: 5000,
        opponentValue: 3000,
        delta: 2000,
        category: 'damage',
      },
    ],
    rationale: {
      headline: 'Attacker Victory',
      bullets: ['Battle lasted 10 turns', 'Attacker maintained numerical advantage'],
      inflectionTurns: [3, 5, 7],
    },
    timelineEvents: [],
    joinerSummary: {
      selectedSkills: [],
      contributionWeights: [],
      totalContribution: 0,
    },
  };

  it('should render loading state', () => {
    render(<BattleResultsPanel viewModel={null} isLoading={true} />);
    expect(screen.getByText(/loading/i)).toBeDefined();
  });

  it('should render error state', () => {
    render(<BattleResultsPanel viewModel={null} error="Test error" />);
    expect(screen.getByText(/error/i)).toBeDefined();
    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('should render empty state', () => {
    render(<BattleResultsPanel viewModel={null} />);
    expect(screen.getByText(/no results available/i)).toBeDefined();
  });

  it('should render success state with view model', () => {
    render(<BattleResultsPanel viewModel={mockViewModel} />);
    expect(screen.getByText(/battle summary/i)).toBeDefined();
    expect(screen.getByText(/attacker victory/i)).toBeDefined();
  });
});
