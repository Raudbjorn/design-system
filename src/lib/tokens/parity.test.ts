import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mergeDocuments, parseTokenDocument, resolveTokens, toCss } from './resolver';
import type { TokenDocument } from './resolver';

// The migration bridge: these goldens are the hand-authored values from
// palette.ts/scale.css as they stood before the DTCG migration, inlined so
// nothing can drift silently. The test asserts (a) the DTCG sources resolve
// to exactly these values and (b) the committed CSS carries exactly these
// values per selector context — and it is written to pass against both the
// legacy emitter's output and the layered rewrite (it parses declarations,
// tolerating the @layer wrapper and the :not([data-theme]) generalization).

const GOLDEN_DARK: Record<string, string> = {
  bg: '#191919',
  'surface-1': '#1e1e1e',
  'surface-2': '#252526',
  'surface-3': '#2d2d2d',
  border: '#3c3c3c',
  text: '#d4d4d4',
  'text-strong': '#f5f5f5',
  'text-muted': '#9a9a9a',
  'text-faint': '#818181',
  accent: '#4ec9b0',
  'accent-2': '#e06c75',
  'accent-rust': '#ce9178',
  'mix-target': '#ffffff',
  success: '#0c9138',
  error: '#f44430',
  warning: '#ffa500',
  'syn-keyword': '#569cd6',
  'syn-string': '#ce9178',
  'syn-var': '#9cdcfe',
  'syn-func': '#dcdcaa',
  'syn-comment': '#74a55e',
  'syn-number': '#b5cea8'
};

const GOLDEN_LIGHT: Record<string, string> = {
  bg: '#f1e7c4',
  'surface-1': '#ece1b8',
  'surface-2': '#e6dcb2',
  'surface-3': '#e0d5a8',
  border: '#c7ba85',
  text: '#3a3527',
  'text-strong': '#2a2617',
  'text-muted': '#605b47',
  'text-faint': '#65604b',
  accent: '#2b8a77',
  'accent-2': '#c0505a',
  'accent-rust': '#b26a45',
  'mix-target': '#000000',
  success: '#0c9138',
  error: '#d13b2a',
  warning: '#b26a00',
  'syn-keyword': '#274a86',
  'syn-string': '#8a4326',
  'syn-var': '#2f3f6e',
  'syn-func': '#6a531f',
  'syn-comment': '#525f36',
  'syn-number': '#2f5f45'
};

const GOLDEN_SCALE: Record<string, string> = {
  'font-sans': "'Inter', system-ui, sans-serif",
  'font-mono': "'Iosevka', ui-monospace, 'Courier New', monospace",
  'font-weight-normal': '400',
  'font-weight-medium': '550',
  'font-weight-semibold': '600',
  'font-weight-bold': '650',
  'space-0': '0',
  'space-1': '0.25rem',
  'space-2': '0.5rem',
  'space-3': '0.75rem',
  'space-4': '1rem',
  'space-6': '1.5rem',
  'space-8': '2rem',
  'space-12': '3rem',
  'radius-sm': '4px',
  'radius-md': '6px',
  'radius-lg': '10px',
  'fs-xs': '0.75rem',
  'fs-sm': '0.875rem',
  'fs-base': '1rem',
  'fs-lg': '1.2rem',
  'fs-xl': '1.44rem',
  'fs-2xl': '1.728rem',
  'fs-3xl': '2.074rem',
  'lh-tight': '1.2',
  'lh-normal': '1.5',
  'lh-relaxed': '1.7',
  'z-base': '0',
  'z-elevated': '10',
  'z-sticky': '100',
  'z-dropdown': '1000',
  'z-overlay': '2000',
  'bp-sm': '640px',
  'bp-md': '768px',
  'bp-lg': '1024px',
  'shadow-sm': '0 1px 2px rgb(0 0 0 / 0.3)',
  'shadow-md': '0 4px 12px rgb(0 0 0 / 0.35)'
};

// vitest runs with cwd at the repo root; import.meta.url is a vite virtual
// path here, so resolve against cwd instead.
const read = (name: string): string =>
  readFileSync(join(process.cwd(), 'src/lib/tokens', name), 'utf8');

