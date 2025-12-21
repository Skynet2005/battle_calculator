'use client';

import { TROOP_TYPE_LIST, sumCapacityCounts } from '@/lib/battle/battle-calculator-helpers';
import { extractJoinerBonuses } from '@/lib/rally/rally-bonus-extractor';
import { useMemo } from 'react';
import type { RallyConfiguration } from '../../types';
import { SectionCard } from '../../ui';

interface RallyJoinerFormulaProps {
  rally: RallyConfiguration;
}

export default function RallyJoinerFormula({ rally }: RallyJoinerFormulaProps) {
  const joiners = rally.joiners ?? [];

  const joinerBonuses = useMemo(() => {
    const extracted = extractJoinerBonuses(joiners, 'attacking');
    const perScope = extracted.perScope;

    const combinedPerTroop = TROOP_TYPE_LIST.reduce<Record<string, { attack: number; defense: number; lethality: number; health: number }>>((acc, troop) => {
      const all = perScope.additive.all_troops || {};
      const rallyAdd = perScope.additive.rally_troops || {};
      const troopAdd = perScope.additive[troop] || {};
      acc[troop] = {
        attack: (all.attack || 0) + (rallyAdd.attack || 0) + (troopAdd.attack || 0),
        defense: (all.defense || 0) + (rallyAdd.defense || 0) + (troopAdd.defense || 0),
        lethality: (all.lethality || 0) + (rallyAdd.lethality || 0) + (troopAdd.lethality || 0),
        health: (all.health || 0) + (rallyAdd.health || 0) + (troopAdd.health || 0),
      };
      return acc;
    }, {});

    const capacityCounts = sumCapacityCounts(rally.capacity);
    const totalTroops = Math.max(1, capacityCounts.infantry + capacityCounts.lancer + capacityCounts.marksman);

    const weighted = TROOP_TYPE_LIST.reduce(
      (acc, troop) => {
        const weight = capacityCounts[troop] > 0 ? capacityCounts[troop] / totalTroops : 0;
        acc.attack += (combinedPerTroop[troop].attack || 0) * weight;
        acc.defense += (combinedPerTroop[troop].defense || 0) * weight;
        acc.lethality += (combinedPerTroop[troop].lethality || 0) * weight;
        acc.health += (combinedPerTroop[troop].health || 0) * weight;
        return acc;
      },
      { attack: 0, defense: 0, lethality: 0, health: 0 }
    );

    return { combinedPerTroop, weighted };
  }, [joiners, rally.capacity]);

  return (
    <SectionCard
      title="Rally Joiner Formula & Bonuses"
      className="mt-4"
    >

      <div className="space-y-2 mb-4">
        <h4>How Rally Joiners Work:</h4>
        <ul className="list-disc pl-5 text-sm text-gray-300 dark:text-gray-300 space-y-1">
          <li>Up to <strong>4 joiners</strong> can be added to a rally</li>
          <li>Only the <strong>first 4 joiners</strong> contribute bonuses</li>
          <li>Each joiner uses their <strong>first expedition skill</strong> at its <strong>highest available skill level</strong></li>
          <li>Joiners contribute bonuses that are <strong>added to the additive bonuses</strong></li>
          <li>Leader heroes use their <strong>full skill levels</strong> and contribute to basic bonuses</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4>Formula:</h4>
        <div className="callout callout-muted font-mono text-sm mt-2">
          <div><strong>Final Stats =</strong></div>
          <div className="ml-4 mt-1">
            [(Basic Bonuses + Joiner Bonuses + Other Additive Bonuses)] × Multiplicative Bonuses
          </div>
        </div>
      </div>

      {joiners.length > 0 ? (
        <div>
          <h4>Current Joiner Bonuses (First 4 Joiners, First Skill at Max Level):</h4>
          {joiners.length > 4 && (
            <div className="callout callout-warning text-sm my-2">
              <strong>Note:</strong> Only the first 4 joiners contribute bonuses. {joiners.length - 4} additional joiner(s) will not contribute.
            </div>
          )}
          <div className="grid gap-4 mt-3">
            <div className="callout callout-muted">
              <strong>Per-Troop Joiner Bonuses (attack/defense/lethality/health):</strong>
              <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-2">
                {TROOP_TYPE_LIST.map((troop) => {
                  const values = joinerBonuses.combinedPerTroop[troop];
                  const hasValue = Object.values(values).some((v) => v > 0);
                  return (
                    <div key={troop} className={!hasValue ? 'text-gray-400 dark:text-gray-400' : ''}>
                      <div className="font-semibold capitalize">{troop}</div>
                      <div className="mt-1 space-y-1">
                        <div>Attack: +{values.attack.toFixed(2)}%</div>
                        <div>Defense: +{values.defense.toFixed(2)}%</div>
                        <div>Lethality: +{values.lethality.toFixed(2)}%</div>
                        <div>Health: +{values.health.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="callout callout-muted">
              <strong>Derived Overall (weighted by rally capacity mix, display-only):</strong>
              <div className="text-sm mt-2 space-y-1">
                <div>Attack: +{joinerBonuses.weighted.attack.toFixed(2)}%</div>
                <div>Defense: +{joinerBonuses.weighted.defense.toFixed(2)}%</div>
                <div>Lethality: +{joinerBonuses.weighted.lethality.toFixed(2)}%</div>
                <div>Health: +{joinerBonuses.weighted.health.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {TROOP_TYPE_LIST.every(troop => Object.values(joinerBonuses.combinedPerTroop[troop]).every(v => v === 0)) && (
            <div className="text-sm text-gray-400 dark:text-gray-400 mt-2">
              No bonuses detected from joiners. This may be because:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Joiners don't have expedition skills</li>
                <li>First skill doesn't have level-based values</li>
                <li>Skills use different property names</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-400 dark:text-gray-400">
          No joiners added yet. Add joiners in the Rally Configuration tab to see their bonuses.
        </div>
      )}
    </SectionCard>
  );
}

