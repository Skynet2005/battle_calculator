/**
 * Unit tests for rally-bonus-extractor (key functions)
 */

import { describe, expect, it } from 'vitest';
import { extractJoinerBonuses } from '../rally-bonus-extractor';

describe('extractJoinerBonuses', () => {
  it('returns expected shape with zero bonuses when joiners is empty', () => {
    const result = extractJoinerBonuses([], 'attacking');

    expect(result.additive).toEqual({ attack: 0, defense: 0, lethality: 0, health: 0 });
    expect(result.multiplicative).toEqual({
      damage: 0,
      attack: 0,
      defense: 0,
      health: 0,
      lethality: 0,
      damageReduction: 0,
    });
    expect(result.perScope).toBeDefined();
    expect(result.perScope.additive).toBeDefined();
    expect(result.perScope.multiplicative).toBeDefined();
    expect(typeof result.perScope.hasTroopSpecific).toBe('boolean');
  });

  it('returns same shape for defending mode with empty joiners', () => {
    const result = extractJoinerBonuses([], 'defending');
    expect(result.additive).toEqual({ attack: 0, defense: 0, lethality: 0, health: 0 });
    expect(result.perScope.hasTroopSpecific).toBe(false);
  });
});
