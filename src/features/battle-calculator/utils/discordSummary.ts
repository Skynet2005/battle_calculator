/**
 * Build a Discord-ready text summary from a BattleReport (client-side).
 * Matches server buildDiscordSummary shape for consistency.
 */

import type { BattleReport, TroopCounts } from '@/domain/battle/engine/types';

function formatTroops(counts: TroopCounts | undefined): string {
  if (!counts) return '—';
  const parts: string[] = [];
  if (counts.Infantry != null) parts.push(`Infantry: ${counts.Infantry}`);
  if (counts.Lancer != null) parts.push(`Lancer: ${counts.Lancer}`);
  if (counts.Marksman != null) parts.push(`Marksman: ${counts.Marksman}`);
  return parts.length ? parts.join(', ') : '—';
}

/**
 * Returns a clean block users can paste into Discord.
 */
export function buildDiscordSummaryFromReport(report: BattleReport): string {
  const lines: string[] = ['Expedition Battle Run', ''];

  lines.push(`Winner: ${report.winner}`);
  if (typeof report.attackerWinRate === 'number') lines.push(`Attacker win rate: ${report.attackerWinRate}%`);
  if (typeof report.simulationsRun === 'number') lines.push(`Simulations: ${report.simulationsRun}`);
  const turnCount = report.turns?.length ?? report.totalTurns ?? 0;
  lines.push(`Turns: ${turnCount}`);
  lines.push('');
  lines.push('Remaining — Attacker: ' + formatTroops(report.attackerRemaining));
  lines.push('Remaining — Defender: ' + formatTroops(report.defenderRemaining));
  if (report.casualties) {
    lines.push('');
    lines.push('Casualties — Attacker: ' + formatTroops(report.casualties.attacker));
    lines.push('Casualties — Defender: ' + formatTroops(report.casualties.defender));
  }

  return '```\n' + lines.join('\n') + '\n```';
}
