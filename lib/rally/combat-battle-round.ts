import type { TroopCounts, TroopType } from "./combat-types";

export interface DamageDebug {
  attackerType: TroopType;
  defenderType: TroopType;
  attackMultiplier: number;
  lethalityMultiplier: number;
  defenseMultiplier: number;
  healthMultiplier: number;
  moraleMultiplier: number;
  controlMultiplier: number;
  dotMultiplier: number;
  hiddenFactor: number;
  sqrtTroops: number;
  offensivePower: number;
  defensivePower: number;
  mitigation: number;
  kills: number;
}

export interface RoundResult {
  roundIndex: number;
  attackerCasualties: TroopCounts;
  defenderCasualties: TroopCounts;
  attackerRemaining: TroopCounts;
  defenderRemaining: TroopCounts;
  ended: boolean;
  attackerDamageLog: DamageDebug[];
  defenderDamageLog: DamageDebug[];
}
