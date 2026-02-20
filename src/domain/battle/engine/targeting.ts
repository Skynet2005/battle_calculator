import { TROOP_TYPES } from "./bonuses";
import type { BattleConfig, Rng, TargetSelection, TroopCounts, TroopType } from "./types";

// Re-export TargetSelection for backwards compatibility
export type { TargetSelection } from "./types";

/** Default row assignments: Infantry and Lancer are Front, Marksman is Back */
const DEFAULT_ROW: Record<TroopType, "Front" | "Back"> = {
  Infantry: "Front",
  Lancer: "Front",
  Marksman: "Back",
};

export function pickTarget(
  attacker: TroopType,
  defenderTroops: TroopCounts,
  config: BattleConfig,
  rng: Rng
): TargetSelection {
  // Lancer backline dive check (always evaluated before formation logic)
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

  // Formation-based targeting: front row must be cleared before back row is reachable
  if (config.useFormations) {
    const frontAlive = TROOP_TYPES.filter(
      (t) => DEFAULT_ROW[t] === "Front" && defenderTroops[t] > 0
    );
    const backAlive = TROOP_TYPES.filter(
      (t) => DEFAULT_ROW[t] === "Back" && defenderTroops[t] > 0
    );

    if (frontAlive.length > 0) {
      return { target: frontAlive[0], reason: "FormationFrontRow" };
    }
    if (backAlive.length > 0) {
      return { target: backAlive[0], reason: "FormationBackRow" };
    }
    return { target: null };
  }

  // Default: front-most troop type with units remaining; simple priority Infantry > Lancer > Marksman
  for (const type of TROOP_TYPES) {
    if (defenderTroops[type] > 0) {
      return { target: type, reason: "FrontlinePriority" };
    }
  }
  return { target: null };
}
