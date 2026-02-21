import { describe, expect, it } from 'vitest';
import { parseReportText } from '../parseReportText';

describe('parseReportText', () => {
  it('parses attacker win', () => {
    const { parsed } = parseReportText('Attacker wins! Battle ended in 15 turns.');
    expect(parsed.winner).toBe('attacker');
    expect(parsed.turnCount).toBe(15);
  });

  it('parses defender win', () => {
    const { parsed } = parseReportText('Defender victory. You lose.');
    expect(parsed.winner).toBe('defender');
  });

  it('parses turn count from "Turns: 20"', () => {
    const { parsed } = parseReportText('Summary. Turns: 20.');
    expect(parsed.turnCount).toBe(20);
  });

  it('returns empty parsed when no patterns match', () => {
    const { parsed } = parseReportText('Some random text with no battle keywords');
    expect(parsed.winner).toBeUndefined();
  });
});
