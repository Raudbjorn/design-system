import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openSync } from 'fontkit';

const here = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(here, '../fonts');

const iosevkaFiles = ['Iosevka-Regular.woff2', 'Iosevka-Bold.woff2'] as const;
const representativePuaCodePoints = [0xe000, 0xe0a0, 0xe0b0, 0xf000] as const;

describe('fonts', () => {
  it('Iosevka weights are under 400 KB each', () => {
    for (const file of iosevkaFiles) {
      expect(statSync(join(fontsDir, file)).size).toBeLessThan(400 * 1024);
    }
  });

  it.each(iosevkaFiles)('%s preserves representative Nerd Font PUA glyphs', (file) => {
    const font = openSync(join(fontsDir, file));
    if (!('characterSet' in font)) {
      throw new Error(`${file} unexpectedly contains a font collection`);
    }

    const characterSet = new Set(font.characterSet);
    for (const codePoint of representativePuaCodePoints) {
      expect(characterSet.has(codePoint), `missing U+${codePoint.toString(16).toUpperCase()}`).toBe(
        true
      );
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
