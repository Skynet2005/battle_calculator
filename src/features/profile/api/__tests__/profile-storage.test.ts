/**
 * Unit tests for profile-storage API client
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllProfiles,
  ApiClientError,
  type ProfilesApiResponse,
} from '../profile-storage';

describe('fetchJson / ApiClientError', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws ApiClientError with message from body when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'Validation failed' }),
    } as Response);

    const err = await getAllProfiles().catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ message: 'Validation failed', status: 400 });
  });

  it('throws ApiClientError with statusText when body has no error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({}),
    } as Response);

    const err = await getAllProfiles().catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ message: 'Internal Server Error', status: 500 });
  });

  it('returns migrated profiles when response is ok', async () => {
    const apiResponse: ProfilesApiResponse = {
      profiles: [
        {
          id: 'p1',
          name: 'Profile 1',
          data: { id: 'p1', name: 'Profile 1', rally: { leader: { infantry: null, lancer: null, marksman: null }, joiners: [], capacity: { infantry: [], lancer: [], marksman: [] } } },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ],
      currentProfileId: 'p1',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(apiResponse),
    } as Response);

    const result = await getAllProfiles();
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].id).toBe('p1');
    expect(result.profiles[0].name).toBe('Profile 1');
    expect(result.currentProfileId).toBe('p1');
  });
});
