/**
 * Unit tests for API validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  registerSchema,
  updateUserSchema,
  profileStateSchema,
  joinerSearchQuerySchema,
  createProfileSchema,
} from '../schemas';

describe('loginSchema', () => {
  it('accepts valid username and password', () => {
    const result = loginSchema.safeParse({ username: 'user', password: 'secret' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ username: 'user', password: 'secret' });
    }
  });

  it('rejects empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ username: 'user', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validPassword = 'ValidPass1!';

  it('accepts valid email, username, password', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      username: 'alice',
      password: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      username: 'alice',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      username: 'alice',
      password: 'alllower1!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      username: 'alice',
      password: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it('rejects username shorter than 3 characters', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.com',
      username: 'ab',
      password: validPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  const validPassword = 'ValidPass1!';

  it('accepts username only', () => {
    const result = updateUserSchema.safeParse({ username: 'newname' });
    expect(result.success).toBe(true);
  });

  it('accepts email only', () => {
    const result = updateUserSchema.safeParse({ email: 'new@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects password change without currentPassword', () => {
    const result = updateUserSchema.safeParse({
      newPassword: validPassword,
    });
    expect(result.success).toBe(false);
  });

  it('accepts password change with current and new', () => {
    const result = updateUserSchema.safeParse({
      currentPassword: 'OldPass1!',
      newPassword: validPassword,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty object', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('profileStateSchema', () => {
  it('accepts null currentProfileId', () => {
    const result = profileStateSchema.safeParse({ currentProfileId: null });
    expect(result.success).toBe(true);
  });

  it('accepts valid UUID', () => {
    const result = profileStateSchema.safeParse({
      currentProfileId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = profileStateSchema.safeParse({
      currentProfileId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('joinerSearchQuerySchema', () => {
  it('accepts empty object and applies defaults', () => {
    const result = joinerSearchQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts query, limit, heroClass', () => {
    const result = joinerSearchQuerySchema.safeParse({
      query: 'Jessie',
      limit: 10,
      heroClass: 'marksman',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        query: 'Jessie',
        limit: 10,
        heroClass: 'marksman',
      });
    }
  });

  it('rejects invalid heroClass', () => {
    const result = joinerSearchQuerySchema.safeParse({
      heroClass: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('createProfileSchema', () => {
  it('accepts valid name and data', () => {
    const result = createProfileSchema.safeParse({
      name: 'My Profile',
      data: { player: {} },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createProfileSchema.safeParse({
      name: '',
      data: {},
    });
    expect(result.success).toBe(false);
  });
});
