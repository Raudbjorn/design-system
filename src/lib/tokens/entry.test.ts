import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f: string) => readFileSync(join(here, f), 'utf8');

describe('token entry', () => {
  it('index.css imports fonts, colors, and scale', () => {
    const css = read('index.css');
    expect(css).toContain("@import './fonts.css'");
    expect(css).toContain("@import './colors.css'");
    expect(css).toContain("@import './scale.css'");
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
