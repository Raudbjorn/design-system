import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SV_TOKEN_REGISTRY } from './registry';
import { palettes } from '../tokens/palette';

const scaleSource = JSON.parse(
  readFileSync(join(process.cwd(), 'src/lib/tokens/scale.tokens.json'), 'utf8')
) as { scale: Record<string, { $type?: string }> };

describe('SV_TOKEN_REGISTRY', () => {
  it('covers every semantic color token', () => {
    for (const name of Object.keys(palettes.dark)) {
      expect(SV_TOKEN_REGISTRY.get(name)?.type, name).toBe('color');
    }
  });

  it('stays in lockstep with the scale token source', () => {
    for (const [name, token] of Object.entries(scaleSource.scale)) {
      if (name.startsWith('$')) continue;
      const spec = SV_TOKEN_REGISTRY.get(name);
      expect(spec, `scale token "${name}" missing from registry`).toBeDefined();
      expect(spec?.type, name).toBe(token.$type);
    }
    // …and the registry lists no scale token the source doesn't have.
    for (const name of SV_TOKEN_REGISTRY.keys()) {
      if (name in palettes.dark) continue;
      expect(name in scaleSource.scale, `registry token "${name}" missing from source`).toBe(true);
    }
  });

  it('locks z-index and breakpoints; allows alpha nowhere', () => {
    for (const [name, spec] of SV_TOKEN_REGISTRY) {
      expect(spec.locked, name).toBe(name.startsWith('z-') || name.startsWith('bp-'));
      expect(spec.alphaAllowed, name).toBe(false);
    }
  });
});
