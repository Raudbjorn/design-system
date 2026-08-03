// The .astro set is a subset of the Svelte set, and both barrels have to agree
// on it. A file added to this directory without a barrel entry is invisible to
// consumers; a barrel entry naming a component the library does not export is
// a name that will never match the documentation.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));

const barrel = readFileSync(join(HERE, 'index.ts'), 'utf8');
const svelteBarrel = readFileSync(join(HERE, '../../index.ts'), 'utf8');

const files = readdirSync(HERE)
  .filter((f) => f.endsWith('.astro'))
  .map((f) => f.replace(/\.astro$/, ''))
  .sort();

const exported = [...barrel.matchAll(/export \{ default as (\w+) \} from '\.\/(\w+)\.astro';/g)];

describe('astro component barrel', () => {
  it('exports every .astro file in this directory, and only those', () => {
    expect(exported.map((m) => m[2]).sort()).toEqual(files);
  });

  it('exports each component under its own file name', () => {
    for (const [, exportName, fileName] of exported) expect(exportName).toBe(fileName);
  });

  it('names only components the library actually ships', () => {
    for (const name of files) {
      expect(svelteBarrel, `${name} is not exported from src/lib/index.ts`).toMatch(
        new RegExp(`export \\{ default as ${name} \\}`)
      );
    }
  });

  it('ports every component that has neither state nor handlers', () => {
    // The selection rule, enforced rather than described: if a component picks
    // up $state/$effect/$bindable or an event handler it is interactive and
    // belongs to the Svelte-only set; if it loses them, it becomes portable and
    // this test says so.
    const INTERACTIVE = /\$state|\$effect|\$bindable|\bon(?:click|keydown|input|change)\b/;
    const roots = ['atoms', 'layout', 'molecules'];
    const componentsDir = join(HERE, '../../components');

    const portable: string[] = [];
    for (const root of roots) {
      for (const file of readdirSync(join(componentsDir, root))) {
        if (!file.endsWith('.svelte')) continue;
        const source = readFileSync(join(componentsDir, root, file), 'utf8');
        if (!INTERACTIVE.test(source)) portable.push(file.replace(/\.svelte$/, ''));
      }
    }

    // Button is the documented exception: no state, but its onclick cannot
    // cross into .astro, so it is ported without that prop.
    expect(files.filter((f) => f !== 'Button').sort()).toEqual(portable.sort());
  });
});
