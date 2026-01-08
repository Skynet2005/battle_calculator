import type { Hero } from '@/domain/battle';

export default function ExclusiveWeaponRow({
  hero,
  currentWeaponLevel,
  onChangeWeaponLevel,
  disabled,
}: {
  hero: Hero;
  currentWeaponLevel: number;
  onChangeWeaponLevel: (next: number, maxLevel: number) => void;
  disabled?: boolean;
}) {
  const exclusiveWeapon = hero['exclusive-weapon'];
  if (!exclusiveWeapon) return null;

  const maxWeaponLevel = exclusiveWeapon?.levels?.length || 0;
  const weaponLevelData = exclusiveWeapon.levels.find((l) => l.level === currentWeaponLevel);
  const expeditionSkill = weaponLevelData?.skills?.expedition;

  const weaponDescription =
    expeditionSkill?.description ||
    (currentWeaponLevel === 0 ? 'No weapon equipped' : 'No skill at this level');

  const weaponPower = weaponLevelData?.power || 0;

  return (
    <div className="hero-weapon-row">
      <div>
        <div className="hero-skill-name">
          {exclusiveWeapon.name} (Level {currentWeaponLevel || 0})
        </div>

        {weaponDescription && <div className="hero-skill-description">{weaponDescription}</div>}

        {currentWeaponLevel > 0 && weaponPower > 0 && (
          <div className="hero-skill-description text-xs font-bold text-white mt-1">
            Power: {weaponPower.toLocaleString()}
          </div>
        )}

        {currentWeaponLevel > 0 && (
          <div className="hero-skill-description text-[0.7rem] mt-1">Max Level: {maxWeaponLevel}</div>
        )}
      </div>

      <div className="form-group mb-0">
        <label className="text-xs text-gray-400 dark:text-gray-400 mb-1 block">Level</label>
        <input
          type="number"
          min="0"
          max={maxWeaponLevel}
          value={currentWeaponLevel}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            onChangeWeaponLevel(Number.isNaN(num) ? currentWeaponLevel : num, maxWeaponLevel);
          }}
          className="w-20"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
