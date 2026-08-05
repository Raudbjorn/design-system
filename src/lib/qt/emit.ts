// Qt emitter — one QPalette JSON document per theme, for PySide6/Qt consumers.
//
// The artifact is a pure data description of the application palette Qt should
// install: three QPalette color groups (active/inactive/disabled) mapped onto
// the semantic tokens, plus the status foreground/background pairs the QSS
// adapter uses. The Qt runtime helper (bin/sv_design_qt.py) applies it after
// the Fusion style and before the generated QSS sheet, so Qt-owned widgets
// without an explicit QSS rule still read the theme's colors.
//
// Pure and deterministic: the same inputs always produce the same bytes.
// Throws on a missing or malformed token rather than emitting a palette with
// holes in it — the Python side validates the same closed schema, so an
// emitted document is always accepted by bin/sv_design_qt.py, and the theme
// name is always a safe filename stem.
//
// This module is published (`@svnbjrn/design/qt`); it reuses the shared color
// math from internal/ rather than duplicating it.

import { mixOklab } from '../internal/color.ts';
import { contrastRatio } from '../internal/contrast.ts';

/** The QPalette roles the emitted groups carry. Keep in sync with the
 * closed-schema validator in bin/sv_design_qt.py. */
export const QT_ROLES = [
  'Window',
  'WindowText',
  'Base',
  'AlternateBase',
  'Text',
  'Button',
  'ButtonText',
  'ToolTipBase',
  'ToolTipText',
  'Highlight',
  'HighlightedText',
  'PlaceholderText',
  'Link',
  'BrightText'
] as const;

/** Status background mix weight toward `bg` (85% toward the page background). */
const STATUS_BG_MIX = 0.85;

const THEME_NAME_RE = /^[a-z][a-z0-9-]{0,63}$/;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

export interface QtPaletteInput {
  name: string;
  palette: Readonly<Record<string, string>>;
}

/** Pure: the same inputs always produce the same bytes. Throws on an invalid
 * theme name, a missing token, or a non-hex token value. */
export const emitQtPalette: (input: QtPaletteInput) => string = ({ name, palette }) => {
  if (!THEME_NAME_RE.test(name)) {
    throw new Error(`emitQtPalette: invalid theme name "${name}"`);
  }

  const c = (key: string): string => {
    const value = palette[key];
    if (value === undefined) {
      throw new Error(`emitQtPalette: missing color token "${key}"`);
    }
    if (!HEX_COLOR_RE.test(value)) {
      throw new Error(`emitQtPalette: token "${key}" is not #rrggbb: "${value}"`);
    }
    return value;
  };

  const bg = c('bg');
  const text = c('text');
  const surface1 = c('surface-1');
  const surface2 = c('surface-2');
  const surface3 = c('surface-3');
  const textStrong = c('text-strong');
  const textMuted = c('text-muted');
  const textFaint = c('text-faint');
  const accent = c('accent');
  const success = c('success');
  const error = c('error');
  const warning = c('warning');
  const info = c('info');

  // Dark means white text is easier to see against the page background than
  // black text — the rule compares bg with white and black, not with text.
  const isDark = contrastRatio('#ffffff', bg) > contrastRatio('#000000', bg);

  const active: Record<string, string> = {
    Window: bg,
    WindowText: text,
    Base: surface1,
    AlternateBase: surface2,
    Text: text,
    Button: surface2,
    ButtonText: text,
    ToolTipBase: surface3,
    ToolTipText: textStrong,
    Highlight: accent,
    HighlightedText: bg,
    PlaceholderText: textFaint,
    Link: accent,
    BrightText: '#ffffff'
  };
  const inactive: Record<string, string> = {
    ...active,
    Highlight: mixOklab(accent, surface3, 0.5)
  };
  const disabled: Record<string, string> = {
    ...active,
    WindowText: textFaint,
    Text: textFaint,
    ButtonText: textFaint,
    Base: bg,
    Button: surface1,
    Highlight: surface3,
    HighlightedText: textMuted,
    Link: textMuted
  };

  const doc = {
    $generated: 'by scripts/build-tokens.mjs — do not edit',
    name,
    meta: { isDark },
    groups: { active, inactive, disabled },
    status: {
      success,
      error,
      warning,
      info,
      'success-bg': mixOklab(success, bg, STATUS_BG_MIX),
      'error-bg': mixOklab(error, bg, STATUS_BG_MIX),
      'warning-bg': mixOklab(warning, bg, STATUS_BG_MIX),
      'info-bg': mixOklab(info, bg, STATUS_BG_MIX)
    }
  };

  return `${JSON.stringify(doc, null, 2)}\n`;
};
