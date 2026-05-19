/**
 * Shared template registry used by the PDF renderer. Mirrors
 * `artifacts/sales-assistant/src/components/karten/templates.ts` so the
 * generated PDF visually matches the browser preview.
 *
 * All decoration is hand-drawn (lines, ornaments, monograms). No third-party
 * images or fonts are used — this avoids any licensing/copyright issues.
 */

export type CardKind = "einladung" | "tischkarte" | "menuekarte" | "dankeskarte";

export type DecorationKind =
  | "minimal-line"
  | "frame"
  | "botanical"
  | "monogram"
  | "editorial"
  | "wash"
  | "art-deco"
  | "arch"
  | "wreath"
  | "terrazzo";

export interface TemplateSpec {
  id: string;
  name: string;
  tagline: string;
  background: string;   // hex
  primary: string;      // text color
  accent: string;       // accent color
  fontFamily: "serif" | "sans" | "display";
  decoration: DecorationKind;
}

export const TEMPLATES: TemplateSpec[] = [
  { id: "creme-serif",        name: "Crème Serif",        tagline: "Klassisch modern, warm und einladend",            background: "#faf7f2", primary: "#2a2a2a", accent: "#c9a96e", fontFamily: "serif",   decoration: "minimal-line" },
  { id: "charcoal-editorial", name: "Charcoal Editorial", tagline: "Bold, magazine-style, unverwechselbar",           background: "#1a1a1a", primary: "#f5f1e8", accent: "#c9a96e", fontFamily: "sans",    decoration: "editorial" },
  { id: "sage-botanical",     name: "Sage Botanical",     tagline: "Natürlich, ruhig, mit feinen Linien",             background: "#f4f1ea", primary: "#2c3a2a", accent: "#8b9a7b", fontFamily: "serif",   decoration: "botanical" },
  { id: "blush-frame",        name: "Blush Frame",        tagline: "Romantisch zart, mit doppeltem Rahmen",           background: "#f9eee9", primary: "#5a2a2a", accent: "#b88577", fontFamily: "serif",   decoration: "frame" },
  { id: "midnight-gold",      name: "Midnight Gold",      tagline: "Edel, dunkel, mit Monogramm-Kreis",               background: "#15233a", primary: "#f7e7c0", accent: "#d4af7a", fontFamily: "display", decoration: "monogram" },
  { id: "linen-minimal",      name: "Linen Minimal",      tagline: "Pur reduziert, zeitlos modern",                   background: "#ffffff", primary: "#1d1d1d", accent: "#1d1d1d", fontFamily: "sans",    decoration: "minimal-line" },
  { id: "gold-deco",          name: "Gold Deco",          tagline: "Glamouröse 20er-Jahre-Eleganz mit Gold",          background: "#0e0e10", primary: "#f4ecd2", accent: "#d4af7a", fontFamily: "display", decoration: "art-deco" },
  { id: "terracotta-arch",    name: "Terracotta Arch",    tagline: "Mediterran-modern mit elegantem Torbogen",        background: "#f5ede4", primary: "#3a2418", accent: "#b56747", fontFamily: "serif",   decoration: "arch" },
  { id: "olive-wreath",       name: "Olive Wreath",       tagline: "Toskanisch warm, mit feinem Olivenkranz",         background: "#f6f3eb", primary: "#2b3022", accent: "#7a8456", fontFamily: "serif",   decoration: "wreath" },
  { id: "rose-confetti",      name: "Rosé Confetti",      tagline: "Frisch & verspielt mit Konfetti-Tupfen",          background: "#fdf6f3", primary: "#3a2228", accent: "#c98a96", fontFamily: "sans",    decoration: "terrazzo" },
];

export function getTemplate(id: string): TemplateSpec | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

/** Page sizes in millimetres, oriented [width, height]. */
export const KIND_SIZE_MM: Record<CardKind, [number, number]> = {
  einladung:   [105, 148], // A6 portrait
  tischkarte:  [90, 55],   // landscape place card
  menuekarte:  [148, 210], // A5 portrait
  dankeskarte: [148, 105], // A6 landscape (room for photo)
};

export const KIND_LABEL: Record<CardKind, string> = {
  einladung:   "Hochzeitseinladung",
  tischkarte:  "Tischkärtchen",
  menuekarte:  "Menükarte",
  dankeskarte: "Dankeskarte",
};
