import { basicBattleInfo } from '../constants';

export function BasicBattleInfo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {basicBattleInfo.map((section) => (
        <div key={section.title} className="rounded-xl bg-slate-900/40 border border-white/5 p-4 hover:bg-slate-900/60 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl" role="img" aria-label={section.title}>
              {section.icon}
            </span>
            <h4 className="font-semibold text-white text-base">{section.title}</h4>
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
            {section.items.map((item, itemIndex) => (
              <li key={`${section.title}-${itemIndex}`} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
