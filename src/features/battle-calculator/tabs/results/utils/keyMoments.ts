/**
 * Key Moments Utility
 *
 * Extracts critical battle events from turn logs for annotation and display.
 */

import type { TurnLog } from '@/domain/battle/engine/types';

export type KeyMoment = {
  turn: number;
  type: 'bigSkill' | 'damageReduction' | 'frontlineCollapse';
  message: string;
};

export function extractKeyMoments(turns: TurnLog[], playerIsAttacker: boolean): KeyMoment[] {
  const moments: KeyMoment[] = [];
  if (turns.length === 0) return moments;

  // Build O(1) lookup map for previous turns (replaces O(n) turns.find calls)
  const turnByNumber = new Map(turns.map(t => [t.turn, t]));

  // Pre-compute average kills in a single pass (avoid flatMap + filter + reduce)
  let killSum = 0;
  let killCount = 0;
  for (const turn of turns) {
    for (const action of turn.actions) {
      const k = action.components.finalKills;
      if (k > 0) { killSum += k; killCount++; }
    }
  }
  const avgKills = killCount > 0 ? killSum / killCount : 0;
  // Use higher thresholds to only show truly significant moments
  const significantKillThreshold = Math.max(10000, avgKills * 3); // Must be 3x average or 10k+
  const veryHighMultiplierThreshold = 4.0; // Only show multipliers of 4x or higher

  // Helper: compute total damage reduction from modifier list
  const sumDamageReduction = (mods: unknown) => {
    if (!mods || !Array.isArray(mods)) return 0;
    let total = 0;
    for (const m of mods as Array<{ magnitude: number; subject: string }>) {
      if (m.magnitude < 0 && (m.subject === 'incoming' || m.subject === 'enemyOutgoing')) {
        total += Math.abs(m.magnitude);
      }
    }
    return total * 100;
  };

  for (const turn of turns) {
    // Only show truly significant big hits
    for (const action of turn.actions) {
      const kills = action.components.finalKills;
      const isSkill = action.actionType === 'Skill';
      const multiplier = action.components.actionMultiplier ?? 1;
      const hasVeryHighMultiplier = multiplier >= veryHighMultiplierThreshold;
      const isSignificantKill = kills > significantKillThreshold;

      // Only show if it's a significant skill hit OR a very high multiplier attack with significant kills
      // Skills must have significant kills to be shown (not just any skill)
      const isSignificantSkill = isSkill && isSignificantKill;
      const isSignificantAttack = hasVeryHighMultiplier && isSignificantKill;

      if (isSignificantSkill || isSignificantAttack) {
        const side = action.side === 'attacker' ? (playerIsAttacker ? 'Rally' : 'Defender') : (playerIsAttacker ? 'Defender' : 'Rally');
        const actionDesc = isSkill
          ? 'Skill'
          : `Attack × ${(multiplier * 100).toFixed(0)}%`;

        moments.push({
          turn: turn.turn,
          type: 'bigSkill',
          message: `Turn ${turn.turn}: ${actionDesc} removed ${kills.toLocaleString()} troops from ${side}`
        });
      }
    }

    // Damage reduction checks - only show significant reductions (15%+)
    const rallyMods = playerIsAttacker ? turn.startModifiers?.attacker : turn.startModifiers?.defender;
    const defenderMods = playerIsAttacker ? turn.startModifiers?.defender : turn.startModifiers?.attacker;
    const prevTurn = turnByNumber.get(turn.turn - 1);

    const rallyReduction = sumDamageReduction(rallyMods);
    // Only show if reduction is significant (15%+) and either first turn or increased substantially (5%+)
    if (rallyReduction >= 15) {
      const prevRallyMods = prevTurn ? (playerIsAttacker ? prevTurn.startModifiers?.attacker : prevTurn.startModifiers?.defender) : undefined;
      const prevRallyReduction = sumDamageReduction(prevRallyMods);
      if (turn.turn === 1 || rallyReduction > prevRallyReduction + 5) {
        moments.push({
          turn: turn.turn,
          type: 'damageReduction',
          message: `Turn ${turn.turn}: Damage reduction active reduced incoming damage to Rally by ~${rallyReduction.toFixed(0)}%`
        });
      }
    }

    const defenderReduction = sumDamageReduction(defenderMods);
    // Only show if reduction is significant (15%+) and either first turn or increased substantially (5%+)
    if (defenderReduction >= 15) {
      const prevDefMods = prevTurn ? (playerIsAttacker ? prevTurn.startModifiers?.defender : prevTurn.startModifiers?.attacker) : undefined;
      const prevDefReduction = sumDamageReduction(prevDefMods);
      if (turn.turn === 1 || defenderReduction > prevDefReduction + 5) {
        moments.push({
          turn: turn.turn,
          type: 'damageReduction',
          message: `Turn ${turn.turn}: Damage reduction active reduced incoming damage to Defender by ~${defenderReduction.toFixed(0)}%`
        });
      }
    }

    // Front line collapse
    if (prevTurn) {
      const rallyInfantry = playerIsAttacker ? turn.attackerTroops?.Infantry ?? 0 : turn.defenderTroops?.Infantry ?? 0;
      const defenderInfantry = playerIsAttacker ? turn.defenderTroops?.Infantry ?? 0 : turn.attackerTroops?.Infantry ?? 0;
      const prevRallyInfantry = playerIsAttacker ? prevTurn.attackerTroops?.Infantry ?? 0 : prevTurn.defenderTroops?.Infantry ?? 0;
      const prevDefenderInfantry = playerIsAttacker ? prevTurn.defenderTroops?.Infantry ?? 0 : prevTurn.attackerTroops?.Infantry ?? 0;

      if (prevRallyInfantry > 0 && rallyInfantry === 0) {
        moments.push({
          turn: turn.turn,
          type: 'frontlineCollapse',
          message: `Turn ${turn.turn}: Rally front line collapsed (Infantry reached 0) → backline got exposed`
        });
      }
      if (prevDefenderInfantry > 0 && defenderInfantry === 0) {
        moments.push({
          turn: turn.turn,
          type: 'frontlineCollapse',
          message: `Turn ${turn.turn}: Defender front line collapsed (Infantry reached 0) → backline got exposed`
        });
      }
    }
  }

  return moments;
}
