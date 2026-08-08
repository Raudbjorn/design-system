// Fix 9 regression: delete a real paletteHex key (not one that was never
// present) and exercise the same "resolve inside it(), not at describe-time"
// pattern generated.test.mjs uses for its TUI_COLOR_FIELDS loop, so a missing
// key fails only the offending test instead of crashing discovery for the
// whole suite. This file is standalone and removed after the brief's
// verification — it complements (does not replace) the production
// `scripts/generated.test.mjs`.

import { describe, expect, it } from 'vitest';
import { prepareBuild } from './emitters/prepare.mjs';
import { emitTuiRust } from './emitters/emit-tui-rust.mjs';

const prepared = prepareBuild();
if (!prepared.ok) {
  throw new Error(prepared.error.join('\n'));
}
const { themes } = prepared.value;

const MISSING_FIELD = 'accent';

describe('Fix 9: missing paletteHex key fails only the offending test', () => {
  for (const theme of themes) {
    const name = theme.name.toUpperCase();
    const partial = { ...theme.paletteHex };
    delete partial[MISSING_FIELD];

    it(`${name} emitTuiRust reports the missing field by name instead of a generic crash`, () => {
      expect(() => emitTuiRust([{ ...theme, paletteHex: partial }])).toThrow(
        new RegExp(`${theme.name}.*${MISSING_FIELD}`)
      );
    });

    it(`${name} per-key lookup against the missing field reports a localized failure`, () => {
      // Field name resolved outside it() (as the production loop does);
      // the paletteHex lookup and parseInt happen inside it() so a missing
      // key throws here, in this one test, not at describe-discovery time.
      const hex = partial[MISSING_FIELD];
      expect(hex).toBeUndefined();
      expect(() => parseInt(hex.slice(1, 3), 16)).toThrow(TypeError);
    });
  }
});
