'use client';

import AuthGate from '@/components/auth/AuthGate';
import Header from '@/components/layout/Header';
import TabBar, { type TabKey } from '@/components/layout/TabBar';
import ProfileGate, { type ProfileGateRef } from '@/components/profile/ProfileGate';
import HowToUseGuideTab from '@/components/tabs/how_to/HowToUseGuideTab';
import OpponentTab from '@/components/tabs/player_and_opponent/OpponentTab';
import PlayerTab from '@/components/tabs/player_and_opponent/PlayerTab';
import RallyTab from '@/components/tabs/rally_config/RallyTab';
import ResultsTab from '@/components/tabs/results/ResultsTab';
import { EmptyState, PageShell, SectionCard, StatTile } from '@/components/ui';
import { useBattleCalculatorState } from '@/hooks/useBattleCalculatorState';
import { getCurrentProfile } from '@/lib/profile-storage';
import { useEffect, useMemo, useRef, useState } from 'react';

const tabCopy: Record<TabKey, { title: string; description: string }> = {
  profile: { title: 'Player Setup', description: 'Configure your commander, heroes, pets, and base stats.' },
  opponent: { title: 'Opponent Setup', description: 'Mirror opponent stats to compare rally outcomes.' },
  rally: { title: 'Rally Configuration', description: 'Assign leaders, joiners, and troop mix for the rally.' },
  results: { title: 'Results', description: 'Review simulation outcomes, multipliers, and timelines.' },
  howto: { title: 'How To', description: 'Usage guidance, readiness checklist, and troubleshooting.' }
};

