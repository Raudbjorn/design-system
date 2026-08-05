// Build-time adapter for the Qt emitter. The emitter itself lives in
// src/lib/qt/emit.ts because it is published (@svnbjrn/design/qt). This file
// only maps a prepared theme row onto its inputs — the same shape as
// emit-extjs.mjs, not the private prepared-theme API emit-qss.mjs uses.

import { emitQtPalette } from '../../src/lib/qt/emit.ts';

export const emitQt = (theme) => emitQtPalette({ name: theme.name, palette: theme.paletteHex });
