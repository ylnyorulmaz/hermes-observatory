// src/sprites/palette.ts — 8-bit palette (max 16 colors), keyed for compact frames.
// '.' is transparent. Letters are palette keys referenced by frames.ts.

export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  K: '#0a0a0a', // outline black
  D: '#2a2a2a', // dark gray (shadow / secondary outline)
  G: '#6b6b6b', // mid gray
  W: '#f2f2f2', // white / highlight
  S: '#e7b98a', // skin
  B: '#4a9eff', // blue (coder hoodie)
  C: '#38d9d9', // cyan (orchestrator headset)
  E: '#4ade80', // green (qa bug)
  Y: '#fbbf24', // amber (librarian book)
  R: '#ff5a5a', // red (growth-hacker megaphone)
  P: '#b57bff', // purple (opencode-cli)
  O: '#ff944d', // orange (accent particles)
  M: '#ff7ac6', // magenta (fx)
  N: '#8b5cf6', // violet (fx)
};

export type PaletteKey = keyof typeof PALETTE;
