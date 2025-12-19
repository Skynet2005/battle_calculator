/**
 * Expert Configuration Types
 *
 * Simplified to store total percentages directly instead of individual expert levels
 */

export interface ExpertSelections {
  // Total stat bonuses from all experts combined (percentages)
  attack: number; // Troops Attack bonus (%)
  defense: number; // Troops Defense bonus (%)
  lethality: number; // Troops Lethality bonus (%)
  health: number; // Troops Health bonus (%)

  // Capacity bonuses (flat values, not percentages)
  deploymentCapacity: number; // Troops Deployment Capacity bonus (units)
  rallyCapacity: number; // Rally Capacity bonus (units)
}

