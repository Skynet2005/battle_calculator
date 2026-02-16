import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  image?: string;
  gameData?: {
    roleId: string;
    gameId: string;
    state: string | null;
    furnaceLevel: number | null;
    profilePicture: string | null;
  } | null;
}

async function fetchAuthUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) return null;
    const error = await res.json().catch(() => ({ error: 'Failed to fetch user' }));
    throw new Error(error.error || 'Failed to fetch user');
  }
  return res.json();
}

export function useAuthUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAuthUser,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Invalid credentials' }));
        throw new Error(error.error || 'Invalid credentials');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; username: string; password: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to register' }));
        const details = Array.isArray(error.details) ? error.details as string[] : null;
        const message = details?.length
          ? details.join(' ')
          : (error.error || 'Failed to register');
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to logout' }));
        throw new Error(error.error || 'Failed to logout');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to delete account' }));
        throw new Error(error.error || 'Failed to delete account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      username?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const res = await fetch('/api/profile', {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useGameLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const res = await fetch('/api/auth/game-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role_id: roleId }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Game login failed' }));
        throw new Error(error.error || 'Game login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLinkGameAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const res = await fetch('/api/auth/link-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role_id: roleId }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to link game account' }));
        throw new Error(error.error || 'Failed to link game account');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
