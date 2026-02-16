/**
 * Profile Storage - Manages user profiles with localStorage
 */

import type { UserProfile } from '@/shared/types';
import type { HeroGearSelections } from '@/domain/battle';
import { buildMaxHeroLevels } from '@/domain/battle';
import { migrateProfile } from './profile-migration';

export type { UserProfile };

const API_BASE = '/api';

function isUuid(value: string | undefined | null): boolean {
  return typeof value === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as any)?.error || res.statusText;
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}

export async function getAllProfiles(): Promise<{ profiles: UserProfile[]; currentProfileId: string | null }> {
  const data = await fetchJson<{ profiles: any[]; currentProfileId: string | null }>(`${API_BASE}/profiles`);
  return {
    profiles: data.profiles.map((p) => {
      // The API returns { id, name, data, createdAt, updatedAt }
      // where 'data' contains the actual profile object
      const profileData = p.data || p;
      const profileToMigrate = {
        ...profileData,
        id: p.id,
        name: p.name,
        createdAt: p.createdAt ? new Date(p.createdAt).getTime() : profileData.createdAt,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : profileData.updatedAt,
      };
      return migrateProfile(profileToMigrate);
    }),
    currentProfileId: data.currentProfileId,
  };
}

export async function saveProfile(profile: UserProfile, setCurrent = false): Promise<UserProfile> {
  // Ensure all required fields are included in the save
  const profileToSave: UserProfile = {
    ...profile,
    updatedAt: Date.now(),
    // Explicitly include all fields to ensure nothing is lost
    heroLevels: profile.heroLevels || {},
    basicBonuses: profile.basicBonuses,
    additiveBonuses: profile.additiveBonuses,
    multiplicativeBonuses: profile.multiplicativeBonuses,
    expertSelections: profile.expertSelections,
    heroGearSelections: profile.heroGearSelections,
    petSkillSelections: profile.petSkillSelections,
    chiefGearSelections: profile.chiefGearSelections,
    charmLevels: profile.charmLevels,
    warAcademySelections: profile.warAcademySelections,
    commandCenterLevel: profile.commandCenterLevel,
    baseCapacity: profile.baseCapacity,
    capacity: profile.capacity,
    opponent: profile.opponent,
    rally: profile.rally,
  };

  const payload = {
    name: profileToSave.name,
    data: profileToSave,
    setCurrent,
  };

  // If the id is not a valid UUID, create instead of update.
  if (!isUuid(profile.id)) {
    const created = await fetchJson<any>(`${API_BASE}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return migrateProfile(created);
  }

  const saved = await fetchJson<any>(`${API_BASE}/profiles/${profile.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    // If the profile was deleted or not found on the server, keep client state but avoid throwing
    if ((err as Error).message === 'Not found') {
      return profile;
    }
    throw err;
  });
  return migrateProfile(saved);
}

export async function createProfile(profile: UserProfile, setCurrent = false): Promise<UserProfile> {
  const payload = {
    name: profile.name,
    data: { ...profile, updatedAt: Date.now() },
    setCurrent,
  };
  const created = await fetchJson<any>(`${API_BASE}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return migrateProfile(created);
}

export async function deleteProfile(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
}

export async function getCurrentProfileId(): Promise<string | null> {
  const data = await fetchJson<{ currentProfileId: string | null }>(`${API_BASE}/profile-state`);
  return data.currentProfileId;
}

export async function setCurrentProfile(id: string | null): Promise<void> {
  await fetchJson(`${API_BASE}/profile-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentProfileId: id }),
  });
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  try {
    const response = await fetchJson<any>(`${API_BASE}/profiles/${id}`);
    // The API returns { id, name, data, createdAt, updatedAt }
    // where 'data' contains the actual profile object
    const profileData = response.data || response;

    // Debug logging removed - use clientLogger if needed
    // clientLogger.debug('Raw profile data from database', { profileId: response.id });

    // Merge the response metadata with the profile data
    const profileToMigrate = {
      ...profileData,
      id: response.id,
      name: response.name,
      createdAt: response.createdAt ? new Date(response.createdAt).getTime() : profileData.createdAt,
      updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : profileData.updatedAt,
    };

    const migrated = migrateProfile(profileToMigrate);
    // Debug logging removed - use clientLogger if needed
    // clientLogger.debug('Migrated profile', { profileId: migrated.id });
    return migrated;
  } catch (err) {
    // Error logging - profile-storage is used in client context
    // In production, these errors should be handled by the calling component
    return null;
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const currentId = await getCurrentProfileId();
  if (!currentId) return null;
  return getProfile(currentId);
}

export function createDefaultHeroGearSelections(): HeroGearSelections {
  const defaultGearConfig = {
    level: 200,
    masteryForged: true,
    masteryLevel: 20,
    essenceLevel: 0,
    empowermentLevel: 100, // Default to +100
    stacking: 'additive' as const,
  };

  return {
    infantry: {
      goggles: { ...defaultGearConfig },
      glove: { ...defaultGearConfig },
      boot: { ...defaultGearConfig },
      belt: { ...defaultGearConfig },
    },
    lancer: {
      goggles: { ...defaultGearConfig },
      glove: { ...defaultGearConfig },
      boot: { ...defaultGearConfig },
      belt: { ...defaultGearConfig },
    },
    marksman: {
      goggles: { ...defaultGearConfig },
      glove: { ...defaultGearConfig },
      boot: { ...defaultGearConfig },
      belt: { ...defaultGearConfig },
    },
  };
}

