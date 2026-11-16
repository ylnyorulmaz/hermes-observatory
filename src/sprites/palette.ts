// 8-bit sprite palette — max 16 entries, indexed by single-character keys
// used across src/sprites/frames.ts. Data-only; edit the frames to re-color.

export interface PaletteEntry {
  key: string;
  color: string;
  label: string;
}

// Palette keys used by the sprite frames:
//   .  transparent      k  black/outline    h  hair (brown)
//   s  skin             S  skin (closed eye) b  blue
//   g  green            G  bright green      a  amber/accent
//   w  white            d  dark grey         r  red
//   p  pink             v  violet            t  teal
//   c  cyan
export const PALETTE: Record<string, string> = {
  ".": "transparent",
  k: "#0c0c0e",
  h: "#5b3a21",
  s: "#e8b48a",
  S: "#e8b48a",
  b: "#2f6df6",
  g: "#22c55e",
  G: "#7dff6b",
  a: "#ffb020",
  w: "#f5f5f4",
  d: "#43434c",
  r: "#ef4444",
  p: "#ff5ea8",
  v: "#8b5cf6",
  t: "#14b8a6",
  c: "#06b6d4",
};

export const PALETTE_SIZE = 16;

export function colorForKey(key: string): string {
  return PALETTE[key] ?? "#ff00ff";
}
