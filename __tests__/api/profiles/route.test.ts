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
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
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
import { GET, POST } from '@/app/api/profiles/route';
import { verifyAuthToken } from '@/lib/auth';
import { db } from '@/lib/db/db';

describe('/api/profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body?: unknown, token?: string) => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const req = new NextRequest('http://localhost:3000/api/profiles', {
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

    it('should return empty profiles array when no profiles exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            // First call: profiles query (returns empty)
            // Second call: user settings query (returns empty)
            if (selectCallCount === 1) {
              return Promise.resolve([]);
            }
            return {
              limit: vi.fn().mockResolvedValue([]),
            };
          }),
        })),
      } as any));

      const req = createRequest('GET', undefined, 'valid-token');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.profiles).toEqual([]);
      expect(data.currentProfileId).toBeNull();
    });

    it('should return profiles for authenticated user', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile 1',
          data: { foo: 'bar' },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'profile-2',
          name: 'Test Profile 2',
          data: { baz: 'qux' },
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            // First call: profiles query
            // Second call: user settings query
            if (selectCallCount === 1) {
              return Promise.resolve(mockProfiles);
            }
            return {
              limit: vi.fn().mockResolvedValue([{ currentProfileId: 'profile-1' }]),
            };
          }),
        })),
      } as any));

      const req = createRequest('GET', undefined, 'valid-token');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.profiles).toHaveLength(2);
      expect(data.profiles[0].name).toBe('Test Profile 1');
      expect(data.profiles[1].name).toBe('Test Profile 2');
      expect(data.currentProfileId).toBe('profile-1');
    });

    it('should return null currentProfileId when user has no settings', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const mockProfiles = [
        {
          id: 'profile-1',
          name: 'Test Profile',
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCallCount++;
            if (selectCallCount === 1) {
              return Promise.resolve(mockProfiles);
            }
            return {
              limit: vi.fn().mockResolvedValue([]),
            };
          }),
        })),
      } as any));

      const req = createRequest('GET', undefined, 'valid-token');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.currentProfileId).toBeNull();
    });
  });

  describe('POST', () => {
    it('should return 401 if no auth token is provided', async () => {
      const req = createRequest('POST', { name: 'Test', data: {} });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth token is invalid', async () => {
      vi.mocked(verifyAuthToken).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('POST', { name: 'Test', data: {} }, 'invalid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if body is invalid', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const req = createRequest('POST', null, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid body');
    });

    it('should return 400 if name is missing', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const req = createRequest('POST', { data: {} }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Name and data are required');
    });

    it('should return 400 if data is missing', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const req = createRequest('POST', { name: 'Test Profile' }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Name and data are required');
    });

    it('should return 400 if name is not a string', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const req = createRequest('POST', { name: 123, data: {} }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Name and data are required');
    });

    it('should create a new profile successfully', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const createdProfile = {
        id: 'profile-new',
        name: 'New Profile',
        data: { settings: { theme: 'dark' } },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdProfile]),
        }),
      } as any);

      const req = createRequest('POST', { name: 'New Profile', data: { settings: { theme: 'dark' } } }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe('profile-new');
      expect(data.name).toBe('New Profile');
      expect(data.data).toEqual({ settings: { theme: 'dark' } });
    });

    it('should create profile and set as current when setCurrent is true', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const createdProfile = {
        id: 'profile-new',
        name: 'New Profile',
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdProfile]),
        }),
      } as any);

      // Mock for upsertCurrentProfile function
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No existing settings
          }),
        }),
      } as any);

      const req = createRequest('POST', { name: 'New Profile', data: {}, setCurrent: true }, 'valid-token');
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBe('profile-new');
      // Verify that insert was called twice (once for profile, once for settings)
      expect(db.insert).toHaveBeenCalledTimes(2);
    });

    it('should create profile without setting as current when setCurrent is false', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const createdProfile = {
        id: 'profile-new',
        name: 'New Profile',
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createdProfile]),
        }),
      } as any);

      const req = createRequest('POST', { name: 'New Profile', data: {}, setCurrent: false }, 'valid-token');
      const res = await POST(req);

      expect(res.status).toBe(201);
      // Verify that insert was called only once (for profile only)
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });
});
