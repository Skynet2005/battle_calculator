'use client';

import { Check, Copy, Download, Edit2, Loader2, Plus, Trash2, Upload, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { UserProfile } from '@/shared/types';
import { createNewProfile } from '@/features/profile/api/profile-storage';
import { useProfiles, useProfile, useCreateProfile, useUpdateProfile, useDeleteProfile } from '@/shared/hooks/useProfiles';
import { useProfileState, useSetProfileState } from '@/shared/hooks/useProfileState';
import { migrateProfile } from '@/features/profile/api/profile-migration';
import { toast } from '@/shared/utils/toast';
import { downloadJson } from '@/shared/utils/fileDownload';
import LoadingSkeleton from '@/shared/ui/LoadingSkeleton';

interface ProfileManagerProps {
  onProfileChange: (profile: UserProfile | null) => void;
}

export default function ProfileManager({ onProfileChange }: ProfileManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Use React Query hooks
  const { data: profilesData, isLoading: isLoadingProfiles, error: profilesError } = useProfiles();
  const { data: profileState } = useProfileState();
  const { data: currentProfileData } = useProfile(profileState?.currentProfileId ?? null);
  const createProfileMutation = useCreateProfile();
  const updateProfileMutation = useUpdateProfile();
  const deleteProfileMutation = useDeleteProfile();
  const setProfileStateMutation = useSetProfileState();

  // Transform profiles from API format to UserProfile[]
  const profiles = useMemo(() => {
    if (!profilesData?.profiles) return [];
    return profilesData.profiles.map((p) => {
      const profileToMigrate = {
        ...p.data,
        id: p.id,
        name: p.name,
        createdAt: p.createdAt ? new Date(p.createdAt).getTime() : p.data.createdAt,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : p.data.updatedAt,
      };
      return migrateProfile(profileToMigrate);
    });
  }, [profilesData]);

  const currentProfile = currentProfileData;

  const loading = isLoadingProfiles || createProfileMutation.isPending || updateProfileMutation.isPending || deleteProfileMutation.isPending || setProfileStateMutation.isPending;
  const error = profilesError?.message || createProfileMutation.error?.message || updateProfileMutation.error?.message || deleteProfileMutation.error?.message || setProfileStateMutation.error?.message || null;

  // Auto-select first profile if no current profile and profiles exist
  useEffect(() => {
    if (!profileState?.currentProfileId && profiles.length > 0 && !loading) {
      const first = profiles[0];
      setProfileStateMutation.mutate(first.id, {
        onSuccess: () => {
          onProfileChange(first);
        },
      });
    }
  }, [profileState?.currentProfileId, profiles, loading, setProfileStateMutation, onProfileChange]);

  // Sync current profile with parent
  useEffect(() => {
    if (currentProfile) {
      onProfileChange(currentProfile);
    }
  }, [currentProfile, onProfileChange]);

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const profile = createNewProfile(newProfileName.trim());
    createProfileMutation.mutate(
      { name: profile.name, data: profile, setCurrent: true },
      {
        onSuccess: (response) => {
          const created = migrateProfile({
            ...response.data,
            id: response.id,
            name: response.name,
            createdAt: response.createdAt ? new Date(response.createdAt).getTime() : response.data.createdAt,
            updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : response.data.updatedAt,
          });
          onProfileChange(created);
          setNewProfileName('');
          setShowCreateDialog(false);
          toast.success('Profile created successfully!');
        },
        onError: (error) => {
          toast.error('Failed to create profile', error.message || 'Please try again');
        },
      }
    );
  };

  const handleSelectProfile = (profile: UserProfile) => {
    setProfileStateMutation.mutate(profile.id, {
      onSuccess: () => {
        onProfileChange(profile);
        toast.success('Profile selected');
      },
      onError: (error) => {
        toast.error('Failed to select profile', error.message || 'Please try again');
      },
    });
  };

  const handleDeleteProfile = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    deleteProfileMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Profile deleted successfully');
        // If deleted profile was current, clear it
        if (currentProfile?.id === id) {
          onProfileChange(null);
        }
      },
      onError: (error) => {
        toast.error('Failed to delete profile', error.message || 'Please try again');
      },
    });
  };

  const handleSaveProfile = (profile: UserProfile) => {
    updateProfileMutation.mutate(
      { id: profile.id, name: profile.name, data: profile, setCurrent: true },
      {
        onSuccess: (response) => {
          const saved = migrateProfile({
            ...response.data,
            id: response.id,
            name: response.name,
            createdAt: response.createdAt ? new Date(response.createdAt).getTime() : response.data.createdAt,
            updatedAt: response.updatedAt ? new Date(response.updatedAt).getTime() : response.data.updatedAt,
          });
          onProfileChange(saved);
          toast.success('Profile saved successfully!');
        },
        onError: (error) => {
          toast.error('Failed to save profile', error.message || 'Please try again');
        },
      }
    );
  };

  const handleRenameProfile = (profile: UserProfile) => {
    if (!editingName.trim() || editingName.trim() === profile.name) {
      setEditingProfileId(null);
      setEditingName('');
      return;
    }
    updateProfileMutation.mutate(
      { id: profile.id, name: editingName.trim(), setCurrent: currentProfile?.id === profile.id },
      {
        onSuccess: () => {
          setEditingProfileId(null);
          setEditingName('');
          toast.success('Profile renamed successfully');
        },
        onError: (error) => {
          toast.error('Failed to rename profile', error.message || 'Please try again');
        },
      }
    );
  };

  const handleDuplicateProfile = (profile: UserProfile) => {
    const duplicatedProfile = {
      ...profile,
      id: crypto.randomUUID(),
      name: `${profile.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    createProfileMutation.mutate(
      { name: duplicatedProfile.name, data: duplicatedProfile, setCurrent: false },
      {
        onSuccess: () => {
          toast.success('Profile duplicated successfully');
        },
        onError: (error) => {
          toast.error('Failed to duplicate profile', error.message || 'Please try again');
        },
      }
    );
  };

  const handleExportProfile = (profile: UserProfile) => {
    const safeName = profile.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadJson(profile, `profile-${safeName}.json`);
    toast.success('Profile exported');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportProfile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);

          if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.name || !parsed.basicBonuses) {
            toast.error('Invalid profile file', 'File must contain id, name, and basicBonuses fields');
            return;
          }

          const imported: UserProfile = {
            ...parsed,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: `${parsed.name} (Imported)`,
          };

          createProfileMutation.mutate(
            { name: imported.name, data: imported, setCurrent: false },
            {
              onSuccess: () => {
                toast.success('Profile imported successfully');
              },
              onError: (err) => {
                toast.error('Failed to import profile', err.message || 'Please try again');
              },
            }
          );
        } catch {
          toast.error('Invalid file', 'Could not parse JSON file');
        }
      };
      reader.readAsText(file);

      // Reset so re-importing the same file fires onChange again
      e.target.value = '';
    },
    [createProfileMutation]
  );

  const startEditing = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.name);
  };

  const cancelEditing = () => {
    setEditingProfileId(null);
    setEditingName('');
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="card mb-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="m-0 flex items-center gap-2">
          <User className="w-6 h-6" />
          Profile Manager
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="button flex items-center gap-2 bg-slate-700/80 hover:bg-slate-700 text-sm"
            onClick={handleImportProfile}
            disabled={loading}
            title="Import profile from JSON"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFileChange}
            aria-label="Import profile JSON file"
          />
          <button
            className="button flex items-center gap-2"
            onClick={() => setShowCreateDialog(true)}
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            New Profile
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg">
          {error}
        </div>
      )}
      {isLoadingProfiles && (
        <div className="mb-4">
          <LoadingSkeleton lines={3} showCard={false} />
        </div>
      )}

      {/* Create Profile Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card max-w-md w-9/10 animate-fade-in">
            <h3 className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Profile
            </h3>
            <div className="form-group">
              <label>Profile Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="button flex-1 flex items-center justify-center gap-2"
                onClick={handleCreateProfile}
                disabled={createProfileMutation.isPending || !newProfileName.trim()}
              >
                {createProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create
                  </>
                )}
              </button>
              <button
                className="button flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewProfileName('');
                }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Profile Indicator */}
      {currentProfile && (
        <div className="mb-4 p-4 bg-linear-to-r from-blue-500/20 to-cyan-500/10 rounded-lg border border-blue-500/40 shadow-lg shadow-blue-500/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <strong className="text-blue-300">Active Profile:</strong>
            <span className="font-semibold text-white">{currentProfile.name}</span>
          </div>
          <div className="text-sm text-gray-400 mt-1 ml-4">
            Last updated: {new Date(currentProfile.updatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Search Bar - Only show when there are profiles */}
      {profiles.length > 2 && (
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles..."
            className="w-full px-4 py-2.5 border-2 border-slate-700 rounded-lg text-base bg-slate-900/50 text-slate-100 transition-all duration-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:border-slate-500"
          />
        </div>
      )}

      {/* Profile List */}
      {profiles.length > 0 && (
        <div>
          <h3 className="flex items-center justify-between">
            <span>Saved Profiles</span>
            <span className="text-sm font-normal text-gray-400">
              {filteredProfiles.length} of {profiles.length} profiles
            </span>
          </h3>
          <div className="flex flex-col gap-3 mt-4">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${currentProfile?.id === profile.id
                    ? 'bg-blue-500/20 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'
                  }`}
                onClick={() => !editingProfileId && handleSelectProfile(profile)}
              >
                <div className="flex-1 min-w-0">
                  {editingProfileId === profile.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        title="Rename profile"
                        placeholder="Enter profile name"
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameProfile(profile);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="flex-1 px-3 py-1.5 border border-blue-400 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        autoFocus
                      />
                      <button
                        className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                        onClick={() => handleRenameProfile(profile)}
                        disabled={updateProfileMutation.isPending}
                        title="Save"
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        onClick={cancelEditing}
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold flex items-center gap-2">
                        {currentProfile?.id === profile.id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                            Active
                          </span>
                        )}
                        {profile.name}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Created: {new Date(profile.createdAt).toLocaleDateString()} |
                        Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
                {editingProfileId !== profile.id && (
                  <div className="flex gap-2 mt-3 sm:mt-0 sm:ml-4">
                    <button
                      className="p-2 text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(profile);
                      }}
                      disabled={loading}
                      title="Rename profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-colors disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProfile(profile);
                      }}
                      disabled={createProfileMutation.isPending}
                      title="Duplicate profile"
                    >
                      {createProfileMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      className="p-2 text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportProfile(profile);
                      }}
                      title="Export profile"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      disabled={deleteProfileMutation.isPending}
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {currentProfile?.id !== profile.id && (
                      <button
                        className="button bg-slate-700/80 hover:bg-slate-700 px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProfile(profile);
                        }}
                        disabled={setProfileStateMutation.isPending}
                      >
                        {setProfileStateMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Selecting...
                          </>
                        ) : (
                          'Select'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* No results message when filtering */}
          {filteredProfiles.length === 0 && searchQuery && (
            <div className="text-center py-6 text-gray-400">
              No profiles found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {profiles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-300 mb-2">No Profiles Yet</h4>
          <p className="text-gray-400 mb-4">
            Create your first profile to start configuring your battle calculator.
          </p>
          <button
            className="button flex items-center gap-2 mx-auto"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Create Your First Profile
          </button>
        </div>
      )}
    </div>
  );
}

// Note: useProfileSave is deprecated - use useUpdateProfile from @/shared/hooks/useProfiles instead
