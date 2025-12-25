export default function BonusStatsGrid({
  bonuses,
}: {
  bonuses: { attack: number; defense: number; lethality: number; health: number };
}) {
  return (
    <div className="stat-grid">
      <div>
        <div className="stat-label normal-case">Attack</div>
        <div className="stat-value text-xl">
          {bonuses.attack > 0 ? '+' : ''}
          {bonuses.attack.toFixed(2)}%
        </div>
      </div>
      <div>
        <div className="stat-label normal-case">Defense</div>
        <div className="stat-value text-xl">
          {bonuses.defense > 0 ? '+' : ''}
          {bonuses.defense.toFixed(2)}%
        </div>
      </div>
      <div>
        <div className="stat-label normal-case">Lethality</div>
        <div className="stat-value text-xl">
          {bonuses.lethality > 0 ? '+' : ''}
          {bonuses.lethality.toFixed(2)}%
        </div>
      </div>
      <div>
        <div className="stat-label normal-case">Health</div>
        <div className="stat-value text-xl">
          {bonuses.health > 0 ? '+' : ''}
          {bonuses.health.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
