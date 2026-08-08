// Public surface of the Qt adapter (`@svnbjrn/design/qt`).
//
// The committed palette documents (dark/light/amber.palette.json) are what
// most consumers want — bin/sv_design_qt.py applies them at runtime. This
// module exists so other prepared palettes can be turned into QPalette JSON
// outside the token build.

export { emitQtPalette, QT_ROLES } from './emit.ts';
export type { QtPaletteInput, QtPaletteIssue, QtPaletteResult } from './emit.ts';
