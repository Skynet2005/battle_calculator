import { expeditionModeInfo } from '../constants';

export function ExpeditionMode() {
  return (
    <div className="space-y-3">
      {expeditionModeInfo.map((item, index) => (
        <div key={`expedition-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-white/5">
          <span className="text-lg mt-0.5" role="img" aria-label="information">
            {item.icon}
          </span>
          <div className="text-sm text-gray-300 leading-relaxed">{item.text}</div>
        </div>
      ))}
    </div>
  );
}
