import type { TroopCounts as CombatTroopCounts, TurnLog } from '@/domain/battle/engine/types';

export function totalCounts(counts?: CombatTroopCounts): number {
  if (!counts) return 0;
  return (counts.Infantry ?? 0) + (counts.Lancer ?? 0) + (counts.Marksman ?? 0);
}

export function diffCounts(before?: CombatTroopCounts, after?: CombatTroopCounts): CombatTroopCounts {
  return {
    Infantry: Math.max(0, (before?.Infantry ?? 0) - (after?.Infantry ?? 0)),
    Lancer: Math.max(0, (before?.Lancer ?? 0) - (after?.Lancer ?? 0)),
    Marksman: Math.max(0, (before?.Marksman ?? 0) - (after?.Marksman ?? 0))
  };
}

export function pickTopSkill(turn: TurnLog, targetSide: "attacker" | "defender"): string | undefined {
  if (!turn.skillImpacts?.length) return undefined;
  const candidates = turn.skillImpacts.filter((s) => s.side === targetSide);
  if (!candidates.length) return undefined;
  const scored = candidates.map((c) => {
    const score = (c.damageModifier ? 3 : 0) + (c.stats?.length ?? 0) * 0.5 + (c.specialStats?.length ?? 0) * 0.5;
    return { score, name: c.heroId ? `${c.heroId} - ${c.name}` : c.name };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.name;
}

export interface CasualtySeriesEntry {
  turn: number;
  attackerLosses: number;
  defenderLosses: number;
  attackerLossesByType: CombatTroopCounts;
  defenderLossesByType: CombatTroopCounts;
  attackerRemaining: CombatTroopCounts;
  defenderRemaining: CombatTroopCounts;
  skillAgainstAttacker?: string;
  skillAgainstDefender?: string;
}

export function buildCasualtySeries(turns: TurnLog[]): CasualtySeriesEntry[] {
  const series: CasualtySeriesEntry[] = [];
  let prevAtt = turns[0]?.startAttackerTroops ?? turns[0]?.attackerTroops;
  let prevDef = turns[0]?.startDefenderTroops ?? turns[0]?.defenderTroops;
  turns.forEach((turn) => {
    const startAtt = turn.startAttackerTroops ?? prevAtt ?? turn.attackerTroops;
    const startDef = turn.startDefenderTroops ?? prevDef ?? turn.defenderTroops;
    const endAtt = turn.attackerTroops;
    const endDef = turn.defenderTroops;
    const attackerLossesByType = diffCounts(startAtt, endAtt);
    const defenderLossesByType = diffCounts(startDef, endDef);
    const attackerLosses = Math.max(0, totalCounts(startAtt) - totalCounts(endAtt));
    const defenderLosses = Math.max(0, totalCounts(startDef) - totalCounts(endDef));
    series.push({
      turn: turn.turn,
      attackerLosses,
      defenderLosses,
      attackerLossesByType,
      defenderLossesByType,
      attackerRemaining: endAtt,
      defenderRemaining: endDef,
      skillAgainstAttacker: pickTopSkill(turn, "defender"), // defender's skills hitting attacker
      skillAgainstDefender: pickTopSkill(turn, "attacker") // attacker's skills hitting defender
    });
    prevAtt = endAtt;
    prevDef = endDef;
  });
  return series;
}

import type { BattleReport } from '@/domain/battle/engine/types';

export function computeCasualtiesByType(report: BattleReport, playerIsAttacker: boolean) {
  const normalize = (c: Partial<CombatTroopCounts> | Record<string, number> | undefined | null): CombatTroopCounts => {
    const n = c as Record<string, number | undefined> | undefined;
    return {
      Infantry: n?.Infantry ?? n?.infantry ?? 0,
      Lancer: n?.Lancer ?? n?.lancer ?? 0,
      Marksman: n?.Marksman ?? n?.marksman ?? 0
    };
  };

  const initialAtt = normalize(report.turns[0]?.startAttackerTroops ?? report.attacker.troops);
  const initialDef = normalize(report.turns[0]?.startDefenderTroops ?? report.defender.troops);
  const finalAtt = normalize(report.attackerRemaining);
  const finalDef = normalize(report.defenderRemaining);

  const diff = (start: CombatTroopCounts, end: CombatTroopCounts): CombatTroopCounts => ({
    Infantry: Math.max(0, start.Infantry - end.Infantry),
    Lancer: Math.max(0, start.Lancer - end.Lancer),
    Marksman: Math.max(0, start.Marksman - end.Marksman)
  });

  const attackerLosses = diff(initialAtt, finalAtt);
  const defenderLosses = diff(initialDef, finalDef);

  const playerCasualtiesByType = playerIsAttacker ? attackerLosses : defenderLosses;
  const opponentCasualtiesByType = playerIsAttacker ? defenderLosses : attackerLosses;

  return { playerCasualtiesByType, opponentCasualtiesByType };
}

export function maxType(losses: CombatTroopCounts): keyof CombatTroopCounts | null {
  const entries = Object.entries(losses) as Array<[keyof CombatTroopCounts, number]>;
  const max = entries.reduce((acc, [type, count]) => (count > acc[1] ? [type, count] : acc), ['Infantry' as keyof CombatTroopCounts, 0] as [keyof CombatTroopCounts, number]);
  return max[1] > 0 ? max[0] : null;
}
