/**
 * Combat Log Filters Component
 *
 * Filter controls for the combat log: key moments, skill procs, deaths, buffs/debuffs, search.
 */

import { useState } from 'react';
import type { TurnFilterOptions } from '../utils/turnFilters';

interface CombatLogFiltersProps {
  filters: TurnFilterOptions;
  onFiltersChange: (filters: TurnFilterOptions) => void;
  totalTurns: number;
  filteredCount: number;
}

export function CombatLogFilters({
  filters,
  onFiltersChange,
  totalTurns,
  filteredCount
}: CombatLogFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.searchText);

  const updateFilter = <K extends keyof TurnFilterOptions>(
    key: K,
    value: TurnFilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    updateFilter('searchText', value);
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-200">Filters</div>
        <div className="text-xs text-gray-400">
          {filteredCount} / {totalTurns} turns
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={filters.onlyKeyMoments}
            onChange={(e) => updateFilter('onlyKeyMoments', e.target.checked)}
            className="h-3 w-3 accent-rose-400"
          />
          Only key moments
        </label>

        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={filters.onlySkillProcs}
            onChange={(e) => updateFilter('onlySkillProcs', e.target.checked)}
            className="h-3 w-3 accent-rose-400"
          />
          Only skill procs
        </label>

        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={filters.onlyBuffsDebuffs}
            onChange={(e) => updateFilter('onlyBuffsDebuffs', e.target.checked)}
            className="h-3 w-3 accent-rose-400"
          />
          Only buffs/debuffs
        </label>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-300">Deaths ≥</label>
          <input
            type="number"
            min={0}
            value={filters.onlyDeathsAbove ?? ''}
            onChange={(e) => {
              const value = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
              updateFilter('onlyDeathsAbove', value);
            }}
            placeholder="Any"
            className="w-20 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-300 mb-1">Search (hero, skill, buff)</label>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by hero name, skill, or buff..."
          className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none"
        />
      </div>

      {(filters.onlyKeyMoments ||
        filters.onlySkillProcs ||
        filters.onlyBuffsDebuffs ||
        filters.onlyDeathsAbove !== null ||
        filters.searchText.trim()) && (
          <button
            type="button"
            onClick={() => {
              onFiltersChange({
                onlyKeyMoments: false,
                onlySkillProcs: false,
                onlyDeathsAbove: null,
                onlyBuffsDebuffs: false,
                searchText: ''
              });
              setLocalSearch('');
            }}
            className="text-xs text-rose-300 hover:text-rose-200 underline"
          >
            Clear all filters
          </button>
        )}
    </div>
  );
}
