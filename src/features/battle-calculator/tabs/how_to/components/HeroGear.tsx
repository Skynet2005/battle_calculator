import { heroGearInfo } from '../constants';

export function HeroGear() {
  return (
    <div className="space-y-4">
      {heroGearInfo.map((item, index) => (
        <div key={`hero-gear-${index}`}>
          {item.type === 'important' ? (
            <div className="rounded-xl bg-blue-950/40 border border-blue-500/20 p-4">
              <div className="text-sm text-gray-300 mb-3 leading-relaxed">{item.text}</div>
              <ul className="space-y-1">
                {item.subItems?.map((subItem, subIndex) => (
                  <li key={subIndex} className="flex items-center gap-2 text-sm text-blue-200">
                    <span className="text-blue-400">•</span>
                    {subItem}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-white/5">
              <span className="text-lg mt-0.5" role="img" aria-label="information">
                {item.type === 'info' ? '📋' : '⚙️'}
              </span>
              <div className="text-sm text-gray-300 leading-relaxed">{item.text}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
