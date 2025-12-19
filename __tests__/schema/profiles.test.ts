import { describe, it, expect } from 'vitest';
import { profiles, DbProfile, DbProfileInsert } from '@/schema/profiles';

describe('profiles schema', () => {
  describe('table structure', () => {
    it('should have all required columns', () => {
      const columns = Object.keys(profiles);

      expect(columns).toContain('id');
      expect(columns).toContain('userId');
      expect(columns).toContain('name');
      expect(columns).toContain('payloadJson');
      expect(columns).toContain('inputJson');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
      expect(columns).toContain('deletedAt');
    });

    it('should have correct table name', () => {
      // Verify the table is named "profiles"
      // Access the internal symbol for table name in Drizzle
      const tableName = (profiles as any)[Symbol.for('drizzle:Name')];
      expect(tableName).toBe('profiles');
    });
  });

  describe('type inference', () => {
    it('DbProfile should have correct select type shape', () => {
      // This is a compile-time check - if types are wrong, TypeScript will error
      const mockProfile: DbProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Profile',
        payloadJson: { key: 'value' },
        inputJson: { input: 'data' },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(mockProfile.id).toBeDefined();
      expect(mockProfile.userId).toBeDefined();
      expect(mockProfile.name).toBeDefined();
      expect(mockProfile.payloadJson).toBeDefined();
      expect(mockProfile.inputJson).toBeDefined();
      expect(mockProfile.createdAt).toBeDefined();
      expect(mockProfile.updatedAt).toBeDefined();
      expect(mockProfile.deletedAt).toBeNull();
    });

    it('DbProfileInsert should allow optional fields', () => {
      // Minimal insert - only required fields
      const minimalInsert: DbProfileInsert = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Profile',
      };

      expect(minimalInsert.userId).toBeDefined();
      expect(minimalInsert.name).toBeDefined();
    });

    it('DbProfileInsert should allow all fields', () => {
      // Full insert - all fields
      const fullInsert: DbProfileInsert = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Profile',
        payloadJson: { key: 'value' },
        inputJson: { input: 'data' },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      expect(fullInsert.id).toBeDefined();
      expect(fullInsert.payloadJson).toBeDefined();
      expect(fullInsert.inputJson).toBeDefined();
      expect(fullInsert.deletedAt).toBeDefined();
    });
  });

  describe('nullable fields', () => {
    it('should allow null for payloadJson', () => {
      const profile: DbProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Profile',
        payloadJson: null,
        inputJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(profile.payloadJson).toBeNull();
    });

    it('should allow null for inputJson', () => {
      const profile: DbProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Profile',
        payloadJson: null,
        inputJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      expect(profile.inputJson).toBeNull();
    });

    it('should allow null for deletedAt (soft delete)', () => {
      const activeProfile: DbProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Active Profile',
        payloadJson: null,
        inputJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const deletedProfile: DbProfile = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Deleted Profile',
        payloadJson: null,
        inputJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      expect(activeProfile.deletedAt).toBeNull();
      expect(deletedProfile.deletedAt).toBeInstanceOf(Date);
    });
  });
});
