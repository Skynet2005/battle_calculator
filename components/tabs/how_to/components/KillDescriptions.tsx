import { killDescriptions } from '../constants';

export function KillDescriptions() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {killDescriptions.map((desc) => (
        <div key={desc.term} className="rounded-xl bg-slate-900/40 border border-white/5 p-4 hover:bg-slate-900/60 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg" role="img" aria-label={desc.term}>
              {desc.icon}
            </span>
            <div className="font-semibold text-white text-sm">{desc.term}:</div>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed">{desc.description}</div>
        </div>
      ))}
    </div>
  );
}
