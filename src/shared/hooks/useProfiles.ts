import { migrateProfile } from '@/features/profile/api/profile-migration';
import type { UserProfile } from '@/shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ProfilesResponse {
  profiles: Array<{
    id: string;
    name: string;
    data: UserProfile;
    createdAt: string;
    updatedAt: string;
  }>;
  currentProfileId: string | null;
}

async function fetchProfiles(bypassCache = false): Promise<ProfilesResponse> {
  // Add cache-busting query parameter to force fresh data from server
  const url = bypassCache ? `/api/profiles?_t=${Date.now()}` : '/api/profiles';
  const res = await fetch(url, {
    credentials: 'include',
    // Force fresh fetch when bypassing cache
    ...(bypassCache && { cache: 'no-store' }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch profiles' }));
    throw new Error(error.error || 'Failed to fetch profiles');
  }
  return res.json();
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => fetchProfiles(false),
    staleTime: 60 * 1000, // 60 seconds - profiles list doesn't change often
    refetchOnMount: false, // Only refetch if data is stale
  });
}

export function useProfile(id: string | null) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!id) return null;
      const res = await fetch(`/api/profiles/${id}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) return null;
        const error = await res.json().catch(() => ({ error: 'Failed to fetch profile' }));
        throw new Error(error.error || 'Failed to fetch profile');
      }
      const response = await res.json();
      // API returns { id, name, data, createdAt, updatedAt }
      // where 'data' contains the actual profile object
      const profileData = response.data || response;

      // Merge the response metadata with the profile data
      const profileToMigrate = {
        ...profileData,
        id: response.id,
        name: response.name,
        createdAt: response.createdAt ? new Date(response.createdAt).getTime() : profileData.createdAt,
        updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : profileData.updatedAt,
      };

      return migrateProfile(profileToMigrate);
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds - profile data can change more frequently
    refetchOnMount: false, // Only refetch if data is stale
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; data: UserProfile; setCurrent?: boolean }) => {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to create profile' }));
        throw new Error(error.error || 'Failed to create profile');
      }
      return res.json();
    },
    onMutate: async (newProfileData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['profiles'] });

      // Snapshot the previous value
      const previousProfiles = queryClient.getQueryData<ProfilesResponse>(['profiles']);

      // Return context for rollback
      return { previousProfiles };
    },
    onError: (err, newProfileData, context) => {
      // Roll back on error
      if (context?.previousProfiles) {
        queryClient.setQueryData(['profiles'], context.previousProfiles);
      }
    },
    onSuccess: (response, variables) => {
      // Transform the new profile to match ProfilesResponse format
      const newProfile = {
        id: response.id,
        name: response.name,
        data: variables.data,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      // Optimistically add the new profile to the list immediately
      const previousProfiles = queryClient.getQueryData<ProfilesResponse>(['profiles']);
      if (previousProfiles) {
        queryClient.setQueryData<ProfilesResponse>(['profiles'], {
          ...previousProfiles,
          profiles: [...previousProfiles.profiles, newProfile],
          currentProfileId: variables.setCurrent ? newProfile.id : previousProfiles.currentProfileId,
        });
      }

      // Invalidate (but don't refetch immediately) to mark as stale
      // The optimistic update is already visible and will be used until data becomes stale
      queryClient.invalidateQueries({ queryKey: ['profiles'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['profile-state'], refetchType: 'none' });
      // No immediate refetch needed - optimistic update is sufficient
      // Data will refetch naturally when components need fresh data (after staleTime expires)
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; data?: UserProfile; setCurrent?: boolean }) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(error.error || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Mark queries as stale but don't immediately refetch
      // They will refetch when components actually need fresh data
      queryClient.invalidateQueries({ queryKey: ['profiles'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['profile', variables.id], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['profile-state'], refetchType: 'none' });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to delete profile' }));
        throw new Error(error.error || 'Failed to delete profile');
      }
      return res.json();
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['profiles'] });

      // Snapshot the previous value
      const previousProfiles = queryClient.getQueryData<ProfilesResponse>(['profiles']);

      // Optimistically update the profiles list
      if (previousProfiles) {
        const updatedProfiles: ProfilesResponse = {
          ...previousProfiles,
          profiles: previousProfiles.profiles.filter((p) => p.id !== deletedId),
          currentProfileId:
            previousProfiles.currentProfileId === deletedId ? null : previousProfiles.currentProfileId,
        };
        // Use setQueryData to immediately update the cache and trigger re-render
        queryClient.setQueryData<ProfilesResponse>(['profiles'], updatedProfiles);
      }

      // Return context with the snapshot value
      return { previousProfiles };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfiles) {
        queryClient.setQueryData(['profiles'], context.previousProfiles);
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove the specific profile from cache
      queryClient.removeQueries({ queryKey: ['profile', deletedId] });

      // The optimistic update already removed it from the list immediately
      // DON'T refetch - server-side cache (60s TTL) will serve stale data
      // Trust the optimistic update - the profile is deleted on the server
      // Only mark as stale so it refetches on next natural interaction
      queryClient.invalidateQueries({ queryKey: ['profiles'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['profile-state'], refetchType: 'none' });

      // NO refetch - optimistic update is the source of truth
      // The profile is gone from the UI and from the database
      // If user navigates away and back, they'll get fresh data then
    },
  });
}
