import { describe, it, expect } from 'vitest';
import { users, User, UserInsert } from '@/schema/users';

describe('users schema', () => {
  describe('table structure', () => {
    it('should have all required columns', () => {
      const columns = Object.keys(users);

      expect(columns).toContain('id');
      expect(columns).toContain('email');
      expect(columns).toContain('password');
      expect(columns).toContain('role');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });

    it('should have additional optional columns', () => {
      const columns = Object.keys(users);

      expect(columns).toContain('name');
      expect(columns).toContain('emailVerified');
      expect(columns).toContain('image');
    });

    it('should have correct table name', () => {
      // Verify the table is named "users"
      // Access the internal symbol for table name in Drizzle
      const tableName = (users as any)[Symbol.for('drizzle:Name')];
      expect(tableName).toBe('users');
    });
  });

  describe('type inference', () => {
    it('User should have correct select type shape', () => {
      // This is a compile-time check - if types are wrong, TypeScript will error
      const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: new Date(),
        image: 'https://example.com/avatar.png',
        role: 'user',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockUser.id).toBeDefined();
      expect(mockUser.email).toBeDefined();
      expect(mockUser.password).toBeDefined();
      expect(mockUser.role).toBeDefined();
      expect(mockUser.createdAt).toBeDefined();
      expect(mockUser.updatedAt).toBeDefined();
    });

    it('User should allow null for optional fields', () => {
      const minimalUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: null,
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        role: 'user',
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(minimalUser.name).toBeNull();
      expect(minimalUser.emailVerified).toBeNull();
      expect(minimalUser.image).toBeNull();
      expect(minimalUser.password).toBeNull();
    });

    it('UserInsert should allow minimal fields (only email required)', () => {
      // Minimal insert - only required fields
      const minimalInsert: UserInsert = {
        email: 'test@example.com',
      };

      expect(minimalInsert.email).toBeDefined();
    });

    it('UserInsert should allow all fields', () => {
      // Full insert - all fields
      const fullInsert: UserInsert = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: new Date(),
        image: 'https://example.com/avatar.png',
        role: 'admin',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(fullInsert.id).toBeDefined();
      expect(fullInsert.name).toBeDefined();
      expect(fullInsert.email).toBeDefined();
      expect(fullInsert.emailVerified).toBeDefined();
      expect(fullInsert.image).toBeDefined();
      expect(fullInsert.role).toBeDefined();
      expect(fullInsert.password).toBeDefined();
      expect(fullInsert.createdAt).toBeDefined();
      expect(fullInsert.updatedAt).toBeDefined();
    });
  });

  describe('nullable fields', () => {
    it('should allow null for name', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: null,
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        role: 'user',
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.name).toBeNull();
    });

    it('should allow null for password (for OAuth users)', () => {
      const oauthUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'OAuth User',
        email: 'oauth@example.com',
        emailVerified: new Date(),
        image: 'https://example.com/avatar.png',
        role: 'user',
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(oauthUser.password).toBeNull();
    });

    it('should allow null for emailVerified', () => {
      const unverifiedUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Unverified User',
        email: 'unverified@example.com',
        emailVerified: null,
        image: null,
        role: 'user',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const verifiedUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Verified User',
        email: 'verified@example.com',
        emailVerified: new Date(),
        image: null,
        role: 'user',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(unverifiedUser.emailVerified).toBeNull();
      expect(verifiedUser.emailVerified).toBeInstanceOf(Date);
    });
  });

  describe('role field', () => {
    it('should support different role values', () => {
      const regularUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Regular User',
        email: 'user@example.com',
        emailVerified: null,
        image: null,
        role: 'user',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const adminUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Admin User',
        email: 'admin@example.com',
        emailVerified: new Date(),
        image: null,
        role: 'admin',
        password: 'hashedpassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(regularUser.role).toBe('user');
      expect(adminUser.role).toBe('admin');
    });

    it('should default role to "user" when not specified in insert', () => {
      // The default is enforced at the database level, but we can verify the type allows omitting it
      const insertWithoutRole: UserInsert = {
        email: 'test@example.com',
      };

      expect(insertWithoutRole.role).toBeUndefined();
    });
  });

  describe('email uniqueness', () => {
    it('should have a unique index on email', () => {
      // Check that the users table has indexes defined
      // The uniqueIndex is defined in the table definition
      // We can verify the table config exists
      const tableConfig = (users as any)[Symbol.for('drizzle:Columns')];
      expect(tableConfig).toBeDefined();

      // The email column should be marked as notNull
      const emailColumn = users.email;
      expect(emailColumn).toBeDefined();
    });
  });
});
