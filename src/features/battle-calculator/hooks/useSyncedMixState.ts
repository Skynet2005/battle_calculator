import { useEffect, useMemo, useRef, useState } from 'react';
import { applyRallyCapToTotal, normalizeRatios, type TroopMixConfig } from '@/domain/rally/mix-utils';

function primeMix(mix: TroopMixConfig | null | undefined, fallback: TroopMixConfig, cap?: number | null): TroopMixConfig {
  const base = mix ?? fallback;
  const total = base.totalTroops && base.totalTroops > 0
    ? applyRallyCapToTotal(base.totalTroops, cap)
    : (cap && cap > 0 ? applyRallyCapToTotal(cap, cap) : 0);

  return normalizeRatios({ ...fallback, ...base, totalTroops: total }, fallback);
}

export function useSyncedMixState(
  input: TroopMixConfig | undefined,
  capTotal: number | null | undefined,
  fallback: TroopMixConfig
) {
  const [mix, setMix] = useState<TroopMixConfig>(() => primeMix(input, fallback, capTotal));
  const dirtyRef = useRef(false);

  // If parent changes input (profile swap), we should sync.
  // If parent changes only cap (capacity changes), ONLY clamp total unless user is actively editing.
  useEffect(() => {
    if (!dirtyRef.current) {
      setMix(primeMix(input, fallback, capTotal));
    } else if (capTotal && capTotal > 0) {
      setMix(prev => ({ ...prev, totalTroops: applyRallyCapToTotal(prev.totalTroops, capTotal) }));
    }
  }, [input, capTotal, fallback]);

  const setUserMix = (next: TroopMixConfig) => {
    dirtyRef.current = true;
    setMix(next);
  };

  const resetDirty = () => { dirtyRef.current = false; };

  return { mix, setMix: setUserMix, resetDirty };
}
