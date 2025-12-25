import { getResearchLevels, getResearchTierLabels } from '@/lib/battle/data-selectors';
import type { ResearchSelections } from './research.utils';

// ============================================================================
// Types
// ============================================================================

interface ResearchCategoryCardProps {
  category: string;
  researchSelections: ResearchSelections;
  onTierChange: (category: string, tierLabel: string, level: number) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ResearchCategoryCard({
  category,
  researchSelections,
  onTierChange,
}: ResearchCategoryCardProps) {
  const tierLabels = getResearchTierLabels(category);

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 mb-4 [data-theme='light']:border-gray-200 [data-theme='light']:bg-white">
      {/* Category Header */}
      <h4 className="text-lg font-semibold text-slate-100 mb-4 [data-theme='light']:text-gray-900">
        {category}
      </h4>

      {/* Research Tiers */}
      <div className="space-y-4">
        {tierLabels.map((tierLabel) => {
          const levels = getResearchLevels(category, tierLabel);
          const currentLevel = researchSelections[category]?.[tierLabel] || 0;

          return (
            <div key={tierLabel} className="form-group">
              <label className="block text-sm font-medium text-slate-200 mb-2 [data-theme='light']:text-gray-700">
                {tierLabel}
              </label>
              <select
                value={currentLevel}
                onChange={(e) => onTierChange(category, tierLabel, parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [data-theme='light']:border-gray-300 [data-theme='light']:bg-white [data-theme='light']:text-gray-900"
              >
                <option value="0">Not researched</option>
                {levels.map((level) => (
                  <option key={level.level} value={level.level}>
                    Level {level.level} - {level.stats.map((s) => `${s.name}: ${s.value}%`).join(', ')}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
