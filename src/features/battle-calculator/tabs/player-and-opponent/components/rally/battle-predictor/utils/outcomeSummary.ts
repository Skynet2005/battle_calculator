/**
 * Outcome summary builder - analyzes battle results and generates actionable insights.
 */

import type { TroopMixConfig } from '@/shared/types';
import type { BattleReport, TroopCounts as CombatTroopCounts } from '@/domain/combat/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { computeCountsFromMix, normalizeRatios } from '@/domain/rally/mix-utils';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import { applyRallyCap } from '@/features/battle-calculator/utils/rally-mix';
import { opponentIsAttacker, resolveOutcome, sumFightCasualties } from '@/features/battle-calculator/utils/rally-outcome';
import { computeCasualtiesByType, maxType } from '@/features/battle-calculator/utils/turn-analytics';
import type { BattleSideContext, CapacityReport } from '../types';
import { computeCounterMixRecommendation, describeMixSkew } from './mixInsights';

function pctShare(value: number, totals: CombatTroopCounts): number {
  const total = totals.Infantry + totals.Lancer + totals.Marksman;
  if (total === 0) return 0;
  return (value / total) * 100;
}

function topSkillHit(report: BattleReport, side: 'attacker' | 'defender'): { count: number; name: string } | null {
  const counts = new Map<string, { count: number; name: string }>();
  report.turns.forEach((t) => {
    t.skillImpacts
      ?.filter((s) => s.side === side && s.succeeded !== false)
      .forEach((s) => {
        const key = `${s.heroId ?? '__'}:${s.name}`;
        const current = counts.get(key)?.count ?? 0;
        counts.set(key, { count: current + 1, name: s.heroId ? `${s.heroId} - ${s.name}` : s.name });
      });
  });
  let best: { count: number; name: string } | null = null;
  counts.forEach((v) => {
    if (!best || v.count > best.count) best = v;
  });
  return best;
}

function skillRngNote(report: BattleReport, playerIsAttacker: boolean): string {
  const rolls = report.turns.flatMap((t) => t.skillRolls ?? []);
  if (!rolls.length) return '';
  const playerSide: 'attacker' | 'defender' = playerIsAttacker ? 'attacker' : 'defender';
  const oppSide: 'attacker' | 'defender' = playerIsAttacker ? 'defender' : 'attacker';
  const playerMisses = rolls.filter((r) => r.side === playerSide && r.succeeded === false).length;
  const playerTotal = rolls.filter((r) => r.side === playerSide).length;
  const oppHits = rolls.filter((r) => r.side === oppSide && r.succeeded).length;
  const oppTotal = rolls.filter((r) => r.side === oppSide).length;
  const missRate = playerTotal ? playerMisses / playerTotal : 0;
  const oppHitRate = oppTotal ? oppHits / oppTotal : 0;
  if (missRate > 0.35) {
    return `Player chance skills missed often this run (miss rate ${(missRate * 100).toFixed(0)}%).`;
  }
  if (oppHitRate > 0.7) {
    return `Enemy chance skills landed frequently this run (hit rate ${(oppHitRate * 100).toFixed(0)}%).`;
  }
  return '';
}

function averageStats(stats: any): any {
  if (!stats) return null;
  const keys = Object.keys(stats);
  if (!keys.length) return null;
  const agg = keys.reduce(
    (acc, key) => {
      acc.attack += stats[key].attack;
      acc.defense += stats[key].defense;
      acc.lethality += stats[key].lethality;
      acc.health += stats[key].health;
      return acc;
    },
    { attack: 0, defense: 0, lethality: 0, health: 0 }
  );
  return {
    attack: agg.attack / keys.length,
    defense: agg.defense / keys.length,
    lethality: agg.lethality / keys.length,
    health: agg.health / keys.length
  };
}

