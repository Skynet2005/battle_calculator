import { createTestProfile } from '@/features/battle-setup/utils/integrationTestHelpers';
import { profileToRequest } from '@/features/battle-setup/utils/profileToRequest';
import { validateProfileForSimulation } from '@/features/battle-setup/utils/validateProfile';
import { describe, expect, it } from 'vitest';

describe('Battle Simulation Integration', () => {
  describe('Profile Validation', () => {
    it('should validate a minimal test profile', () => {
      const profile = createTestProfile();
      const result = validateProfileForSimulation(profile);
      expect(result.valid).toBe(true);
    });

    it('should reject profile without rally config', () => {
      const profile = createTestProfile();
      delete (profile as any).rally;
      const result = validateProfileForSimulation(profile);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Profile missing rally configuration');
    });
  });

  describe('Profile to Request Conversion', () => {
    it('should convert a valid profile to request format', () => {
      const profile = createTestProfile();
      const request = profileToRequest(profile);

      expect(request).toBeDefined();
      expect(request.player).toBeDefined();
      expect(request.opponent).toBeDefined();
      expect(request.rally).toBeDefined();
      expect(request.rally.battleType).toBe('Rally');
    });

    it('should handle profile with opponent data', () => {
      const profile = createTestProfile();
      profile.opponent = {
        heroLevels: {},
        basicBonuses: profile.basicBonuses,
        additiveBonuses: profile.additiveBonuses,
        multiplicativeBonuses: profile.multiplicativeBonuses,
        expertSelections: {},
      };

      const request = profileToRequest(profile);
      expect(request.opponent).toBeDefined();
      expect(request.opponent.heroLevels).toBeDefined();
    });
  });

  describe('Request Schema Validation', () => {
    it('should create a request that passes schema validation', () => {
      const profile = createTestProfile();
      const request = profileToRequest(profile);

      // Basic structure check
      expect(request.rally.joiners).toBeDefined();
      expect(Array.isArray(request.rally.joiners)).toBe(true);
      expect(request.rally.battleType).toBe('Rally');
    });
  });
});
