import type { ContributingHero } from './DataSelectors.utils';

export default function SpecialBuffsContributors({ heroes }: { heroes: ContributingHero[] }) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-700">
      <p className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-2">Contributing Heroes:</p>
      <div className="text-sm text-gray-400 dark:text-gray-400 space-y-1">
        {heroes.length > 0 ? (
          heroes.map((h, idx) => (
            <div key={idx}>
              • {h.role}: {h.name}
              {h.class ? ` (${h.class})` : ''}
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No heroes contributing special buffs</div>
        )}
      </div>
    </div>
  );
}
