import type { RoundResult } from "./combat-battle-round";
import type { TroopCounts } from "./combat-types";

export interface FightResult {
  rounds: RoundResult[];
  attackerRemaining: TroopCounts;
  defenderRemaining: TroopCounts;
  attackerWon: boolean;
  defenderWon: boolean;
}
