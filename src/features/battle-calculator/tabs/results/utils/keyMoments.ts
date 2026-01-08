/**
 * Key Moments Utility
 *
 * Extracts critical battle events from turn logs for annotation and display.
 */

import type { TurnLog } from '@/domain/combat/types';

export type KeyMoment = {
  turn: number;
  type: 'bigSkill' | 'damageReduction' | 'frontlineCollapse';
  message: string;
};

export function extractKeyMoments(turns: TurnLog[], playerIsAttacker: boolean): KeyMoment[] {
  const moments: KeyMoment[] = [];

  // Calculate average kills per action to identify unusually high damage
  const allKills = turns.flatMap(t => t.actions.map(a => a.components.finalKills)).filter(k => k > 0);
  const avgKills = allKills.length > 0 ? allKills.reduce((a, b) => a + b, 0) / allKills.length : 0;
  const highKillThreshold = Math.max(5000, avgKills * 2); // At least 2x average or 5000, whichever is higher

  // Find big hits (skill hits or high-damage normal attacks)
  turns.forEach((turn) => {
    turn.actions.forEach((action) => {
      const kills = action.components.finalKills;
      const isSkill = action.actionType === 'Skill';
      const hasHighMultiplier = (action.components.actionMultiplier ?? 1) >= 2.5;
      const isHighKill = kills > highKillThreshold;

      // Detect big hits: skills, high multipliers, or unusually high kills
      if (isSkill || hasHighMultiplier || isHighKill) {
        const side = action.side === 'attacker' ? (playerIsAttacker ? 'Rally' : 'Defender') : (playerIsAttacker ? 'Defender' : 'Rally');
        const actionDesc = isSkill
          ? 'Skill'
          : hasHighMultiplier
            ? `Attack × ${((action.components.actionMultiplier ?? 1) * 100).toFixed(0)}%`
            : 'High-damage attack';

        moments.push({
          turn: turn.turn,
          type: 'bigSkill',
          message: `Turn ${turn.turn}: ${actionDesc} removed ${kills.toLocaleString()} troops from ${side}`
        });
      }
    });

    // Check for damage reduction active (check all turns, not just turn 1)
    const rallyMods = playerIsAttacker ? turn.startModifiers?.attacker : turn.startModifiers?.defender;
    const defenderMods = playerIsAttacker ? turn.startModifiers?.defender : turn.startModifiers?.attacker;

    const rallyDamageReduction = rallyMods?.filter(m =>
      m.magnitude < 0 && (m.subject === 'incoming' || m.subject === 'enemyOutgoing')
    ) || [];
    const defenderDamageReduction = defenderMods?.filter(m =>
      m.magnitude < 0 && (m.subject === 'incoming' || m.subject === 'enemyOutgoing')
    ) || [];

    // Only log damage reduction if it's significant (>5%) and either on turn 1 or newly applied
    if (rallyDamageReduction.length > 0) {
      const totalReduction = rallyDamageReduction.reduce((sum, m) => sum + Math.abs(m.magnitude), 0) * 100;
      const prevTurn = turns.find(t => t.turn === turn.turn - 1);
      const prevModifiers = prevTurn ? (playerIsAttacker ? prevTurn.startModifiers?.attacker : prevTurn.startModifiers?.defender) : undefined;
      const prevRallyReduction = prevModifiers
        ? prevModifiers.filter(m =>
            m.magnitude < 0 && (m.subject === 'incoming' || m.subject === 'enemyOutgoing')
          ).reduce((sum, m) => sum + Math.abs(m.magnitude), 0) * 100
        : 0;

      // Log if significant and either first turn or newly applied
      if (totalReduction > 5 && (turn.turn === 1 || totalReduction > prevRallyReduction + 1)) {
        moments.push({
          turn: turn.turn,
          type: 'damageReduction',
          message: `Turn ${turn.turn}: Damage reduction active reduced incoming damage to Rally by ~${totalReduction.toFixed(0)}%`
        });
      }
    }
    if (defenderDamageReduction.length > 0) {
      const totalReduction = defenderDamageReduction.reduce((sum, m) => sum + Math.abs(m.magnitude), 0) * 100;
      const prevTurn = turns.find(t => t.turn === turn.turn - 1);
      const prevDefenderModifiers = prevTurn ? (playerIsAttacker ? prevTurn.startModifiers?.defender : prevTurn.startModifiers?.attacker) : undefined;
      const prevDefenderReduction = prevDefenderModifiers
        ? prevDefenderModifiers.filter(m =>
            m.magnitude < 0 && (m.subject === 'incoming' || m.subject === 'enemyOutgoing')
          ).reduce((sum, m) => sum + Math.abs(m.magnitude), 0) * 100
        : 0;

      // Log if significant and either first turn or newly applied
      if (totalReduction > 5 && (turn.turn === 1 || totalReduction > prevDefenderReduction + 1)) {
        moments.push({
          turn: turn.turn,
          type: 'damageReduction',
          message: `Turn ${turn.turn}: Damage reduction active reduced incoming damage to Defender by ~${totalReduction.toFixed(0)}%`
        });
      }
    }

    // Check for front line collapse (Infantry reaches very low or zero)
    const rallyInfantry = playerIsAttacker ? turn.attackerTroops?.Infantry ?? 0 : turn.defenderTroops?.Infantry ?? 0;
    const defenderInfantry = playerIsAttacker ? turn.defenderTroops?.Infantry ?? 0 : turn.attackerTroops?.Infantry ?? 0;
    const prevTurn = turns.find(t => t.turn === turn.turn - 1);

    if (prevTurn) {
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
  });

  return moments;
}
