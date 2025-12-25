'use client';

import type { ExpertSelections } from '@/lib/battle';
import {
  createDefaultAdditiveBonuses,
  defaultExpertSelections
} from '@/lib/battle/battle-calculator-helpers';
import type { AdditiveBonuses, BasicBonuses, MultiplicativeBonuses } from '@/lib/battle/calculations';

import type { UserProfile } from '@/components/types';
import { SectionCard } from '@/components/ui';

import MultiplicativeBonusesInput from '@/components/tabs/player-and-opponent/components/info/capacity/MultiplicativeBonusesInput';
import DataSelectors from '@/components/tabs/player-and-opponent/components/special-bonuses/DataSelectors';
import AdditiveBonusesInput from '@/components/tabs/rally_config/additive-bonuses-input';

export default function PlayerBasicSubTab({
  currentProfile,
  setCurrentProfile
}: {
  currentProfile: UserProfile;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}) {
  return (
    <div>
      <SectionCard
        title="Basic Bonuses"
        description="Configure basic bonuses including combat tech, experts, pets, and hero gear."
      >
        <DataSelectors
          basicBonuses={currentProfile.basicBonuses}
          onBasicBonusesChange={(bonuses: BasicBonuses) => {
            setCurrentProfile((prev) => (prev ? { ...prev, basicBonuses: bonuses } : null));
          }}
          expertSelections={currentProfile.expertSelections || defaultExpertSelections}
          onExpertSelectionsChange={(selections: ExpertSelections) => {
            setCurrentProfile((prev) => (prev ? { ...prev, expertSelections: selections } : null));
          }}
          additiveBonuses={currentProfile.additiveBonuses}
          onAdditiveBonusesChange={(bonuses: AdditiveBonuses) => {
            setCurrentProfile((prev) =>
              prev
                ? {
                  ...prev,
                  additiveBonuses: {
                    ...bonuses,
                    manualOverrideTotals: prev.additiveBonuses?.manualOverrideTotals
                  }
                }
                : null
            );
          }}
          multiplicativeBonuses={currentProfile.multiplicativeBonuses}
          onMultiplicativeBonusesChange={(bonuses: MultiplicativeBonuses) => {
            setCurrentProfile((prev) =>
              prev
                ? {
                  ...prev,
                  multiplicativeBonuses: {
                    ...bonuses,
                    manualOverrideTotals: prev.multiplicativeBonuses?.manualOverrideTotals
                  }
                }
                : null
            );
          }}
          rally={currentProfile.rally}
        />
      </SectionCard>

      <SectionCard title="Other Basic Bonuses" collapsible defaultCollapsed={false}>
        <div className="grid">
          {(['attack', 'defense', 'lethality', 'health'] as const).map((stat) => {
            const label = stat.charAt(0).toUpperCase() + stat.slice(1);
            return (
              <div key={stat} className="form-group">
                <label>Alliance Tech - {label} % (Max 10%)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={(currentProfile.basicBonuses.allianceTech as any)[stat]}
                  onChange={(e) =>
                    setCurrentProfile({
                      ...currentProfile,
                      basicBonuses: {
                        ...currentProfile.basicBonuses,
                        allianceTech: {
                          ...currentProfile.basicBonuses.allianceTech,
                          [stat]: Math.min(10, parseFloat(e.target.value) || 0)
                        }
                      }
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Additive Bonuses" collapsible defaultCollapsed={false}>
        <AdditiveBonusesInput
          bonuses={currentProfile.additiveBonuses || createDefaultAdditiveBonuses()}
          onBonusesChange={(bonuses: AdditiveBonuses) => {
            setCurrentProfile((prev) => (prev ? { ...prev, additiveBonuses: bonuses } : null));
          }}
        />
      </SectionCard>

      <SectionCard title="Multiplicative Bonuses" collapsible defaultCollapsed={false}>
        <MultiplicativeBonusesInput
          bonuses={currentProfile.multiplicativeBonuses}
          onBonusesChange={(bonuses: MultiplicativeBonuses) => {
            setCurrentProfile((prev) => (prev ? { ...prev, multiplicativeBonuses: bonuses } : null));
          }}
          petSkillSelections={currentProfile.petSkillSelections}
          isOpponent={false}
        />
      </SectionCard>
    </div>
  );
}
