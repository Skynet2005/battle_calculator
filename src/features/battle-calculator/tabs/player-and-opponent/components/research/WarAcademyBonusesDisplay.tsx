import { getWarAcademyBonuses } from '@/domain/battle/data-extractors';
import BonusStatsGrid from './BonusStatsGrid';

// ============================================================================
// Types
// ============================================================================

interface WarAcademyBonusesDisplayProps {
  warAcademySelections: Record<string, number>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function hasTroopTypeBonuses(bonuses: { attack: number; defense: number; lethality: number; health: number }): boolean {
  return bonuses.attack > 0 || bonuses.defense > 0 || bonuses.lethality > 0 || bonuses.health > 0;
}

// ============================================================================
// Main Component
// ============================================================================

export default function WarAcademyBonusesDisplay({
  warAcademySelections,
}: WarAcademyBonusesDisplayProps) {
  const academyBonuses = getWarAcademyBonuses(warAcademySelections);

  const hasBonuses =
    hasTroopTypeBonuses(academyBonuses.infantry) ||
    hasTroopTypeBonuses(academyBonuses.lancer) ||
    hasTroopTypeBonuses(academyBonuses.marksman);

  if (!hasBonuses) return null;

  return (
    <div className="card info-card mb-6">
      <h4 className="mb-4 text-lg font-semibold">Total War Academy Bonuses</h4>

      <div className="mb-6">
        <h5 className="stat-label text-blue-300 dark:text-blue-300 mb-2">Infantry</h5>
        <BonusStatsGrid bonuses={academyBonuses.infantry} />
      </div>

      <div className="stat-section">
        <h5 className="stat-label text-rose-300 dark:text-rose-300 mb-2">Lancer</h5>
        <BonusStatsGrid bonuses={academyBonuses.lancer} />
      </div>

      <div className="stat-section">
        <h5 className="stat-label text-amber-300 dark:text-amber-300 mb-2">Marksman</h5>
        <BonusStatsGrid bonuses={academyBonuses.marksman} />
      </div>
    </div>
  );
}
