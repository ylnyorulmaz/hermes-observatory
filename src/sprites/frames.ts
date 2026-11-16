// src/sprites/frames.ts — pixel grids per agent (16×16), palette keys only.
// Data, not JSX, so it is editable. Each frame is 16 rows × 16 chars.
// idle = 2 frames (blink), busy = 4 frames (signature action).

import type { AgentId } from '../lib/types';

export type Frame = string[];

function v(base: Frame, overrides: Record<number, string>): Frame {
  const out = base.slice();
  for (const k of Object.keys(overrides)) {
    out[Number(k)] = overrides[Number(k)];
  }
  return out;
}

// --- default · Orchestrator (cyan headset + clipboard) --------------------

const DEFAULT: Frame = [
  '................',
  '....KCCCCCK.....',
  '....KSSSSSSK....',
  '....SKSSSSKS....',
  '....KSSSSSSK....',
  '.....KKKKKK.....',
  '....KCCCCCCK....',
  '....KCCCCCCK....',
  '....KCCCCCCK....',
  '....KCCCCCCK....',
  '....KCWWWWCK....',
  '....KCCCCCCK....',
  '....KCCCCCCK....',
  '.....KKKKKK.....',
  '.....KK..KK.....',
  '.....KK..KK.....',
];

// --- coder · hoodie + keyboard (blue) --------------------------------------

const CODER: Frame = [
  '................',
  '....BBBBBBBB....',
  '....BSSSSSSB....',
  '....BSKSSKSB....',
  '....BSSSSSSB....',
  '.....BBBBBB.....',
  '....KBBBBBBK....',
  '....KBBBBBBK....',
  '....KBBBBBBK....',
  '....KBBBBBBK....',
  '....KBWWWWBK....',
  '....KBBBBBBK....',
  '....KBBBBBBK....',
  '.....KKKKKK.....',
  '.....KK..KK.....',
  '.....KK..KK.....',
];

// --- qa · magnifier + bug (green) -----------------------------------------

const QA: Frame = [
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '....SKSSSSKS....',
  '....KSSSSSSK....',
  '.....KKKKKK.....',
  '....KEEEEEEK....',
  '....KEEEEEEK....',
  '...KEEWWWWEEK...',
  '...KEEWWWWEEK...',
  '...KEEEEEEEEK...',
  '....KEEEEEEK....',
  '....KEEEEEEK....',
  '.....KKKKKK.....',
  '.....KK..KK.....',
  '.....KK..KK.....',
];

// --- librarian · glasses + book (amber) ------------------------------------

const LIBRARIAN: Frame = [
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '....KSKKKKSK....',
  '....KSSSSSSK....',
  '.....KKKKKK.....',
  '....KYYYYYYK....',
  '....KYYYYYYK....',
  '....KYYYYYYK....',
  '....KYYYYYYK....',
  '....KWWWWWWK....',
  '....KYYYYYYK....',
  '....KYYYYYYK....',
  '.....KKKKKK.....',
  '.....KK..KK.....',
  '.....KK..KK.....',
];

// --- growth-hacker · megaphone (red) ---------------------------------------

const GROWTH: Frame = [
  '................',
  '.....KKKKKK.....',
  '....KSSSSSSK....',
  '....SKSSSSKS....',
  '....KSSSSSSK....',
  '.....KKKKKK.....',
  '....KRRRRRRK....',
  '....KRRRRRRK....',
  '....KRRRRRRK....',
  '....KRRRRRRK....',
  '...KRRRRRRRRK...',
  '..KRRRRRRRRRRK..',
  '....KRRRRRRK....',
  '.....KKKKKK.....',
  '.....KK..KK.....',
  '.....KK..KK.....',
];

// --- opencode-cli · terminal robot, CRT chest (purple) ---------------------

const CLI: Frame = [
  '.......KK.......',
  '.......KK.......',
  '.....KKKKKK.....',
  '....KPPPPPPK....',
  '....KPEPPEPK....',
  '.....KKKKKK.....',
  '....KPPPPPPK....',
  '....KPPPPPPK....',
  '...KPEEEEEEPK...',
  '...KPEPPPPEPK...',
  '...KPEEEEEEPK...',
  '....KPPPPPPK....',
  '....KPPPPPPK....',
  '.....KKKKKK.....',
  '.....KK..KK.....',
  '.....KK..KK.....',
];