export default function BattleCalculatorPage() {
  const [authUser, setAuthUser] = useState<{ email: string; username: string } | null>(null);
  const profileGateRef = useRef<ProfileGateRef>(null);

  const {
    currentProfile,
    setCurrentProfile,
    activeTab,
    setActiveTab,
    profileSubTab,
    setProfileSubTab,
    opponentSubTab,
    setOpponentSubTab,
    playerBaseStats,
    opponentBaseStats,
    playerCapacityReport,
    opponentCapacityReport,
    simulatedFightResult,
    fightSimulationError,
    simulatedPlayerContext,
    simulatedOpponentContext,
    simulatedBattleReport,
    simulationMode,
    setSimulationModeAction,
    simulationCount,
    setSimulationCountAction,
    playerJoinerInfo,
    opponentJoinerInfo,
    profileLoaded,
    playerReady,
    opponentReady,
    rallyReady,
    fightReady,
    roundsSimulated,
    handleProfileChange,
    handleSave,
    handleTroopMixChange
  } = useBattleCalculatorState();

  const tabStatuses: Partial<Record<TabKey, 'ready' | 'warning' | 'error'>> = useMemo(
    () => ({
      profile: playerReady ? 'ready' : 'warning',
      opponent: opponentReady ? 'ready' : 'warning',
      rally: rallyReady ? 'ready' : 'warning',
      results: fightSimulationError ? 'error' : fightReady ? 'ready' : 'warning',
      howto: fightSimulationError ? 'error' : undefined
    }),
    [fightReady, fightSimulationError, opponentReady, playerReady, rallyReady]
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setAuthUser(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Delete your account and all associated data? This cannot be undone.');
    if (!confirmDelete) return;
    try {
      const res = await fetch('/api/profile', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        console.error('Delete failed');
        return;
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setAuthUser(null);
    }
  };

  // Load current profile from server on auth success and on mount
  useEffect(() => {
    if (!authUser) return;
    const loadCurrent = async () => {
      try {
        const profile = await getCurrentProfile();
        if (profile) {
          handleProfileChange(profile);
        }
      } catch (err) {
        console.error('Failed to load current profile', err);
      }
    };
    void loadCurrent();
  }, [authUser, handleProfileChange]);

  // Load current profile when switching to Player tab
  useEffect(() => {
    if (!authUser || activeTab !== 'profile') return;
    const loadProfile = async () => {
      try {
        const profile = await getCurrentProfile();
        if (profile) {
          handleProfileChange(profile);
        }
      } catch (err) {
        console.error('Failed to load current profile', err);
      }
    };
    void loadProfile();
  }, [activeTab, authUser, handleProfileChange]);

  const headerSummary = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Profile"
        value={currentProfile?.name ?? 'Not loaded'}
        tone={playerReady ? 'success' : 'muted'}
        helper={playerReady ? 'Ready' : 'Pending setup'}
      />
      <StatTile
        label="Opponent"
        value={currentProfile?.opponent ? 'Configured' : 'Not set'}
        tone={opponentReady ? 'success' : 'muted'}
        helper={opponentReady ? 'Ready' : 'Pending setup'}
      />
      <StatTile
        label="Rally"
        value={rallyReady ? 'Configured' : 'Needs config'}
        tone={rallyReady ? 'success' : 'warning'}
        helper="Leaders, joiners, troop mix"
      />
      <StatTile
        label="Results"
        value={fightReady ? 'Simulated' : fightSimulationError ? 'Error' : 'Awaiting run'}
        tone={fightSimulationError ? 'error' : fightReady ? 'info' : 'muted'}
        helper={fightSimulationError || `Rounds: ${roundsSimulated ?? 0}`}
      />
    </div>
  );

  const renderActiveTab = () => {
    if (!currentProfile) {
      return (
        <EmptyState
          title="Profile not loaded"
          description="Create or load a profile to start configuring your battle."
          actionLabel="Open profile manager"
          onAction={() => profileGateRef.current?.openProfileModal()}
        />
      );
    }

    if (activeTab === 'profile') {
      return (
        <PlayerTab
          currentProfile={currentProfile}
          setCurrentProfile={setCurrentProfile}
          profileSubTab={profileSubTab}
          onSubTabChange={setProfileSubTab}
          playerCapacityReport={playerCapacityReport}
          playerJoinerInfo={playerJoinerInfo}
          onSave={handleSave}
          onTroopMixChange={handleTroopMixChange}
        />
      );
    }

    if (activeTab === 'opponent') {
      return (
        <OpponentTab
          currentProfile={currentProfile}
          setCurrentProfile={setCurrentProfile}
          opponentSubTab={opponentSubTab}
          onSubTabChange={setOpponentSubTab}
          opponentCapacityReport={opponentCapacityReport}
          opponentJoinerInfo={opponentJoinerInfo}
          onTroopMixChange={handleTroopMixChange}
        />
      );
    }

    if (activeTab === 'rally') {
      return (
        <RallyTab
          currentProfile={currentProfile}
          setCurrentProfile={setCurrentProfile}
          playerBaseStats={playerBaseStats}
          opponentBaseStats={opponentBaseStats}
        />
      );
    }

    if (activeTab === 'results') {
      return (
        <ResultsTab
          player={simulatedPlayerContext}
          opponent={simulatedOpponentContext}
          fightResult={simulatedFightResult}
          battleReport={simulatedBattleReport}
          errorMessage={fightSimulationError}
          simulationMode={simulationMode}
          setSimulationModeAction={setSimulationModeAction}
          simulationCount={simulationCount}
          setSimulationCountAction={setSimulationCountAction}
          onMixChange={handleTroopMixChange}
          playerCapacity={playerCapacityReport}
          opponentCapacity={opponentCapacityReport}
          playerMixInput={currentProfile.rally.troopMix?.player}
          opponentMixInput={currentProfile.rally.troopMix?.opponent}
        />
      );
    }

    return (
      <HowToUseGuideTab
        profileLoaded={profileLoaded}
        playerReady={playerReady}
        opponentReady={opponentReady}
        rallyReady={rallyReady}
        fightReady={fightReady}
        hasError={Boolean(fightSimulationError)}
        errorMessage={fightSimulationError}
        playerCapacity={playerCapacityReport?.rally.total ?? null}
        opponentCapacity={opponentCapacityReport?.rally.total ?? null}
        roundsSimulated={roundsSimulated}
      />
    );
  };

  return (
    <>
      <AuthGate onAuthSuccess={setAuthUser} />
      {authUser && (
        <ProfileGate
          ref={profileGateRef}
          currentProfile={currentProfile}
          onProfileChange={handleProfileChange}
          authUser={authUser}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        >
          <PageShell
            header={
              <div className="flex flex-col gap-6">
                <Header
                  currentProfile={currentProfile}
                  onSave={handleSave}
                  authEmail={authUser?.email}
                  authUsername={authUser?.username}
                  onLogout={handleLogout}
                  onDeleteAccount={handleDeleteAccount}
                  onProfileOpen={() => profileGateRef.current?.openProfileModal()}
                />
                <SectionCard title="Readiness" description="Track setup completion and simulation status." tone="muted">
                  {headerSummary}
                </SectionCard>
                <div className="card overflow-hidden border-slate-700/60">
                  <div className="flex flex-col gap-4">
                    <div className="w-full min-w-0 overflow-hidden">
                      <TabBar activeTab={activeTab} onTabChange={setActiveTab} statuses={tabStatuses} />
                    </div>
                    <div className="text-xs text-slate-400/80 italic border-t border-slate-700/50 pt-3">
                      💡 Tips: use profiles to preload heroes, then configure rally and run results.
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div className="flex flex-col gap-6">
              <SectionCard
                title={tabCopy[activeTab].title}
                description={tabCopy[activeTab].description}
              >
                {renderActiveTab()}
              </SectionCard>
            </div>
          </PageShell>
        </ProfileGate>
      )}
    </>
  );
}
