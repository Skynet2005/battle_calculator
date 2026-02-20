/**
 * Formula Breakdown - Shows the exact battle calculation formulas
 *
 * Displays the formulas used in battle calculations with actual values:
 * - Final Stats Formula: X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)
 * - Damage Formula: Hidden Factor × √(Troop Count) × Attack × Lethality ÷ Enemy Defense
 * - Balance Equation: (Attacker_HP×ATK×LETH×DEF) / (Defender_HP×ATK×LETH×DEF) / (Defender_Troops/Attacker_Troops)^1.5
 */

import { TROOP_TYPE_LIST } from '@/domain/battle/battle-calculator-helpers';
import type { FinalStats } from '@/domain/battle/calculations';
import { calculateBalanceRatio, calculatePowerIndex } from '@/domain/battle/calculations';
import { totalTroops } from '@/domain/rally/combat-fighter';
import type { BattleSideContext } from '@/features/battle-calculator/model/types';
import { SectionCard } from '@/shared/ui';
import { useMemo } from 'react';

function formatFormulaNumber(n: number, decimals = 2) {
  if (n === 0) return '0';
  if (Math.abs(n) < 0.01) return n.toExponential(2);
  return n.toFixed(decimals);
}

function formatFormulaPercent(n: number) {
  return `${n >= 0 ? '+' : ''}${formatFormulaNumber(n)}%`;
}

interface FormulaBreakdownProps {
  player: BattleSideContext;
  opponent: BattleSideContext;
}

