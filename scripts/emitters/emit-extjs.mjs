// Build-time adapter for the ExtJS emitter. The emitter itself lives in
// src/lib/extjs/emit.ts because it is published — bin/design-generate.mjs uses
// it to emit sheets for generated world themes outside this repo. This file
// only maps a prepared theme row onto its inputs.

import { emitExtJsCss } from '../../src/lib/extjs/emit.ts';

export const emitExtJs = (theme) =>
  emitExtJsCss({
    name: `sv-${theme.name}`,
    palette: theme.paletteHex,
    scale: Object.fromEntries(theme.scaleFull.map((row) => [row.key, row.css]))
  });
