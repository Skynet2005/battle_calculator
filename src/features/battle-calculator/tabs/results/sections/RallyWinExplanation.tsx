/**
 * Rally Win Explanation Section
 *
 * Rally-specific win explanation component following Whiteout Survival notes.
 * Shows "Why this rally won" with 3 key bullets:
 * 1. Rally damage vs Defender durability
 * 2. Defender damage vs Rally durability
 * 3. Targeting outcome
 */

import { useMemo } from 'react';
import type { BattleReport } from '@/domain/battle/engine/types';
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
  const analysis = useMemo(() => {
    const playerIsAtt = player.role === 'attacker';
    const { winner: w } = resolveOutcome(player.role, fightResult);

    const playerFinal = playerIsAtt ? fightResult.attackerRemaining : fightResult.defenderRemaining;
    const opponentFinal = playerIsAtt ? fightResult.defenderRemaining : fightResult.attackerRemaining;
    const pSurvivors = totalTroops(playerFinal);
    const oSurvivors = totalTroops(opponentFinal);

    let pDmg = 0, oDmg = 0;
    let wTurn: number | null = null;
    const casByType = { infantry: 0, lancer: 0, marksman: 0 };

    for (let i = 0; i < fightResult.rounds.length; i++) {
      const round = fightResult.rounds[i];
      const pCas = playerIsAtt ? round.defenderCasualties : round.attackerCasualties;
      const oCas = playerIsAtt ? round.attackerCasualties : round.defenderCasualties;
      pDmg += (pCas.infantry ?? 0) + (pCas.lancer ?? 0) + (pCas.marksman ?? 0);
      oDmg += (oCas.infantry ?? 0) + (oCas.lancer ?? 0) + (oCas.marksman ?? 0);
      casByType.infantry += playerIsAtt ? (round.attackerCasualties.infantry ?? 0) : (round.defenderCasualties.infantry ?? 0);
      casByType.lancer += playerIsAtt ? (round.attackerCasualties.lancer ?? 0) : (round.defenderCasualties.lancer ?? 0);
      casByType.marksman += playerIsAtt ? (round.attackerCasualties.marksman ?? 0) : (round.defenderCasualties.marksman ?? 0);
      if (wTurn === null && (totalTroops(round.attackerRemaining) === 0 || totalTroops(round.defenderRemaining) === 0)) {
        wTurn = i + 1;
      }
    }

    const maxLossType = (Object.entries(casByType) as [string, number][]).reduce(
      (max, [type, count]) => count > max[1] ? [type, count] : max, ['infantry', 0] as [string, number]
    )[0];

    const bullets: string[] = [];
    if (w === 'player') {
      bullets.push(`Your rally hit harder than the defender could withstand (removed ${pDmg.toLocaleString()} troops vs ${oDmg.toLocaleString()} removed from you).`);
      bullets.push(`The defender couldn't remove your troops fast enough (you ended with ${pSurvivors.toLocaleString()} troops remaining).`);
    } else if (w === 'opponent') {
      bullets.push(`The defender's damage output exceeded your rally's durability (removed ${oDmg.toLocaleString()} troops vs ${pDmg.toLocaleString()} removed from them).`);
      bullets.push(`The defender removed your troops faster than you could remove theirs (you ended with ${pSurvivors.toLocaleString()} vs ${oSurvivors.toLocaleString()} remaining).`);
    } else {
      bullets.push(`Damage output was relatively balanced (${pDmg.toLocaleString()} vs ${oDmg.toLocaleString()} troops removed).`);
      bullets.push(`Both sides had similar troop counts remaining (${pSurvivors.toLocaleString()} vs ${oSurvivors.toLocaleString()}).`);
    }
    if (maxLossType === 'infantry') {
      bullets.push(`Most incoming damage hit your front line (Infantry), so your backline (Lancers/Marksmen) stayed relatively intact.`);
    } else {
      bullets.push(`Damage distribution: Most losses were in ${maxLossType} (${casByType[maxLossType as keyof typeof casByType].toLocaleString()} lost).`);
    }

    const outcomeWord = w === 'player' ? 'won' : w === 'opponent' ? 'lost' : 'drew';
    const agent = w === 'player' ? 'your rally' : w === 'opponent' ? 'the defender' : 'both sides';
    const reason = w === 'player' ? "removed the defender's troops faster than they removed yours" : w === 'opponent' ? 'removed your troops faster than you removed theirs' : 'removed troops at similar rates';
    const ending = wTurn
      ? `By Turn ${wTurn}, ${w === 'player' ? 'the defender reached 0 troops remaining' : w === 'opponent' ? 'your rally reached 0 troops remaining' : 'both sides still had troops'}.`
      : `After ${fightResult.rounds.length} turns, ${w === 'player' ? `you had ${pSurvivors.toLocaleString()} remaining while the defender had ${oSurvivors.toLocaleString()}` : w === 'opponent' ? `the defender had ${oSurvivors.toLocaleString()} remaining while you had ${pSurvivors.toLocaleString()}` : `both sides had similar troop counts (${pSurvivors.toLocaleString()} vs ${oSurvivors.toLocaleString()})`}.`;

    const winExplanation = `You ${outcomeWord} because ${agent} ${reason}. ${ending}`;
    const accent = w === 'player' ? 'text-emerald-300' : 'text-rose-300';
    const borderColor = w === 'player' ? 'border-emerald-400/30' : 'border-rose-400/30';
    const bgColor = w === 'player' ? 'bg-emerald-500/10' : 'bg-rose-500/10';

    return { winner: w, bullets, winExplanation, accent, borderColor, bgColor };
  }, [player.role, fightResult]);

  const { winner, bullets, winExplanation, accent, borderColor, bgColor } = analysis;

  if (winner === 'stalemate') {
    return null;
  }

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
