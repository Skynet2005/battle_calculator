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
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
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
import { GET, PUT, DELETE } from '@/app/api/profiles/[id]/route';
import { verifyAuthToken } from '@/lib/auth';
import { db } from '@/lib/db/db';

describe('/api/profiles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body?: unknown, token?: string) => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const req = new NextRequest('http://localhost:3000/api/profiles/profile-123', {
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

  const createCtx = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  describe('GET', () => {
    it('should return 401 if no auth token is provided', async () => {
      const req = createRequest('GET');
      const ctx = createCtx('profile-123');
      const res = await GET(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth token is invalid', async () => {
      vi.mocked(verifyAuthToken).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('GET', undefined, 'invalid-token');
      const ctx = createCtx('profile-123');
      const res = await GET(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if profile does not exist', async () => {
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
      const ctx = createCtx('nonexistent-profile');
      const res = await GET(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should return 404 if profile belongs to different user', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Query returns empty because WHERE clause includes userId check
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const req = createRequest('GET', undefined, 'valid-token');
      const ctx = createCtx('other-users-profile');
      const res = await GET(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should return profile for authenticated user', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const mockProfile = {
        id: 'profile-123',
        name: 'My Profile',
        data: { theme: 'dark', level: 50 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      } as any);

      const req = createRequest('GET', undefined, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await GET(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe('profile-123');
      expect(data.name).toBe('My Profile');
      expect(data.data).toEqual({ theme: 'dark', level: 50 });
    });
  });

  describe('PUT', () => {
    it('should return 401 if no auth token is provided', async () => {
      const req = createRequest('PUT', { name: 'Updated' });
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth token is invalid', async () => {
      vi.mocked(verifyAuthToken).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('PUT', { name: 'Updated' }, 'invalid-token');
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);
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

      const req = createRequest('PUT', null, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid body');
    });

    it('should return 404 if profile does not exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const req = createRequest('PUT', { name: 'Updated' }, 'valid-token');
      const ctx = createCtx('nonexistent-profile');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should return 404 if profile belongs to different user', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Update returns empty because WHERE clause includes userId check
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const req = createRequest('PUT', { name: 'Updated' }, 'valid-token');
      const ctx = createCtx('other-users-profile');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should update profile name successfully', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const updatedProfile = {
        id: 'profile-123',
        name: 'Updated Profile Name',
        data: { existing: 'data' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProfile]),
          }),
        }),
      } as any);

      const req = createRequest('PUT', { name: 'Updated Profile Name' }, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe('Updated Profile Name');
    });

    it('should update profile data successfully', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const updatedProfile = {
        id: 'profile-123',
        name: 'My Profile',
        data: { newData: 'updated' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProfile]),
          }),
        }),
      } as any);

      const req = createRequest('PUT', { data: { newData: 'updated' } }, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toEqual({ newData: 'updated' });
    });

    it('should update both name and data successfully', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const updatedProfile = {
        id: 'profile-123',
        name: 'New Name',
        data: { completely: 'new' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProfile]),
          }),
        }),
      } as any);

      const req = createRequest('PUT', { name: 'New Name', data: { completely: 'new' } }, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.name).toBe('New Name');
      expect(data.data).toEqual({ completely: 'new' });
    });

    it('should set as current profile when setCurrent is true', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      const updatedProfile = {
        id: 'profile-123',
        name: 'My Profile',
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProfile]),
          }),
        }),
      } as any);

      // Mock for upsertCurrentProfile - check existing settings
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ userId: 'user-123' }]),
          }),
        }),
      } as any);

      const req = createRequest('PUT', { name: 'My Profile', setCurrent: true }, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await PUT(req, ctx);

      expect(res.status).toBe(200);
      // Verify update was called (once for profile, once for settings)
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE', () => {
    it('should return 401 if no auth token is provided', async () => {
      const req = createRequest('DELETE');
      const ctx = createCtx('profile-123');
      const res = await DELETE(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if auth token is invalid', async () => {
      vi.mocked(verifyAuthToken).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('DELETE', undefined, 'invalid-token');
      const ctx = createCtx('profile-123');
      const res = await DELETE(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if profile does not exist', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const req = createRequest('DELETE', undefined, 'valid-token');
      const ctx = createCtx('nonexistent-profile');
      const res = await DELETE(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should return 404 if profile belongs to different user', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Delete returns empty because WHERE clause includes userId check
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const req = createRequest('DELETE', undefined, 'valid-token');
      const ctx = createCtx('other-users-profile');
      const res = await DELETE(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should delete profile successfully', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'profile-123' }]),
        }),
      } as any);

      // Mock for clearing current profile
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const req = createRequest('DELETE', undefined, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await DELETE(req, ctx);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('should clear current profile setting if deleted profile was current', async () => {
      vi.mocked(verifyAuthToken).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      });

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'profile-123' }]),
        }),
      } as any);

      const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({
        set: mockUpdateSet,
      } as any);

      const req = createRequest('DELETE', undefined, 'valid-token');
      const ctx = createCtx('profile-123');
      const res = await DELETE(req, ctx);

      expect(res.status).toBe(200);
      // Verify that update was called to clear currentProfileId
      expect(db.update).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          currentProfileId: null,
        })
      );
    });
  });
});
