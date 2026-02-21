'use client';

import AuthGate from '@/features/auth/components/auth/AuthGate';
import Header from '@/features/battle-calculator/components/layout/Header';
import TabBar, { type DecisionEnginePanel, type TabKey } from '@/features/battle-calculator/components/layout/TabBar';
import { useBattleCalculatorState } from '@/features/battle-calculator/hooks/useBattleCalculatorState';
import OpponentTab from '@/features/battle-calculator/tabs/player-and-opponent/OpponentTab';
import PlayerTab from '@/features/battle-calculator/tabs/player-and-opponent/PlayerTab';
import RallyTab from '@/features/battle-calculator/tabs/rally_config/RallyTab';
import ProfileGate, { type ProfileGateRef } from '@/features/profile/components/profile/ProfileGate';
import { useAuthUser, useDeleteAccount, useLogout } from '@/shared/hooks/useAuth';
import { useProfileState } from '@/shared/hooks/useProfileState';
import { useProfile } from '@/shared/hooks/useProfiles';
import { EmptyState, LoadingSkeleton, PageShell, SectionCard, StatTile } from '@/shared/ui';
import { toast } from '@/shared/utils/toast';
import dynamic from 'next/dynamic';
import { Suspense, useMemo, useRef, useState } from 'react';

// Lazy load heavy components for code splitting
const ResultsTab = dynamic(() => import('@/features/battle-calculator/tabs/results/ResultsTab'), {
  loading: () => <LoadingSkeleton lines={8} />,
});

const ScenarioRunnerTab = dynamic(
  () => import('@/features/battle-calculator/tabs/scenario-runner/ScenarioRunnerTab'),
  { loading: () => <LoadingSkeleton lines={6} /> }
);

const HeatmapTab = dynamic(
  () => import('@/features/battle-calculator/tabs/heatmap/HeatmapTab'),
  { loading: () => <LoadingSkeleton lines={6} /> }
);

const SwapLabTab = dynamic(
  () => import('@/features/battle-calculator/tabs/swap-lab/SwapLabTab'),
  { loading: () => <LoadingSkeleton lines={6} /> }
);

const FlipLeversTab = dynamic(
  () => import('@/features/battle-calculator/tabs/flip-levers/FlipLeversTab'),
  { loading: () => <LoadingSkeleton lines={6} /> }
);

const UpgradeROITab = dynamic(
  () => import('@/features/battle-calculator/tabs/upgrade-roi/UpgradeROITab'),
  { loading: () => <LoadingSkeleton lines={6} /> }
);

const ReportImporterTab = dynamic(
  () => import('@/features/battle-calculator/tabs/reports/ReportImporterTab'),
  { loading: () => <LoadingSkeleton lines={4} /> }
);

const CalibrationDashboardTab = dynamic(
  () => import('@/features/battle-calculator/tabs/calibration/CalibrationDashboardTab'),
  { loading: () => <LoadingSkeleton lines={4} /> }
);

const HowToUseGuideTab = dynamic(() => import('@/features/battle-calculator/tabs/how_to/HowToUseGuideTab'), {
  loading: () => <LoadingSkeleton lines={10} />,
});

const tabCopy: Record<TabKey, { title: string; description: string }> = {
  profile: { title: 'Player Setup', description: 'Configure your commander, heroes, pets, and base stats.' },
  opponent: { title: 'Opponent Setup', description: 'Mirror opponent stats to compare rally outcomes.' },
  rally: { title: 'Rally Configuration', description: 'Assign leaders, joiners, and troop mix for the rally.' },
  results: { title: 'Results', description: 'Review simulation outcomes, multipliers, and timelines.' },
  'decision-engine': { title: 'Decision Engine', description: 'Scenario runner, heatmaps, swap lab, levers, ROI, reports, and calibration.' },
  howto: { title: 'How To', description: 'Usage guidance, readiness checklist, and troubleshooting.' }
};

const decisionEnginePanelCopy: Record<DecisionEnginePanel, string> = {
  'scenario-runner': 'Scenario Runner',
  heatmap: 'Troop Mix Heatmap',
  'swap-lab': 'Swap Lab',
  'flip-levers': 'Flip Levers',
  'upgrade-roi': 'Upgrade ROI',
  reports: 'Report Import',
  calibration: 'Calibration',
};

