/**
 * Rally Key Moments Component
 *
 * Highlights critical battle events: big skill hits, damage reduction active,
 * and front line collapse. Engine explanation: Scans turn logs for high-impact
 * events that significantly affected battle outcome.
 */

import type { KeyMoment } from '../utils/keyMoments';

interface RallyKeyMomentsProps {
  keyMoments: KeyMoment[];
}

export function RallyKeyMoments({ keyMoments }: RallyKeyMomentsProps) {
  const moments = keyMoments;

  if (moments.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      <div className="text-sm font-semibold text-slate-200">Key Moments</div>
      <div className="space-y-2">
        {moments.map((moment, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-3 text-sm ${moment.type === 'bigSkill'
                ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200'
                : moment.type === 'damageReduction'
                  ? 'border-blue-400/30 bg-blue-500/10 text-blue-200'
                  : 'border-orange-400/30 bg-orange-500/10 text-orange-200'
              }`}
          >
            {moment.message}
          </div>
        ))}
      </div>
    </div>
  );
}
