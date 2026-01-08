interface SkillListProps {
  title: string;
  rows: Array<{ name: string; trigger?: string; succeeded?: boolean; heroId?: string }>;
}

export function SkillList({ title, rows }: SkillListProps) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{title}</div>
        <div className="text-xs text-gray-500">No skills recorded this turn.</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-3 space-y-1">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{title}</div>
      {rows.map((row, idx) => (
        <div key={`${row.name}-${row.heroId ?? 'troop'}-${idx}`} className="flex items-center justify-between text-xs text-slate-200">
          <span className="font-semibold">{row.heroId ? `${row.heroId} - ${row.name}` : row.name}</span>
          <span className="text-[11px] text-slate-400">{row.trigger ?? '—'}</span>
          <span className={`text-[11px] ${row.succeeded === false ? 'text-rose-300' : 'text-emerald-300'}`}>
            {row.succeeded === false ? 'miss' : 'hit'}
          </span>
        </div>
      ))}
    </div>
  );
}