export function buildOutcomeSummary({
  player,
  opponent,
  fightResult,
  battleReport,
  playerCapacity,
  opponentCapacity,
  playerMix,
  opponentMix
}: {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  battleReport: BattleReport | null;
  playerCapacity?: CapacityReport | null;
  opponentCapacity?: CapacityReport | null;
  playerMix: TroopMixConfig;
  opponentMix: TroopMixConfig;
}): { winner: 'player' | 'opponent' | 'stalemate'; verdict: string; reasons: string[]; actions: string[] } {
  type Factor = { reason: string; score: number };
  const actions: string[] = [];

  const playerIsAttacker = player.role === 'attacker';
  const { winner } = resolveOutcome(player.role, fightResult);

  const playerFinal = playerIsAttacker ? fightResult.attackerRemaining : fightResult.defenderRemaining;
  const opponentFinal = opponentIsAttacker(opponent) ? fightResult.attackerRemaining : fightResult.defenderRemaining;
  const playerInitial = totalTroops(player.fighter?.troopCounts || computeCountsFromMix(normalizeRatios(applyRallyCap(playerMix, playerCapacity?.rally.total), DEFAULT_TROOP_MIX)));
  const opponentInitial = totalTroops(opponent.fighter?.troopCounts || computeCountsFromMix(normalizeRatios(applyRallyCap(opponentMix, opponentCapacity?.rally.total), DEFAULT_TROOP_MIX)));
  const playerSurvivors = totalTroops(playerFinal);
  const opponentSurvivors = totalTroops(opponentFinal);

  const verdict =
    winner === 'player'
      ? 'Player Victory'
      : winner === 'opponent'
        ? 'Opponent Victory'
        : 'Stalemate';

  const factors: Factor[] = [];

  // Capacity edge
  const playerCap = playerCapacity?.rally.total ?? playerInitial;
  const opponentCap = opponentCapacity?.rally.total ?? opponentInitial;
  if (playerCap !== opponentCap) {
    const deltaPct = ((playerCap - opponentCap) / Math.max(playerCap, opponentCap || 1)) * 100;
    factors.push({
      score: Math.abs(deltaPct),
      reason:
        playerCap > opponentCap
          ? `Player marched with a larger rally (+${deltaPct.toFixed(1)}% capacity: ${playerCap.toLocaleString()} vs ${opponentCap.toLocaleString()}).`
          : `Opponent marched with a larger rally (+${(-deltaPct).toFixed(1)}% capacity: ${opponentCap.toLocaleString()} vs ${playerCap.toLocaleString()}).`
    });
    if (winner !== 'player' && playerCap < opponentCap) {
      actions.push('Increase rally capacity (Command Center, Daybreak capacity, pet bonus, city deployment %, chief gear capacity).');
    }
  }

  // Survivors gap
  if (playerSurvivors !== opponentSurvivors) {
    const survivorDelta = playerSurvivors - opponentSurvivors;
    const survivorPct = (survivorDelta / Math.max(playerSurvivors, opponentSurvivors || 1)) * 100;
    factors.push({
      score: Math.abs(survivorPct),
      reason:
        survivorDelta > 0
          ? `Player ended with more survivors (+${survivorPct.toFixed(1)}%: ${playerSurvivors.toLocaleString()} vs ${opponentSurvivors.toLocaleString()}).`
          : `Opponent ended with more survivors (+${(-survivorPct).toFixed(1)}%: ${opponentSurvivors.toLocaleString()} vs ${playerSurvivors.toLocaleString()}).`
    });
    if (winner !== 'player' && survivorDelta < 0) {
      actions.push('Reduce losses: boost HP/DEF (skins, chief gear, pets), or bring more capacity to dilute losses.');
    }
  }

  // Kills / losses edge
  const playerTotalLosses = sumFightCasualties(fightResult.rounds, playerIsAttacker);
  const opponentTotalLosses = sumFightCasualties(fightResult.rounds, !playerIsAttacker);
  if (playerTotalLosses !== opponentTotalLosses) {
    const lossDelta = opponentTotalLosses - playerTotalLosses;
    const lossPct = (lossDelta / Math.max(playerTotalLosses, opponentTotalLosses || 1)) * 100;
    factors.push({
      score: Math.abs(lossPct),
      reason:
        lossDelta > 0
          ? `Player inflicted more net kills (lost ${playerTotalLosses.toLocaleString()} vs ${opponentTotalLosses.toLocaleString()}).`
          : `Opponent inflicted more net kills (lost ${opponentTotalLosses.toLocaleString()} vs ${playerTotalLosses.toLocaleString()}).`
    });
    if (winner !== 'player' && lossDelta < 0) {
      actions.push('Increase damage: raise ATK/LETH (hero lead, chief gear, skins, pet refinement, war academy, city buffs).');
    }
  }

  // Per-type casualty driver
  if (battleReport) {
    const { playerCasualtiesByType, opponentCasualtiesByType } = computeCasualtiesByType(battleReport, playerIsAttacker);
    const playerMaxType = maxType(playerCasualtiesByType);
    const opponentMaxType = maxType(opponentCasualtiesByType);
    if (playerMaxType) {
      const pct = pctShare(playerCasualtiesByType[playerMaxType], playerCasualtiesByType);
      factors.push({
        score: pct,
        reason: `Player losses were highest in ${playerMaxType} (${playerCasualtiesByType[playerMaxType].toLocaleString()} lost, ${pct.toFixed(1)}% of player losses).`
      });
      if (winner !== 'player') {
        actions.push(`Bolster ${playerMaxType}: prioritize HP/DEF (skins, chief gear, pets) and consider shifting mix away from ${playerMaxType}.`);
      }
    }
    if (opponentMaxType) {
      const pct = pctShare(opponentCasualtiesByType[opponentMaxType], opponentCasualtiesByType);
      factors.push({
        score: pct,
        reason: `Opponent losses were concentrated in ${opponentMaxType} (${opponentCasualtiesByType[opponentMaxType].toLocaleString()} lost, ${pct.toFixed(1)}% of opponent losses).`
      });
      if (winner !== 'player') {
        actions.push(`Target ${opponentMaxType}: lean on the counter troop type by +5–10% and ensure matching attack/lethality buffs.`);
      }
    }

    // Top skill impact
    const topPlayerSkill = topSkillHit(battleReport, playerIsAttacker ? 'attacker' : 'defender');
    const topOpponentSkill = topSkillHit(battleReport, playerIsAttacker ? 'defender' : 'attacker');
    if (topOpponentSkill) {
      factors.push({
        score: 6,
        reason: `Enemy skill impact: ${topOpponentSkill.name} hit ${topOpponentSkill.count}x; likely driving incoming multipliers.`
      });
      if (winner !== 'player') {
        actions.push(`Mitigate ${topOpponentSkill.name}: raise HP/DEF on counter troop, stack damage reduction, or adjust mix to reduce exposure.`);
      }
    }
    if (topPlayerSkill && winner !== 'player') {
      actions.push(`Capitalize on ${topPlayerSkill.name}: ensure it triggers (chance/turn skills) and pair with troop-type buffs for that source.`);
    }

    // RNG note
    const rngNote = skillRngNote(battleReport, playerIsAttacker);
    if (rngNote) {
      factors.push({ score: 3, reason: rngNote });
    }
  }

  // Stat edge
  const avgStatsPlayer = averageStats(player.stats);
  const avgStatsOpponent = averageStats(opponent.stats);
  if (avgStatsPlayer && avgStatsOpponent) {
    const attackDelta = avgStatsPlayer.attack - avgStatsOpponent.attack;
    const defenseDelta = avgStatsPlayer.defense - avgStatsOpponent.defense;
    const lethalityDelta = avgStatsPlayer.lethality - avgStatsOpponent.lethality;
    const healthDelta = avgStatsPlayer.health - avgStatsOpponent.health;
    const statEdgeThreshold = 3;
    const pushStat = (label: string, delta: number) => {
      if (Math.abs(delta) > statEdgeThreshold) {
        factors.push({
          score: Math.abs(delta),
          reason: delta > 0
            ? `Player had higher ${label} (+${delta.toFixed(1)}%).`
            : `Opponent had higher ${label} (+${(-delta).toFixed(1)}%).`
        });
        if (winner !== 'player' && delta < 0) {
          if (label === 'attack' || label === 'lethality') {
            actions.push(`Raise ${label}: hero (leader), chief gear, skins, pet refinement, VIP, war academy, city bonuses.`);
          } else if (label === 'defense' || label === 'health') {
            actions.push(`Raise ${label}: skins, chief gear, daybreak, pet refinement, VIP, alliance facilities.`);
          }
        }
      }
    };
    pushStat('attack', attackDelta);
    pushStat('defense', defenseDelta);
    pushStat('lethality', lethalityDelta);
    pushStat('health', healthDelta);
  }

  // Mix skew
  const mixNote = describeMixSkew(playerMix, opponentMix, winner);
  if (mixNote) {
    factors.push({ score: 4, reason: mixNote });
    if (winner !== 'player') {
      const counterSuggestion = computeCounterMixRecommendation(playerMix, opponentMix);
      actions.push(counterSuggestion);
    }
  }

  // Hero/Joiner readiness
  if (winner !== 'player') {
    const missingLeader = !player.leaders?.infantry || !player.leaders?.lancer || !player.leaders?.marksman;
    if (missingLeader) {
      actions.push('Assign rally leaders for each troop type to unlock leader stats.');
    }
    if (!player.joiners || player.joiners.length === 0) {
      actions.push('Add up to 4 rally joiners with expedition buffs for multiplicative gains.');
    }
  }

  // Sort by score desc and keep top 4
  const reasons = factors
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((f) => f.reason);

  if (!reasons.length) {
    reasons.push('Outcome driven by combined stats, skills, and morale over the simulated rounds.');
  }

  const dedupedActions = Array.from(new Set(actions)).slice(0, 4);

  return { winner, verdict, reasons, actions: dedupedActions };
}
