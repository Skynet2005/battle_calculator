'use client';

import type { UserProfile } from '@/shared/types';
import React from 'react';
import Header from './Header';
import TabBar, { type TabKey } from './TabBar';
import TabPanel from './TabPanel';

interface MainLayoutProps {
  currentProfile: UserProfile | null;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onSave: () => void;
  authEmail?: string | null;
  authUsername?: string | null;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onProfileOpen?: () => void;
  children: React.ReactNode;
}

export default function MainLayout({
  currentProfile,
  activeTab,
  onTabChange,
  onSave,
  authEmail,
  authUsername,
  onLogout,
  onDeleteAccount,
  onProfileOpen,
  children
}: MainLayoutProps) {
  return (
    <div className="container">
      <Header
        currentProfile={currentProfile}
        onSave={onSave}
        authEmail={authEmail}
        authUsername={authUsername}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onProfileOpen={onProfileOpen}
      />

      <main className="card">
        <TabBar activeTab={activeTab} onTabChange={onTabChange} />

        <div className="tab-content-container">
          {children}
        </div>
      </main>
    </div>
  );
}

export { TabPanel };
export type { TabKey };

