/**
 * Skill analysis utilities for battle turn logs.
 * Processes skill activations, impacts, and effects from combat engine.
 */

import type { NormalizedSkillEffect } from '@/domain/battle';
import type { TurnLog } from '@/domain/battle/engine/types';
import { formatEffectStat } from '../utils/format';

export function collectSkillActivations(turnLog: TurnLog | undefined, role: 'attacker' | 'defender'): {
  hero: Array<{ name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string; succeeded?: boolean }>;
  troop: Array<{ name: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string; succeeded?: boolean }>;
  impacts: Array<{
    name: string;
    heroId?: string;
    stats?: string[];
    specialStats?: string[];
    damageModifier?: boolean;
    target?: string;
    trigger?: string;
    sourceType?: 'hero' | 'troop';
    succeeded?: boolean;
  }>;
} {
  if (!turnLog) return { hero: [], troop: [], impacts: [] };
  const heroCounts = new Map<string, { name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>();
  const troopCounts = new Map<string, { name: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>();
  const impacts: Array<{ name: string; heroId?: string; stats?: string[]; specialStats?: string[]; damageModifier?: boolean; target?: string; trigger?: string; sourceType?: 'hero' | 'troop'; succeeded?: boolean }> = [];
  const rolls: Array<{ name: string; heroId?: string; trigger?: string; succeeded?: boolean }> =
    turnLog.skillRolls?.filter((r) => r.side === role) ?? [];

  // Create lookup maps for trigger and sourceType from skillRolls
  const triggerMap = new Map<string, string>();
  const sourceTypeMap = new Map<string, 'hero' | 'troop'>();
  rolls.forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}`;
    if (r.trigger && !triggerMap.has(key)) {
      triggerMap.set(key, r.trigger);
    }
  });
  turnLog.skillRolls?.filter((r) => r.side === role).forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}`;
    if (r.sourceType && !sourceTypeMap.has(key)) {
      sourceTypeMap.set(key, r.sourceType);
    }
  });

  // Prefer explicit skill activation log
  if (turnLog.skillsActivated && turnLog.skillsActivated.length) {
    turnLog.skillsActivated
      .filter((entry) => entry.side === role)
      .forEach((entry) => {
        const isHero = Boolean(entry.heroId);
        const key = `${entry.heroId ?? '__troop'}:${entry.name}`;
        const trigger = triggerMap.get(key);
        const triggerKey = (trigger ?? '').toLowerCase();
        const passive = triggerKey.includes('passive') || entry.isActive;
        if (isHero) {
          const existing = heroCounts.get(key);
          heroCounts.set(key, {
            name: entry.name,
            heroId: entry.heroId,
            count: passive ? 1 : (existing?.count ?? 0) + 1,
            trigger: trigger,
            sourceType: 'hero',
            target: undefined
          });
        } else {
          const existing = troopCounts.get(entry.name);
          troopCounts.set(entry.name, {
            name: entry.name,
            count: passive ? 1 : (existing?.count ?? 0) + 1,
            trigger: trigger,
            sourceType: 'troop',
            target: undefined
          });
        }
      });
    // impacts for this role
    if (turnLog.skillImpacts && turnLog.skillImpacts.length) {
      turnLog.skillImpacts
        .filter((entry) => entry.side === role)
        .forEach((entry) => {
          const key = `${entry.heroId ?? '__troop'}:${entry.name}`;
          impacts.push({
            name: entry.name,
            heroId: entry.heroId,
            stats: entry.stats,
            specialStats: entry.specialStats,
            damageModifier: entry.damageModifier,
            target: undefined, // skillImpacts doesn't have target property
            trigger: entry.trigger ?? triggerMap.get(key),
            sourceType: (sourceTypeMap.get(key) ?? (entry.heroId ? 'hero' : 'troop')) as 'hero' | 'troop',
            succeeded: entry.succeeded
          });
        });
    }
  } else {
    // Fallback: derive from actions if available
    const relevantActions = turnLog.actions.filter((a) => a.side === role);
    const skillActions = relevantActions.filter((a) => a.skillName || a.skillId);
    skillActions.forEach((action) => {
      const name = action.skillName || action.skillId || 'Skill';
      const existing = troopCounts.get(name);
      troopCounts.set(name, { name, count: (existing?.count ?? 0) + 1 });
    });
  }

  const impactLookup = new Map<string, { trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>();
  impacts.forEach((i) => {
    const key = `${i.heroId ?? '__troop'}:${i.name}`;
    impactLookup.set(key, { trigger: i.trigger, sourceType: i.sourceType, target: i.target });
  });

  const toArrHero = (m: Map<string, { name: string; heroId?: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>) =>
    Array.from(m.values()).map((v) => {
      const meta = impactLookup.get(`${v.heroId ?? '__troop'}:${v.name}`);
      return { ...v, trigger: v.trigger ?? meta?.trigger, sourceType: v.sourceType ?? meta?.sourceType, target: v.target ?? meta?.target };
    });
  const toArrTroop = (m: Map<string, { name: string; count: number; trigger?: string; sourceType?: 'hero' | 'troop'; target?: string }>) =>
    Array.from(m.values()).map((v) => {
      const meta = impactLookup.get(`__troop:${v.name}`);
      return { ...v, trigger: v.trigger ?? meta?.trigger, sourceType: v.sourceType ?? meta?.sourceType, target: v.target ?? meta?.target };
    });

  return { hero: toArrHero(heroCounts), troop: toArrTroop(troopCounts), impacts };
}

export function skillsForSide(turn: TurnLog, side: 'attacker' | 'defender') {
  const rows: Array<{ name: string; trigger?: string; succeeded?: boolean; heroId?: string }> = [];
  const push = (name: string, trigger?: string, succeeded?: boolean, heroId?: string) => {
    rows.push({ name, trigger, succeeded, heroId });
  };
  // Create a lookup map for triggers from skillRolls
  const triggerMap = new Map<string, string>();
  turn.skillRolls?.filter((r) => r.side === side).forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}`;
    if (r.trigger && !triggerMap.has(key)) {
      triggerMap.set(key, r.trigger);
    }
  });
  turn.skillsActivated?.filter((s) => s.side === side).forEach((s) => {
    const key = `${s.heroId ?? '__troop'}:${s.name}`;
    const trigger = s.isActive ? 'Passive' : triggerMap.get(key) ?? (s as any).trigger;
    push(s.name, trigger, s.succeeded, s.heroId);
  });
  turn.skillImpacts?.filter((s) => s.side === side).forEach((s) => push(s.name, s.trigger as any, s.succeeded, s.heroId));
  turn.skillRolls?.filter((r) => r.side === side).forEach((r) => push(r.name, r.trigger, r.succeeded, r.heroId));
  // Dedup by name/heroId/trigger keeping first hit/miss
  const seen = new Set<string>();
  const unique: typeof rows = [];
  rows.forEach((r) => {
    const key = `${r.heroId ?? '__troop'}:${r.name}:${r.trigger ?? 'any'}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(r);
  });
  return unique;
}

export function splitSkillEffects(effects: NormalizedSkillEffect[]) {
  const hero = effects.filter((effect) => effect.source !== 'troop-passive');
  const troop = effects.filter((effect) => effect.source === 'troop-passive');
  return {
    heroEffects: collapseEffects(hero),
    troopEffects: collapseEffects(troop)
  };
}

export function collapseEffects(effects: NormalizedSkillEffect[]) {
  const map = new Map<string, number>();
  effects.forEach((effect) => {
    const label = `${effect.sourceName} · ${formatEffectStat(effect.stat)}`;
    map.set(label, (map.get(label) ?? 0) + effect.value);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 5);
}
