import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyWorldTheme, clearWorldTheme, switchWorldTheme } from './apply';
import { parseWorldTheme } from './parse';
import { BOOT_STYLE_ID, THEME_STORAGE } from './boot';
import type { WorldTheme } from './types';
import grimdark from './fixtures/grimdark.json';

const load = (json: unknown): WorldTheme => {
  const parsed = parseWorldTheme(json);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.error));
  return parsed.value;
};

const grim = load(grimdark);
const other = load({
  name: 'other-world',
  version: '1.0.0',
  extends: 'light',
  tokens: { accent: { $value: '#2b6a5e' } }
});

const styleEls = () => [...document.head.querySelectorAll('style[data-sv-theme]')];

afterEach(() => {
  clearWorldTheme();
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
});

describe('applyWorldTheme (element strategy in jsdom)', () => {
  it('injects a head <style>, sets data-theme to extends, and writes the cache', () => {
    const result = applyWorldTheme(grim);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const els = styleEls();
    expect(els).toHaveLength(1);
    expect(els[0]?.textContent).toContain('--sv-bg: #141210;');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    const cached = JSON.parse(window.localStorage.getItem(THEME_STORAGE.worldCss) ?? 'null');
    expect(cached).toMatchObject({ v: 1, name: 'grimdark-hive', extends: 'dark' });
    expect(cached.css.startsWith('/*sv-world*/@layer ')).toBe(true);
    result.value.remove();
  });

  it('re-applying at document scope replaces in place (same handle, one sheet)', () => {
    const first = applyWorldTheme(grim);
    const second = applyWorldTheme(other);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value).toBe(first.value);
    expect(styleEls()).toHaveLength(1);
    expect(styleEls()[0]?.textContent).toContain('--sv-accent: #2b6a5e;');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('remove() detaches, restores nothing it does not own, clears cache, and is idempotent', () => {
    const result = applyWorldTheme(grim);
    if (!result.ok) return;
    result.value.remove();
    result.value.remove();
    expect(styleEls()).toHaveLength(0);
    expect(window.localStorage.getItem(THEME_STORAGE.worldCss)).toBeNull();
  });

  it('update() swaps CSS without detaching and refreshes the cache', () => {
    const result = applyWorldTheme(grim);
    if (!result.ok) return;
    result.value.update(other);
    expect(styleEls()).toHaveLength(1);
    expect(styleEls()[0]?.textContent).toContain('--sv-accent: #2b6a5e;');
    expect(result.value.theme.manifest.name).toBe('other-world');
    const cached = JSON.parse(window.localStorage.getItem(THEME_STORAGE.worldCss) ?? 'null');
    expect(cached).toMatchObject({ name: 'other-world' });
  });

  it('reconciles away the boot-injected style on first document apply', () => {
    const boot = document.createElement('style');
    boot.id = BOOT_STYLE_ID;
    document.head.appendChild(boot);
    const result = applyWorldTheme(grim);
    expect(document.getElementById(BOOT_STYLE_ID)).toBeNull();
    if (result.ok) result.value.remove();
  });
});

describe('scoped application', () => {
  it('themes a subtree via data-sv-world without touching data-theme or the cache', () => {
    const pane = document.createElement('div');
    document.body.appendChild(pane);
    const result = applyWorldTheme(grim, { scope: pane });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const uid = pane.getAttribute('data-sv-world');
    expect(uid).toMatch(/^w\d+$/);
    expect(styleEls()[0]?.textContent).toContain(`[data-sv-world="${uid}"] {`);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE.worldCss)).toBeNull();
    result.value.remove();
    expect(pane.hasAttribute('data-sv-world')).toBe(false);
    pane.remove();
  });

  it('multiple scoped previews coexist with distinct uids', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);
    const ra = applyWorldTheme(grim, { scope: a });
    const rb = applyWorldTheme(other, { scope: b });
    expect(ra.ok && rb.ok).toBe(true);
    expect(a.getAttribute('data-sv-world')).not.toBe(b.getAttribute('data-sv-world'));
    expect(styleEls()).toHaveLength(2);
    if (ra.ok) ra.value.remove();
    if (rb.ok) rb.value.remove();
    a.remove();
    b.remove();
  });
});

describe('switchWorldTheme', () => {
  it('switches worlds through the singleton and clears with null', async () => {
    const first = await switchWorldTheme(grim);
    expect(first.ok).toBe(true);
    const second = await switchWorldTheme(other);
    expect(second.ok).toBe(true);
    expect(styleEls()).toHaveLength(1);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    const cleared = await switchWorldTheme(null);
    expect(cleared.ok).toBe(true);
    if (cleared.ok) expect(cleared.value).toBeNull();
    expect(styleEls()).toHaveLength(0);
    expect(window.localStorage.getItem(THEME_STORAGE.worldCss)).toBeNull();
  });

  it('uses startViewTransition when present and survives its absence', async () => {
    let transitioned = false;
    const docAny = document as unknown as Record<string, unknown>;
    docAny.startViewTransition = (cb: () => void) => {
      transitioned = true;
      cb();
      return { finished: Promise.resolve() };
    };
    const result = await switchWorldTheme(grim);
    expect(result.ok).toBe(true);
    expect(transitioned).toBe(true);
    delete docAny.startViewTransition;
    const withoutApi = await switchWorldTheme(other, { transition: false });
    expect(withoutApi.ok).toBe(true);
  });
});

describe('constructed strategy (stubbed)', () => {
  it('adopts and removes a constructable sheet', () => {
    const applied: string[] = [];
    class FakeSheet {
      css = '';
      replaceSync(css: string) {
        this.css = css;
        applied.push(css);
      }
    }
    const win = window as unknown as Record<string, unknown>;
    const originalCtor = win.CSSStyleSheet;
    win.CSSStyleSheet = FakeSheet;
    Object.defineProperty(document, 'adoptedStyleSheets', {
      configurable: true,
      writable: true,
      value: []
    });

    const result = applyWorldTheme(grim, { strategy: 'auto' });
    expect(result.ok).toBe(true);
    expect(applied[0]).toContain('--sv-bg: #141210;');
    expect((document.adoptedStyleSheets as unknown[]).length).toBe(1);
    expect(styleEls()).toHaveLength(0);
    if (result.ok) result.value.remove();
    expect((document.adoptedStyleSheets as unknown[]).length).toBe(0);

    win.CSSStyleSheet = originalCtor;
    delete (document as unknown as Record<string, unknown>).adoptedStyleSheets;
  });
});

describe('failure modes', () => {
  it('returns E_NO_DOM without a document (simulated server)', async () => {
    vi.stubGlobal('document', undefined);
    try {
      const applied = applyWorldTheme(grim);
      expect(applied.ok).toBe(false);
      if (!applied.ok) expect(applied.error.code).toBe('E_NO_DOM');
      const switched = await switchWorldTheme(grim);
      expect(switched.ok).toBe(false);
      if (!switched.ok) expect(switched.error.code).toBe('E_NO_DOM');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('returns E_BAD_SCOPE for a non-Element scope', () => {
    const result = applyWorldTheme(grim, { scope: 'nope' as unknown as Element });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('E_BAD_SCOPE');
  });
});
