/**
 * Expert Bonus Extractor
 * Simplified to return direct percentage values from ExpertSelections
 */

import type { StatType } from '../../calculations';
import type { ExpertSelections } from './expert-types';

/**
 * Extract all expert bonuses (additive)
 * Returns the direct percentage values from ExpertSelections
 */
export function getExpertBonuses(selections: ExpertSelections): Record<StatType, number> {
  return {
    attack: selections.attack || 0,
    defense: selections.defense || 0,
    lethality: selections.lethality || 0,
    health: selections.health || 0,
  };
}

/**
 * Get expert deployment capacity bonus
 */
export function getExpertDeploymentCapacity(selections: ExpertSelections): number {
  return selections.deploymentCapacity || 0;
}

/**
 * Get expert rally capacity bonus
 */
export function getExpertRallyCapacity(selections: ExpertSelections): number {
  return selections.rallyCapacity || 0;
}

