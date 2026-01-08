import type { TroopCounts as CombatTroopCounts } from '@/domain/combat/types';
import type { CasualtySeriesEntry } from '@/features/battle-calculator/utils/turn-analytics';
import { formatBigNumber } from '../utils/format';

export function renderTypeLines(
  series: CasualtySeriesEntry[],
  toPoint: (value: number, idx: number) => { x: number; y: number },
  side: "attacker" | "defender",
  normalize: (raw: number, side: "attacker" | "defender", type: "Infantry" | "Lancer" | "Marksman") => number,
  setHover: (v: {
    side: "attacker" | "defender";
    turn: number;
    losses: number;
    byType: Partial<CombatTroopCounts>;
    topSkill?: string;
    pairedLosses?: number;
    pairedByType?: Partial<CombatTroopCounts>;
    pairedSkill?: string;
  } | null) => void,
  playerIsAttacker: boolean = true
) {
  // Consistent color scheme: Player = rose, Opponent = sky
  // Map side to player/opponent based on playerIsAttacker
  const isPlayerSide = (side === "attacker" && playerIsAttacker) || (side === "defender" && !playerIsAttacker);
  const palette = isPlayerSide
    ? { Infantry: "rgba(251,113,133,0.95)", Lancer: "rgba(244,63,94,0.9)", Marksman: "rgba(225,29,72,0.9)" } // Rose shades (Player)
    : { Infantry: "rgba(125,211,252,0.95)", Lancer: "rgba(56,189,248,0.9)", Marksman: "rgba(14,165,233,0.9)" }; // Sky shades (Opponent)

  return (["Infantry", "Lancer", "Marksman"] as const).map((type) => {
    const points = series.map((p, idx) => {
      const raw = side === "defender" ? (p.defenderLossesByType[type] ?? 0) : (p.attackerLossesByType[type] ?? 0);
      const value = normalize(raw, side, type);
      const pt = toPoint(value, idx);
      return {
        ...pt,
        turn: p.turn,
        raw,
        losses: raw,
        byType: side === "defender" ? p.defenderLossesByType : p.attackerLossesByType,
        topSkill: side === "defender" ? p.skillAgainstDefender : p.skillAgainstAttacker,
        pairedLosses: side === "defender" ? p.attackerLosses : p.defenderLosses,
        pairedByType: side === "defender" ? p.attackerLossesByType : p.defenderLossesByType,
        pairedSkill: side === "defender" ? p.skillAgainstAttacker : p.skillAgainstDefender
      };
    });
    const pointsStr = points.map(({ x, y }) => `${x},${y}`).join(" ");
    return (
      <g key={`${side}-${type}`}>
        <polyline fill="none" stroke={(palette as any)[type]} strokeWidth="1.5" points={pointsStr} />
        {points.map((pt, idx) => (
          <circle
            key={`${side}-${type}-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={(palette as any)[type]}
            onMouseEnter={() =>
              setHover({
                side,
                turn: pt.turn,
                losses: pt.losses ?? 0,
                byType: pt.byType,
                topSkill: pt.topSkill,
                pairedLosses: pt.pairedLosses,
                pairedByType: pt.pairedByType,
                pairedSkill: pt.pairedSkill
              })
            }
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </g>
    );
  });
}

export function renderByType(
  label: string,
  value: number | undefined,
  side: "attacker" | "defender",
  usePercent: boolean,
  normalizeFn: (value: number | undefined, side: "attacker" | "defender", type: keyof CombatTroopCounts) => number
) {
  if (value === undefined) return null;
  const norm =
    label === "Infantry"
      ? normalizeFn(value, side, "Infantry")
      : label === "Lancer"
        ? normalizeFn(value, side, "Lancer")
        : normalizeFn(value, side, "Marksman");
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-emerald-200">
        {usePercent ? `${norm.toFixed(2)}%` : formatBigNumber(value)}
      </span>
    </div>
  );
}
