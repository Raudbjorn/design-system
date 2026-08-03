// Drift guard: the committed generated outputs must equal what the emitters
// produce from the current DTCG sources — `pnpm run tokens` was run and its
// output committed, or this fails. Also the QSS structural contract.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOVER_MIX, PRESSED_MIX, prepareBuild, TOKENS_DIR } from './emitters/prepare.mjs';
import { emitColorsCss, emitScaleCss } from './emitters/emit-css.mjs';
import { emitPaletteTs } from './emitters/emit-palette-ts.mjs';
import { emitResolvedJson } from './emitters/emit-json.mjs';
import { emitQss } from './emitters/emit-qss.mjs';
import { emitExtJs } from './emitters/emit-extjs.mjs';
import {
  checkProxmoxThemeName,
  emitExtJsCss,
  extJsInputsFromWorldTheme,
  HOVER_MIX as EXTJS_HOVER_MIX,
  PRESSED_MIX as EXTJS_PRESSED_MIX
} from '../src/lib/extjs/emit.ts';
import { emitTuiRust } from './emitters/emit-tui-rust.mjs';

const prepared = prepareBuild();
if (!prepared.ok) throw new Error(prepared.error.join('\n'));
const { base, themes } = prepared.value;

const read = (...segments) => readFileSync(join(TOKENS_DIR, ...segments), 'utf8');

const TUI_COLOR_FIELDS = [
  'bg',
  'surface-1',
  'surface-2',
  'surface-3',
  'border',
  'text',
  'text-strong',
  'text-muted',
  'text-faint',
  'accent',
  'accent-2',
  'accent-rust',
  'mix-target',
  'success',
  'error',
  'warning',
  'syn-keyword',
  'syn-string',
  'syn-var',
  'syn-func',
  'syn-comment',
  'syn-number'
];

describe('committed outputs match the emitters (run `pnpm run tokens` after token edits)', () => {
  it('scale.css', () => {
    expect(read('scale.css')).toBe(emitScaleCss(base));
  });

  it('colors.css', () => {
    expect(read('colors.css')).toBe(emitColorsCss(themes));
  });

  it('palette.ts', () => {
    expect(read('palette.ts')).toBe(emitPaletteTs(themes));
  });

  for (const theme of themes) {
    it(`resolved/${theme.name}.tokens.json`, () => {
      expect(read('resolved', `${theme.name}.tokens.json`)).toBe(emitResolvedJson(theme));
    });
    it(`qss/${theme.name}.qss`, () => {
      expect(read('..', 'qss', `${theme.name}.qss`)).toBe(emitQss(theme));
    });
    it(`extjs/theme-sv-${theme.name}.css`, () => {
      expect(read('..', 'extjs', `theme-sv-${theme.name}.css`)).toBe(emitExtJs(theme));
    });
  }
    it(`crates/raudbjorn-tui/src/theme/generated.rs`, () => {
      expect(readFileSync(join(TOKENS_DIR, '../../../crates/raudbjorn-tui/src/theme/generated.rs'), 'utf8')).toBe(emitTuiRust(themes));
    });
});

