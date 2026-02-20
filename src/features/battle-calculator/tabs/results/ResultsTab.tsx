import type { BattleConfig, BattleReport } from '@/domain/battle/engine/types';
import { DEFAULT_TROOP_MIX } from '@/domain/rally/rally-config';
import type { TroopMixConfig } from '@/shared/types';
import type { FightResult } from '@/domain/rally/combat-fight';
import BattlePredictor from './battle-predictor';
import type {
  BattleSideContext,
  CapacityReport,
} from '@/features/battle-calculator/model/types';

interface ResultsTabProps {
  player: BattleSideContext | null;
  opponent: BattleSideContext | null;
  fightResult: FightResult | null;
  battleReport: BattleReport | null;
  previousBattleReport?: BattleReport | null;
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
  previousBattleReport,
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
        battleReport={battleReport}
        previousBattleReport={previousBattleReport}
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
      />
    </div>
  );
}
