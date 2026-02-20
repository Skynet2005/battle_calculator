import { useEffect, useRef } from 'react';
import type { UserProfile } from '@/shared/types';
import { useUpdateProfile } from '@/shared/hooks/useProfiles';
import { migrateProfile } from '@/features/profile/api/profile-migration';
import { clientLogger } from '@/shared/utils/clientLogger';
import { isUuid } from '@/shared/utils/validation';

/**
 * Auto-saves the profile to the database when it changes, with debouncing.
 * Skips saves during initial load (first 3 seconds after profile switch).
 */
export function useAutoSave(
  currentProfile: UserProfile | null,
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
) {
  const updateProfileMutation = useUpdateProfile();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedProfileIdRef = useRef<string | null>(null);
  const profileLoadTimeRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (currentProfile && isUuid(currentProfile.id)) {
      if (lastSavedProfileIdRef.current !== currentProfile.id) {
        isInitialLoadRef.current = true;
        profileLoadTimeRef.current = Date.now();
      }
      lastSavedProfileIdRef.current = currentProfile.id;
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 3000);
    } else if (!currentProfile) {
      lastSavedProfileIdRef.current = null;
      isInitialLoadRef.current = true;
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    if (!currentProfile) return;
    if (!isUuid(currentProfile.id)) return;
    if (isSavingRef.current) return;

    if (isInitialLoadRef.current) {
      const timeSinceLoad = Date.now() - profileLoadTimeRef.current;
      if (timeSinceLoad < 3000) return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!currentProfile || !isUuid(currentProfile.id)) return;

      isSavingRef.current = true;
      try {
        clientLogger.debug('Auto-saving profile to database...', {
          component: 'useAutoSave',
          profileId: currentProfile.id,
        });
        const response = await updateProfileMutation.mutateAsync({
          id: currentProfile.id,
          name: currentProfile.name,
          data: currentProfile,
          setCurrent: false,
        });
        const saved = migrateProfile({
          ...response.data,
          id: response.id,
          name: response.name,
          createdAt: response.createdAt
            ? new Date(response.createdAt).getTime()
            : response.data.createdAt,
          updatedAt: response.updatedAt
            ? new Date(response.updatedAt).getTime()
            : response.data.updatedAt,
        });
        clientLogger.debug('Auto-save successful', {
          component: 'useAutoSave',
          profileId: saved.id,
        });
        lastSavedProfileIdRef.current = saved.id;
        if (saved.id !== currentProfile.id) {
          setCurrentProfile(saved);
        }
      } catch (err) {
        clientLogger.error('Auto-save failed', err, {
          component: 'useAutoSave',
          profileId: currentProfile.id,
        });
      } finally {
        isSavingRef.current = false;
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentProfile]);
}
