/**
 * Unit tests for requireAuth and optionalAuth
 */

import { describe, expect, it, vi } from 'vitest';
import { requireAuth, optionalAuth } from '../auth';
import { ApiError } from '../apiErrorHandler';
import { verifyAuthToken } from '@/server/auth/auth';

vi.mock('@/server/auth/auth', () => ({
  verifyAuthToken: vi.fn(),
}));

function createRequest(cookieValue: string | undefined): Parameters<typeof requireAuth>[0] {
  return {
    cookies: {
      get: (name: string) =>
        name === 'auth_token' && cookieValue !== undefined ? { name: 'auth_token', value: cookieValue } : undefined,
    },
  } as unknown as Parameters<typeof requireAuth>[0];
}

describe('requireAuth', () => {
  it('throws ApiError with MISSING_TOKEN when cookie is absent', async () => {
    const req = createRequest(undefined);
    await expect(requireAuth(req)).rejects.toThrow(ApiError);
    await expect(requireAuth(req)).rejects.toMatchObject({
      statusCode: 401,
      code: 'MISSING_TOKEN',
    });
  });

  it('throws ApiError with INVALID_TOKEN when verifyAuthToken throws', async () => {
    vi.mocked(verifyAuthToken).mockRejectedValue(new Error('invalid'));
    const req = createRequest('bad-token');
    await expect(requireAuth(req)).rejects.toThrow(ApiError);
    await expect(requireAuth(req)).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
    vi.mocked(verifyAuthToken).mockReset();
  });

  it('returns AuthResult when token is valid', async () => {
    vi.mocked(verifyAuthToken).mockResolvedValue({
      id: 'user-1',
      email: 'u@example.com',
      username: 'user1',
    });
    const req = createRequest('valid-token');
    const auth = await requireAuth(req);
    expect(auth).toEqual({
      userId: 'user-1',
      email: 'u@example.com',
      username: 'user1',
    });
    vi.mocked(verifyAuthToken).mockReset();
  });
});

describe('optionalAuth', () => {
  it('returns null when cookie is absent', async () => {
    const req = createRequest(undefined);
    const result = await optionalAuth(req);
    expect(result).toBeNull();
  });

  it('returns null when verifyAuthToken throws', async () => {
    vi.mocked(verifyAuthToken).mockRejectedValue(new Error('invalid'));
    const req = createRequest('bad-token');
    const result = await optionalAuth(req);
    expect(result).toBeNull();
    vi.mocked(verifyAuthToken).mockReset();
  });

  it('returns AuthResult when token is valid', async () => {
    vi.mocked(verifyAuthToken).mockResolvedValue({
      id: 'user-2',
      email: 'u2@example.com',
      username: 'user2',
    });
    const req = createRequest('valid-token');
    const result = await optionalAuth(req);
    expect(result).toEqual({
      userId: 'user-2',
      email: 'u2@example.com',
      username: 'user2',
    });
    vi.mocked(verifyAuthToken).mockReset();
  });
});
