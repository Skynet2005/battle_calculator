import type { GearPieceSpec } from "./gear-piece-core";

export const GEAR_PIECE_SPECS: Record<"goggles" | "glove" | "boot" | "belt", GearPieceSpec> = {
  goggles: {
    piece: "goggles",
    primary: "lethality",
    empowermentPattern: "ATK_DEF_ATK",
  },
  boot: {
    piece: "boot",
    primary: "lethality",
    empowermentPattern: "DEF_ATK_DEF",
  },
  glove: {
    piece: "glove",
    primary: "health",
    empowermentPattern: "DEF_ATK_DEF",
  },
  belt: {
    piece: "belt",
    primary: "health",
    empowermentPattern: "ATK_DEF_ATK",
  },
};