export const FRAMES: Record<AgentId, { idle: Frame[]; busy: Frame[] }> = {
  default: {
    idle: [DEFAULT, v(DEFAULT, { 3: '....SSSSSSSS....' })],
    busy: [
      DEFAULT,
      v(DEFAULT, { 10: '...KCWWWWWWCK...', 9: '...KCCCCCCCCK...' }),
      v(DEFAULT, { 10: '....KCWWWWCK....', 9: '...KCCCCCCCCK...' }),
      v(DEFAULT, { 10: '...KCWWWWWWCK...', 9: '...KCCCCCCCCK...' }),
    ],
  },
  coder: {
    idle: [CODER, v(CODER, { 3: '....BSSSSSSB....' })],
    busy: [
      CODER,
      v(CODER, { 10: '...KBWWWWWWBK...', 9: '...KBBBBBBBBK...' }),
      v(CODER, { 10: '....KBWWWWBK....', 9: '...KBBKBBKBBK...' }),
      v(CODER, { 10: '...KBWWWWWWBK...', 9: '...KBBBBBBBBK...' }),
    ],
  },
  qa: {
    idle: [QA, v(QA, { 3: '....SSSSSSSS....' })],
    busy: [
      QA,
      v(QA, { 9: '...KEEWWWWEEK...', 8: '...KEEEEEEEEK...' }),
      v(QA, { 9: '...KEEEEEEEEK...', 8: '...KEEWWWWEEK...' }),
      v(QA, { 9: '...KEEWWWWEEK...', 8: '...KEEEEEEEEK...' }),
    ],
  },
  librarian: {
    idle: [LIBRARIAN, v(LIBRARIAN, { 3: '....SSSSSSSS....' })],
    busy: [
      LIBRARIAN,
      v(LIBRARIAN, { 10: '...KWWWWWWWWK...', 9: '...KYYYYYYYYK...' }),
      v(LIBRARIAN, { 10: '....KWWWWWWK....', 9: '...KYYYYYYYYK...' }),
      v(LIBRARIAN, { 10: '...KWWWWWWWWK...', 9: '...KYYYYYYYYK...' }),
    ],
  },
  'growth-hacker': {
    idle: [GROWTH, v(GROWTH, { 3: '....SSSSSSSS....' })],
    busy: [
      GROWTH,
      v(GROWTH, { 11: '..KRRRRRRRRRRK..', 10: '...KRRRRRRRRK...' }),
      v(GROWTH, { 11: '.KRRRRRRRRRRRRK.', 10: '...KRRRRRRRRK...' }),
      v(GROWTH, { 11: '..KRRRRRRRRRRK..', 10: '...KRRRRRRRRK...' }),
    ],
  },
  'opencode-cli': {
    idle: [CLI, v(CLI, { 4: '....KPPPPPPK....' })],
    busy: [
      CLI,
      v(CLI, { 9: '...KPGGGGGGPK...', 8: '...KPEEEEEEPK...' }),
      v(CLI, { 9: '...KPEEEEEEPK...', 8: '...KPGGGGGGPK...' }),
      v(CLI, { 9: '...KPGGGGGGPK...', 8: '...KPEEEEEEPK...' }),
    ],
  },
};

export const FRAME_COLS = 16;
export const FRAME_ROWS = 16;

export function frameFor(
  id: AgentId,
  status: 'busy' | 'idle' | 'offline',
): { frames: Frame[]; intervalMs: number } {
  const set = FRAMES[id];
  if (status === 'busy') return { frames: set.busy, intervalMs: 140 };
  if (status === 'idle') return { frames: set.idle, intervalMs: 600 };
  return { frames: [set.idle[0]], intervalMs: 0 };
}

// Busy-FX particle glyph rendered above a busy agent's head.
export const BUSY_GLYPHS = ['Z', '!', '⚙', '·'];
