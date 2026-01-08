import { formatBigNumber } from '../utils/format';

interface StatBlockProps {
  label: string;
  value: number;
  align: 'left' | 'right';
}

export function StatBlock({ label, value, align }: StatBlockProps) {
  return (
    <div className={`rounded-lg bg-slate-900/40 px-3 py-2 border border-slate-700/40 ${align === 'right' ? 'text-right' : ''}`}>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm font-semibold">{formatBigNumber(value)}</div>
    </div>
  );
}