export default function BattleCalculatorPage() {
  const [authSessionVersion, setAuthSessionVersion] = useState(0);
  const [decisionEnginePanel, setDecisionEnginePanel] = useState<DecisionEnginePanel>('scenario-runner');
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
    rngSeed,
    lockSeed,
    setRngSeed,
    setLockSeed,
    rerunSameSeed,
    newSeed,
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
  } = useBattleCalculatorState({ serverProfile: currentProfileData ?? null });

  const tabStatuses: Partial<Record<TabKey, 'ready' | 'warning' | 'error'>> = useMemo(
    () => ({
      profile: playerReady ? 'ready' : 'warning',
      opponent: opponentReady ? 'ready' : 'warning',
      rally: rallyReady ? 'ready' : 'warning',
      results: fightSimulationError ? 'error' : fightReady ? 'ready' : 'warning',
      'decision-engine': rallyReady ? 'ready' : 'warning',
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
            rngSeed={rngSeed}
            lockSeed={lockSeed}
            setRngSeed={setRngSeed}
            setLockSeed={setLockSeed}
            rerunSameSeed={rerunSameSeed}
            newSeed={newSeed}
            onMixChange={handleTroopMixChange}
            playerCapacity={playerCapacityReport}
            opponentCapacity={opponentCapacityReport}
            playerMixInput={currentProfile.rally.troopMix?.player}
            opponentMixInput={currentProfile.rally.troopMix?.opponent}
          />
        </Suspense>
      );
    }

    if (activeTab === 'decision-engine') {
      const panel = decisionEnginePanel;
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-700/60 pb-3">
            {(Object.keys(decisionEnginePanelCopy) as DecisionEnginePanel[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDecisionEnginePanel(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${panel === key
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                  }`}
              >
                {decisionEnginePanelCopy[key]}
              </button>
            ))}
          </div>
          <div className="min-h-0">
            {panel === 'scenario-runner' && (
              <Suspense fallback={<LoadingSkeleton lines={6} />}>
                <ScenarioRunnerTab
                  currentProfile={currentProfile}
                  playerBaseStats={playerBaseStats}
                  opponentBaseStats={opponentBaseStats}
                  playerCapacityReport={playerCapacityReport}
                  opponentCapacityReport={opponentCapacityReport}
                  simulationMode={simulationMode}
                  simulationCount={simulationCount}
                />
              </Suspense>
            )}
            {panel === 'heatmap' && (
              <Suspense fallback={<LoadingSkeleton lines={6} />}>
                <HeatmapTab
                  currentProfile={currentProfile}
                  playerBaseStats={playerBaseStats}
                  opponentBaseStats={opponentBaseStats}
                  playerCapacityReport={playerCapacityReport}
                  opponentCapacityReport={opponentCapacityReport}
                  simulationMode={simulationMode}
                  simulationCount={simulationCount}
                />
              </Suspense>
            )}
            {panel === 'swap-lab' && (
              <Suspense fallback={<LoadingSkeleton lines={6} />}>
                <SwapLabTab
                  currentProfile={currentProfile}
                  playerBaseStats={playerBaseStats}
                  opponentBaseStats={opponentBaseStats}
                  playerCapacityReport={playerCapacityReport}
                  opponentCapacityReport={opponentCapacityReport}
                />
              </Suspense>
            )}
            {panel === 'flip-levers' && (
              <Suspense fallback={<LoadingSkeleton lines={6} />}>
                <FlipLeversTab
                  currentProfile={currentProfile}
                  playerBaseStats={playerBaseStats}
                  opponentBaseStats={opponentBaseStats}
                  playerCapacityReport={playerCapacityReport}
                  opponentCapacityReport={opponentCapacityReport}
                />
              </Suspense>
            )}
            {panel === 'upgrade-roi' && (
              <Suspense fallback={<LoadingSkeleton lines={6} />}>
                <UpgradeROITab
                  currentProfile={currentProfile}
                  playerBaseStats={playerBaseStats}
                  opponentBaseStats={opponentBaseStats}
                  playerCapacityReport={playerCapacityReport}
                  opponentCapacityReport={opponentCapacityReport}
                />
              </Suspense>
            )}
            {panel === 'reports' && (
              <Suspense fallback={<LoadingSkeleton lines={4} />}>
                <ReportImporterTab />
              </Suspense>
            )}
            {panel === 'calibration' && (
              <Suspense fallback={<LoadingSkeleton lines={4} />}>
                <CalibrationDashboardTab />
              </Suspense>
            )}
          </div>
        </div>
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
      <AuthGate key={authSessionVersion} onAuthSuccess={() => { }} />
      {authUser && !isAuthLoading && (
        <ProfileGate
          ref={profileGateRef}
          currentProfile={currentProfile}
          onProfileChange={handleProfileChange}
          authUser={authUserForGate}
          gameData={authUser?.gameData || null}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onAuthUserUpdate={() => { }}
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
                  onDecisionEngineSelect={(panel) => {
                    setActiveTab('decision-engine');
                    setDecisionEnginePanel(panel);
                  }}
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
