import { DEFAULT_TROOP_MIX } from '@/lib/rally/rally-config';
import type { FightResult } from '../../../lib/rally/combat-fight';
import type { TroopMixConfig } from '../../types';
import BattlePredictor, { type BattleSideContext, type CapacityReport } from '../player_and_opponent/components/battle-predictor';

import type { BattleConfig, BattleReport } from '@/lib/combat/types';

interface ResultsTabProps {
  player: BattleSideContext | null;
  opponent: BattleSideContext | null;
  fightResult: FightResult | null;
  battleReport: BattleReport | null;
  errorMessage: string | null;
  simulationMode: BattleConfig['randomMode'];
  setSimulationModeAction: (mode: BattleConfig['randomMode']) => void;
  simulationCount: number;
  setSimulationCountAction: (count: number) => void;
  onMixChange: (side: 'player' | 'opponent', mix: TroopMixConfig) => void;
  playerCapacity: CapacityReport | null;
  opponentCapacity: CapacityReport | null;
  playerMixInput?: TroopMixConfig;
  opponentMixInput?: TroopMixConfig;
}

export default function ResultsTab({
  player,
  opponent,
  fightResult,
  battleReport,
  errorMessage,
  simulationMode,
  setSimulationModeAction,
  simulationCount,
  setSimulationCountAction,
  onMixChange,
  playerCapacity,
  opponentCapacity,
  playerMixInput = DEFAULT_TROOP_MIX,
  opponentMixInput = DEFAULT_TROOP_MIX
}: ResultsTabProps) {
  return (
    <div className="tab-content active">
      <BattlePredictor
        player={player}
        opponent={opponent}
        fightResult={fightResult}
        errorMessage={errorMessage}
        simulationMode={simulationMode}
        setSimulationModeAction={setSimulationModeAction}
        simulationCount={simulationCount}
        setSimulationCountAction={setSimulationCountAction}
        onMixChange={onMixChange}
        playerCapacity={playerCapacity}
        opponentCapacity={opponentCapacity}
        playerMixInput={playerMixInput}
        opponentMixInput={opponentMixInput}
        battleReport={battleReport}
      />
    </div>
  );
}

