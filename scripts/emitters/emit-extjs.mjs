// Build-time adapter for the ExtJS emitter. The emitter itself lives in
// src/lib/extjs/emit.ts because it is published — bin/design-generate.mjs uses
// it to emit sheets for generated world themes outside this repo. This file
// only maps a prepared theme row onto its inputs.

import { checkProxmoxThemeName, emitExtJsCss } from '../../src/lib/extjs/emit.ts';

export const emitExtJs = (theme) => {
  // A built-in theme whose name breaks Proxmox's rule (a digit, say) would
  // otherwise be emitted, committed and drift-guarded as a sheet nobody can
  // select. emitExtJsCss enforces this too; failing here names the theme.
  const name = `sv-${theme.name}`;
  const check = checkProxmoxThemeName(name);
  if (!check.ok) {
    throw new Error(`emitExtJs: theme "${theme.name}" cannot ship to Proxmox — ${check.error}`);
  }

  return emitExtJsCss({
    name,
    palette: theme.paletteHex,
    scale: Object.fromEntries(theme.scaleFull.map((row) => [row.key, row.css]))
  });
};
