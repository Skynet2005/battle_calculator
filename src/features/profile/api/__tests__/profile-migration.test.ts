/**
 * Unit tests for profile migration
 */

import { describe, expect, it } from 'vitest';
import { migrateProfile, type LegacyProfile } from '../profile-migration';

describe('migrateProfile', () => {
  it('returns expected shape for minimal valid profile', () => {
    const minimal: LegacyProfile = {
      id: 'test-id',
      name: 'Test',
      createdAt: 1000,
      updatedAt: 2000,
      rally: {
        leader: { infantry: null, lancer: null, marksman: null },
        joiners: [],
        capacity: { infantry: [], lancer: [], marksman: [] },
      },
    };
    const result = migrateProfile(minimal);
    expect(result).toBeDefined();
    expect(result.id).toBe('test-id');
    expect(result.name).toBe('Test');
    expect(result.rally).toBeDefined();
    expect(result.rally.leader).toBeDefined();
    expect(result.rally.joiners).toEqual([]);
    expect(result.heroLevels).toBeDefined();
    expect(result.basicBonuses).toBeDefined();
    expect(result.expertSelections).toBeDefined();
    expect(result.additiveBonuses).toBeDefined();
    expect(result.multiplicativeBonuses).toBeDefined();
  });

  it('migrates legacy expertSelections (old format) to new format', () => {
    const legacy: LegacyProfile = {
      id: 'legacy-id',
      name: 'Legacy',
      expertSelections: { cyrille: 10, agnes: 5 },
    };
    const result = migrateProfile(legacy);
    expect(result.expertSelections).toEqual({
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      deploymentCapacity: 0,
      rallyCapacity: 0,
    });
  });

  it('preserves new-format expertSelections', () => {
    const withNewFormat: LegacyProfile = {
      id: 'new-id',
      name: 'New',
      expertSelections: {
        attack: 10,
        defense: 20,
        lethality: 5,
        health: 15,
        deploymentCapacity: 0,
        rallyCapacity: 5,
      },
    };
    const result = migrateProfile(withNewFormat);
    expect(result.expertSelections).toEqual({
      attack: 10,
      defense: 20,
      lethality: 5,
      health: 15,
      deploymentCapacity: 0,
      rallyCapacity: 5,
    });
  });

  it('handles missing optional fields with defaults', () => {
    const empty: LegacyProfile = {};
    const result = migrateProfile(empty);
    expect(result.rally).toBeDefined();
    expect(result.rally.troopMix).toBeDefined();
    expect(result.opponent).toBeDefined();
    expect(result.additiveBonuses).toBeDefined();
    expect(result.multiplicativeBonuses).toBeDefined();
  });
});
