import {
  getResearchCategories,
  getResearchTierLabels,
} from '@/domain/battle/data-selectors';
import { getMaxResearchLevels } from '@/domain/battle/data/max-levels';

export type ResearchSelections = Record<string, Record<string, number>>;

export function buildDefaultResearchSelections(): ResearchSelections {
  const maxResearchLevels = getMaxResearchLevels();
  const categories = getResearchCategories();

  const defaults: ResearchSelections = {};
  for (const category of categories) {
    defaults[category] = {};
    const tierLabels = getResearchTierLabels(category);
    for (const tierLabel of tierLabels) {
      defaults[category][tierLabel] = maxResearchLevels[category]?.[tierLabel] || 0;
    }
  }
  return defaults;
}
