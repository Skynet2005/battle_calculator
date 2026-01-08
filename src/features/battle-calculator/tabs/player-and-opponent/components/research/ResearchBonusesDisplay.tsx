import type { BasicBonuses } from '@/domain/battle/calculations';
import BonusStatsGrid from './BonusStatsGrid';

export default function ResearchBonusesDisplay({ basicBonuses }: { basicBonuses: BasicBonuses }) {
  const totalTroopBonus = basicBonuses.combatTech?.totalTroopBonus || { attack: 0, defense: 0, lethality: 0, health: 0 };
  const troopTypeBonus = basicBonuses.combatTech?.troopTypeBonus || {
    infantry: { attack: 0, defense: 0, lethality: 0, health: 0 },
    lancer: { attack: 0, defense: 0, lethality: 0, health: 0 },
    marksman: { attack: 0, defense: 0, lethality: 0, health: 0 },
  };

  const infantryTotal = {
    attack: troopTypeBonus.infantry.attack - totalTroopBonus.attack,
    defense: troopTypeBonus.infantry.defense - totalTroopBonus.defense,
    lethality: troopTypeBonus.infantry.lethality - totalTroopBonus.lethality,
    health: troopTypeBonus.infantry.health - totalTroopBonus.health,
  };
  const lancerTotal = {
    attack: troopTypeBonus.lancer.attack - totalTroopBonus.attack,
    defense: troopTypeBonus.lancer.defense - totalTroopBonus.defense,
    lethality: troopTypeBonus.lancer.lethality - totalTroopBonus.lethality,
    health: troopTypeBonus.lancer.health - totalTroopBonus.health,
  };
  const marksmanTotal = {
    attack: troopTypeBonus.marksman.attack - totalTroopBonus.attack,
    defense: troopTypeBonus.marksman.defense - totalTroopBonus.defense,
    lethality: troopTypeBonus.marksman.lethality - totalTroopBonus.lethality,
    health: troopTypeBonus.marksman.health - totalTroopBonus.health,
  };

  const hasBonuses =
    totalTroopBonus.attack > 0 || totalTroopBonus.defense > 0 || totalTroopBonus.lethality > 0 || totalTroopBonus.health > 0 ||
    troopTypeBonus.infantry.attack > 0 || troopTypeBonus.infantry.defense > 0 || troopTypeBonus.infantry.lethality > 0 || troopTypeBonus.infantry.health > 0 ||
    troopTypeBonus.lancer.attack > 0 || troopTypeBonus.lancer.defense > 0 || troopTypeBonus.lancer.lethality > 0 || troopTypeBonus.lancer.health > 0 ||
    troopTypeBonus.marksman.attack > 0 || troopTypeBonus.marksman.defense > 0 || troopTypeBonus.marksman.lethality > 0 || troopTypeBonus.marksman.health > 0;

  if (!hasBonuses) return null;

  return (
    <div className="card info-card mb-6">
      <h4 className="mb-4 text-lg font-semibold">Total Research Bonuses</h4>

      <div className="mb-6">
        <h5 className="stat-label text-cyan-300 dark:text-cyan-300 mb-2">All Troops (Global)</h5>
        <BonusStatsGrid bonuses={totalTroopBonus} />
      </div>

      <div className="stat-section">
        <h5 className="stat-label text-blue-300 dark:text-blue-300 mb-2">Infantry (Troop-Specific Only)</h5>
        <BonusStatsGrid bonuses={infantryTotal} />
      </div>

      <div className="stat-section">
        <h5 className="stat-label text-rose-300 dark:text-rose-300 mb-2">Lancer (Troop-Specific Only)</h5>
        <BonusStatsGrid bonuses={lancerTotal} />
      </div>

      <div className="stat-section">
        <h5 className="stat-label text-amber-300 dark:text-amber-300 mb-2">Marksman (Troop-Specific Only)</h5>
        <BonusStatsGrid bonuses={marksmanTotal} />
      </div>
    </div>
  );
}
