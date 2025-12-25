'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import ProfileManager from '@/lib/ProfileManager';
import type { UserProfile } from '../types';
import { EmptyState } from '../ui';

interface ProfileGateProps {
  currentProfile: UserProfile | null;
  onProfileChange: (profile: UserProfile | null) => void;
  authUser: { email: string; username: string } | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  children: React.ReactNode;
}

export interface ProfileGateRef {
  openProfileModal: () => void;
}

function ProfileModal({
  open,
  onClose,
  authUser,
  onLogout,
  onDeleteAccount,
  onProfileChange,
}: {
  open: boolean;
  onClose: () => void;
  authUser: { email: string; username: string } | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onProfileChange: (profile: UserProfile | null) => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="card modal-content relative">
        <button
          className="absolute top-3 right-3 text-sm text-slate-300 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="mb-4">Profile & Account</h2>
        <div className="space-y-3 text-sm text-slate-200">
          {authUser ? (
            <>
              <div className="font-semibold">Signed in</div>
              <div>Username: {authUser.username}</div>
              <div>Email: {authUser.email}</div>
              <div className="flex gap-2 pt-2">
                <button className="button bg-slate-700/80 hover:bg-slate-700 px-3 py-2 text-xs" onClick={onLogout}>
                  Sign out
                </button>
                <button className="button bg-red-600 hover:bg-red-700 px-3 py-2 text-xs" onClick={onDeleteAccount}>
                  Delete account
                </button>
              </div>
            </>
          ) : (
            <div>Please sign in.</div>
          )}
        </div>
        <div className="section-divider" />
        <ProfileManager onProfileChange={onProfileChange} />
      </div>
    </div>
  );
}

const ProfileGate = forwardRef<ProfileGateRef, ProfileGateProps>(({
  currentProfile,
  onProfileChange,
  authUser,
  onLogout,
  onDeleteAccount,
  children
}, ref) => {
  const [showProfileModal, setShowProfileModal] = useState(false);

  useImperativeHandle(ref, () => ({
    openProfileModal: () => setShowProfileModal(true)
  }));

  if (!currentProfile) {
    return (
      <>
        <div className="container">
          <EmptyState
            title="No profile selected"
            message="Open Profile to create or select a profile before configuring players and rallies."
            action={{
              label: 'Open Profile',
              onClick: () => setShowProfileModal(true)
            }}
          />
        </div>
        <ProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          authUser={authUser}
          onLogout={onLogout}
          onDeleteAccount={onDeleteAccount}
          onProfileChange={onProfileChange}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        authUser={authUser}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onProfileChange={onProfileChange}
      />
    </>
  );
});

ProfileGate.displayName = 'ProfileGate';

export default ProfileGate;
