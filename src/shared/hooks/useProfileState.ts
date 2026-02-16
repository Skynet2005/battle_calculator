import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ProfileStateResponse {
  currentProfileId: string | null;
}

interface ProfilesResponse {
  profiles: Array<{
    id: string;
    name: string;
    data: unknown;
    createdAt: string;
    updatedAt: string;
  }>;
  currentProfileId: string | null;
}

async function fetchProfileState(): Promise<ProfileStateResponse> {
  const res = await fetch('/api/profile-state', { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch profile state' }));
    throw new Error(error.error || 'Failed to fetch profile state');
  }
  return res.json();
}

export function useProfileState() {
  return useQuery({
    queryKey: ['profile-state'],
    queryFn: fetchProfileState,
    staleTime: 60 * 1000, // 60 seconds - profile state doesn't change often
    refetchOnMount: false, // Only refetch if data is stale
  });
}

export function useSetProfileState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentProfileId: string | null) => {
      const res = await fetch('/api/profile-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentProfileId }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update profile state' }));
        throw new Error(error.error || 'Failed to update profile state');
      }
      return res.json();
    },
    onMutate: async (newCurrentProfileId) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['profiles'] });
      await queryClient.cancelQueries({ queryKey: ['profile-state'] });

      // Snapshot the previous values
      const previousProfileState = queryClient.getQueryData<ProfileStateResponse>(['profile-state']);
      const previousProfiles = queryClient.getQueryData<ProfilesResponse>(['profiles']);

      // Optimistically update profile state
      if (previousProfileState) {
        queryClient.setQueryData<ProfileStateResponse>(['profile-state'], {
          currentProfileId: newCurrentProfileId,
        });
      }

      // Optimistically update profiles list to reflect new currentProfileId
      if (previousProfiles) {
        queryClient.setQueryData<ProfilesResponse>(['profiles'], {
          ...previousProfiles,
          currentProfileId: newCurrentProfileId,
        });
      }

      // Return context with snapshot values for rollback
      return { previousProfileState, previousProfiles };
    },
    onError: (err, newCurrentProfileId, context) => {
      // Roll back optimistic updates on error
      if (context?.previousProfileState) {
        queryClient.setQueryData(['profile-state'], context.previousProfileState);
      }
      if (context?.previousProfiles) {
        queryClient.setQueryData(['profiles'], context.previousProfiles);
      }
    },
    onSuccess: () => {
      // Mark queries as stale - they will refetch when components need fresh data
      // No need to immediately refetch since we optimistically updated the cache
      queryClient.invalidateQueries({ queryKey: ['profile-state'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['profiles'], refetchType: 'none' });
    },
  });
}
