/**
 * Build a Discord-ready text summary from a battle run's response summary and optional rally snapshot.
 * Safe to call with partial or unknown summary shape.
 */

export interface BattleSummaryForDiscord {
  winner?: string;
  attackerWinRate?: number;
  attackerRemaining?: Record<string, number>;
  defenderRemaining?: Record<string, number>;
  casualties?: { attacker?: Record<string, number>; defender?: Record<string, number> };
  turns?: number;
  simulationsRun?: number;
}

function formatTroops(obj: Record<string, number> | undefined): string {
  if (!obj || typeof obj !== 'object') return '—';
  const parts = Object.entries(obj)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => `${k}: ${v}`);
  return parts.length ? parts.join(', ') : '—';
}

/**
 * Returns a clean block users can paste into Discord (no rich embed; plain code block).
 */
export function buildDiscordSummary(
  responseSummary: unknown,
  _rallyConfigSnapshot?: unknown
): string {
  const s = responseSummary as BattleSummaryForDiscord | null | undefined;
  if (!s || typeof s !== 'object') {
    return '```\nBattle Run\n(No summary data)\n```';
  }

  const lines: string[] = ['Expedition Battle Run', ''];

  if (s.winner != null) lines.push(`Winner: ${String(s.winner)}`);
  if (typeof s.attackerWinRate === 'number') lines.push(`Attacker win rate: ${s.attackerWinRate}%`);
  if (typeof s.simulationsRun === 'number') lines.push(`Simulations: ${s.simulationsRun}`);
  if (typeof s.turns === 'number') lines.push(`Turns: ${s.turns}`);
  lines.push('');
  lines.push('Remaining — Attacker: ' + formatTroops(s.attackerRemaining));
  lines.push('Remaining — Defender: ' + formatTroops(s.defenderRemaining));
  if (s.casualties && (s.casualties.attacker || s.casualties.defender)) {
    lines.push('');
    lines.push('Casualties — Attacker: ' + formatTroops(s.casualties.attacker));
    lines.push('Casualties — Defender: ' + formatTroops(s.casualties.defender));
  }

  return '```\n' + lines.join('\n') + '\n```';
}
