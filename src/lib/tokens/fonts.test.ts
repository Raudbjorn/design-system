import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(here, '../fonts');

describe('fonts', () => {
  it('Iosevka weights are under 400 KB each', () => {
    for (const f of ['Iosevka-Regular.woff2', 'Iosevka-Bold.woff2']) {
      expect(statSync(join(fontsDir, f)).size).toBeLessThan(400 * 1024);
    }
  });

  it('fonts.css uses font-display: swap for every face', () => {
    const css = readFileSync(join(here, 'fonts.css'), 'utf8');
    const faces = css.match(/@font-face/g) ?? [];
    const swaps = css.match(/font-display:\s*swap/g) ?? [];
    expect(faces.length).toBeGreaterThanOrEqual(4);
    expect(swaps.length).toBe(faces.length);
  });
});
