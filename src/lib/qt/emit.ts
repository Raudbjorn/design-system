// Qt emitter — one QPalette JSON document per theme, for PySide6/Qt consumers.
//
// The artifact is a pure data description of the application palette Qt should
// install: three QPalette color groups (active/inactive/disabled) mapped onto
// the semantic tokens, plus status foreground/background pairs exposed for
// consumers. The Qt runtime helper (bin/sv_design_qt.py) applies it after
// the Fusion style and before the generated QSS sheet, so Qt-owned widgets
// without an explicit QSS rule still read the theme's colors.
//
// Pure and deterministic: the same inputs always produce the same bytes.
// Invalid names, missing tokens, and malformed colors are returned as typed
// issues rather than producing a palette with holes. The Python side validates
// the same closed schema, so a successful document is always accepted by
// bin/sv_design_qt.py and its theme name is always a safe filename stem.
//
// This module is published (`@svnbjrn/design/qt`); it reuses the shared color
// math from internal/ rather than duplicating it.

import { mixOklab, parseColor, toHex6 } from '../internal/color.ts';
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

const REQUIRED_COLOR_TOKENS = [
  'bg',
  'text',
  'surface-1',
  'surface-2',
  'surface-3',
  'text-strong',
  'text-muted',
  'text-faint',
  'accent',
  'success',
  'error',
  'warning',
  'info'
] as const;

export interface QtPaletteInput {
  name: string;
  palette: Readonly<Record<string, string>>;
}

export type QtPaletteIssue =
  | { code: 'E_THEME_NAME'; message: string; name: string }
  | { code: 'E_MISSING_COLOR'; message: string; token: string }
  | { code: 'E_COLOR_VALUE'; message: string; token: string; value: string };

export type QtPaletteResult =
  | { ok: true; value: string }
  | { ok: false; error: QtPaletteIssue[] };

/** Pure: the same inputs always produce the same bytes. Invalid input returns
 * structured issues and never emits a partial document. */
export const emitQtPalette = ({ name, palette }: QtPaletteInput): QtPaletteResult => {
  if (!THEME_NAME_RE.test(name)) {
    return {
      ok: false,
      error: [
        {
          code: 'E_THEME_NAME',
          name,
          message: `emitQtPalette: invalid theme name "${name}"`
        }
      ]
    };
  }

  const issues: QtPaletteIssue[] = [];
  const canonicalHex = (value: unknown): string | null => {
    const parsed = parseColor(typeof value === 'string' ? value : '');
    return parsed ? toHex6(parsed) : null;
  };
  const colors = new Map<string, string>();
  for (const key of REQUIRED_COLOR_TOKENS) {
    const value = palette[key];
    if (value === undefined) {
      issues.push({
        code: 'E_MISSING_COLOR',
        token: key,
        message: `emitQtPalette: missing color token "${key}"`
      });
      continue;
    }
    const normalized = canonicalHex(value);
    if (normalized === null) {
      issues.push({
        code: 'E_COLOR_VALUE',
        token: key,
        value: String(value),
        message: `emitQtPalette: token "${key}" is not a valid hex color: "${value}"`
      });
      continue;
    }
    colors.set(key, normalized);
  }
  if (issues.length > 0) return { ok: false, error: issues };

  // Every required key reached this point with a validated six-digit lowercase hex.
  const c = (key: (typeof REQUIRED_COLOR_TOKENS)[number]): string => colors.get(key)!;
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

  return { ok: true, value: `${JSON.stringify(doc, null, 2)}\n` };
};

