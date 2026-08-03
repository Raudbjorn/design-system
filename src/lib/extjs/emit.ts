// ExtJS emitter — one self-contained CSS override sheet per theme, for
// Proxmox VE / PBS / PMG (and any app built on proxmox-widget-toolkit).
//
// Proxmox loads exactly one theme stylesheet after theme-crisp-all.css, so the
// artifact has to carry everything: @font-face declarations, the `:root`
// variable block, and the structural `.x-*` rules. Only the variable block is
// theme-specific; EXTJS_STRUCTURE is shared verbatim (see structure.ts for the
// conventions that differ from the web components).
//
// The sheet is deliberately UNLAYERED. Cascade layers always lose to unlayered
// rules, and ext-all.css is unlayered — a layer wrapper here would make the
// whole theme inert.
//
// Interaction states are inlined as hex, not color-mix(), so the values match
// the QSS adapter byte for byte and the sheet stays parseable by anything that
// reads it back. The math mirrors scripts/emitters/prepare.mjs.
//
// This module is published (`@svnbjrn/design/extjs`) so the design-generate
// bin can emit sheets for generated world themes outside this repo.

import { mixOklab } from '../internal/color.ts';
import { EXTJS_STRUCTURE } from './structure.ts';

/** Mix weights for derived interaction states. Must stay in lockstep with
 * scripts/emitters/prepare.mjs — a drift-guard test asserts the emitted values
 * equal the ones that build the QSS and web outputs. */
export const HOVER_MIX = 0.15;
export const PRESSED_MIX = 0.25;

/** Tokens that get -hover/-pressed derivations. Mirrors prepare.mjs. */
const DERIVED_TOKENS = ['accent', 'accent-2', 'error', 'surface-1', 'surface-2', 'surface-3'];

/** Scale tokens the ExtJS sheet consumes. z-* and bp-* are omitted: ExtJS owns
 * its own stacking and has no CSS breakpoints. */
const SCALE_KEYS = [
  'font-sans',
  'font-mono',
  'font-weight-normal',
  'font-weight-medium',
  'font-weight-semibold',
  'font-weight-bold',
  'fs-xs',
  'fs-sm',
  'fs-base',
  'fs-lg',
  'lh-tight',
  'lh-normal',
  'space-1',
  'space-2',
  'space-3',
  'space-4',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'shadow-sm',
  'shadow-md'
];

/** Proxmox reads these at runtime with getPropertyValue() to paint RRD charts
 * and gauges on canvas — CSS alone cannot reach them. Plain var() chains only:
 * the JS side hands the value straight to a canvas context, so it has to
 * resolve to a single parseable color. */
const PWT_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['--pwt-panel-background', 'surface-1'],
  ['--pwt-text-color', 'text'],
  ['--pwt-gauge-default', 'accent'],
  ['--pwt-gauge-back', 'surface-3'],
  ['--pwt-gauge-warn', 'warning'],
  ['--pwt-gauge-crit', 'error'],
  ['--pwt-chart-primary', 'accent'],
  ['--pwt-chart-grid-stroke', 'border']
];

const FONT_FILES: ReadonlyArray<readonly [string, string, string, string]> = [
  ['Inter', 'normal', '100 900', 'InterVariable.woff2'],
  ['Inter', 'italic', '100 900', 'InterVariable-Italic.woff2'],
  ['Iosevka', 'normal', '400', 'Iosevka-Regular.woff2'],
  ['Iosevka', 'normal', '700', 'Iosevka-Bold.woff2']
];

/** Filter applied to crisp's dark raster sprites on dark themes — the same
 * trade the official Proxmox dark theme makes in its _icons.scss. */
const DARK_ICON_FILTER = 'invert(1) hue-rotate(180deg) brightness(1.15) saturate(0.85)';

/** ExtJS lays out in pixels and measures in JavaScript; rem would make widget
 * metrics depend on the host page's root font size. */
const REM_PX = 16;

const toPx = (value: string): string => {
  const match = /^(-?[\d.]+)rem$/.exec(String(value).trim());
  if (match?.[1] === undefined) return value;
  const px = Number.parseFloat(match[1]) * REM_PX;
  if (Number.isNaN(px)) throw new Error(`emitExtJs: unparseable rem length "${value}"`);
  return `${px}px`;
};

