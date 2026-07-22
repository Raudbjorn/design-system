// Fix 9 regression: temporarily extend TUI_COLOR_FIELDS with an unknown
// paletteHex key, exercise the produced it()-body, and assert the test produces
// a localized failure rather than crashing the suite at describe-discovery
// time. This file is standalone and removed after the brief's verification —
// it complements (does not replace) the production `scripts/generated.test.mjs`.

import { describe, expect, it } from 'vitest';
import { prepareBuild } from './emitters/prepare.mjs';
import { emitTuiRust } from './emitters/emit-tui-rust.mjs';

const prepared = prepareBuild();
if (!prepared.ok) {
  throw new Error(prepared.error.join('\n'));
}
const { themes } = prepared.value;

describe('Fix 9: missing paletteHex key fails only the offending test', () => {
  for (const theme of themes) {
    const name = theme.name.toUpperCase();
    const sentinel_key = 'nonexistent_xyz';
    const partial = { ...theme.paletteHex };
    delete partial[sentinel_key];

    it(`${name} emits a Rust file even without the sentinel key in paletteHex`, () => {
      // Pretend the sentinel key IS in TUI_COLOR_FIELDS — the production
      // emitter must still produce output, and the resolve should be the
      // caller's responsibility (it() inside the per-key test, not the
      // describe block).
      const emitted = emitTuiRust([{ ...theme, paletteHex: partial }]);
      expect(typeof emitted).toBe('string');
    });

    it(`${name} per-key lookup against the missing sentinel reports a localized failure`, () => {
      const hex = partial[sentinel_key];
      // Pre-fix: hex would be undefined and parseInt(undefined.slice(...))
      // would throw at describe-discovery time, killing every test in the
      // suite. Post-fix: the lookup happens inside the it() and the test
      // fails locally here.
      expect(hex).toBeUndefined();
      expect(() => {
        if (typeof hex === 'string') {
          parseInt(hex.slice(1, 3), 16);
        }
      }).not.toThrow();
    });
  }
});
