'use client';

import { getHeroesByClassForSelect, getHeroExpeditionSkills, getAllHeroesForSelect } from '@/domain/battle/data-selectors';
import type { RallySideConfig, SideBaseStats, SideCombatSummary, TroopStatLine } from '@/domain/rally/combat-types';
import { buildConfigForSide } from '@/domain/rally/rally-config';
import type { RallyConfiguration, RallyHero, TroopConfiguration, TroopType } from '@/shared/types';
import { SectionCard } from '@/shared/ui';
import { useMemo, useState } from 'react';

import { JoinerMathBreakdown } from './JoinerMathBreakdown';
import { JoinerSelector } from './JoinerSelector';
import { LeaderSelector, syncLeadersFromHeroLevels } from './LeaderSelector';
import { SideSummaryCard } from './SideSummaryCard';

interface RallyConfigurationProps {
  rally: RallyConfiguration;
  onRallyChangeAction: (rally: RallyConfiguration) => void;
  playerHeroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  opponentHeroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  isUsingPlayerHeroes?: boolean;
  playerBaseStats: SideBaseStats;
  opponentBaseStats: SideBaseStats;
}

export default function RallyConfigurationComponent({
  rally,
  onRallyChangeAction,
  playerHeroLevels,
  opponentHeroLevels,
  playerBaseStats,
  opponentBaseStats,
}: RallyConfigurationProps) {
  const [activeTab, setActiveTab] = useState<'leaders' | 'joiners'>('leaders');
  const [rallyMode, setRallyMode] = useState<'player' | 'opponent'>(
    rally.usePlayerHeroes === false ? 'opponent' : 'player'
  );
  const heroes = getHeroesByClassForSelect();
  const isUsingPlayerHeroes = rallyMode === 'player';
  const playerJoiners = rally.playerJoiners || rally.joiners || [];
  const opponentJoiners = rally.opponentJoiners || [];

  const playerSideConfig = useMemo<RallySideConfig>(
    () => buildConfigForSide(rally, 'player', playerBaseStats),
    [rally, playerBaseStats]
  );
  const opponentSideConfig = useMemo<RallySideConfig>(
    () => buildConfigForSide(rally, 'opponent', opponentBaseStats),
    [rally, opponentBaseStats]
  );
  const rallySummary = useMemo(() => {
    const makeSummary = (side: RallySideConfig): SideCombatSummary => ({
      troopStats: side.baseStats as Record<TroopType, TroopStatLine>,
      damageDealtMultiplier: 1,
      damageTakenMultiplier: 1,
      controlSummary: {},
      dotSummary: undefined,
      debugEffects: []
    });
    return {
      attacker: playerSideConfig.role === 'attacker' ? makeSummary(playerSideConfig) : makeSummary(opponentSideConfig),
      defender: playerSideConfig.role === 'attacker' ? makeSummary(opponentSideConfig) : makeSummary(playerSideConfig)
    };
  }, [playerSideConfig, opponentSideConfig]);

  const playerSummary = playerSideConfig.role === 'attacker'
    ? rallySummary.attacker
    : rallySummary.defender;
  const opponentSummary = playerSideConfig.role === 'attacker'
    ? rallySummary.defender
    : rallySummary.attacker;

  const updateLeader = (type: TroopType, hero: RallyHero | null) => {
    if (rallyMode === 'player') {
      onRallyChangeAction({
        ...rally,
        leader: {
          ...rally.leader,
          [type]: hero,
        },
        playerLeader: {
          ...(rally.playerLeader || rally.leader),
          [type]: hero,
        },
      });
    } else {
      onRallyChangeAction({
        ...rally,
        leader: {
          ...rally.leader,
          [type]: hero,
        },
        opponentLeader: {
          ...(rally.opponentLeader || rally.leader),
          [type]: hero,
        },
      });
    }
  };

  const updateJoiner = (index: number, hero: RallyHero | null) => {
    const currentJoiners = rallyMode === 'player'
      ? [...playerJoiners]
      : [...opponentJoiners];

    if (hero) {
      currentJoiners[index] = hero;
    } else {
      currentJoiners.splice(index, 1);
    }

    const updatedJoiners = currentJoiners.slice(0, 4);

    if (rallyMode === 'player') {
      onRallyChangeAction({
        ...rally,
        playerJoiners: updatedJoiners,
        joiners: updatedJoiners,
      });
    } else {
      onRallyChangeAction({
        ...rally,
        opponentJoiners: updatedJoiners,
      });
    }
  };

  const addJoiner = () => {
    const currentJoiners = rallyMode === 'player'
      ? playerJoiners
      : opponentJoiners;

    if (currentJoiners.length >= 4) return;
    updateJoiner(currentJoiners.length, {
      heroName: '',
      heroClass: 'infantry',
      starLevel: 0,
      generation: 1,
      skillLevels: {},
      xpLevel: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionCard
        title="Rally Configuration"
        collapsible={false}
      >

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'leaders' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaders')}
          >
            Leaders (3)
          </button>
          <button
            className={`tab ${activeTab === 'joiners' ? 'active' : ''}`}
            onClick={() => setActiveTab('joiners')}
          >
            Joiners ({(() => {
              const playerCount = rally.playerJoiners?.length || rally.joiners?.length || 0;
              const opponentCount = rally.opponentJoiners?.length || 0;
              return playerCount + opponentCount > 0 ? `${playerCount + opponentCount}/8` : '0/8';
            })()})
          </button>
        </div>

        {/* Leaders Tab */}
        {activeTab === 'leaders' && (
          <LeadersTabContent
            rally={rally}
            rallyMode={rallyMode}
            heroes={heroes}
            isUsingPlayerHeroes={isUsingPlayerHeroes}
            playerHeroLevels={playerHeroLevels}
            opponentHeroLevels={opponentHeroLevels}
            onRallyChangeAction={onRallyChangeAction}
            onRallyModeChange={setRallyMode}
            onLeaderUpdate={updateLeader}
          />
        )}

        {/* Joiners Tab */}
        {activeTab === 'joiners' && (
          <JoinersTabContent
            rallyMode={rallyMode}
            playerJoiners={playerJoiners}
            opponentJoiners={opponentJoiners}
            isUsingPlayerHeroes={isUsingPlayerHeroes}
            playerHeroLevels={playerHeroLevels}
            opponentHeroLevels={opponentHeroLevels}
            onRallyModeChange={setRallyMode}
            onJoinerUpdate={updateJoiner}
            onAddJoiner={addJoiner}
          />
        )}

      </SectionCard>

      <SectionCard
        title="Rally Combat Summary"
        description="Summary of rally combat configuration showing player and opponent side stats."
        collapsible
        defaultCollapsed={false}
      >
        {!rallySummary && (
          <div className="text-sm text-gray-400 dark:text-gray-400 mt-4">
            Unable to build summary yet. Ensure both Player and Opponent base stats are configured.
          </div>
        )}
        {rallySummary && (
          <div className="grid gap-4 lg:grid-cols-2 mt-4">
            <SideSummaryCard
              title="Player"
              role={playerSideConfig.role}
              summary={playerSummary}
            />
            <SideSummaryCard
              title="Opponent"
              role={opponentSideConfig.role}
              summary={opponentSummary}
            />
          </div>
        )}
      </SectionCard>
    </div >
  );
}

/* ------------------------------------------------------------------ */
/*  Leaders Tab                                                        */
/* ------------------------------------------------------------------ */

interface LeadersTabContentProps {
  rally: RallyConfiguration;
  rallyMode: 'player' | 'opponent';
  heroes: ReturnType<typeof getHeroesByClassForSelect>;
  isUsingPlayerHeroes: boolean;
  playerHeroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  opponentHeroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  onRallyChangeAction: (rally: RallyConfiguration) => void;
  onRallyModeChange: (mode: 'player' | 'opponent') => void;
  onLeaderUpdate: (type: TroopType, hero: RallyHero | null) => void;
}

function LeadersTabContent({
  rally,
  rallyMode,
  heroes,
  isUsingPlayerHeroes,
  playerHeroLevels,
  opponentHeroLevels,
  onRallyChangeAction,
  onRallyModeChange,
  onLeaderUpdate,
}: LeadersTabContentProps) {
  return (
    <div className="tab-content active">
      <h3>Rally Leaders</h3>
      <p className="section-description">
        Select one hero for each troop type (Infantry, Lancer, Marksman). In Rally Battles, <strong>all Rally Captain Hero Skills are active</strong>.
        When a hero is selected, their skill levels, star levels, and power levels are automatically pulled from the Player/Opponent Heroes section if configured there.
      </p>

      {/* Player/Opponent Tabs */}
      <div className="tabs mb-6">
        <button
          className={`tab ${rallyMode === 'player' ? 'active' : ''}`}
          onClick={() => {
            onRallyModeChange('player');
            onRallyChangeAction({
              ...rally,
              usePlayerHeroes: true,
            });
            if (!rally.playerLeader) {
              syncLeadersFromHeroLevels(playerHeroLevels, heroes, onRallyChangeAction, rally, true);
            }
          }}
        >
          Player
        </button>
        <button
          className={`tab ${rallyMode === 'opponent' ? 'active' : ''}`}
          onClick={() => {
            onRallyModeChange('opponent');
            onRallyChangeAction({
              ...rally,
              usePlayerHeroes: false,
            });
            if (!rally.opponentLeader) {
              syncLeadersFromHeroLevels(opponentHeroLevels, heroes, onRallyChangeAction, rally, false);
            }
          }}
        >
          Opponent
        </button>
      </div>

      {/* Attacking/Defending Mode Selector */}
      <div className="form-group mb-6">
        <label>Special Widget Bonus Mode ({rallyMode === 'player' ? 'Player' : 'Opponent'})</label>
        <select
          title="Special Widget Bonus Mode"
          value={rally.specialWidgetBonus?.[rallyMode] || 'attacking'}
          onChange={(e) => {
            const newMode = e.target.value as 'attacking' | 'defending';
            onRallyChangeAction({
              ...rally,
              specialWidgetBonus: {
                player: rally.specialWidgetBonus?.player || 'attacking',
                opponent: rally.specialWidgetBonus?.opponent || 'defending',
                [rallyMode]: newMode,
              },
            });
          }}
        >
          <option value="attacking">Attacking (Rally Buff)</option>
          <option value="defending">Defending (Defender Skill)</option>
        </select>
        <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
          Mode is auto-detected from hero expedition skill descriptions. If a skill description contains &quot;Defender&quot;, it&rsquo;s defensive. If it contains &quot;Rally&quot;, it&rsquo;s attacking.
          {rally.specialWidgetBonus && (
            <span className="block mt-1">
              <strong>Player:</strong> {rally.specialWidgetBonus.player === 'attacking' ? 'Attacking' : 'Defending'} |
              <strong> Opponent:</strong> {rally.specialWidgetBonus.opponent === 'attacking' ? 'Attacking' : 'Defending'}
            </span>
          )}
        </p>
      </div>

      {(['infantry', 'lancer', 'marksman'] as TroopType[]).map(type => {
        const currentLeader = rallyMode === 'player'
          ? (rally.playerLeader?.[type] ?? rally.leader[type])
          : (rally.opponentLeader?.[type] ?? rally.leader[type]);

        return (
          <LeaderSelector
            key={type}
            type={type}
            hero={currentLeader}
            availableHeroes={heroes[type]}
            onHeroChange={(hero) => {
              onLeaderUpdate(type, hero);
              if (hero) {
                const heroData = heroes[type].find(h => h['hero-name'] === hero.heroName);
                if (heroData) {
                  const skills = getHeroExpeditionSkills(heroData);
                  let detectedMode: 'attacking' | 'defending' = rally.specialWidgetBonus?.[rallyMode] || 'attacking';
                  for (const skill of skills) {
                    const desc = skill.description?.toLowerCase() || '';
                    if (desc.includes('defender')) {
                      detectedMode = 'defending';
                      break;
                    } else if (desc.includes('rally')) {
                      detectedMode = 'attacking';
                      break;
                    }
                  }
                  const currentMode = rally.specialWidgetBonus?.[rallyMode];
                  if (detectedMode !== currentMode) {
                    onRallyChangeAction({
                      ...rally,
                      leader: {
                        ...rally.leader,
                        [type]: hero,
                      },
                      specialWidgetBonus: {
                        player: rally.specialWidgetBonus?.player || 'attacking',
                        opponent: rally.specialWidgetBonus?.opponent || 'defending',
                        [rallyMode]: detectedMode,
                      },
                    });
                  }
                }
              }
            }}
            heroLevels={isUsingPlayerHeroes ? playerHeroLevels : opponentHeroLevels}
            isUsingPlayerHeroes={isUsingPlayerHeroes}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Joiners Tab                                                        */
/* ------------------------------------------------------------------ */

interface JoinersTabContentProps {
  rallyMode: 'player' | 'opponent';
  playerJoiners: RallyHero[];
  opponentJoiners: RallyHero[];
  isUsingPlayerHeroes: boolean;
  playerHeroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  opponentHeroLevels?: Record<string, import('@/shared/types').HeroLevel>;
  onRallyModeChange: (mode: 'player' | 'opponent') => void;
  onJoinerUpdate: (index: number, hero: RallyHero | null) => void;
  onAddJoiner: () => void;
}

function JoinersTabContent({
  rallyMode,
  playerJoiners,
  opponentJoiners,
  isUsingPlayerHeroes,
  playerHeroLevels,
  opponentHeroLevels,
  onRallyModeChange,
  onJoinerUpdate,
  onAddJoiner,
}: JoinersTabContentProps) {
  const currentJoiners = rallyMode === 'player'
    ? playerJoiners
    : opponentJoiners;

  return (
    <div className="tab-content active">
      <div className="mb-4">
        <h3>Rally Joiners</h3>
        <p className="section-description">
          Up to 4 joiners per side. Only the <strong>first 4 joiners</strong> contribute bonuses. Each joiner uses their <strong>first expedition skill</strong> at its <strong>highest available skill level</strong>.
        </p>
      </div>

      {/* Player/Opponent Tabs */}
      <div className="tabs mb-6">
        <button
          className={`tab ${rallyMode === 'player' ? 'active' : ''}`}
          onClick={() => onRallyModeChange('player')}
        >
          Player
        </button>
        <button
          className={`tab ${rallyMode === 'opponent' ? 'active' : ''}`}
          onClick={() => onRallyModeChange('opponent')}
        >
          Opponent
        </button>
      </div>

      {currentJoiners.length < 4 && (
        <button className="button mb-4" onClick={onAddJoiner}>
          + Add Joiner
        </button>
      )}

      {currentJoiners.map((joiner, index) => (
        <JoinerSelector
          key={index}
          joiner={joiner}
          availableHeroes={getAllHeroesForSelect()}
          onJoinerChange={(hero) => onJoinerUpdate(index, hero)}
          onRemove={() => onJoinerUpdate(index, null)}
          heroLevels={isUsingPlayerHeroes ? playerHeroLevels : opponentHeroLevels}
          isUsingPlayerHeroes={isUsingPlayerHeroes}
        />
      ))}

      {currentJoiners.length === 0 && (
        <div className="text-center text-gray-400 dark:text-gray-400 py-8">
          No joiners added yet. Click &quot;+ Add Joiner&quot; to add one.
        </div>
      )}

      {currentJoiners.length > 0 && (
        <JoinerMathBreakdown joiners={currentJoiners} />
      )}
    </div>
  );
}