export function createNewProfile(name: string): UserProfile {
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    heroLevels: buildMaxHeroLevels(),
    basicBonuses: {
      combatTech: {
        troopTypeBonus: {
          infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
          lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
          marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
        },
        totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      allianceTech: { attack: 0, defense: 0, lethality: 0, health: 0 },
      experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
      daybreakIsland: {
        infantry: { attack: 0, defense: 0 },
        lancer: { attack: 0, defense: 0 },
        marksman: { attack: 0, defense: 0 },
        troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
        deploymentCapacity: 0,
        rallyCapacity: 0,
      },
      pets: { attack: 0, defense: 0, lethality: 0, health: 0 },
      stackedSkins: { attack: 0, defense: 0, lethality: 0, health: 0 },
      hero: { attack: 0, defense: 0, lethality: 0, health: 0 },
      chiefGear: { attack: 0, defense: 0 },
      charms: {
        infantry: { lethality: 0, health: 0 },
        lancer: { lethality: 0, health: 0 },
        marksman: { lethality: 0, health: 0 },
      },
      heroGear: {
        infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
        lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
        marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
      },
      allianceFacilities: { attack: 0, defense: 0 },
      petRefinement: {
        infantry: { lethality: 0, health: 0 },
        lancer: { lethality: 0, health: 0 },
        marksman: { lethality: 0, health: 0 },
        troops: { attack: 0, defense: 0 },
      },
      warAcademy: {
        infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
        lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
        marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      specialHeroes: { jeronimo: false, natalia: false },
      vipPrestige: { attack: 0, defense: 0, lethality: 0, health: 0 },
      globe: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    expertSelections: {
      attack: 0,
      defense: 0,
      lethality: 0,
      health: 0,
      deploymentCapacity: 0,
      rallyCapacity: 0,
    },
    heroGearSelections: createDefaultHeroGearSelections(),
    opponent: {
      heroLevels: buildMaxHeroLevels(),
      basicBonuses: {
        combatTech: {
          troopTypeBonus: {
            infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
            lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
            marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
          },
          totalTroopBonus: { attack: 0, defense: 0, lethality: 0, health: 0 },
        },
        allianceTech: { attack: 0, defense: 0, lethality: 0, health: 0 },
        experts: { attack: 0, defense: 0, lethality: 0, health: 0 },
        daybreakIsland: {
          infantry: { attack: 0, defense: 0 },
          lancer: { attack: 0, defense: 0 },
          marksman: { attack: 0, defense: 0 },
          troops: { attack: 0, defense: 0, lethality: 0, health: 0 },
          deploymentCapacity: 0,
          rallyCapacity: 0,
        },
        pets: { attack: 0, defense: 0, lethality: 0, health: 0 },
        stackedSkins: { attack: 0, defense: 0, lethality: 0, health: 0 },
        hero: { attack: 0, defense: 0, lethality: 0, health: 0 },
        chiefGear: { attack: 0, defense: 0 },
        charms: {
          infantry: { lethality: 0, health: 0 },
          lancer: { lethality: 0, health: 0 },
          marksman: { lethality: 0, health: 0 },
        },
        heroGear: {
          infantry: { lethality: 0, health: 0, attack: 0, defense: 0 },
          lancer: { lethality: 0, health: 0, attack: 0, defense: 0 },
          marksman: { lethality: 0, health: 0, attack: 0, defense: 0 },
        },
        allianceFacilities: { attack: 0, defense: 0 },
        petRefinement: {
          infantry: { lethality: 0, health: 0 },
          lancer: { lethality: 0, health: 0 },
          marksman: { lethality: 0, health: 0 },
          troops: { attack: 0, defense: 0 },
        },
        warAcademy: {
          infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
          lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
          marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
        },
        specialHeroes: { jeronimo: false, natalia: false },
        vipPrestige: { attack: 0, defense: 0, lethality: 0, health: 0 },
        globe: { attack: 0, defense: 0, lethality: 0, health: 0 },
      },
      expertSelections: {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        deploymentCapacity: 0,
        rallyCapacity: 0,
      },
      commandCenterLevel: 'FC10', // Default to max level for opponent
    },
    additiveBonuses: {
      temporaryEvents: { attack: 0, defense: 0, lethality: 0, health: 0 },
      supremePresident: { attack: 0, defense: 0, lethality: 0, health: 0 },
      specialBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
    },
    multiplicativeBonuses: {
      castleBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      eventBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      petSkills: { attack: 0, defense: 0, lethality: 0, health: 0 },
      combatBuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      combatDebuffs: { attack: 0, defense: 0, lethality: 0, health: 0 },
      exclusiveWeapon: { attack: 0, defense: 0, lethality: 0, health: 0 },
      allianceTerritory: { attack: 0, defense: 0, lethality: 0, health: 0 },
      tyrantSpire: { attack: 0, defense: 0, lethality: 0, health: 0 },
      cityBonuses: {
        attack: 0,
        defense: 0,
        lethality: 0,
        health: 0,
        enemyAttackReduction: 0,
        enemyDefenseReduction: 0,
        deploymentCapacity: 0,
      },
    },
    rally: {
      leader: {
        infantry: null,
        lancer: null,
        marksman: null,
      },
      joiners: [],
      capacity: {
        infantry: [],
        lancer: [],
        marksman: [],
      },
      troopMix: {
        player: { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
        opponent: { totalTroops: 0, infantryRatio: 33.34, lancerRatio: 33.33, marksmanRatio: 33.33 },
      },
    },
    capacity: {
      rally: 0,
      march: 0,
    },
    baseCapacity: {
      rally: 0,
      march: 0,
    },
    petSkillSelections: undefined, // Will be initialized on first load with max levels
    chiefGearSelections: undefined, // Will be initialized on first load with max levels
    charmLevels: undefined, // Will be initialized on first load with max levels
    warAcademySelections: undefined, // Will be initialized on first load with max levels
    commandCenterLevel: undefined, // Will be set by user
  };

  // Don't auto-save - let the caller handle saving via React Query
  return profile;
}

