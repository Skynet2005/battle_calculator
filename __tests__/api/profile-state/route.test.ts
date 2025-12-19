import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database module
vi.mock('@/lib/db/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
  migrationsReady: Promise.resolve(),
}));

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  verifyAuthToken: vi.fn(),
}));

// Import after mocking
import { GET, POST } from '@/app/api/profile-state/route';
import { verifyAuthToken } from '@/lib/auth';
import { db } from '@/lib/db/db';

describe('/api/profile-state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body?: unknown, token?: string) => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const req = new NextRequest('http://localhost:3000/api/profile-state', {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Mock the cookies
    if (token) {
      Object.defineProperty(req, 'cookies', {
        value: {
          get: vi.fn((name: string) => name === 'auth_token' ? { value: token } : undefined),
        },
      });
    } else {
      Object.defineProperty(req, 'cookies', {
        value: {
          get: vi.fn(() => undefined),
        },
      });
    }

    return req;
  };

  describe('GET', () => {
    it('should return 401 if no auth token is provided', async () => {
      const req = createRequest('GET');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth token is invalid', async () => {
      vi.mocked(verifyAuthToken).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('GET', undefined, 'invalid-token');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return null currentProfileId when no settings exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const req = createRequest('GET', undefined, 'valid-token');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.currentProfileId).toBeNull();
    });

    it('should return currentProfileId when settings exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ currentProfileId: 'profile-456' }]),
          }),
        }),
      } as any);

      const req = createRequest('GET', undefined, 'valid-token');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.currentProfileId).toBe('profile-456');
    });
  });

  describe('POST', () => {
    it('should return 401 if no auth token is provided', async () => {
      const req = createRequest('POST', { currentProfileId: 'profile-123' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth token is invalid', async () => {
      vi.mocked(verifyAuthToken).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('POST', { currentProfileId: 'profile-123' }, 'invalid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if currentProfileId is not a string', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const req = createRequest('POST', { currentProfileId: 12345 }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid currentProfileId');
    });

    it('should return 404 if profile does not exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // First call for profile validation returns empty (not found)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const req = createRequest('POST', { currentProfileId: 'nonexistent-profile' }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should return 404 if profile belongs to different user', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Profile validation returns empty because user ID does not match
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const req = createRequest('POST', { currentProfileId: 'other-users-profile' }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should create new settings if none exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCallCount++;
              // First call: profile check (returns profile found)
              // Second call: user settings check (returns empty - no settings)
              if (selectCallCount === 1) {
                return Promise.resolve([{ id: 'profile-123' }]);
              }
              return Promise.resolve([]);
            }),
          })),
        })),
      } as any));

      const mockInsertValues = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: mockInsertValues,
      } as any);

      const req = createRequest('POST', { currentProfileId: 'profile-123' }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should update existing settings', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCallCount++;
              // First call: profile check (returns profile found)
              // Second call: user settings check (returns existing settings)
              if (selectCallCount === 1) {
                return Promise.resolve([{ id: 'profile-123' }]);
              }
              return Promise.resolve([{ userId: 'user-123' }]);
            }),
          })),
        })),
      } as any));

      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({
        set: mockUpdateSet,
      } as any);

      const req = createRequest('POST', { currentProfileId: 'profile-123' }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it('should allow setting currentProfileId to null', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // When setting to null, only user settings are checked (no profile validation)
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ userId: 'user-123' }]),
          }),
        }),
      } as any);

      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({
        set: mockUpdateSet,
      } as any);

      const req = createRequest('POST', { currentProfileId: null }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('should handle missing currentProfileId in body (treated as null)', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ userId: 'user-123' }]),
          }),
        }),
      } as any);

      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({
        set: mockUpdateSet,
      } as any);

      const req = createRequest('POST', {}, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });
});
