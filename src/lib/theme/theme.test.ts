import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, defineTheme, swapTheme, themeCss } from './theme';
import type { ThemeIssue } from './theme';
import { dark } from '../tokens/palette';
import type { Palette } from '../tokens/palette';

function findInjectedCss(): { styleText: string; sheetText: string } {
  const styleText = Array.from(document.head.querySelectorAll('style[data-sv-theme]'))
    .map((el) => el.textContent ?? '')
    .join('\n');
  const sheetText =
    'adoptedStyleSheets' in document
      ? document.adoptedStyleSheets
          .map((sheet) => Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n'))
          .join('\n')
      : '';
  return { styleText, sheetText };
}

function themeCssInjected(decl: string): boolean {
  const { styleText, sheetText } = findInjectedCss();
  return styleText.includes(decl) || sheetText.includes(decl);
}

describe('defineTheme', () => {
  it('accepts a valid hex override of a known token, lowercasing it and merging over the dark base by default', () => {
    const result = defineTheme({ border: '#ABCDEF' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.overrides).toEqual({ border: '#abcdef' });
    expect(result.theme.palette).toEqual({ ...dark, border: '#abcdef' });
  });

  it('an override set that keeps every gate passing succeeds', () => {
    const result = defineTheme({});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.overrides).toEqual({});
    expect(result.theme.palette).toEqual(dark);
  });

  it('reports an unknown token name', () => {
    const result = defineTheme({ 'not-a-real-token': '#ffffff' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual([{ kind: 'unknown-token', token: 'not-a-real-token' }]);
  });

  it.each([['url(x)'], ['red;} :root{--x:1'], ['#fff'], ['#12345g']])(
    'rejects %j as an invalid color for a known token',
    (value) => {
      const result = defineTheme({ border: value });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.issues).toEqual([{ kind: 'invalid-color', token: 'border', value }]);
    }
  );

  it('collects every issue instead of failing fast on the first one', () => {
    const result = defineTheme({
      'not-a-real-token': '#ffffff',
      border: 'not-a-color',
      text: '#222222'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.issues).toHaveLength(3);
    expect(result.issues).toContainEqual({ kind: 'unknown-token', token: 'not-a-real-token' });
    expect(result.issues).toContainEqual({
      kind: 'invalid-color',
      token: 'border',
      value: 'not-a-color'
    });

    const contrastIssue = result.issues.find((i) => i.kind === 'contrast');
    expect(contrastIssue).toMatchObject({ kind: 'contrast', fg: 'text', bg: 'bg', min: 4.5 });
    expect((contrastIssue as Extract<ThemeIssue, { kind: 'contrast' }>).ratio).toBeLessThan(4.5);
  });

  it('rejects an override that makes text illegible against the base background', () => {
    const result = defineTheme({ text: '#222222' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toHaveLength(1);
    const [issue] = result.issues;
    expect(issue).toMatchObject({ kind: 'contrast', fg: 'text', bg: 'bg', min: 4.5 });
    expect((issue as Extract<ThemeIssue, { kind: 'contrast' }>).ratio).toBeLessThan(4.5);
  });

  it('a text override that matches the default dark ink passes against the dark base', () => {
    const result = defineTheme({ text: '#d4d4d4' }, { base: 'dark' });
    expect(result.ok).toBe(true);
  });

  it('the same override fails contrast against the light base\'s pale paper background', () => {
    const result = defineTheme({ text: '#d4d4d4' }, { base: 'light' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const issue = result.issues.find((i) => i.kind === 'contrast' && i.fg === 'text');
    expect(issue).toBeDefined();
    expect((issue as Extract<ThemeIssue, { kind: 'contrast' }>).ratio).toBeLessThan(4.5);
  });

  it('accepts a full custom Palette object as the base and gates against it', () => {
    const customBase: Palette = { ...dark, 'accent-rust': '#123456' };
    const result = defineTheme({ border: '#334455' }, { base: customBase });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.palette).toEqual({ ...customBase, border: '#334455' });
    expect(result.theme.palette['accent-rust']).toBe('#123456');
  });

  it('layers merge in array order, a later layer overriding an earlier one for the same token', () => {
    const result = defineTheme([{ accent: '#4ec9b0' }, { accent: '#e06c75' }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.overrides.accent).toBe('#e06c75');
  });

  it('collects issues from every layer, not just the first that fails', () => {
    const result = defineTheme([{ banner: '#fff000' }, { accent: 'red' }]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toHaveLength(2);
    expect(result.issues).toContainEqual({ kind: 'unknown-token', token: 'banner' });
    expect(result.issues).toContainEqual({ kind: 'invalid-color', token: 'accent', value: 'red' });
  });

  it('an empty array of layers is a valid theme equal to the unmodified dark base', () => {
    const result = defineTheme([]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.overrides).toEqual({});
    expect(result.theme.palette).toEqual(dark);
  });
});

// A user-selected activity mode (combat/exploration/social) is just a sparse
// override layer composed ON TOP of the world layer via the array form —
// `defineTheme([...world, activityLayer])`. These lock the composition
// properties the ActivityModes story relies on.
describe('activity-mode layer composition', () => {
  const world = { accent: '#c9a227', 'surface-1': '#1a1714' };
  const combat = { accent: '#e06c75' };
  const social = { accent: '#4ec9b0' };

  it('an activity layer overrides only its own keys, leaving the rest of the world intact', () => {
    const withActivity = defineTheme([world, combat]);
    expect(withActivity.ok).toBe(true);
    if (!withActivity.ok) return;
    // combat only touched accent…
    expect(withActivity.theme.palette.accent).toBe('#e06c75');
    // …world's other override and every base token are untouched.
    expect(withActivity.theme.palette['surface-1']).toBe('#1a1714');
    expect(withActivity.theme.palette.bg).toBe(dark.bg);
    expect(withActivity.theme.overrides).toEqual({ accent: '#e06c75', 'surface-1': '#1a1714' });
  });

  it('dropping the activity layer restores the world palette exactly (reversible "Default")', () => {
    const withActivity = defineTheme([world, combat]);
    const worldOnly = defineTheme([world]);
    expect(withActivity.ok && worldOnly.ok).toBe(true);
    if (!withActivity.ok || !worldOnly.ok) return;
    // The only difference between mode-on and mode-off is combat's keys.
    expect(worldOnly.theme.palette).toEqual({ ...dark, ...world });
    expect(worldOnly.theme.palette).toEqual({ ...withActivity.theme.palette, accent: world.accent });
  });

  it('a later activity layer wins over an earlier one for a shared token', () => {
    const result = defineTheme([world, combat, social]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.palette.accent).toBe('#4ec9b0'); // social, applied last
  });

  it('the contrast gate governs mode selection — an illegible activity mode is not a theme', () => {
    // A mode that drives text to near-invisibility on the dark bg is rejected;
    // the UI can never enter an unreadable mode.
    const result = defineTheme([world, { text: '#333333' }]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual(
      expect.objectContaining({ kind: 'contrast', fg: 'text', bg: 'bg' })
    );
  });
});

describe('themeCss', () => {
  it('renders only the sorted overrides, one declaration per line, wrapped in the default :root selector', () => {
    const result = defineTheme({ warning: '#abcdef', border: '#123456' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const css = themeCss(result.theme);
    expect(css).toBe(':root {\n  --sv-border: #123456;\n  --sv-warning: #abcdef;\n}\n');
    expect(css).not.toContain('--sv-bg');
    expect(css).not.toContain('--sv-text');
  });

  it('respects a custom selector', () => {
    const result = defineTheme({ border: '#123456' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const css = themeCss(result.theme, '[data-theme="custom"]');
    expect(css).toBe('[data-theme="custom"] {\n  --sv-border: #123456;\n}\n');
  });
});

describe('applyTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.querySelectorAll('style[data-sv-theme]').forEach((el) => el.remove());
  });

  it('injects the theme CSS reachable via adoptedStyleSheets or a style element, and the disposer removes it', () => {
    const result = defineTheme({ accent: '#00ff00' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const hasAdopted = 'adoptedStyleSheets' in document;
    const baselineSheetCount = hasAdopted ? document.adoptedStyleSheets.length : 0;

    const dispose = applyTheme(result.theme);

    const styleEl = document.head.querySelector('style[data-sv-theme]');
    const newSheets = hasAdopted ? document.adoptedStyleSheets.slice(baselineSheetCount) : [];
    const sheetText = newSheets
      .map((sheet) => Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n'))
      .join('\n');

    const reachable = styleEl !== null || sheetText.includes('--sv-accent: #00ff00');
    expect(reachable).toBe(true);
    if (styleEl) {
      expect(styleEl.textContent).toBe(themeCss(result.theme));
    }

    dispose();

    expect(document.head.querySelector('style[data-sv-theme]')).toBeNull();
    if (hasAdopted) {
      expect(document.adoptedStyleSheets.length).toBe(baselineSheetCount);
    }
  });

  it('throws without a DOM document', () => {
    const result = defineTheme({ accent: '#00ff00' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    vi.stubGlobal('document', undefined);
    expect(() => applyTheme(result.theme)).toThrow();
  });
});

describe('swapTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, 'startViewTransition');
    document.head.querySelectorAll('style[data-sv-theme]').forEach((el) => el.remove());
  });

  it('falls back to an instant swap when the View Transitions API is unavailable, disposing the old theme and returning a disposer for the new one', async () => {
    const themeA = defineTheme({ accent: '#ff0000' });
    const themeB = defineTheme({ accent: '#00ccff' });
    expect(themeA.ok).toBe(true);
    expect(themeB.ok).toBe(true);
    if (!themeA.ok || !themeB.ok) return;

    const disposeA = applyTheme(themeA.theme);
    expect(themeCssInjected('--sv-accent: #ff0000')).toBe(true);

    const disposeB = await swapTheme(themeB.theme, { dispose: disposeA });

    expect(themeCssInjected('--sv-accent: #ff0000')).toBe(false);
    expect(themeCssInjected('--sv-accent: #00ccff')).toBe(true);

    disposeB();
    expect(themeCssInjected('--sv-accent: #00ccff')).toBe(false);
  });

  it('routes the swap through document.startViewTransition when available, calling it exactly once', async () => {
    const themeA = defineTheme({ accent: '#ff0000' });
    const themeB = defineTheme({ accent: '#00ccff' });
    expect(themeA.ok).toBe(true);
    expect(themeB.ok).toBe(true);
    if (!themeA.ok || !themeB.ok) return;

    const disposeA = applyTheme(themeA.theme);
    const startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { updateCallbackDone: Promise.resolve() };
    });
    // jsdom has no View Transitions; install the stub as a runtime property
    // (Reflect keeps the mutation outside lib.dom's required-method typing).
    Reflect.set(document, 'startViewTransition', startViewTransition);

    const disposeB = await swapTheme(themeB.theme, { dispose: disposeA });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(themeCssInjected('--sv-accent: #ff0000')).toBe(false);
    expect(themeCssInjected('--sv-accent: #00ccff')).toBe(true);

    disposeB();
  });

  it('throws without a DOM document', async () => {
    const themeA = defineTheme({ accent: '#ff0000' });
    expect(themeA.ok).toBe(true);
    if (!themeA.ok) return;

    vi.stubGlobal('document', undefined);
    await expect(swapTheme(themeA.theme)).rejects.toThrow();
  });
});

describe('zero-trust input hardening', () => {
  it('rejects null/non-object overrides and layers as issues, never throwing', () => {
    const nullResult = defineTheme(null as never);
    expect(nullResult.ok).toBe(false);
    if (!nullResult.ok) {
      expect(nullResult.issues).toEqual([{ kind: 'invalid-layer', index: 0 }]);
    }

    // One junk layer poisons the result but not the parse of its siblings.
    const mixed = defineTheme([{ accent: '#ff0000' }, 'junk' as never, 42 as never]);
    expect(mixed.ok).toBe(false);
    if (!mixed.ok) {
      expect(mixed.issues).toEqual([
        { kind: 'invalid-layer', index: 1 },
        { kind: 'invalid-layer', index: 2 }
      ]);
    }
  });

  it('rejects non-string token values as invalid-color instead of crashing on toLowerCase', () => {
    const result = defineTheme({ accent: 42 as never, bg: { toString: () => '#111111' } as never });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual({ kind: 'invalid-color', token: 'accent', value: '42' });
      expect(result.issues.some((i) => i.kind === 'invalid-color' && i.token === 'bg')).toBe(true);
    }
  });

  it('rejects a sparse custom base with missing-token issues instead of gating blind', () => {
    const result = defineTheme({ accent: '#4ec9b0' }, { base: { bg: '#101010', text: '#e0e0e0' } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const missing = result.issues.filter((i) => i.kind === 'missing-token');
      expect(missing.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.kind === 'missing-token' && i.token === 'accent')).toBe(true);
    }
  });

  it('applyTheme and swapTheme name the misuse when handed a non-Theme', async () => {
    expect(() => applyTheme(undefined as never)).toThrow(/check result.ok/);
    await expect(swapTheme(null as never)).rejects.toThrow(/check result.ok/);
  });

  it('applyTheme falls back to documentElement when doc.head is null', () => {
    const bare = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
    const result = defineTheme({ accent: '#ff0000' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const dispose = applyTheme(result.theme, { target: bare as unknown as Document });
    expect(bare.documentElement.querySelector('style[data-sv-theme]')).not.toBeNull();
    dispose();
    expect(bare.documentElement.querySelector('style[data-sv-theme]')).toBeNull();
  });
});
