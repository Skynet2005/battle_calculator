import type { getWarAcademyTech } from '@/domain/battle/data-selectors';

// ============================================================================
// Types
// ============================================================================

interface WarAcademyTroopSectionProps {
  troopType: 'infantry' | 'lancer' | 'marksman';
  warAcademyData: ReturnType<typeof getWarAcademyTech>;
  warAcademySelections: Record<string, number>;
  setWarAcademySelections: (selections: Record<string, number>) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TROOP_TYPE_CONFIG = {
  infantry: {
    label: 'Infantry',
    color: 'text-blue-300 dark:text-blue-300',
  },
  lancer: {
    label: 'Lancer',
    color: 'text-rose-300 dark:text-rose-300',
  },
  marksman: {
    label: 'Marksman',
    color: 'text-amber-300 dark:text-amber-300',
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

function formatTechValue(value: number): string {
  const isPercentage = value < 1;
  return isPercentage ? `${(value * 100).toFixed(1)}%` : value.toLocaleString();
}

function getTechUniqueKey(tech: { name: string; type: string }): string {
  return `${tech.name}-${tech.type}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function WarAcademyTroopSection({
  troopType,
  warAcademyData,
  warAcademySelections,
  setWarAcademySelections,
}: WarAcademyTroopSectionProps) {
  const config = TROOP_TYPE_CONFIG[troopType];
  const troopTechs = warAcademyData.filter(
    (tech): tech is typeof tech & { type: string } => tech.type === troopType
  );

  const handleLevelChange = (uniqueKey: string, level: number) => {
    setWarAcademySelections({
      ...warAcademySelections,
      [uniqueKey]: level,
    });
  };

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 [data-theme='light']:border-gray-200 [data-theme='light']:bg-white">
      {/* Troop Type Header */}
      <h4 className={`text-lg font-semibold mb-4 ${config.color}`}>
        {config.label} Tech
      </h4>

      {/* Tech Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {troopTechs.map((tech) => {
          const uniqueKey = getTechUniqueKey(tech);
          const currentLevel = warAcademySelections[uniqueKey] || 0;

          return (
            <TechOption
              key={uniqueKey}
              tech={tech}
              uniqueKey={uniqueKey}
              currentLevel={currentLevel}
              onLevelChange={handleLevelChange}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface TechOptionProps {
  tech: {
    name: string;
    effect: string;
    levels: Array<{ level: number; value: number }>;
  };
  uniqueKey: string;
  currentLevel: number;
  onLevelChange: (uniqueKey: string, level: number) => void;
}

function TechOption({ tech, uniqueKey, currentLevel, onLevelChange }: TechOptionProps) {
  return (
    <div className="form-group">
      <label className="block text-sm font-medium text-slate-200 mb-1 [data-theme='light']:text-gray-700">
        {tech.name}
      </label>
      <p className="text-xs text-slate-400 mb-2 [data-theme='light']:text-gray-500">
        {tech.effect}
      </p>

      <select
        value={currentLevel}
        onChange={(e) => onLevelChange(uniqueKey, parseInt(e.target.value, 10) || 0)}
        className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [data-theme='light']:border-gray-300 [data-theme='light']:bg-white [data-theme='light']:text-gray-900"
        aria-label={`${tech.name} level`}
      >
        <option value="0">Level 0 (Not researched)</option>
        {tech.levels.map((level) => (
          <option key={level.level} value={level.level}>
            Level {level.level} - {formatTechValue(level.value)}
          </option>
        ))}
      </select>
    </div>
  );
}
