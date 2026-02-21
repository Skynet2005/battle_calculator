/**
 * Minimal parser for in-game battle report pasted text.
 * Extracts winner, troop totals, remaining, turn count, lineup if present.
 */

export interface ParsedReport {
  winner?: string;
  troopTotals?: Record<string, number>;
  remaining?: Record<string, unknown>;
  turnCount?: number;
  lineupText?: string;
}

export function parseReportText(raw: string): { parsed: ParsedReport; errors: string[] } {
  const errors: string[] = [];
  const parsed: ParsedReport = {};
  const lower = raw.toLowerCase();

  if (/\battacker\s+win|attacker\s+victory|you\s+win\b/i.test(raw)) parsed.winner = 'attacker';
  else if (/\bdefender\s+win|defender\s+victory|you\s+lose\b/i.test(raw)) parsed.winner = 'defender';
  else if (/\bdraw\b/i.test(raw)) parsed.winner = 'draw';

  const turnMatch = raw.match(/(?:turn|round)s?\s*[:\s]*(\d+)/i) ?? raw.match(/(\d+)\s*(?:turn|round)/i);
  if (turnMatch) {
    const n = parseInt(turnMatch[1]!, 10);
    if (!isNaN(n)) parsed.turnCount = n;
  }

  const numbers = raw.match(/\d{1,10}/g);
  if (numbers && numbers.length >= 2) {
    const nums = numbers.map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
    if (nums.length >= 2) {
      parsed.troopTotals = { total: nums[0]!, remaining: nums[1]! };
    }
  }

  return { parsed, errors };
}
