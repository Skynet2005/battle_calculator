'use client';

import BattleCalculatorPage from '@/features/battle-calculator/components/BattleCalculatorPage';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <BattleCalculatorPage />
    </ErrorBoundary>
  );
}