export function FormulaBreakdown({ player, opponent }: FormulaBreakdownProps) {
  const playerStats = player.stats;
  const opponentStats = opponent.stats;
  const playerTroops = player.troopCounts ? totalTroops(player.troopCounts) : 0;
  const opponentTroops = opponent.troopCounts ? totalTroops(opponent.troopCounts) : 0;

  // Calculate average stats across troop types for display
  const playerAvgStats = useMemo(() => {
    if (!playerStats) return null;
    const stats: FinalStats = { attack: 0, defense: 0, lethality: 0, health: 0 };
    let count = 0;
    TROOP_TYPE_LIST.forEach((troop) => {
      if (playerStats[troop]) {
        stats.attack += playerStats[troop].attack;
        stats.defense += playerStats[troop].defense;
        stats.lethality += playerStats[troop].lethality;
        stats.health += playerStats[troop].health;
        count++;
      }
    });
    if (count === 0) return null;
    return {
      attack: stats.attack / count,
      defense: stats.defense / count,
      lethality: stats.lethality / count,
      health: stats.health / count,
    };
  }, [playerStats]);

  const opponentAvgStats = useMemo(() => {
    if (!opponentStats) return null;
    const stats: FinalStats = { attack: 0, defense: 0, lethality: 0, health: 0 };
    let count = 0;
    TROOP_TYPE_LIST.forEach((troop) => {
      if (opponentStats[troop]) {
        stats.attack += opponentStats[troop].attack;
        stats.defense += opponentStats[troop].defense;
        stats.lethality += opponentStats[troop].lethality;
        stats.health += opponentStats[troop].health;
        count++;
      }
    });
    if (count === 0) return null;
    return {
      attack: stats.attack / count,
      defense: stats.defense / count,
      lethality: stats.lethality / count,
      health: stats.health / count,
    };
  }, [opponentStats]);

  // Calculate balance ratio
  // Note: Stats in SideBaseStats include base troop stats, but calculateBalanceRatio expects percentage bonuses
  // We'll use the stats as-is since they represent the final effective values
  const balanceRatio = useMemo(() => {
    if (!playerAvgStats || !opponentAvgStats || playerTroops === 0 || opponentTroops === 0) return null;

    // Convert to FinalStats format (treating as percentage bonuses)
    const playerFinalStats: FinalStats = {
      attack: playerAvgStats.attack,
      defense: playerAvgStats.defense,
      lethality: playerAvgStats.lethality,
      health: playerAvgStats.health,
    };

    const opponentFinalStats: FinalStats = {
      attack: opponentAvgStats.attack,
      defense: opponentAvgStats.defense,
      lethality: opponentAvgStats.lethality,
      health: opponentAvgStats.health,
    };

    return calculateBalanceRatio(
      playerFinalStats,
      playerTroops,
      opponentFinalStats,
      opponentTroops
    );
  }, [playerAvgStats, opponentAvgStats, playerTroops, opponentTroops]);

  // Calculate power indices
  const playerPowerIndex = useMemo(() => {
    if (!playerAvgStats || playerTroops === 0) return null;
    return calculatePowerIndex(
      {
        attack: playerAvgStats.attack,
        defense: playerAvgStats.defense,
        lethality: playerAvgStats.lethality,
        health: playerAvgStats.health,
      },
      playerTroops
    );
  }, [playerAvgStats, playerTroops]);

  const opponentPowerIndex = useMemo(() => {
    if (!opponentAvgStats || opponentTroops === 0) return null;
    return calculatePowerIndex(
      {
        attack: opponentAvgStats.attack,
        defense: opponentAvgStats.defense,
        lethality: opponentAvgStats.lethality,
        health: opponentAvgStats.health,
      },
      opponentTroops
    );
  }, [opponentAvgStats, opponentTroops]);

  if (!playerStats || !opponentStats || !playerAvgStats || !opponentAvgStats) {
    return null;
  }

  return (
    <SectionCard
      title="Battle Calculation Formulas"
      description="Exact formulas used to calculate battle outcomes"
      className="mt-6"
      collapsible
      defaultCollapsed={true}
    >
      <div className="space-y-6">
        {/* Final Stats Formula */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-200">Final Stats Formula</div>
          <div className="text-xs text-gray-400 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
            X_final% = ( X_base% × (1 + BuffSum%/100) + FlatBuff% - FlatDebuff% ) / (1 + DebuffSum%/100)
          </div>
          <div className="text-xs text-gray-400 space-y-1 pl-2">
            <div className="font-semibold text-slate-300">Step A - Pooled Base Stat %:</div>
            <div>• X_base% = X_basic% + X_additive%</div>
            <div className="mt-2 font-semibold text-slate-300">Step B - Apply Multiplicative Effects:</div>
            <div>• BuffSum% = Sum of multiplicative stat buff percentages:</div>
            <div className="pl-4">- Castle/Event stat buffs</div>
            <div className="pl-4">- Pet skills ("Troops Attack +X%")</div>
            <div className="pl-4">- Exclusive weapon stat buffs</div>
            <div className="pl-4">- City stat bonuses (10% or 20%) - multiplicative, not additive</div>
            <div className="pl-4">- Alliance territory, Tyrant Spire stat buffs</div>
            <div>• FlatBuff% = Flat buff bonuses (rare)</div>
            <div>• FlatDebuff% = Flat debuff values (rare)</div>
            <div>
              • DebuffSum% = stat reductions applied to this side&#39;s stat line
            </div>
            <div className="text-amber-300 pl-4">
              Enemy-targeted reductions should be applied when calculating the enemy’s stats, not yours
            </div>
            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300">
              <div className="font-semibold">Important Separation:</div>
              <div>Combat modifiers (Damage Up, Damage Taken Down, Skill Damage) are NOT stat multipliers.</div>
              <div>They apply at the damage step, not inside Final Stats calculation.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">{player.label} Average Stats</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>ATK: {formatFormulaPercent(playerAvgStats.attack)}</div>
                <div>DEF: {formatFormulaPercent(playerAvgStats.defense)}</div>
                <div>LETH: {formatFormulaPercent(playerAvgStats.lethality)}</div>
                <div>HP: {formatFormulaPercent(playerAvgStats.health)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">{opponent.label} Average Stats</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>ATK: {formatFormulaPercent(opponentAvgStats.attack)}</div>
                <div>DEF: {formatFormulaPercent(opponentAvgStats.defense)}</div>
                <div>LETH: {formatFormulaPercent(opponentAvgStats.lethality)}</div>
                <div>HP: {formatFormulaPercent(opponentAvgStats.health)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Damage Formula */}
        <div className="space-y-3 pt-4 border-t border-slate-700/50">
          <div className="text-sm font-semibold text-slate-200">Damage Formula (Empirical Approximation)</div>
          <div className="text-xs text-gray-400 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
            BaseDamage ≈ K × √(Troop Count) × (Attack × Lethality) / EnemyDefense
          </div>
          <div className="text-xs text-gray-400 space-y-1 pl-2">
            <div>Base Damage (stat-only):</div>
            <div>• K = Hidden factor (troop tier, Fire Crystal level, troop type)</div>
            <div>• Troop count uses square root scaling (√) - diminishing returns after ~5k troops</div>
            <div>• Attack and Lethality multiply together in the numerator</div>
            <div>• Enemy Defense divides the total damage</div>
            <div className="mt-2 text-amber-300">Important: HP does NOT belong in damage numerator/denominator. HP affects survivability across rounds, not raw hit damage.</div>
            <div className="mt-2">Combat Modifiers (applied after base damage):</div>
            <div className="space-y-1 pl-2">
              <div><strong>Normal Attacks:</strong></div>
              <div>• NormalDamage = BaseDamage × (1 + NormalAttackDmg%/100) × (1 + DamageDealt%/100)</div>
              <div className="mt-1"><strong>Skill Actions:</strong></div>
              <div>• NormalDamage = BaseDamage × (1 + NormalAttackDmg%/100) × (1 + DamageDealt%/100)</div>
              <div>• SkillDamage = NormalDamage × (1 + SkillDamage%/100) × (1 + DamageDealt%/100)</div>
              <div>• Skill-specific chance: ExtraDamage = NormalDamage (doubling, no modifiers)</div>
              <div>• TotalDamage = NormalDamage + SkillDamage + ExtraDamage</div>
              <div className="mt-1 text-amber-300">Key: NormalAttackDmg% only affects normal attacks. DamageDealt% affects all damage sources.</div>
              <div className="text-amber-300">Doubling chance is skill-source dependent (e.g., Crystal Lance: 15%, some heroes: 25%, default: 25%)</div>
            </div>
            <div className="text-amber-300 mt-2">Note: Damage modifiers are NOT stat multipliers - they apply at the damage step.</div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">{player.label}</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Troops: {playerTroops.toLocaleString()}</div>
                <div>√(Troops): {formatFormulaNumber(Math.sqrt(Math.max(0, playerTroops)))}</div>
                <div>ATK × LETH: {formatFormulaNumber((1 + playerAvgStats.attack / 100) * (1 + playerAvgStats.lethality / 100), 4)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">{opponent.label}</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Troops: {opponentTroops.toLocaleString()}</div>
                <div>√(Troops): {formatFormulaNumber(Math.sqrt(Math.max(0, opponentTroops)))}</div>
                <div>DEF: {formatFormulaPercent(opponentAvgStats.defense)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Equation */}
        <div className="space-y-3 pt-4 border-t border-slate-700/50">
          <div className="text-sm font-semibold text-slate-200">Balance Equation (Heuristic Predictor)</div>
          <div className="text-xs text-gray-400 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
            Ratio = (Att_HP × Att_ATK × Att_LETH × Att_DEF) / (Def_HP × Def_ATK × Def_LETH × Def_DEF) / (Def_Troops / Att_Troops)^1.5
          </div>
          <div className="text-xs text-gray-400 space-y-1 pl-2">
            <div className="text-amber-300 mb-1">Note: This is a heuristic predictor, not the actual per-turn combat engine.</div>
            <div>Interpretation:</div>
            <div>• Ratio {'>'} 1 = Attacker advantage (more likely to break)</div>
            <div>• Ratio {'<'} 1 = Defender advantage (more likely to hold)</div>
            <div>• Troop count uses exponent 1.5 (not linear scaling)</div>
            <div>• Small stat advantages compound over rounds</div>
          </div>
          {balanceRatio !== null && (
            <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700/50">
              <div className="text-xs font-semibold text-slate-300 mb-2">Calculated Balance Ratio</div>
              <div className="text-lg font-bold text-center">
                <span className={balanceRatio > 1 ? 'text-emerald-300' : balanceRatio < 1 ? 'text-rose-300' : 'text-slate-300'}>
                  {formatFormulaNumber(balanceRatio, 4)}
                </span>
              </div>
              <div className="text-xs text-gray-400 text-center mt-1">
                {balanceRatio > 1
                  ? `${player.label} has advantage`
                  : balanceRatio < 1
                    ? `${opponent.label} has advantage`
                    : 'Evenly matched'}
              </div>
            </div>
          )}
        </div>

        {/* Power Index */}
        {(playerPowerIndex !== null || opponentPowerIndex !== null) && (
          <div className="space-y-3 pt-4 border-t border-slate-700/50">
            <div className="text-sm font-semibold text-slate-200">Power Index</div>
            <div className="text-xs text-gray-400 font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50">
              Power Index = (1 + ATK%) × (1 + LETH%) × (1 + DEF%) × (1 + HP%) × (Troop Count)^1.5
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              {playerPowerIndex !== null && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">{player.label}</div>
                  <div className="text-xs text-gray-400">
                    Power Index: <span className="font-mono text-slate-200">{formatFormulaNumber(playerPowerIndex, 2)}</span>
                  </div>
                </div>
              )}
              {opponentPowerIndex !== null && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">{opponent.label}</div>
                  <div className="text-xs text-gray-400">
                    Power Index: <span className="font-mono text-slate-200">{formatFormulaNumber(opponentPowerIndex, 2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
