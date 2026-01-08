import { TROOP_TYPES } from "./bonuses";
import type { BattleConfig, Rng, TargetSelection, TroopCounts, TroopType } from "./types";

// Re-export TargetSelection for backwards compatibility
export type { TargetSelection } from "./types";

export function pickTarget(
  attacker: TroopType,
  defenderTroops: TroopCounts,
  config: BattleConfig,
  rng: Rng
): TargetSelection {
  if (config.allowLancerBacklineDive && attacker === "Lancer") {
    const totalMarksmen = defenderTroops.Marksman;
    const roll = rng();
    const probability = config.lancerBacklineDiveChance;
    if (totalMarksmen > 0 && roll <= probability) {
      return { target: "Marksman", reason: "BacklineDive", roll, probability, backlineDive: true };
    }
    if (totalMarksmen > 0) {
      return { target: "Marksman", reason: "BacklineDiveFailed", roll, probability, backlineDive: false };
    }
  }

  // Default: front-most troop type with units remaining; simple priority Infantry > Lancer > Marksman
  for (const type of TROOP_TYPES) {
    if (defenderTroops[type] > 0) {
      return { target: type, reason: "FrontlinePriority" };
    }
  }
  return { target: null };
}
