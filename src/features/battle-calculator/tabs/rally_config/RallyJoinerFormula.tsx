'use client';

import { TROOP_TYPE_LIST, sumCapacityCounts } from '@/domain/battle/battle-calculator-helpers';
import { extractJoinerBonuses } from '@/domain/rally/rally-bonus-extractor';
import { useMemo } from 'react';
import type { RallyConfiguration } from '@/shared/types';
import { SectionCard } from '@/shared/ui';

interface RallyJoinerFormulaProps {
  rally: RallyConfiguration;
}

export default function RallyJoinerFormula({ rally }: RallyJoinerFormulaProps) {
  const joiners = rally.joiners ?? [];

  const joinerBonuses = useMemo(() => {
    const extracted = extractJoinerBonuses(joiners, 'attacking');
    const perScope = extracted.perScope;

    // Combine bonuses for each troop type
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

    // Calculate weighted average based on rally capacity
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

  const hasAnyBonuses = TROOP_TYPE_LIST.some(troop =>
    Object.values(joinerBonuses.combinedPerTroop[troop]).some(v => v > 0)
  );

  return (
    <SectionCard title="Rally Joiner Formula & Bonuses" className="mt-4">
      {/* How Rally Joiners Work */}
      <div className="space-y-2 mb-6">
        <h4 className="text-lg font-semibold">How Rally Joiners Work</h4>
        <ul className="list-disc pl-5 text-sm text-gray-300 dark:text-gray-300 space-y-1">
          <li>Up to <strong>4 joiners</strong> can be added to a rally</li>
          <li>Only the <strong>first 4 joiners</strong> contribute bonuses</li>
          <li>Each joiner uses their <strong>first expedition skill</strong> at its <strong>highest available skill level</strong></li>
          <li>Joiners contribute bonuses that are <strong>added to the additive bonuses</strong></li>
          <li>Leader heroes use their <strong>full skill levels</strong> and contribute to basic bonuses</li>
        </ul>
      </div>

      {/* Formula */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-2">Formula</h4>
        <div className="callout callout-muted font-mono text-sm">
          <div><strong>Final Stats =</strong></div>
          <div className="ml-4 mt-1">
            [(Basic Bonuses + Joiner Bonuses + Other Additive Bonuses)] × Multiplicative Bonuses
          </div>
        </div>
      </div>

      {/* Current Joiner Bonuses */}
      {joiners.length > 0 ? (
        <div>
          <h4 className="text-lg font-semibold mb-3">Current Joiner Bonuses</h4>
          <p className="text-sm text-gray-400 dark:text-gray-400 mb-3">
            First 4 joiners, first skill at max level
          </p>

          {/* Warning for excess joiners */}
          {joiners.length > 4 && (
            <div className="callout callout-warning text-sm mb-4">
              <strong>Note:</strong> Only the first 4 joiners contribute bonuses. {joiners.length - 4} additional joiner(s) will not contribute.
            </div>
          )}

          {/* Per-Troop Bonuses */}
          <div className="callout callout-muted mb-4">
            <strong className="block mb-3">Per-Troop Joiner Bonuses</strong>
            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {TROOP_TYPE_LIST.map((troop) => {
                const values = joinerBonuses.combinedPerTroop[troop];
                const hasValue = Object.values(values).some((v) => v > 0);
                return (
                  <div key={troop} className={!hasValue ? 'text-gray-400 dark:text-gray-400' : ''}>
                    <div className="font-semibold capitalize mb-2">{troop}</div>
                    <div className="space-y-1">
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

          {/* Weighted Overall */}
          <div className="callout callout-muted">
            <strong className="block mb-2">Weighted Overall (Display Only)</strong>
            <p className="text-xs text-gray-400 dark:text-gray-400 mb-3">
              Weighted by rally capacity mix
            </p>
            <div className="text-sm space-y-1">
              <div>Attack: +{joinerBonuses.weighted.attack.toFixed(2)}%</div>
              <div>Defense: +{joinerBonuses.weighted.defense.toFixed(2)}%</div>
              <div>Lethality: +{joinerBonuses.weighted.lethality.toFixed(2)}%</div>
              <div>Health: +{joinerBonuses.weighted.health.toFixed(2)}%</div>
            </div>
          </div>

          {/* No bonuses detected message */}
          {!hasAnyBonuses && (
            <div className="callout callout-muted text-sm mt-4">
              <strong>No bonuses detected from joiners.</strong>
              <p className="mt-2">This may be because:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Joiners don't have expedition skills</li>
                <li>First skill doesn't have level-based values</li>
                <li>Skills use different property names</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="callout callout-muted text-sm">
          No joiners added yet. Add joiners in the Rally Configuration tab to see their bonuses.
        </div>
      )}
    </SectionCard>
  );
}
