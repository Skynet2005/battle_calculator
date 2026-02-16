'use client';

import { useAuthUser, useLinkGameAccount, useUpdateUserProfile } from '@/shared/hooks/useAuth';
import type { UserProfile } from '@/shared/types';
import { EmptyState, FormField } from '@/shared/ui';
import { toast } from '@/shared/utils/toast';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import ProfileManager from './ProfileManager';

interface ProfileGateProps {
  currentProfile: UserProfile | null;
  onProfileChange: (profile: UserProfile | null) => void;
  authUser: { email: string; username: string } | null;
  gameData?: {
    roleId: string;
    gameId: string;
    state: string | null;
    furnaceLevel: number | null;
    profilePicture: string | null;
  } | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onAuthUserUpdate?: (user: { email: string; username: string }) => void;
  children: React.ReactNode;
}

export interface ProfileGateRef {
  openProfileModal: () => void;
}

/**
 * Account Info View - Display mode for user account information
 */
const AccountInfoView = memo(({
  authUser,
  gameData,
  onEdit,
  onLogout,
  onDeleteAccount,
}: {
  authUser: { email: string; username: string };
  gameData?: {
    roleId: string;
    gameId: string;
    state: string | null;
    furnaceLevel: number | null;
    profilePicture: string | null;
  } | null;
  onEdit: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) => {
  const handleEdit = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const handleDeleteAccount = useCallback(() => {
    onDeleteAccount();
  }, [onDeleteAccount]);

  return (
    <>
      {gameData ? (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            {gameData.profilePicture && (
              <img
                src={gameData.profilePicture}
                alt="Game Profile"
                className="w-16 h-16 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 text-sm">
              <div className="font-semibold text-white mb-1">{authUser.username}</div>
              <div className="text-gray-300">ID: {gameData.roleId}</div>
              {gameData.state && <div className="text-gray-300">State: {gameData.state}</div>}
              {gameData.furnaceLevel && <div className="text-gray-300">Furnace Level: {gameData.furnaceLevel}</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700 border-dashed">
          <div className="text-sm text-slate-400">
            No game account linked. Click "Edit Profile" to link your game account.
          </div>
        </div>
      )}
      <div>Username: {authUser.username}</div>
      <div>Email: {authUser.email}</div>
      <div className="flex gap-2 pt-2">
        <button
          className="button bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs"
          onClick={handleEdit}
        >
          Edit Profile
        </button>
        <button
          className="button bg-slate-700/80 hover:bg-slate-700 px-3 py-2 text-xs"
          onClick={handleLogout}
        >
          Sign out
        </button>
        <button
          className="button bg-red-600 hover:bg-red-700 px-3 py-2 text-xs"
          onClick={handleDeleteAccount}
        >
          Delete account
        </button>
      </div>
    </>
  );
});

AccountInfoView.displayName = 'AccountInfoView';

/**
 * Password Change Form - Sub-component for password change fields
 */
const PasswordChangeForm = memo(({
  currentPassword,
  newPassword,
  confirmPassword,
  isSaving,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSaving: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}) => {
  const handleCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onCurrentPasswordChange(e.target.value);
  }, [onCurrentPasswordChange]);

  const handleNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onNewPasswordChange(e.target.value);
  }, [onNewPasswordChange]);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfirmPasswordChange(e.target.value);
  }, [onConfirmPasswordChange]);

  return (
    <>
      <div className="section-divider" />
      <div className="text-xs text-slate-400 mb-2">Change Password (optional)</div>

      <FormField label="Current Password" htmlFor="edit-current-password">
        <input
          id="edit-current-password"
          type="password"
          value={currentPassword}
          onChange={handleCurrentPasswordChange}
          placeholder="Enter current password"
          disabled={isSaving}
          className="input"
        />
      </FormField>

      <FormField label="New Password" htmlFor="edit-new-password">
        <input
          id="edit-new-password"
          type="password"
          value={newPassword}
          onChange={handleNewPasswordChange}
          placeholder="Enter new password"
          disabled={isSaving}
          className="input"
        />
        <p className="text-xs text-slate-400 mt-1">
          Must be at least 8 characters with uppercase, lowercase, number, and special character
        </p>
      </FormField>

      <FormField label="Confirm New Password" htmlFor="edit-confirm-password">
        <input
          id="edit-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="Confirm new password"
          disabled={isSaving}
          className="input"
        />
      </FormField>
    </>
  );
});

