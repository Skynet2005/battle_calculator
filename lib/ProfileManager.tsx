'use client';

import { Check, Copy, Edit2, Plus, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { UserProfile } from '../components/types';
import {
  createNewProfile,
  createProfile,
  deleteProfile,
  getAllProfiles,
  getCurrentProfile,
  saveProfile,
  setCurrentProfile,
} from './profile-storage';

interface ProfileManagerProps {
  onProfileChange: (profile: UserProfile | null) => void;
}

export default function ProfileManager({ onProfileChange }: ProfileManagerProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfileState] = useState<UserProfile | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { profiles: allProfiles, currentProfileId } = await getAllProfiles();
      setProfiles(allProfiles);

      const current = currentProfileId
        ? allProfiles.find((p) => p.id === currentProfileId) || (await getCurrentProfile())
        : null;

      if (current) {
        setCurrentProfileState(current);
        onProfileChange(current);
      } else if (allProfiles.length > 0) {
        // Auto-select first profile
        const first = allProfiles[0];
        await setCurrentProfile(first.id);
        setCurrentProfileState(first);
        onProfileChange(first);
      } else {
        setCurrentProfileState(null);
        onProfileChange(null);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const profile = createNewProfile(newProfileName.trim());
      const created = await createProfile(profile, true);
      setCurrentProfileState(created);
      onProfileChange(created);
      setNewProfileName('');
      setShowCreateDialog(false);
      await loadProfiles();
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 401) {
        setError('You are not authenticated. Please refresh the page and log in again.');
      } else {
        setError(error.message || 'Failed to create profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profile: UserProfile) => {
    try {
      setLoading(true);
      await setCurrentProfile(profile.id);
      setCurrentProfileState(profile);
      onProfileChange(profile);
    } catch (err) {
      setError((err as Error).message || 'Failed to select profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      setLoading(true);
      await deleteProfile(id);
      await loadProfiles();
    } catch (err) {
      setError((err as Error).message || 'Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    try {
      setLoading(true);
      setError(null);
      const saved = await saveProfile(profile, true);
      setCurrentProfileState(saved);
      onProfileChange(saved);
      await loadProfiles();
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 401) {
        setError('You are not authenticated. Please refresh the page and log in again.');
      } else {
        setError(error.message || 'Failed to save profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenameProfile = async (profile: UserProfile) => {
    if (!editingName.trim() || editingName.trim() === profile.name) {
      setEditingProfileId(null);
      setEditingName('');
      return;
    }
    try {
      setLoading(true);
      const updatedProfile = { ...profile, name: editingName.trim() };
      const saved = await saveProfile(updatedProfile, currentProfile?.id === profile.id);
      if (currentProfile?.id === profile.id) {
        setCurrentProfileState(saved);
        onProfileChange(saved);
      }
      setEditingProfileId(null);
      setEditingName('');
      await loadProfiles();
    } catch (err) {
      setError((err as Error).message || 'Failed to rename profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateProfile = async (profile: UserProfile) => {
    try {
      setLoading(true);
      const duplicatedProfile = {
        ...profile,
        id: crypto.randomUUID(),
        name: `${profile.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await createProfile(duplicatedProfile, false);
      await loadProfiles();
    } catch (err) {
      setError((err as Error).message || 'Failed to duplicate profile');
    } finally {
      setLoading(false);
    }
  };

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
        <button
          className="button flex items-center gap-2"
          onClick={() => setShowCreateDialog(true)}
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          New Profile
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-3 p-3 text-sm text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-pulse">
          Loading...
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
                disabled={loading || !newProfileName.trim()}
              >
                <Check className="w-4 h-4" />
                Create
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
                        className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                        onClick={() => handleRenameProfile(profile)}
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
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
                      className="p-2 text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProfile(profile);
                      }}
                      disabled={loading}
                      title="Duplicate profile"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      disabled={loading}
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {currentProfile?.id !== profile.id && (
                      <button
                        className="button bg-slate-700/80 hover:bg-slate-700 px-3 py-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProfile(profile);
                        }}
                        disabled={loading}
                      >
                        Select
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

// Export a hook for saving profiles
export function useProfileSave() {
  return (profile: UserProfile) => {
    void saveProfile(profile);
  };
}

