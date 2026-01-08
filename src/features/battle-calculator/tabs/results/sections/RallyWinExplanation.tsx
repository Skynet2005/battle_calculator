/**
 * Rally Win Explanation Section
 *
 * Rally-specific win explanation component following Whiteout Survival notes.
 * Shows "Why this rally won" with 3 key bullets:
 * 1. Rally damage vs Defender durability
 * 2. Defender damage vs Rally durability
 * 3. Targeting outcome
 */

import type { BattleReport } from '@/domain/combat/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import { totalTroops } from '@/domain/rally/combat-fighter';
import { resolveOutcome } from '@/features/battle-calculator/utils/rally-outcome';
import { SectionCard } from '@/shared/ui';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';

interface RallyWinExplanationProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
  fightResult: FightResult;
  battleReport: BattleReport | null;
}

export function RallyWinExplanation({
  player,
  opponent,
  fightResult,
  battleReport
}: RallyWinExplanationProps) {
  const playerIsAttacker = player.role === 'attacker';
  const { winner } = resolveOutcome(player.role, fightResult);

  const playerFinal = playerIsAttacker ? fightResult.attackerRemaining : fightResult.defenderRemaining;
  const opponentFinal = playerIsAttacker ? fightResult.defenderRemaining : fightResult.attackerRemaining;
  const playerSurvivors = totalTroops(playerFinal);
  const opponentSurvivors = totalTroops(opponentFinal);

  // Calculate total damage dealt by each side
  const playerTotalDamage = fightResult.rounds.reduce((sum, round) => {
    const damage = playerIsAttacker ? round.defenderCasualties : round.attackerCasualties;
    return sum + (damage.infantry ?? 0) + (damage.lancer ?? 0) + (damage.marksman ?? 0);
  }, 0);

  const opponentTotalDamage = fightResult.rounds.reduce((sum, round) => {
    const damage = playerIsAttacker ? round.attackerCasualties : round.defenderCasualties;
    return sum + (damage.infantry ?? 0) + (damage.lancer ?? 0) + (damage.marksman ?? 0);
  }, 0);

  // Find the turn where one side reached zero (if any)
  let winningTurn: number | null = null;
  for (let i = 0; i < fightResult.rounds.length; i++) {
    const round = fightResult.rounds[i];
    const attackerRemaining = totalTroops(round.attackerRemaining);
    const defenderRemaining = totalTroops(round.defenderRemaining);
    if (attackerRemaining === 0 || defenderRemaining === 0) {
      winningTurn = i + 1;
      break;
    }
  }

  // Analyze targeting - which troop type took most damage
  const playerCasualtiesByType = {
    infantry: fightResult.rounds.reduce((sum, r) => sum + (playerIsAttacker ? r.attackerCasualties.infantry ?? 0 : r.defenderCasualties.infantry ?? 0), 0),
    lancer: fightResult.rounds.reduce((sum, r) => sum + (playerIsAttacker ? r.attackerCasualties.lancer ?? 0 : r.defenderCasualties.lancer ?? 0), 0),
    marksman: fightResult.rounds.reduce((sum, r) => sum + (playerIsAttacker ? r.attackerCasualties.marksman ?? 0 : r.defenderCasualties.marksman ?? 0), 0)
  };

  const maxPlayerLossType = Object.entries(playerCasualtiesByType).reduce((max, [type, count]) =>
    count > max[1] ? [type, count] : max, ['infantry', 0] as [string, number]
  )[0];

  // Generate the 3 key bullets
  const bullets: string[] = [];

  // 1. Rally damage vs Defender durability
  if (winner === 'player') {
    bullets.push(`Your rally hit harder than the defender could withstand (removed ${playerTotalDamage.toLocaleString()} troops vs ${opponentTotalDamage.toLocaleString()} removed from you).`);
  } else if (winner === 'opponent') {
    bullets.push(`The defender's damage output exceeded your rally's durability (removed ${opponentTotalDamage.toLocaleString()} troops vs ${playerTotalDamage.toLocaleString()} removed from them).`);
  } else {
    bullets.push(`Damage output was relatively balanced (${playerTotalDamage.toLocaleString()} vs ${opponentTotalDamage.toLocaleString()} troops removed).`);
  }

  // 2. Defender damage vs Rally durability
  if (winner === 'player') {
    bullets.push(`The defender couldn't remove your troops fast enough (you ended with ${playerSurvivors.toLocaleString()} troops remaining).`);
  } else if (winner === 'opponent') {
    bullets.push(`The defender removed your troops faster than you could remove theirs (you ended with ${playerSurvivors.toLocaleString()} vs ${opponentSurvivors.toLocaleString()} remaining).`);
  } else {
    bullets.push(`Both sides had similar troop counts remaining (${playerSurvivors.toLocaleString()} vs ${opponentSurvivors.toLocaleString()}).`);
  }

  // 3. Targeting outcome
  if (maxPlayerLossType === 'infantry') {
    bullets.push(`Most incoming damage hit your front line (Infantry), so your backline (Lancers/Marksmen) stayed relatively intact.`);
  } else {
    bullets.push(`Damage distribution: Most losses were in ${maxPlayerLossType} (${playerCasualtiesByType[maxPlayerLossType as keyof typeof playerCasualtiesByType].toLocaleString()} lost).`);
  }

  // Generate simple win explanation sentence
  const winExplanation = winningTurn
    ? `You ${winner === 'player' ? 'won' : winner === 'opponent' ? 'lost' : 'drew'} because ${winner === 'player' ? 'your rally' : winner === 'opponent' ? 'the defender' : 'both sides'} ${winner === 'player' ? 'removed the defender\'s troops faster than they removed yours' : winner === 'opponent' ? 'removed your troops faster than you removed theirs' : 'removed troops at similar rates'}. ${winningTurn ? `By Turn ${winningTurn}, ${winner === 'player' ? 'the defender reached 0 troops remaining' : winner === 'opponent' ? 'your rally reached 0 troops remaining' : 'both sides still had troops'}.` : ''}`
    : `You ${winner === 'player' ? 'won' : winner === 'opponent' ? 'lost' : 'drew'} because ${winner === 'player' ? 'your rally' : winner === 'opponent' ? 'the defender' : 'both sides'} ${winner === 'player' ? 'removed the defender\'s troops faster than they removed yours' : winner === 'opponent' ? 'removed your troops faster than you removed theirs' : 'removed troops at similar rates'}. After ${fightResult.rounds.length} turns, ${winner === 'player' ? `you had ${playerSurvivors.toLocaleString()} troops remaining while the defender had ${opponentSurvivors.toLocaleString()}` : winner === 'opponent' ? `the defender had ${opponentSurvivors.toLocaleString()} troops remaining while you had ${playerSurvivors.toLocaleString()}` : `both sides had similar troop counts (${playerSurvivors.toLocaleString()} vs ${opponentSurvivors.toLocaleString()})`}.`;

  if (winner === 'stalemate') {
    return null; // Don't show explanation for stalemates
  }

  const accent = winner === 'player' ? 'text-emerald-300' : 'text-rose-300';
  const borderColor = winner === 'player' ? 'border-emerald-400/30' : 'border-rose-400/30';
  const bgColor = winner === 'player' ? 'bg-emerald-500/10' : 'bg-rose-500/10';

  return (
    <SectionCard
      title={`Why this rally ${winner === 'player' ? 'won' : 'lost'}`}
      description={winExplanation}
      className={`mt-6 space-y-4 border ${borderColor} ${bgColor}`}
    >
      <div>
        <div className={`text-lg font-bold ${accent} mb-3`}>
          {winner === 'player' ? 'Rally Victory' : 'Rally Defeat'}
        </div>
      </div>

      <div className="space-y-2">
        {bullets.map((bullet, idx) => (
          <div key={idx} className="flex gap-2 items-start text-sm text-gray-100">
            <span className="mt-[2px] text-gray-400">•</span>
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
