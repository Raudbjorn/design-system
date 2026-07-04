// Per-$type value grammars for UNTRUSTED theme-package values.
//
// Parse, don't validate: each grammar parses its input into a typed internal
// representation and the CSS emitted downstream is re-serialized from that
// representation only. There is no code path from a package string to a
// stylesheet — url(), @import, escape sequences and </style> breakouts die
// here because no grammar can produce them.

import { parseColor, toHex6, toHex8 } from '../internal/color.ts';
import type { TokenType } from '../tokens/resolver.ts';

export interface ValidatedValue {
  /** CSS-safe serialization, ready for a custom-property declaration. */
  css: string;
  /** Grammar-level alpha flag (colors only) — the caller decides legality. */
  hasAlpha: boolean;
}

const DIMENSION_RE = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)$/;
const MAX_PX = 1000;
const MAX_REM = 64;
const MAX_SHADOW_PX = 100;
const MAX_FAMILIES = 4;
const MAX_SHADOW_LAYERS = 4;
const FAMILY_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$/;
const GENERIC_FAMILIES = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'system-ui',
  'ui-monospace',
  'ui-sans-serif',
  'ui-serif'
]);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

const validateColor = (value: unknown): ValidatedValue | null => {
  if (typeof value !== 'string') return null;
  const parsed = parseColor(value);
  if (!parsed) return null;
  return parsed.a >= 1
    ? { css: toHex6(parsed), hasAlpha: false }
    : { css: toHex8(parsed), hasAlpha: true };
};

interface Dimension {
  value: number;
  unit: 'px' | 'rem';
}

const parseDimension = (value: unknown, { allowNegative = false } = {}): Dimension | null => {
  let dim: Dimension | null = null;
  if (typeof value === 'string') {
    const m = DIMENSION_RE.exec(value.trim());
    if (m && m[1] !== undefined && (m[2] === 'px' || m[2] === 'rem')) {
      dim = { value: Number(m[1]), unit: m[2] };
    }
  } else if (isRecord(value) && typeof value.value === 'number') {
    if (value.unit === 'px' || value.unit === 'rem') {
      dim = { value: value.value, unit: value.unit };
    }
  }
  if (!dim || !Number.isFinite(dim.value)) return null;
  if (!allowNegative && dim.value < 0) return null;
  const limit = dim.unit === 'px' ? MAX_PX : MAX_REM;
  if (Math.abs(dim.value) > limit) return null;
  return { value: round4(dim.value), unit: dim.unit };
};

const serializeDimension = (d: Dimension): string => (d.value === 0 ? '0' : `${d.value}${d.unit}`);

const validateDimension = (value: unknown): ValidatedValue | null => {
  const dim = parseDimension(value);
  return dim ? { css: serializeDimension(dim), hasAlpha: false } : null;
};

const validateNumber = (value: unknown): ValidatedValue | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value <= 0 || value > 100) return null;
  return { css: String(round4(value)), hasAlpha: false };
};

const validateFontWeight = (value: unknown): ValidatedValue | null => {
  const weight = value === 'normal' ? 400 : value === 'bold' ? 700 : value;
  if (typeof weight !== 'number' || !Number.isFinite(weight)) return null;
  if (weight < 1 || weight > 1000) return null;
  return { css: String(Math.round(weight)), hasAlpha: false };
};

const validateFontFamily = (value: unknown): ValidatedValue | null => {
  const list = typeof value === 'string' ? [value] : Array.isArray(value) ? value : null;
  if (!list || list.length === 0 || list.length > MAX_FAMILIES) return null;
  const out: string[] = [];
  for (const entry of list) {
    if (typeof entry !== 'string') return null;
    const family = entry.trim();
    if (GENERIC_FAMILIES.has(family)) {
      out.push(family);
    } else if (FAMILY_RE.test(family)) {
      // FAMILY_RE's charset excludes quotes, backslashes, braces, slashes and
      // semicolons, so single-quoting the raw text is safe by construction.
      out.push(`'${family}'`);
    } else {
      return null;
    }
  }
  return { css: out.join(', '), hasAlpha: false };
};

const validateShadowLayer = (value: unknown): string | null => {
  if (!isRecord(value)) return null;
  const color = typeof value.color === 'string' ? parseColor(value.color) : null;
  if (!color) return null;
  const colorCss = color.a >= 1 ? toHex6(color) : toHex8(color);
  const lengths: string[] = [];
  for (const field of ['offsetX', 'offsetY', 'blur', 'spread'] as const) {
    const raw = field === 'spread' && value[field] === undefined ? '0px' : value[field];
    const allowNegative = field === 'offsetX' || field === 'offsetY' || field === 'spread';
    const dim = parseDimension(raw, { allowNegative });
    if (!dim || (dim.unit === 'px' && Math.abs(dim.value) > MAX_SHADOW_PX)) return null;
    if (field === 'blur' && dim.value < 0) return null;
    lengths.push(serializeDimension(dim));
  }
  const inset = value.inset === undefined ? false : value.inset;
  if (typeof inset !== 'boolean') return null;
  const spread = lengths[3] === '0' ? '' : ` ${lengths[3]}`;
  return `${inset ? 'inset ' : ''}${lengths[0]} ${lengths[1]} ${lengths[2]}${spread} ${colorCss}`;
};

const validateShadow = (value: unknown): ValidatedValue | null => {
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0 || list.length > MAX_SHADOW_LAYERS) return null;
  const layers: string[] = [];
  for (const entry of list) {
    const layer = validateShadowLayer(entry);
    if (layer === null) return null;
    layers.push(layer);
  }
  return { css: layers.join(', '), hasAlpha: false };
};

/**
 * Validate one untrusted value against its registry $type. Returns the
 * CSS-safe serialization or null (rejected). Alpha legality is reported, not
 * decided, here.
 */
export const validateTokenValue = (type: TokenType, value: unknown): ValidatedValue | null => {
  switch (type) {
    case 'color':
      return validateColor(value);
    case 'dimension':
      return validateDimension(value);
    case 'number':
      return validateNumber(value);
    case 'fontWeight':
      return validateFontWeight(value);
    case 'fontFamily':
      return validateFontFamily(value);
    case 'shadow':
      return validateShadow(value);
  }
};
