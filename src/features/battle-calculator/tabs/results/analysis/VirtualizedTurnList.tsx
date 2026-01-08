/**
 * Virtualized Turn List Component
 *
 * Efficiently renders large turn lists using @tanstack/react-virtual.
 * Includes filtering and jump-to-turn functionality.
 */

import type { TurnLog } from '@/domain/combat/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';
import { extractKeyMoments } from '../utils/keyMoments';
import { filterTurns, getTurnHighlights, type TurnFilterOptions } from '../utils/turnFilters';
import { TurnCard } from './TurnCard';

interface VirtualizedTurnListProps {
  turns: TurnLog[];
  playerIsAttacker: boolean;
  filters: TurnFilterOptions;
  onJumpToTurn?: (turnNumber: number) => void;
}

export function VirtualizedTurnList({
  turns,
  playerIsAttacker,
  filters,
  onJumpToTurn
}: VirtualizedTurnListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const filteredTurns = useMemo(
    () => filterTurns(turns, filters, playerIsAttacker),
    [turns, filters, playerIsAttacker]
  );

  const highlights = useMemo(
    () => getTurnHighlights(turns, playerIsAttacker),
    [turns, playerIsAttacker]
  );

  const keyMoments = useMemo(
    () => extractKeyMoments(turns, playerIsAttacker),
    [turns, playerIsAttacker]
  );

  const virtualizer = useVirtualizer({
    count: filteredTurns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500, // Large estimate to prevent overlap - will be measured accurately
    overscan: 3
  });

  // Remeasure only when filtered turns change (filters applied) or on initial mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      virtualizer.measure();
    }, 150);
    return () => clearTimeout(timeout);
  }, [filteredTurns.length, virtualizer]);

  const jumpToTurn = (turnNumber: number) => {
    const index = filteredTurns.findIndex(t => t.turn === turnNumber);
    if (index !== -1) {
      virtualizer.scrollToIndex(index, { align: 'start', behavior: 'smooth' });
      onJumpToTurn?.(turnNumber);
    }
  };

  return (
    <div className="space-y-4">
      {/* Jump to key turns */}
      {keyMoments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Jump to:</span>
          {Array.from(new Set(keyMoments.map(m => m.turn)))
            .slice(0, 10)
            .map((turnNumber) => (
              <button
                key={`jump-${turnNumber}`}
                type="button"
                onClick={() => jumpToTurn(turnNumber)}
                className="px-2 py-1 text-xs rounded-md border border-white/10 bg-slate-900/60 text-gray-300 hover:border-rose-400 hover:text-rose-300 transition-colors"
              >
                Turn {turnNumber}
              </button>
            ))}
        </div>
      )}

      {/* Virtualized list */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto rounded-lg border border-white/10 bg-slate-900/20"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const turn = filteredTurns[virtualItem.index];
            const isHighlighted = highlights.has(turn.turn);

            return (
              <div
                key={turn.turn}
                data-index={virtualItem.index}
                ref={(node) => {
                  virtualizer.measureElement(node);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`
                }}
                className={isHighlighted ? 'border-l-2 border-yellow-400/50 pl-2' : ''}
              >
                <div className="px-2 py-1">
                  <TurnCard turn={turn} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-400 text-center">
        Showing {filteredTurns.length} of {turns.length} turns
      </div>
    </div>
  );
}
