import type { NormalizedSkillEffect } from '@/domain/battle';
import type { TroopCounts as CombatTroopCounts } from '@/domain/combat/types';
import type { RoundResult } from '@/domain/rally/combat-battle-round';

export function formatBigNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

export function formatPercent(value: number, digits = 1): string {
  // Assumes value is already 0–100 in your mix UI.
  return `${value.toFixed(digits)}%`;
}

function toPercentMaybe(value: number): number {
  // If your engine stores 0.10 for 10%, convert to 10.
  // If it already stores 10, keep it.
  return Math.abs(value) <= 2 ? value * 100 : value;
}

export function formatSignedPercent(value: number, digits = 2): string {
  const pct = toPercentMaybe(value);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

export function formatStatValue(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function formatMultiplier(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}×`;
}

export function formatPowerValue(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatNumber(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toFixed(3);
}

export function formatTroopCounts(counts?: CombatTroopCounts): string {
  if (!counts) return '—';
  return `${counts.Infantry ?? 0}/${counts.Lancer ?? 0}/${counts.Marksman ?? 0}`;
}

export function formatCasualtyLine(casualties: RoundResult['attackerCasualties']): string {
  return `INF ${casualties.infantry.toLocaleString()} · LNC ${casualties.lancer.toLocaleString()} · MRK ${casualties.marksman.toLocaleString()}`;
}

export function shorten(value?: string, max = 14): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatEffectValue(value: number): string {
  const percent = value * 100;
  if (Math.abs(percent) < 0.01) {
    return '0.00%';
  }
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

export function formatEffectStat(stat: NormalizedSkillEffect['stat']): string {
  switch (stat) {
    case 'attack':
      return 'Attack';
    case 'defense':
      return 'Defense';
    case 'health':
      return 'Health';
    case 'lethality':
      return 'Lethality';
    case 'damage_dealt':
      return 'Damage Dealt';
    case 'damage_taken':
      return 'Damage Taken';
    case 'control_chance':
      return 'Control';
    default:
      return stat?.replace(/_/g, ' ') ?? 'Bonus';
  }
}
