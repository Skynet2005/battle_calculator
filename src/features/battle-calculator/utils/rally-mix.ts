import type { TroopMixConfig } from '@/shared/types';
import { applyRallyCapToTotal } from '@/domain/rally/mix-utils';

/**
 * Applies rally capacity cap to a troop mix configuration.
 */
export function applyRallyCap(mix: TroopMixConfig, cap?: number | null): TroopMixConfig {
  const cappedTotal = applyRallyCapToTotal(mix.totalTroops, cap);
  return {
    ...mix,
    totalTroops: cappedTotal
  };
}
