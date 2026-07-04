import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f: string) => readFileSync(join(here, f), 'utf8');

describe('token entry', () => {
  it('index.css declares the layer order before importing fonts, colors, and scale', () => {
    const css = read('index.css');
    const layerStatement = css.indexOf('@layer sv.base, sv.theme, sv.world, sv.user;');
    expect(layerStatement).toBeGreaterThanOrEqual(0);
    for (const imported of ['./fonts.css', './colors.css', './scale.css']) {
      const at = css.indexOf(`@import '${imported}'`);
      expect(at, `${imported} imported after the layer statement`).toBeGreaterThan(layerStatement);
    }
  });

  it('generated CSS registers the expected layers', () => {
    expect(read('scale.css')).toContain('@layer sv.base {');
    expect(read('colors.css')).toContain('@layer sv.theme {');
  });

  it('scale defines the font-family + weight + z + breakpoint tokens', () => {
    const css = read('scale.css');
    for (const t of [
      '--sv-font-mono',
      '--sv-font-weight-medium',
      '--sv-font-weight-bold',
      '--sv-z-dropdown',
      '--sv-bp-md',
      '--sv-space-4'
    ]) {
      expect(css).toContain(t);
    }
  });

});
