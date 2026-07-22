// Drift guard: the committed generated outputs must equal what the emitters
// produce from the current DTCG sources — `pnpm run tokens` was run and its
// output committed, or this fails. Also the QSS structural contract.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { prepareBuild, TOKENS_DIR } from './emitters/prepare.mjs';
import { emitColorsCss, emitScaleCss } from './emitters/emit-css.mjs';
import { emitPaletteTs } from './emitters/emit-palette-ts.mjs';
import { emitResolvedJson } from './emitters/emit-json.mjs';
import { emitQss } from './emitters/emit-qss.mjs';
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