const luminance = (hex: string): number => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (match?.[1] === undefined) throw new Error(`emitExtJs: expected a #rrggbb color, got "${hex}"`);
  const digits = match[1];
  const channel = (offset: number): number => {
    const srgb = Number.parseInt(digits.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
};

export type ProxmoxNameCheck = { ok: true; value: string } | { ok: false; error: string };

/** Proxmox validates theme names against ^[a-z]{1,10}(-[a-z]{1,10}){0,5}$ on
 * PVE and PMG — lowercase letters and hyphens only, no digits. A name that
 * fails this installs fine and then cannot be selected, so reject it early.
 * Errors are values: the caller decides between throwing and an exit code. */
export const checkProxmoxThemeName = (name: string): ProxmoxNameCheck =>
  /^[a-z]{1,10}(-[a-z]{1,10}){0,5}$/.test(name)
    ? { ok: true, value: name }
    : {
        ok: false,
        error:
          `"${name}" is not a selectable Proxmox theme name — PVE and PMG require ` +
          `^[a-z]{1,10}(-[a-z]{1,10}){0,5}$ (lowercase letters and hyphens, no digits, ` +
          `segments of 1-10 characters)`
      };

export interface ExtJsThemeInput {
  /** Theme id: goes in the header and, as theme-<name>.css, the file stem. */
  name: string;
  /** Semantic color tokens -> #rrggbb. Must include every role the sheet uses. */
  palette: Record<string, string>;
  /** Scale tokens -> CSS value. rem lengths are converted to px. */
  scale: Record<string, string>;
}

/** Pure: the same inputs always produce the same bytes. Throws on a missing
 * token rather than emitting a sheet with holes in it. */
export const emitExtJsCss = ({ name, palette, scale }: ExtJsThemeInput): string => {
  const c = (key: string): string => {
    const value = palette[key];
    if (value === undefined) throw new Error(`emitExtJs: missing color token "${key}"`);
    return value;
  };
  const s = (key: string): string => {
    const value = scale[key];
    if (value === undefined) throw new Error(`emitExtJs: missing scale token "${key}"`);
    return value;
  };

  const mixTarget = c('mix-target');
  const derived: Array<readonly [string, string]> = [];
  for (const key of DERIVED_TOKENS) {
    derived.push([`${key}-hover`, mixOklab(c(key), mixTarget, HOVER_MIX)]);
    derived.push([`${key}-pressed`, mixOklab(c(key), mixTarget, PRESSED_MIX)]);
  }

  const isDark = luminance(c('bg')) < luminance(c('text'));
  const colorLines = Object.keys(palette)
    .map((key) => `  --sv-${key}: ${c(key)};`)
    .join('\n');
  const derivedLines = derived.map(([key, value]) => `  --sv-${key}: ${value};`).join('\n');
  const scaleLines = SCALE_KEYS.map((key) => `  --sv-${key}: ${toPx(s(key))};`).join('\n');
  const pwtLines = PWT_ALIASES.map(([alias, key]) => `  ${alias}: var(--sv-${key});`).join('\n');
  const fontFaces = FONT_FILES.map(
    ([family, style, weight, file]) => `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('sv-fonts/${file}') format('woff2');
}`
  ).join('\n');

  return `/* GENERATED — do not edit by hand.
 * Theme: ${name} — ExtJS override sheet for @svnbjrn/design.
 *
 * Proxmox VE / PBS / PMG:
 *   install to /usr/share/javascript/proxmox-widget-toolkit/themes/theme-${name}.css
 *   with the woff2 files in a sibling sv-fonts/ directory, then select the
 *   theme in the UI (or set the P{VE,BS,MG}ThemeCookie to "${name}").
 *   bin/proxmox-theme-install.sh does all of that.
 *
 * Own ExtJS apps: load after ext-all.css / theme-crisp-all.css. Nothing here is
 * wrapped in a cascade layer, because layered rules lose to ExtJS's unlayered
 * ones.
 */

${fontFaces}

:root {
${colorLines}

${derivedLines}

${scaleLines}

  --sv-icon-filter: ${isDark ? DARK_ICON_FILTER : 'none'};

  /* Read at runtime by RRDChart.js / GaugeWidget.js — canvas cannot be styled
   * by CSS, so these are the only hook charts have. */
${pwtLines}
}
${EXTJS_STRUCTURE}`;
};

/** A resolved token map as committed to src/lib/tokens/resolved/<theme>.tokens.json. */
export interface ResolvedTokenDocument {
  tokens: Record<string, { type: string; css: string }>;
}

/** Minimal shape of a world-theme package's token overrides. */
export interface WorldThemeLike {
  name: string;
  tokens: Record<string, { $type?: string; $value: string }>;
}

export type ExtJsInputsResult =
  | { ok: true; value: ExtJsThemeInput }
  | { ok: false; error: string };

/**
 * Fold a generated world-theme package over its base theme's resolved tokens.
 * World packages carry colors (and sometimes radii) only — everything else has
 * to come from the theme they extend.
 *
 * Errors are values: the CLI turns them into an exit code.
 */
export const extJsInputsFromWorldTheme = (
  world: WorldThemeLike,
  base: ResolvedTokenDocument,
  options: { prefix?: string } = {}
): ExtJsInputsResult => {
  const name = `${options.prefix ?? 'sv-'}${world.name}`;
  const check = checkProxmoxThemeName(name);
  if (!check.ok) return check;

  const palette: Record<string, string> = {};
  const scale: Record<string, string> = {};
  for (const [key, token] of Object.entries(base.tokens)) {
    if (token.type === 'color') palette[key] = token.css;
    else scale[key] = token.css;
  }
  for (const [key, token] of Object.entries(world.tokens)) {
    // $type is authoritative when present. When it is not, fall back to which
    // bucket the base theme already put the key in — an override that silently
    // landed in the wrong one would just never apply.
    const isColor = token.$type === 'color' || (token.$type === undefined && key in palette);
    if (isColor) palette[key] = token.$value;
    else scale[key] = token.$value;
  }

  return { ok: true, value: { name, palette, scale } };
};
