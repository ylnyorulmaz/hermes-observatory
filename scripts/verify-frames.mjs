// Verifies all sprite frames are 16x16 and use only palette keys.
import { FRAMES, FRAME_COLS, FRAME_ROWS } from '../src/sprites/frames.ts';
import { PALETTE } from '../src/sprites/palette.ts';

let bad = 0;
for (const [agent, set] of Object.entries(FRAMES)) {
  for (const [kind, frames] of Object.entries(set)) {
    for (const [i, frame] of frames.entries()) {
      if (frame.length !== FRAME_ROWS) {
        console.log(`BAD ${agent} ${kind}[${i}]: ${frame.length} rows`);
        bad++;
      }
      frame.forEach((row, r) => {
        if (row.length !== FRAME_COLS) {
          console.log(`BAD ${agent} ${kind}[${i}] row${r}: len ${row.length} -> "${row}"`);
          bad++;
        }
        for (const ch of row) {
          if (!(ch in PALETTE)) {
            console.log(`BAD ${agent} ${kind}[${i}] row${r}: unknown key "${ch}"`);
            bad++;
          }
        }
      });
    }
  }
}
console.log(bad === 0 ? 'ALL FRAMES OK' : `${bad} problems`);