const loadDoc = (name: string): TokenDocument => {
  const parsed = parseTokenDocument(JSON.parse(read(name)), name);
  if (!parsed.ok) throw new Error(`${name}: ${JSON.stringify(parsed.error, null, 2)}`);
  return parsed.value;
};

/** token key → css value for a resolved theme, one prefix ('color'|'scale'). */
const resolvedGroup = (files: string[], prefix: string): Record<string, string> => {
  const merged = mergeDocuments(files.map(loadDoc));
  const resolved = resolveTokens(merged);
  if (!resolved.ok) throw new Error(JSON.stringify(resolved.error, null, 2));
  const out: Record<string, string> = {};
  for (const token of resolved.value.values()) {
    const [group, ...rest] = token.path.split('.');
    if (group === prefix && rest.length === 1 && rest[0] !== undefined) {
      out[rest[0]] = toCss(token.value);
    }
  }
  return out;
};

/**
 * Minimal CSS scanner: collects `--sv-*` declarations keyed by their
 * innermost enclosing selector, layout- and @layer-insensitive.
 */
const cssVarsBySelector = (css: string): Map<string, Record<string, string>> => {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Map<string, Record<string, string>>();
  const stack: string[] = [];
  let buf = '';
  for (const ch of clean) {
    if (ch === '{') {
      stack.push(buf.trim().replace(/\s+/g, ' '));
      buf = '';
    } else if (ch === '}') {
      const selector = stack.pop() ?? '';
      const decls = out.get(selector) ?? {};
      for (const m of buf.matchAll(/--sv-([a-z0-9-]+):\s*([^;]+);/g)) {
        if (m[1] !== undefined && m[2] !== undefined) decls[m[1]] = m[2].trim();
      }
      if (Object.keys(decls).length > 0) out.set(selector, decls);
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
};

/** Accepts the legacy and the generalized auto-light selector. */
const lightAutoSelector = (vars: Map<string, Record<string, string>>): Record<string, string> => {
  const modern = vars.get(':root:not([data-theme])');
  const legacy = vars.get(':root:not([data-theme="dark"])');
  const found = modern ?? legacy;
  expect(found, 'auto-light media block present').toBeDefined();
  return found ?? {};
};

describe('DTCG sources resolve to the hand-authored golden values', () => {
  it('dark theme colors match', () => {
    expect(
      resolvedGroup(['primitives.tokens.json', 'scale.tokens.json', 'dark.tokens.json'], 'color')
    ).toEqual(GOLDEN_DARK);
  });

  it('light theme colors match', () => {
    expect(
      resolvedGroup(['primitives.tokens.json', 'scale.tokens.json', 'light.tokens.json'], 'color')
    ).toEqual(GOLDEN_LIGHT);
  });

  it('scale tokens match', () => {
    expect(
      resolvedGroup(['primitives.tokens.json', 'scale.tokens.json', 'dark.tokens.json'], 'scale')
    ).toEqual(GOLDEN_SCALE);
  });

  it('all registry themes define an identical color key set', () => {
    const dark = resolvedGroup(
      ['primitives.tokens.json', 'scale.tokens.json', 'dark.tokens.json'],
      'color'
    );
    const light = resolvedGroup(
      ['primitives.tokens.json', 'scale.tokens.json', 'light.tokens.json'],
      'color'
    );
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });
});

describe('committed CSS carries exactly the golden values', () => {
  const colorVars = cssVarsBySelector(read('colors.css'));

  it(':root (default) is the dark theme', () => {
    expect(colorVars.get(':root')).toEqual(GOLDEN_DARK);
  });

  it('auto-light media block is the light theme', () => {
    expect(lightAutoSelector(colorVars)).toEqual(GOLDEN_LIGHT);
  });

  it('explicit [data-theme] blocks match', () => {
    expect(colorVars.get('[data-theme="light"]')).toEqual(GOLDEN_LIGHT);
    expect(colorVars.get('[data-theme="dark"]')).toEqual(GOLDEN_DARK);
  });

  it('scale.css :root carries the golden scale', () => {
    const scaleVars = cssVarsBySelector(read('scale.css'));
    expect(scaleVars.get(':root')).toEqual(GOLDEN_SCALE);
  });
});
