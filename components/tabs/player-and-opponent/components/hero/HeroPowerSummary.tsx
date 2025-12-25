import type { Hero } from '../../../../../lib/battle';
import type { HeroPowerComponents } from './HeroSelector.model';

export default function HeroPowerSummary({
  hero,
  power,
}: {
  hero: Hero;
  power: HeroPowerComponents;
}) {
  return (
    <div className="min-w-[150px] shrink-0">
      <div className="font-bold mb-1 text-base">{hero['hero-name']}</div>
      <div className="text-xs text-gray-400 dark:text-gray-400 capitalize mb-2">
        {hero['hero-class']}
      </div>

      <div className="text-xs text-gray-300 dark:text-gray-300 flex flex-col gap-1">
        <div>Hero Power: {Math.round(power.heroPower).toLocaleString()}</div>
        <div>Weapon Power: {Math.round(power.weaponPower).toLocaleString()}</div>
        <div>Gear Power: {Math.round(power.gearPower).toLocaleString()}</div>
        <div className="mt-1 pt-1 border-t border-white/10 font-semibold text-sm text-white">
          Total Power: {Math.round(power.totalPower).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