PasswordChangeForm.displayName = 'PasswordChangeForm';

/**
 * Account Edit Form - Edit mode for user account information
 */
const AccountEditForm = memo(({
  username,
  email,
  currentPassword,
  newPassword,
  confirmPassword,
  gameRoleId,
  isSaving,
  error,
  success,
  onUsernameChange,
  onEmailChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onGameRoleIdChange,
  onLinkGame,
  onSave,
  onCancel,
}: {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  gameRoleId: string;
  isSaving: boolean;
  error: string | null;
  success: boolean;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onGameRoleIdChange: (value: string) => void;
  onLinkGame: () => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUsernameChange(e.target.value);
  }, [onUsernameChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  }, [onEmailChange]);

  const handleSave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  }, [onSave]);

  return (
    <div className="space-y-3">
      <FormField label="Username" htmlFor="edit-username">
        <input
          id="edit-username"
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="Enter username"
          disabled={isSaving}
          className="input"
        />
      </FormField>
      <FormField label="Email" htmlFor="edit-email">
        <input
          id="edit-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter email"
          disabled={isSaving}
          className="input"
        />
      </FormField>

      <PasswordChangeForm
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        isSaving={isSaving}
        onCurrentPasswordChange={onCurrentPasswordChange}
        onNewPasswordChange={onNewPasswordChange}
        onConfirmPasswordChange={onConfirmPasswordChange}
      />

      <div className="section-divider" />
      <div className="text-xs text-slate-400 mb-2">Link/Update Game Account (optional)</div>
      <FormField label="Game Role ID" htmlFor="edit-game-role-id">
        <input
          id="edit-game-role-id"
          type="text"
          value={gameRoleId}
          onChange={(e) => onGameRoleIdChange(e.target.value)}
          placeholder="Enter your in-game Role ID (e.g., 100579922)"
          disabled={isSaving}
          className="input"
          autoComplete="off"
        />
        <p className="text-xs text-slate-400 mt-1">
          Enter your in-game Role ID to link or update your game account and sync profile data
        </p>
      </FormField>
      <button
        type="button"
        className="button bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed w-full"
        onClick={onLinkGame}
        disabled={isSaving || !gameRoleId.trim()}
      >
        {isSaving ? 'Linking...' : gameRoleId.trim() ? 'Link/Update Game Account' : 'Enter Role ID to Link'}
      </button>

      {error && (
        <div className="text-red-400 text-xs">{error}</div>
      )}

      {success && (
        <div className="text-green-400 text-xs">Profile updated successfully!</div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="button bg-green-600 hover:bg-green-700 px-3 py-2 text-xs disabled:opacity-50"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          className="button bg-slate-700/80 hover:bg-slate-700 px-3 py-2 text-xs"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

AccountEditForm.displayName = 'AccountEditForm';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  authUser: { email: string; username: string } | null;
  gameData?: {
    roleId: string;
    gameId: string;
    state: string | null;
    furnaceLevel: number | null;
    profilePicture: string | null;
  } | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onProfileChange: (profile: UserProfile | null) => void;
  onAuthUserUpdate?: (user: { email: string; username: string }) => void;
}

function ProfileModalComponent({
  open,
  onClose,
  authUser,
  gameData,
  onLogout,
  onDeleteAccount,
  onProfileChange,
  onAuthUserUpdate,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(authUser?.username || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gameRoleId, setGameRoleId] = useState('');

  // Use React Query hooks
  const { data: currentAuthUser } = useAuthUser();
  const updateUserProfileMutation = useUpdateUserProfile();
  const linkGameAccountMutation = useLinkGameAccount();

  // Sync form fields when authUser changes (only when not editing)
  useEffect(() => {
    const user = authUser || (currentAuthUser ? { email: currentAuthUser.email, username: currentAuthUser.username } : null);
    if (user && !isEditing) {
      setUsername(user.username);
      setEmail(user.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Pre-fill game Role ID if game data exists
      setGameRoleId(gameData?.roleId || '');
    }
  }, [authUser, currentAuthUser, isEditing, gameData]);

  const isSaving = updateUserProfileMutation.isPending || linkGameAccountMutation.isPending;
  const error = updateUserProfileMutation.error?.message || linkGameAccountMutation.error?.message || null;

  const handleSave = useCallback(() => {
    const user = authUser || (currentAuthUser ? { email: currentAuthUser.email, username: currentAuthUser.username } : null);
    if (!user) {
      return;
    }

    const updateData: { username?: string; email?: string; currentPassword?: string; newPassword?: string } = {};

    if (username !== user.username) {
      updateData.username = username;
    }

    if (email !== user.email) {
      updateData.email = email;
    }

    // Handle password change
    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim() !== confirmPassword.trim()) {
        toast.error('Password mismatch', 'New password and confirm password do not match');
        return;
      }
      if (!currentPassword || currentPassword.trim().length === 0) {
        toast.error('Current password required', 'Current password is required to change password');
        return;
      }
      updateData.currentPassword = currentPassword.trim();
      updateData.newPassword = newPassword.trim();
    }

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false);
      return;
    }

    updateUserProfileMutation.mutate(updateData, {
      onSuccess: (data) => {
        setIsEditing(false);
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Update auth user in parent
        if (onAuthUserUpdate) {
          onAuthUserUpdate({
            username: data.username || username,
            email: data.email || email,
          });
        }

        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to update profile', error.message || 'Please try again');
      },
    });
  }, [authUser, currentAuthUser, username, email, newPassword, currentPassword, confirmPassword, onAuthUserUpdate, updateUserProfileMutation]);

  const handleCancel = useCallback(() => {
    const user = authUser || (currentAuthUser ? { email: currentAuthUser.email, username: currentAuthUser.username } : null);
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setGameRoleId('');
    setIsEditing(false);
  }, [authUser, currentAuthUser]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
  }, []);

  const handleCurrentPasswordChange = useCallback((value: string) => {
    setCurrentPassword(value);
  }, []);

  const handleNewPasswordChange = useCallback((value: string) => {
    setNewPassword(value);
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
  }, []);

  const handleGameRoleIdChange = useCallback((value: string) => {
    setGameRoleId(value);
  }, []);

  const handleLinkGame = useCallback(() => {
    if (!gameRoleId.trim()) {
      toast.error('Role ID required', 'Please enter your game Role ID');
      return;
    }

    linkGameAccountMutation.mutate(gameRoleId.trim(), {
      onSuccess: () => {
        toast.success('Game account linked successfully!');
        setGameRoleId('');
        // Refresh auth user data
        if (onAuthUserUpdate) {
          // The query will be invalidated automatically, but we can trigger a refetch
          setTimeout(() => {
            window.location.reload(); // Simple way to refresh all data
          }, 500);
        }
      },
      onError: (error) => {
        toast.error('Failed to link game account', error.message || 'Please check your Role ID and try again');
      },
    });
  }, [gameRoleId, linkGameAccountMutation, onAuthUserUpdate]);

  // Sync form fields when authUser changes (only when not editing)
  useEffect(() => {
    if (authUser && !isEditing) {
      setUsername(authUser.username);
      setEmail(authUser.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Pre-fill game Role ID if game data exists
      setGameRoleId(gameData?.roleId || '');
    }
  }, [authUser, isEditing, gameData]);

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="card modal-content relative flex flex-col max-h-[90vh] w-[90vw] max-w-[600px]">
        <div className="shrink-0">
          <button
            className="absolute top-3 right-3 text-sm text-slate-300 hover:text-white z-10"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
          <h2 className="mb-4 pr-8">Profile & Account</h2>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          <div className="space-y-3 text-sm text-slate-200">
            {authUser ? (
              <>
                <div className="font-semibold">Signed in</div>

                {isEditing ? (
                  <AccountEditForm
                    username={username}
                    email={email}
                    currentPassword={currentPassword}
                    newPassword={newPassword}
                    confirmPassword={confirmPassword}
                    gameRoleId={gameRoleId}
                    isSaving={isSaving}
                    error={error}
                    success={false}
                    onUsernameChange={handleUsernameChange}
                    onEmailChange={handleEmailChange}
                    onCurrentPasswordChange={handleCurrentPasswordChange}
                    onNewPasswordChange={handleNewPasswordChange}
                    onConfirmPasswordChange={handleConfirmPasswordChange}
                    onGameRoleIdChange={handleGameRoleIdChange}
                    onLinkGame={handleLinkGame}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                ) : (
                  <AccountInfoView
                    authUser={authUser}
                    gameData={gameData}
                    onEdit={handleEdit}
                    onLogout={onLogout}
                    onDeleteAccount={onDeleteAccount}
                  />
                )}
              </>
            ) : (
              <div>Please sign in.</div>
            )}
          </div>
          <div className="section-divider" />
          <ProfileManager onProfileChange={onProfileChange} />
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized ProfileModal component to prevent unnecessary re-renders
 */
const ProfileModal = memo(ProfileModalComponent, (prev, next) => {
  return (
    prev.open === next.open &&
    prev.authUser === next.authUser &&
    prev.gameData === next.gameData &&
    prev.onClose === next.onClose &&
    prev.onLogout === next.onLogout &&
    prev.onDeleteAccount === next.onDeleteAccount &&
    prev.onProfileChange === next.onProfileChange &&
    prev.onAuthUserUpdate === next.onAuthUserUpdate
  );
});

ProfileModal.displayName = 'ProfileModal';

const ProfileGateComponent = forwardRef<ProfileGateRef, ProfileGateProps>(({
  currentProfile,
  onProfileChange,
  authUser,
  gameData,
  onLogout,
  onDeleteAccount,
  onAuthUserUpdate,
  children
}, ref) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentAuthUser, setCurrentAuthUser] = useState(authUser);

  useImperativeHandle(ref, () => ({
    openProfileModal: () => setShowProfileModal(true)
  }), []);

  // Sync currentAuthUser when authUser prop changes
  useEffect(() => {
    setCurrentAuthUser(authUser);
  }, [authUser]);

  const handleAuthUserUpdate = useCallback((user: { email: string; username: string }) => {
    setCurrentAuthUser(user);
    // Also notify parent component
    if (onAuthUserUpdate) {
      onAuthUserUpdate(user);
    }
  }, [onAuthUserUpdate]);

  const handleOpenModal = useCallback(() => {
    setShowProfileModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowProfileModal(false);
  }, []);

  if (!currentProfile) {
    return (
      <>
        <div className="container">
          <EmptyState
            title="No profile selected"
            message="Open Profile to create or select a profile before configuring players and rallies."
            action={{
              label: 'Open Profile',
              onClick: handleOpenModal
            }}
          />
        </div>
        <ProfileModal
          open={showProfileModal}
          onClose={handleCloseModal}
          authUser={currentAuthUser}
          gameData={gameData}
          onLogout={onLogout}
          onDeleteAccount={onDeleteAccount}
          onProfileChange={onProfileChange}
          onAuthUserUpdate={handleAuthUserUpdate}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <ProfileModal
        open={showProfileModal}
        onClose={handleCloseModal}
        authUser={currentAuthUser}
        gameData={gameData}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onProfileChange={onProfileChange}
        onAuthUserUpdate={handleAuthUserUpdate}
      />
    </>
  );
});

ProfileGateComponent.displayName = 'ProfileGateComponent';

ProfileGateComponent.displayName = 'ProfileGate';

/**
 * Memoized ProfileGate component to prevent unnecessary re-renders
 * Only re-renders when props actually change
 * Note: forwardRef components need special handling with memo
 */
const ProfileGate = memo(ProfileGateComponent, (prev, next) => {
  return (
    prev.currentProfile === next.currentProfile &&
    prev.onProfileChange === next.onProfileChange &&
    prev.authUser === next.authUser &&
    prev.onLogout === next.onLogout &&
    prev.onDeleteAccount === next.onDeleteAccount &&
    prev.onAuthUserUpdate === next.onAuthUserUpdate &&
    prev.children === next.children
  );
}) as typeof ProfileGateComponent;

ProfileGate.displayName = 'ProfileGate';

export default ProfileGate;
