'use client';

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";

// ============================================================================
// Types
// ============================================================================

export type TroopType = "infantry" | "lancer" | "marksman";
export type GearPiece = "belt" | "boots" | "gloves" | "goggles";

export type GearProgress =
  | { rarity: "mythic"; level: number }
  | { rarity: "legendary"; plus: number };

export type EmpowermentTier = 0 | 20 | 40 | 60 | 80 | 100;

export type GearSelection = {
  progress: GearProgress;
  masteryForged: boolean;
  masteryLevel: number;
  essenceLevel: number;
};

export type GearComputed = {
  displayLevel: string;
  empowermentTier: EmpowermentTier;

  baseMainStatPct: number;
  masteryForgeMultiplier: number;
  totalMainStatPct: number;

  mainStatLabel: string;

  attackPct: number;
  defensePct: number;
  healthPct: number;

  power: number;

  warnings: string[];
};

export type HeroGearRegistry = Record<TroopType, Record<GearPiece, (sel: GearSelection) => GearComputed>>;

export type HeroGearLoadout = Record<TroopType, Record<GearPiece, GearSelection>>;

type Props = {
  registry: HeroGearRegistry;
  initialLoadout?: HeroGearLoadout;
  onLoadoutChange?: (loadout: HeroGearLoadout) => void;
};

// ============================================================================
// Constants
// ============================================================================

const TROOPS: readonly TroopType[] = ["infantry", "lancer", "marksman"] as const;
const PIECES: readonly GearPiece[] = ["belt", "boots", "gloves", "goggles"] as const;

const PIECE_LABEL: Record<GearPiece, string> = {
  belt: "Belt",
  boots: "Boots",
  gloves: "Gloves",
  goggles: "Goggles"
};

const TROOP_LABEL: Record<TroopType, string> = {
  infantry: "Infantry",
  lancer: "Lancer",
  marksman: "Marksman"
};

// ============================================================================
// Utility Functions
// ============================================================================

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  const x = Math.floor(n);
  return Math.min(Math.max(x, min), max);
}

function formatPct(n: number): string {
  const x = Number.isFinite(n) ? n : 0;
  return `${x.toFixed(2)}%`;
}

function formatNum(n: number): string {
  const x = Number.isFinite(n) ? n : 0;
  return Math.round(x).toLocaleString();
}