describe('crates/raudbjorn-tui/src/theme/generated.rs validation', () => {
  const generatedPath = join(TOKENS_DIR, '../../../crates/raudbjorn-tui/src/theme/generated.rs');
  const content = readFileSync(generatedPath, 'utf8');

  it('contains no invalid syntax', () => {
    expect(content).toContain('use ratatui::style::Color;');
    expect(content).not.toMatch(/undefined|\{.*?\}|\$\{/);
    expect(content).not.toMatch(/var\(/);
    expect(content).not.toMatch(/NaN/);
  });

  for (const theme of themes) {
    const name = theme.name.toUpperCase();
    const regex = new RegExp(`pub const ${name}: TerminalPalette = TerminalPalette \\{([\\s\\S]*?)\\};`);
    const match = regex.exec(content);

    it(`${name} content is well-formed`, () => {
      expect(match).not.toBeNull();
      const fields = match[1].trim().split(',\n').filter(s => s.trim() !== '');
      expect(fields.length).toBe(TUI_COLOR_FIELDS.length);
    });

    for (const key of TUI_COLOR_FIELDS) {
      const rustField = key.replace(/-/g, '_');

      it(`${name} field ${key} appears once with a parseable RGB color`, () => {
        // Lookup happens inside the test so a missing key fails ONLY that
        // case instead of crashing the entire Vitest suite at discovery.
        const hex = theme.paletteHex[key];
        expect(typeof hex).toBe('string');
        expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const expected = `Color::Rgb(${r}, ${g}, ${b})`;
        const occurrences = match[1].match(new RegExp(`\\b${rustField}:`, 'g')) ?? [];
        expect(occurrences).toHaveLength(1);
        expect(match[1]).toContain(`${rustField}: ${expected}`);
      });
    }
  }
});

describe('emitter validation', () => {
  it('emits exactly one trailing newline', () => {
    const output = emitTuiRust(themes);
    expect(output).toMatch(/};\n$/);
    expect(output).not.toMatch(/\n\n$/);
  });

  it('rejects missing fields', () => {
    const badTheme = { ...themes[0], paletteHex: { ...themes[0].paletteHex } };
    delete badTheme.paletteHex['bg'];
    expect(() => emitTuiRust([badTheme])).toThrow(/missing field bg/);
  });

  it('rejects invalid hex strings', () => {
    const badTheme = { ...themes[0], paletteHex: { ...themes[0].paletteHex, bg: '#invalid' } };
    expect(() => emitTuiRust([badTheme])).toThrow(/invalid hex: #invalid/);
  });
});

describe('QSS contract', () => {
  const REQUIRED_SELECTORS = [
    'QPushButton',
    'QPushButton[class="primary"]',
    'QPushButton[class="danger"]',
    'QPushButton[class="ghost"]',
    'QLineEdit',
    'QComboBox QAbstractItemView',
    'QMenu',
    'QMenuBar',
    'QToolTip',
    'QScrollBar',
    'QTabBar::tab',
    'QCheckBox',
    'QRadioButton',
    'QGroupBox',
    'QStatusBar',
    'QToolBar',
    'QToolButton',
    'QProgressBar',
    'QSlider',
    'QTableView',
    'QHeaderView::section'
  ];
  const REQUIRED_STATES = [':hover', ':pressed', ':focus', ':disabled', ':checked'];

  for (const theme of themes) {
    const qss = emitQss(theme);

    it(`${theme.name}: no unresolved placeholders or undefineds`, () => {
      expect(qss).not.toContain('${');
      expect(qss).not.toContain('var(');
      expect(qss).not.toContain('undefined');
      expect(qss).not.toContain('NaN');
    });

    it(`${theme.name}: covers the mandated widgets and states`, () => {
      for (const selector of REQUIRED_SELECTORS) expect(qss).toContain(selector);
      for (const state of REQUIRED_STATES) expect(qss).toContain(state);
    });

    it(`${theme.name}: every color literal is a resolved or derived token`, () => {
      const allowed = new Set([
        ...Object.values(theme.paletteHex),
        ...theme.derived.map((d) => d.css),
        '#ffffff' // danger button text, hardcoded to mirror the web Button
      ]);
      for (const match of qss.matchAll(/#[0-9a-f]{6,8}\b/g)) {
        expect(allowed.has(match[0]), `unexpected color ${match[0]}`).toBe(true);
      }
    });
  }
});

describe('ExtJS contract', () => {
  const REQUIRED_SELECTORS = [
    '.x-body',
    '.x-panel-header',
    '.x-toolbar',
    '.x-btn-default-small',
    '.x-btn-over',
    '.x-btn-pressed',
    '.x-form-text',
    '.x-form-checkbox',
    '.x-boundlist-item',
    '.x-column-header',
    '.x-grid-item',
    '.x-grid-item-alt',
    '.x-grid-item-selected',
    '.x-treelist-item-text',
    '.x-tree-node-text',
    '.x-tab-active',
    '.x-window-default',
    '.x-menu-item-active',
    '.x-tip',
    '.x-progress-bar',
    '.x-splitter',
    '.x-mask',
    '.x-datepicker',
    '.x-legend-item',
    '::-webkit-scrollbar'
  ];
  // Read at runtime by RRDChart.js / GaugeWidget.js. Missing one means charts
  // silently keep the light palette on a dark theme.
  const REQUIRED_PWT_VARS = [
    '--pwt-panel-background',
    '--pwt-text-color',
    '--pwt-gauge-default',
    '--pwt-gauge-back',
    '--pwt-gauge-warn',
    '--pwt-gauge-crit',
    '--pwt-chart-primary',
    '--pwt-chart-grid-stroke'
  ];

  for (const theme of themes) {
    const css = emitExtJs(theme);

    it(`${theme.name}: no unresolved placeholders`, () => {
      expect(css).not.toContain('${');
      expect(css).not.toContain('undefined');
      expect(css).not.toContain('NaN');
      // A @layer wrapper would make the whole sheet lose to ExtJS's unlayered
      // rules — the sheet must stay unlayered. (Matches the at-rule, not the
      // word where the header comment explains this.)
      expect(css).not.toMatch(/^\s*@layer\b/m);
      // ExtJS measures widget geometry in JS; rem would tie it to the host
      // page's root font size.
      expect(css).not.toMatch(/\d(?:\.\d+)?rem\b/);
    });

    it(`${theme.name}: every var() reference is defined in the same file`, () => {
      const defined = new Set([...css.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]));
      for (const match of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        expect(defined.has(match[1]), `dangling variable ${match[1]}`).toBe(true);
      }
    });

    it(`${theme.name}: covers the mandated widgets and chart hooks`, () => {
      for (const selector of REQUIRED_SELECTORS) expect(css).toContain(selector);
      for (const name of REQUIRED_PWT_VARS) expect(css).toContain(`${name}: var(--sv-`);
    });

    it(`${theme.name}: interaction states match the QSS/web oklab math`, () => {
      for (const { key, css: value } of theme.derived) {
        expect(css).toContain(`--sv-${key}: ${value};`);
      }
    });

    it(`${theme.name}: parses as CSS with every rule intact`, () => {
      // A dropped rule is the failure mode a string-matching test cannot see:
      // one bad selector and the browser silently discards that block.
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      try {
        // Comments are stripped first: the header documents the cookie names
        // as P{VE,BS,MG}ThemeCookie, and those braces are not a rule.
        const blocks = (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\{/g) ?? []).length;
        expect(style.sheet.cssRules.length).toBe(blocks);
      } finally {
        style.remove();
      }
    });

    it(`${theme.name}: bundles the self-hosted fonts`, () => {
      expect(css.match(/@font-face/g)).toHaveLength(4);
      expect(css).toContain("url('sv-fonts/InterVariable.woff2')");
      expect(css).toContain("url('sv-fonts/Iosevka-Regular.woff2')");
    });

    it(`${theme.name}: file stem is a selectable Proxmox theme name`, () => {
      expect(checkProxmoxThemeName(`sv-${theme.name}`).ok).toBe(true);
    });
  }

  it('inverts crisp icon sprites on dark themes only', () => {
    const byName = Object.fromEntries(themes.map((t) => [t.name, emitExtJs(t)]));
    expect(byName.dark).toMatch(/--sv-icon-filter: invert\(1\)/);
    expect(byName.light).toContain('--sv-icon-filter: none;');
  });

  it('rejects a missing token instead of emitting a broken sheet', () => {
    const palette = { ...themes[0].paletteHex };
    delete palette['surface-3'];
    const scale = Object.fromEntries(themes[0].scaleFull.map((r) => [r.key, r.css]));
    expect(() => emitExtJsCss({ name: 'sv-broken', palette, scale })).toThrow(
      /missing color token "surface-3"/
    );
    expect(() => emitExtJsCss({ name: 'sv-broken', palette: themes[0].paletteHex, scale: {} })).toThrow(
      /missing scale token/
    );
  });

  it('keeps its mix weights in lockstep with prepare.mjs', () => {
    // The published emitter cannot import from scripts/, so the two constants
    // are duplicated. This is the guard that they never diverge.
    expect(EXTJS_HOVER_MIX).toBe(HOVER_MIX);
    expect(EXTJS_PRESSED_MIX).toBe(PRESSED_MIX);
  });

  it('folds a world theme over the base it extends', () => {
    const base = JSON.parse(read('resolved', 'dark.tokens.json'));
    const world = {
      name: 'mistwood',
      tokens: {
        accent: { $type: 'color', $value: '#c9a227' },
        'radius-lg': { $type: 'dimension', $value: '2px' }
      }
    };
    const inputs = extJsInputsFromWorldTheme(world, base);
    expect(inputs.ok).toBe(true);
    expect(inputs.value.name).toBe('sv-mistwood');
    expect(inputs.value.palette.accent).toBe('#c9a227');
    // untouched roles fall through from the base theme
    expect(inputs.value.palette.bg).toBe(base.tokens.bg.css);
    expect(inputs.value.scale['radius-lg']).toBe('2px');

    const css = emitExtJsCss(inputs.value);
    expect(css).toContain('--sv-accent: #c9a227;');
    expect(css).toContain('--sv-radius-lg: 2px;');
    // derived states are recomputed from the overridden accent, not inherited
    expect(css).not.toContain(`--sv-accent-hover: ${base.derived['accent-hover']};`);
  });

  it('refuses to fold a world theme into an unselectable name', () => {
    const base = JSON.parse(read('resolved', 'dark.tokens.json'));
    const result = extJsInputsFromWorldTheme({ name: 'world2', tokens: {} }, base);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not a selectable Proxmox theme name/);
  });

  it('refuses hostile token values instead of interpolating them', () => {
    // World themes are untrusted input everywhere else in this repo, and a
    // sheet emitted from one lands in a Proxmox admin UI — injected CSS there
    // can overlay a confirmation dialog, not just restyle it.
    const scale = Object.fromEntries(themes[0].scaleFull.map((r) => [r.key, r.css]));
    const emit = (palette, name = 'sv-evil') => () => emitExtJsCss({ name, palette, scale });

    // A non-derived colour: never parsed by mixOklab or luminance, so nothing
    // else in the pipeline would have caught it.
    expect(
      emit({ ...themes[0].paletteHex, warning: '#ff0000; } .x-window { display: none' })
    ).toThrow(/must be a hex color/);
    expect(emit({ ...themes[0].paletteHex, border: 'red' })).toThrow(/must be a hex color/);
    expect(
      emit({ ...themes[0].paletteHex, 'evil}key': '#ffffff' })
    ).toThrow(/unsafe token name/);
    expect(() =>
      emitExtJsCss({
        name: 'sv-ok',
        palette: themes[0].paletteHex,
        scale: { ...scale, 'radius-md': '4px } .x-btn { visibility: hidden' }
      })
    ).toThrow(/contains CSS structure/);
    // The name reaches the header comment; */ would end it early.
    expect(emit(themes[0].paletteHex, 'x */ body{display:none} /*')).toThrow(
      /not a selectable Proxmox theme name/
    );
  });

  it('keeps legitimate composite scale values that merely look structural', () => {
    // Shadows carry `rgb(0 0 0 / 0.3)` and font stacks carry quotes and commas;
    // a stricter value check would reject the real tokens.
    const css = emitExtJs(themes[0]);
    expect(css).toMatch(/--sv-shadow-md: [^;]*rgb\([^;]*\);/);
    expect(css).toContain("--sv-font-sans: 'Inter'");
  });

  it('rejects a --pwt-* alias pointing at a token the palette lacks', () => {
    // A dangling chart variable means canvas silently keeps the light palette.
    const palette = { ...themes[0].paletteHex };
    delete palette.warning; // only --pwt-gauge-warn references this
    const scale = Object.fromEntries(themes[0].scaleFull.map((r) => [r.key, r.css]));
    expect(() => emitExtJsCss({ name: 'sv-x', palette, scale })).toThrow(
      /missing color token "warning"/
    );
  });

  it('refuses to emit a built-in theme Proxmox could not select', () => {
    expect(() => emitExtJs({ ...themes[0], name: 'high-contrast-2' })).toThrow(
      /cannot ship to Proxmox/
    );
  });

  it('rejects theme names Proxmox cannot select', () => {
    // PVE/PMG validate ^[a-z]{1,10}(-[a-z]{1,10}){0,5}$ server-side: a name with
    // a digit installs fine and then can never be chosen.
    expect(checkProxmoxThemeName('sv-mistwood').ok).toBe(true);
    expect(checkProxmoxThemeName('sv-world2').ok).toBe(false);
    expect(checkProxmoxThemeName('SvDark').ok).toBe(false);
    expect(checkProxmoxThemeName('sv_dark').ok).toBe(false);
    expect(checkProxmoxThemeName('sv-abcdefghijk').ok).toBe(false);
  });
});

describe('emitters generalize to N themes', () => {
  it('a synthetic third theme flows through emitColorsCss with scale overrides', () => {
    const grim = {
      name: 'grimdark',
      isDefault: false,
      prefersColorScheme: undefined,
      colors: [
        { key: 'bg', type: 'color', css: '#141210', qt: '#141210' },
        { key: 'accent', type: 'color', css: '#c9a227', qt: '#c9a227' }
      ],
      scaleFull: [],
      scaleDiff: [{ key: 'radius-lg', type: 'dimension', css: '6px', qt: '6px' }],
      paletteHex: { bg: '#141210', accent: '#c9a227' },
      derived: []
    };
    const css = emitColorsCss([...themes, grim]);
    expect(css).toContain('[data-theme="grimdark"]');
    const block = css.slice(css.indexOf('[data-theme="grimdark"]'));
    expect(block).toContain('--sv-accent: #c9a227;');
    expect(block).toContain('--sv-radius-lg: 6px;');
    // existing themes emit no scale overrides (identical to base)
    expect(themes.every((t) => t.scaleDiff.length === 0)).toBe(true);
  });
});
