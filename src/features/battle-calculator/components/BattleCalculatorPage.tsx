'use client';

import dynamic from 'next/dynamic';
import AuthGate from '@/features/auth/components/auth/AuthGate';
import Header from '@/features/battle-calculator/components/layout/Header';
import TabBar, { type TabKey } from '@/features/battle-calculator/components/layout/TabBar';
import ProfileGate, { type ProfileGateRef } from '@/features/profile/components/profile/ProfileGate';
import OpponentTab from '@/features/battle-calculator/tabs/player-and-opponent/OpponentTab';
import PlayerTab from '@/features/battle-calculator/tabs/player-and-opponent/PlayerTab';
import RallyTab from '@/features/battle-calculator/tabs/rally_config/RallyTab';
import { EmptyState, PageShell, SectionCard, StatTile, LoadingSkeleton } from '@/shared/ui';

// Lazy load heavy components for code splitting
const ResultsTab = dynamic(() => import('@/features/battle-calculator/tabs/results/ResultsTab'), {
  loading: () => <LoadingSkeleton lines={8} />,
});

const HowToUseGuideTab = dynamic(() => import('@/features/battle-calculator/tabs/how_to/HowToUseGuideTab'), {
  loading: () => <LoadingSkeleton lines={10} />,
});
import { useBattleCalculatorState } from '@/features/battle-calculator/hooks/useBattleCalculatorState';
import { useAuthUser, useLogout, useDeleteAccount } from '@/shared/hooks/useAuth';
import { useProfileState } from '@/shared/hooks/useProfileState';
import { useProfile } from '@/shared/hooks/useProfiles';
import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { toast } from '@/shared/utils/toast';

const tabCopy: Record<TabKey, { title: string; description: string }> = {
  profile: { title: 'Player Setup', description: 'Configure your commander, heroes, pets, and base stats.' },
  opponent: { title: 'Opponent Setup', description: 'Mirror opponent stats to compare rally outcomes.' },
  rally: { title: 'Rally Configuration', description: 'Assign leaders, joiners, and troop mix for the rally.' },
  results: { title: 'Results', description: 'Review simulation outcomes, multipliers, and timelines.' },
  howto: { title: 'How To', description: 'Usage guidance, readiness checklist, and troubleshooting.' }
};

export default function BattleCalculatorPage() {
  const [authSessionVersion, setAuthSessionVersion] = useState(0);
  const profileGateRef = useRef<ProfileGateRef>(null);

  // Use React Query hooks
  const { data: authUser, isLoading: isAuthLoading } = useAuthUser();
  const { data: profileState } = useProfileState();
  const { data: currentProfileData, isLoading: isProfileLoading } = useProfile(profileState?.currentProfileId ?? null);
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();

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
    previousBattleReport,
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

  // Sync React Query profile data with local state
  useEffect(() => {
    if (currentProfileData) {
      handleProfileChange(currentProfileData);
    }
  }, [currentProfileData, handleProfileChange]);

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

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setCurrentProfile(null);
        setActiveTab('rally');
        setAuthSessionVersion((v) => v + 1);
        toast.success('Logged out successfully');
      },
      onError: (error) => {
        toast.error('Logout failed', error.message || 'Please try again');
      },
    });
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm('Delete your account and all associated data? This cannot be undone.');
    if (!confirmDelete) return;

    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        setCurrentProfile(null);
        setActiveTab('rally');
        setAuthSessionVersion((v) => v + 1);
        toast.success('Account deleted successfully');
      },
      onError: (error) => {
        toast.error('Delete account failed', error.message || 'Please try again');
      },
    });
  };

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
    // Show loading skeleton while checking auth or loading profile
    if (isAuthLoading || isProfileLoading) {
      return <LoadingSkeleton lines={5} />;
    }

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
        <Suspense fallback={<LoadingSkeleton lines={8} />}>
          <ResultsTab
            player={simulatedPlayerContext}
            opponent={simulatedOpponentContext}
            fightResult={simulatedFightResult}
            battleReport={simulatedBattleReport}
            previousBattleReport={previousBattleReport}
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
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<LoadingSkeleton lines={10} />}>
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
      </Suspense>
    );
  };

  // Convert authUser to the format expected by ProfileGate
  const authUserForGate = authUser
    ? { email: authUser.email, username: authUser.username }
    : null;

  return (
    <>
      <AuthGate key={authSessionVersion} onAuthSuccess={() => {}} />
      {authUser && !isAuthLoading && (
        <ProfileGate
          ref={profileGateRef}
          currentProfile={currentProfile}
          onProfileChange={handleProfileChange}
          authUser={authUserForGate}
          gameData={authUser?.gameData || null}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onAuthUserUpdate={() => {}}
        >
          <PageShell
            header={
              <div className="flex flex-col gap-6">
                <Header
                  currentProfile={currentProfile}
                  onSave={handleSave}
                  authEmail={authUser?.email}
                  authUsername={authUser?.username}
                  gameData={authUser?.gameData || null}
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
