import { joinerFaqs, joinerSpecificNotes } from '../constants';

export function JoinerFaqs() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {joinerFaqs.map((tier) => (
          <div key={tier.tier} className="rounded-xl bg-slate-900/40 border border-white/5 p-4 hover:bg-slate-900/60 transition-colors">
            <div className="flex items-start gap-4">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border flex-shrink-0 ${tier.color}`}>
                {tier.tier}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-300 mb-2 leading-relaxed">{tier.description}</div>
                <div className="text-xs text-gray-400 font-mono bg-black/20 p-2 rounded border break-all">
                  {tier.heroes}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-amber-950/40 border border-amber-500/20 p-4">
        <h4 className="font-semibold text-amber-200 text-sm mb-3 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          Specific Hero Notes
        </h4>
        <ul className="space-y-3">
          {joinerSpecificNotes.map((note, index) => (
            <li key={`joiner-note-${index}`} className="flex items-start gap-3">
              <span className={`text-sm mt-0.5 flex-shrink-0 ${
                note.type === 'warning' ? 'text-amber-400' :
                note.type === 'danger' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {note.type === 'warning' ? '⚠️' : note.type === 'danger' ? '❌' : 'ℹ️'}
              </span>
              <div className="text-sm text-gray-300 leading-relaxed">{note.text}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