function deepCloneLoadout(x: HeroGearLoadout): HeroGearLoadout {
  return JSON.parse(JSON.stringify(x)) as HeroGearLoadout;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Styling Functions
// ============================================================================

function cardClass(): string {
  return "rounded-2xl border border-white/15 bg-white/5 p-4";
}

function buttonClass(active = false, variant?: "mythic" | "legendary" | "p20" | "p60" | "p100"): string {
  const base = "px-3 py-2 rounded-lg border text-sm font-medium";

  if (variant === "mythic") {
    return active
      ? `${base} border-yellow-400/70 bg-yellow-500/50 hover:bg-yellow-500/60 text-white`
      : `${base} border-yellow-500/50 bg-yellow-600/30 hover:bg-yellow-600/40 text-white`;
  }
  if (variant === "legendary") {
    return active
      ? `${base} border-red-400/70 bg-red-500/50 hover:bg-red-500/60 text-white`
      : `${base} border-red-500/50 bg-red-600/30 hover:bg-red-600/40 text-white`;
  }
  if (variant === "p20") {
    return `${base} border-green-500/50 bg-green-600/30 hover:bg-green-600/40 text-white`;
  }
  if (variant === "p60") {
    return `${base} border-purple-500/50 bg-purple-600/30 hover:bg-purple-600/40 text-white`;
  }
  if (variant === "p100") {
    return `${base} border-red-800/50 bg-red-900/40 hover:bg-red-900/50 text-white`;
  }

  return [
    base,
    active ? "border-white/30 bg-white/15" : "border-white/15 bg-white/10 hover:bg-white/15"
  ].join(" ");
}

function inputClass(): string {
  return "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20";
}

function pillClass(): string {
  return "inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm";
}

// ============================================================================
// Gear Selection Functions
// ============================================================================

function normalizeSelection(sel: GearSelection): GearSelection {
  const p = sel.progress;
  const progress: GearProgress =
    p.rarity === "mythic"
      ? { rarity: "mythic", level: clampInt("level" in p ? (p.level ?? 0) : 0, 0, 100) }
      : { rarity: "legendary", plus: clampInt("plus" in p ? (p.plus ?? 1) : 1, 1, 100) };

  const masteryLevel = clampInt(sel.masteryLevel, 0, 20);
  const essenceLevel = clampInt(sel.essenceLevel, 0, 20);
  const masteryForged = masteryLevel > 0 || essenceLevel > 0 || Boolean(sel.masteryForged);

  return {
    progress,
    masteryForged,
    masteryLevel: masteryForged ? masteryLevel : 0,
    essenceLevel: masteryForged ? essenceLevel : 0
  };
}

function defaultSelection(): GearSelection {
  return {
    progress: { rarity: "mythic", level: 0 },
    masteryForged: false,
    masteryLevel: 0,
    essenceLevel: 0
  };
}

export function createDefaultLoadout(): HeroGearLoadout {
  const out: HeroGearLoadout = {
    infantry: { belt: defaultSelection(), boots: defaultSelection(), gloves: defaultSelection(), goggles: defaultSelection() },
    lancer: { belt: defaultSelection(), boots: defaultSelection(), gloves: defaultSelection(), goggles: defaultSelection() },
    marksman: { belt: defaultSelection(), boots: defaultSelection(), gloves: defaultSelection(), goggles: defaultSelection() }
  };
  return out;
}

function setSelectionAt(
  loadout: HeroGearLoadout,
  troop: TroopType,
  piece: GearPiece,
  next: GearSelection
): HeroGearLoadout {
  const copy = deepCloneLoadout(loadout);
  copy[troop][piece] = next;
  return copy;
}

function setTroopAllPieces(
  loadout: HeroGearLoadout,
  troop: TroopType,
  next: GearSelection
): HeroGearLoadout {
  const copy = deepCloneLoadout(loadout);
  for (const p of PIECES) copy[troop][p] = next;
  return copy;
}

function setAllTroopsAllPieces(loadout: HeroGearLoadout, next: GearSelection): HeroGearLoadout {
  const copy = deepCloneLoadout(loadout);
  for (const t of TROOPS) for (const p of PIECES) copy[t][p] = next;
  return copy;
}

function getRequiredMasteryLevel(plus: number): number {
  if (plus >= 100) return 15;
  if (plus >= 60) return 13;
  if (plus >= 20) return 11;
  return 10; // +1 to +19
}

// ============================================================================
// Validation
// ============================================================================

function assertRegistryComplete(reg: HeroGearRegistry): void {
  for (const t of TROOPS) {
    if (!reg[t]) throw new Error(`HeroGearRegistry missing troop: ${t}`);
    for (const p of PIECES) {
      if (!reg[t][p]) throw new Error(`HeroGearRegistry missing calculator: ${t}.${p}`);
      if (typeof reg[t][p] !== "function") throw new Error(`HeroGearRegistry calculator is not a function: ${t}.${p}`);
    }
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function HeroGearSelectorPanel(props: Props): ReactElement {
  assertRegistryComplete(props.registry);

  // State
  const [activeTroop, setActiveTroop] = useState<TroopType>("infantry");
  const [loadout, setLoadout] = useState<HeroGearLoadout>(props.initialLoadout ?? createDefaultLoadout());
  const [toast, setToast] = useState<string>("");
  const shouldNotifyParent = useRef(false);

  // Sync with parent's initialLoadout if it changes externally
  useEffect(() => {
    if (props.initialLoadout) {
      setLoadout(props.initialLoadout);
      shouldNotifyParent.current = false; // Don't notify when syncing from parent
    }
  }, [props.initialLoadout]);

  // Notify parent when loadout changes (only if it was a user-initiated change)
  useEffect(() => {
    if (shouldNotifyParent.current) {
      shouldNotifyParent.current = false;
      props.onLoadoutChange?.(loadout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadout]);

  // Computed values
  const computed = useMemo(() => {
    const out = {} as Record<TroopType, Record<GearPiece, GearComputed>>;
    for (const t of TROOPS) {
      out[t] = {} as Record<GearPiece, GearComputed>;
      for (const p of PIECES) {
        const sel = normalizeSelection(loadout[t][p]);
        out[t][p] = props.registry[t][p](sel);
      }
    }
    return out;
  }, [loadout, props.registry]);

  const troopTotals = useMemo(() => {
    const out: Record<TroopType, { attackPct: number; defensePct: number; healthPct: number; lethalityPct: number; power: number; warnings: number }> =
    {
      infantry: { attackPct: 0, defensePct: 0, healthPct: 0, lethalityPct: 0, power: 0, warnings: 0 },
      lancer: { attackPct: 0, defensePct: 0, healthPct: 0, lethalityPct: 0, power: 0, warnings: 0 },
      marksman: { attackPct: 0, defensePct: 0, healthPct: 0, lethalityPct: 0, power: 0, warnings: 0 }
    };

    for (const t of TROOPS) {
      let atk = 0, def = 0, hp = 0, leth = 0, pow = 0, warn = 0;
      for (const p of PIECES) {
        const r = computed[t][p];
        atk += r.attackPct;
        def += r.defensePct;
        if (p === "belt" || p === "gloves") {
          hp += r.totalMainStatPct; // Health from belt and gloves
        } else {
          leth += r.totalMainStatPct; // Lethality from goggles and boots
        }
        pow += r.power;
        warn += r.warnings.length;
      }
      out[t] = { attackPct: atk, defensePct: def, healthPct: hp, lethalityPct: leth, power: pow, warnings: warn };
    }
    return out;
  }, [computed]);

  const activeTotals = troopTotals[activeTroop];

  // Update handlers
  function updateLoadout(updater: (prev: HeroGearLoadout) => HeroGearLoadout) {
    shouldNotifyParent.current = true;
    setLoadout(updater);
  }

  function updatePieceProgressRarity(troop: TroopType, piece: GearPiece, rarity: "mythic" | "legendary"): void {
    const cur = normalizeSelection(loadout[troop][piece]);
    if (rarity === "mythic") {
      const next: GearSelection = { ...cur, progress: { rarity: "mythic", level: 0 } };
      updateLoadout((x) => setSelectionAt(x, troop, piece, next));
    } else {
      // When switching to legendary, use updateLegendaryPlus to handle mastery level requirements
      updateLegendaryPlus(troop, piece, 1);
    }
  }

  function updateMythicLevel(troop: TroopType, piece: GearPiece, level: number): void {
    const cur = normalizeSelection(loadout[troop][piece]);
    const next: GearSelection = { ...cur, progress: { rarity: "mythic", level: clampInt(level, 0, 100) } };
    updateLoadout((x) => setSelectionAt(x, troop, piece, next));
  }

  function updateLegendaryPlus(troop: TroopType, piece: GearPiece, plus: number): void {
    const cur = normalizeSelection(loadout[troop][piece]);
    const clampedPlus = clampInt(plus, 1, 100);
    const requiredMasteryLevel = getRequiredMasteryLevel(clampedPlus);

    // Auto-set mastery level if below requirement
    let masteryLevel = cur.masteryLevel;
    let masteryForged = cur.masteryForged;
    if (masteryLevel < requiredMasteryLevel) {
      masteryLevel = requiredMasteryLevel;
      masteryForged = true; // Auto-enable mastery forging if setting a level
    }

    const next: GearSelection = {
      ...cur,
      progress: { rarity: "legendary", plus: clampedPlus },
      masteryLevel,
      masteryForged
    };
    updateLoadout((x) => setSelectionAt(x, troop, piece, next));
  }

  function updateMasteryForged(troop: TroopType, piece: GearPiece, masteryForged: boolean): void {
    const cur = normalizeSelection(loadout[troop][piece]);
    const next: GearSelection = normalizeSelection({ ...cur, masteryForged });
    updateLoadout((x) => setSelectionAt(x, troop, piece, next));
  }

  function updateMasteryLevel(troop: TroopType, piece: GearPiece, masteryLevel: number): void {
    const cur = normalizeSelection(loadout[troop][piece]);
    const next: GearSelection = normalizeSelection({ ...cur, masteryLevel: clampInt(masteryLevel, 0, 20) });
    updateLoadout((x) => setSelectionAt(x, troop, piece, next));
  }

  function updateEssenceLevel(troop: TroopType, piece: GearPiece, essenceLevel: number): void {
    const cur = normalizeSelection(loadout[troop][piece]);
    const next: GearSelection = normalizeSelection({ ...cur, essenceLevel: clampInt(essenceLevel, 0, 20) });
    updateLoadout((x) => setSelectionAt(x, troop, piece, next));
  }

  function applyPresetToPiece(troop: TroopType, piece: GearPiece, preset: "m0" | "m50" | "m100" | "p20" | "p60" | "p100"): void {
    if (preset === "m0") updateMythicLevel(troop, piece, 0);
    if (preset === "m50") updateMythicLevel(troop, piece, 50);
    if (preset === "m100") updateMythicLevel(troop, piece, 100);
    if (preset === "p20") updateLegendaryPlus(troop, piece, 20);
    if (preset === "p60") updateLegendaryPlus(troop, piece, 60);
    if (preset === "p100") updateLegendaryPlus(troop, piece, 100);
  }

  // Bulk actions
  function resetActiveTroop(): void {
    const next = deepCloneLoadout(loadout);
    for (const p of PIECES) next[activeTroop][p] = defaultSelection();
    updateLoadout(() => next);
    setToast("Reset active troop");
    window.setTimeout(() => setToast(""), 1400);
  }

  function resetAll(): void {
    updateLoadout(() => createDefaultLoadout());
    setToast("Reset all troops");
    window.setTimeout(() => setToast(""), 1400);
  }

  function setActiveTroopAllPiecesTo(sel: GearSelection): void {
    updateLoadout((x) => setTroopAllPieces(x, activeTroop, normalizeSelection(sel)));
    setToast("Applied selection to all pieces (active troop)");
    window.setTimeout(() => setToast(""), 1400);
  }

  function setAllTo(sel: GearSelection): void {
    updateLoadout((x) => setAllTroopsAllPieces(x, normalizeSelection(sel)));
    setToast("Applied selection to all troops/pieces");
    window.setTimeout(() => setToast(""), 1400);
  }

  // Render
  return (
    <div className="w-full max-w-7xl mx-auto p-4 text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xl font-semibold">Hero Gear Loadout</div>
          <div className="text-sm text-white/70">Select Belt/Boots/Gloves/Goggles for Infantry/Lancer/Marksman. Mythic uses Lv 0–100. Legendary uses +1–+100. Empowerment is derived.</div>
        </div>
        {toast ? <span className="text-sm px-3 py-2 rounded-lg border border-white/15 bg-white/10">{toast}</span> : null}
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        {/* Troop Selection */}
        <div className="flex flex-wrap items-center gap-2">
          {TROOPS.map((t) => (
            <button
              key={t}
              type="button"
              className={buttonClass(activeTroop === t)}
              onClick={() => setActiveTroop(t)}
            >
              {TROOP_LABEL[t]}
            </button>
          ))}
        </div>

        {/* Stats Display */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={pillClass()}>Attack: {activeTotals.attackPct.toFixed(0)}%</span>
          <span className={pillClass()}>Defense: {activeTotals.defensePct.toFixed(0)}%</span>
          <span className={pillClass()}>Health: {activeTotals.healthPct.toFixed(0)}%</span>
          <span className={pillClass()}>Lethality: {activeTotals.lethalityPct.toFixed(0)}%</span>
          <span className={pillClass()}>Power: {formatNum(activeTotals.power)}</span>
          {activeTotals.warnings > 0 && (
            <span className={pillClass()}>⚠ {activeTotals.warnings} Warning{activeTotals.warnings !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonClass()} onClick={resetActiveTroop}>
            Reset {TROOP_LABEL[activeTroop]}
          </button>
          <button type="button" className={buttonClass()} onClick={resetAll}>
            Reset All
          </button>
        </div>
      </div>

      {/* Gear Pieces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {PIECES.map((piece) => {
          const sel = normalizeSelection(loadout[activeTroop][piece]);
          const r = computed[activeTroop][piece];
          const isMythic = sel.progress.rarity === "mythic";
          let mythicLevel = 0;
          let plusLevel = 0;
          if (sel.progress.rarity === "mythic") {
            mythicLevel = sel.progress.level;
          } else {
            plusLevel = sel.progress.plus;
          }

          return (
            <div key={piece} className={cardClass()}>
              {/* Piece Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="text-base font-semibold">{PIECE_LABEL[piece]}</div>
                  <div className="text-xs text-white/70">{r.mainStatLabel}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={pillClass()}>{r.displayLevel}</span>
                  <span className={pillClass()}>Emp: {r.empowermentTier}</span>
                </div>
              </div>

              {/* Rarity Selection */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className={buttonClass(isMythic, "mythic")}
                  onClick={() => updatePieceProgressRarity(activeTroop, piece, "mythic")}
                >
                  Mythic
                </button>
                <button
                  type="button"
                  className={buttonClass(!isMythic, "legendary")}
                  onClick={() => updatePieceProgressRarity(activeTroop, piece, "legendary")}
                >
                  Legendary
                </button>

                <span className="mx-1 h-9 w-px bg-white/15" />

                <button type="button" className={buttonClass(false, "p20")} onClick={() => { updatePieceProgressRarity(activeTroop, piece, "legendary"); applyPresetToPiece(activeTroop, piece, "p20"); }}>+20</button>
                <button type="button" className={buttonClass(false, "p60")} onClick={() => { updatePieceProgressRarity(activeTroop, piece, "legendary"); applyPresetToPiece(activeTroop, piece, "p60"); }}>+60</button>
                <button type="button" className={buttonClass(false, "p100")} onClick={() => { updatePieceProgressRarity(activeTroop, piece, "legendary"); applyPresetToPiece(activeTroop, piece, "p100"); }}>+100</button>
              </div>

              {/* Level Controls */}
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/70">{isMythic ? "Mythic Level (0–100)" : "Legendary +Level (1–100)"}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      title="Select a level"
                      className={inputClass()}
                      type="number"
                      min={isMythic ? 0 : 1}
                      max={isMythic ? 100 : 100}
                      step={1}
                      value={isMythic ? mythicLevel : plusLevel}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (isMythic) updateMythicLevel(activeTroop, piece, v);
                        else updateLegendaryPlus(activeTroop, piece, v);
                      }}
                    />
                  </div>
                  <div className="mt-2">
                    <input
                      title="Select a level"
                      className="w-full accent-white"
                      type="range"
                      min={isMythic ? 0 : 1}
                      max={100}
                      step={1}
                      value={isMythic ? mythicLevel : plusLevel}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (isMythic) updateMythicLevel(activeTroop, piece, v);
                        else updateLegendaryPlus(activeTroop, piece, v);
                      }}
                    />
                  </div>
                </div>

                {/* Mastery Controls */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white/80">Mastery</span>
                  <span className="text-xs text-white/60">Auto-enables when &gt; 0</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <div className="text-xs text-white/70">Mastery Level (0–20)</div>
                    <input
                      title="Select a mastery level"
                      className={inputClass()}
                      type="number"
                      min={0}
                      max={20}
                      step={1}
                      value={sel.masteryLevel}
                      onChange={(e) => updateMasteryLevel(activeTroop, piece, Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Stats Display */}
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Base</span>
                    <span className="font-semibold">{formatPct(r.baseMainStatPct)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Multiplier</span>
                    <span className="font-semibold">{r.masteryForgeMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Total</span>
                    <span className="font-semibold">{formatPct(r.totalMainStatPct)}</span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="text-white/70">ATK</div>
                      <div className="font-semibold">{r.attackPct.toFixed(0)}%</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="text-white/70">DEF</div>
                      <div className="font-semibold">{r.defensePct.toFixed(0)}%</div>
                    </div>
                    {piece === "goggles" || piece === "boots" ? (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                        <div className="text-white/70">Lethality</div>
                        <div className="font-semibold">{r.totalMainStatPct.toFixed(0)}%</div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                        <div className="text-white/70">HP</div>
                        <div className="font-semibold">{r.healthPct.toFixed(0)}%</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-white/80">Power</span>
                    <span className="font-semibold">{formatNum(r.power)}</span>
                  </div>
                </div>

                {/* Warnings/Validation */}
                {r.warnings.length > 0 ? (
                  <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3">
                    <div className="text-sm font-semibold text-yellow-200 mb-1">Warnings</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-100/90">
                      {r.warnings.map((w, i) => (
                        <li key={`${piece}-${i}`}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                    <div className="text-sm font-semibold text-emerald-200">Valid</div>
                    <div className="text-xs text-emerald-100/80">No invalid combinations detected.</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Apply Section */}
      <div className="mt-4">
        <div className={cardClass()}>
          <div className="text-base font-semibold mb-2">Quick Apply</div>
          <div className="text-sm text-white/70 mb-3">Apply preset configurations to all pieces for the active troop.</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              type="button"
              className={buttonClass(false, "mythic")}
              onClick={() => setActiveTroopAllPiecesTo({ progress: { rarity: "mythic", level: 100 }, masteryForged: false, masteryLevel: 0, essenceLevel: 0 })}
            >
              Mythic Lv 100
            </button>
            <button
              type="button"
              className={buttonClass(false, "p20")}
              onClick={() => setActiveTroopAllPiecesTo({ progress: { rarity: "legendary", plus: 20 }, masteryForged: true, masteryLevel: 11, essenceLevel: 0 })}
            >
              Legendary +20
            </button>
            <button
              type="button"
              className={buttonClass(false, "p60")}
              onClick={() => setActiveTroopAllPiecesTo({ progress: { rarity: "legendary", plus: 60 }, masteryForged: true, masteryLevel: 13, essenceLevel: 0 })}
            >
              Legendary +60
            </button>
            <button
              type="button"
              className={buttonClass(false, "p100")}
              onClick={() => setActiveTroopAllPiecesTo({ progress: { rarity: "legendary", plus: 100 }, masteryForged: true, masteryLevel: 20, essenceLevel: 0 })}
            >
              Legendary +100
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-gray-500/50 bg-gray-700/30 hover:bg-gray-700/40 text-sm font-medium text-white col-span-full sm:col-span-1 lg:col-span-1"
              onClick={() => setActiveTroopAllPiecesTo({ progress: { rarity: "mythic", level: 0 }, masteryForged: false, masteryLevel: 0, essenceLevel: 0 })}
            >
              Reset Gear (to 0)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
