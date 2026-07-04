// The DOM edge of the theme engine: inject/replace/remove world-theme
// stylesheets. Everything above this module is pure; everything DOM-shaped
// lives here.
//
// Injection strategies:
//  - 'constructed' (default where supported): a constructable CSSStyleSheet
//    in document.adoptedStyleSheets — no DOM mutation, CSP-friendly (CSSOM
//    writes bypass style-src).
//  - 'element': a <style data-sv-theme> in <head> — the jsdom-testable path
//    and the fallback for older engines.
//
// Document-scope applies also set data-theme to the theme's `extends` so the
// CSS cascade falls through to the same built-in palette the contrast gate
// validated against — gating against dark but cascading over light would be
// unsound.

import { worldThemeToCss } from './css.ts';
import { BOOT_STYLE_ID, THEME_STORAGE } from './boot.ts';
import type { Result, ThemeIssue, WorldTheme } from './types.ts';

export interface ApplyWorldThemeOptions {
  /** Theme a subtree (preview pane) instead of the document. */
  scope?: Element;
  layer?: 'world' | 'user';
  strategy?: 'auto' | 'constructed' | 'element';
  /** Write the boot cache (default: true at document scope, never scoped). */
  cache?: boolean;
  /** Injection point for tests / multi-document setups. */
  document?: Document;
}

export interface WorldThemeHandle {
  readonly id: string;
  readonly theme: WorldTheme;
  /** Swap CSS in place (no detach, no flash) — the live-preview path. */
  update(next: WorldTheme): void;
  /** Detach the sheet, clear owned cache/attributes. Idempotent. */
  remove(): void;
}

interface StyleTarget {
  setCss(css: string): void;
  remove(): void;
}

const supportsConstructed = (doc: Document): boolean => {
  const win = doc.defaultView;
  return (
    !!win &&
    typeof win.CSSStyleSheet === 'function' &&
    'replaceSync' in win.CSSStyleSheet.prototype &&
    Array.isArray(doc.adoptedStyleSheets)
  );
};

const makeConstructedTarget = (doc: Document): StyleTarget => {
  const win = doc.defaultView;
  if (!win) throw new Error('unreachable: supportsConstructed checked defaultView');
  const sheet = new win.CSSStyleSheet();
  let adopted = false;
  return {
    setCss(css) {
      sheet.replaceSync(css);
      if (!adopted) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
        adopted = true;
      }
    },
    remove() {
      if (!adopted) return;
      doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== sheet);
      adopted = false;
    }
  };
};

const makeElementTarget = (doc: Document, id: string): StyleTarget => {
  let el: HTMLStyleElement | null = null;
  return {
    setCss(css) {
      if (!el || !el.isConnected) {
        // Replace any same-id element from a previous session/apply.
        doc.head.querySelector(`style[data-sv-theme="${id}"]`)?.remove();
        el = doc.createElement('style');
        el.setAttribute('data-sv-theme', id);
        doc.head.appendChild(el);
      }
      el.textContent = css;
    },
    remove() {
      el?.remove();
      el = null;
    }
  };
};

const storageOf = (doc: Document): Storage | null => {
  try {
    return doc.defaultView?.localStorage ?? globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

// One handle registry per document; singletons per layer for document scope.
const registries = new WeakMap<Document, Map<string, InternalHandle>>();

interface InternalHandle extends WorldThemeHandle {
  theme: WorldTheme;
}

let scopeUid = 0;

const err = (code: 'E_NO_DOM' | 'E_BAD_SCOPE', message: string): { ok: false; error: ThemeIssue } => ({
  ok: false,
  error: { severity: 'error', code, message }
});

export const applyWorldTheme = (
  theme: WorldTheme,
  opts: ApplyWorldThemeOptions = {}
): Result<WorldThemeHandle, ThemeIssue> => {
  const doc = opts.document ?? globalThis.document;
  if (!doc) return err('E_NO_DOM', 'no document — applyWorldTheme needs a DOM (see worldThemeToCss for SSR)');
  if (opts.scope !== undefined && !(opts.scope instanceof (doc.defaultView?.Element ?? Element))) {
    return err('E_BAD_SCOPE', 'scope must be an Element of the target document');
  }

  const layer = opts.layer ?? 'world';
  const scoped = opts.scope !== undefined;
  const writeCache = opts.cache ?? !scoped;
  const registry = registries.get(doc) ?? new Map<string, InternalHandle>();
  registries.set(doc, registry);

  let selector: string;
  let id: string;
  if (scoped) {
    id = `${layer}:scope:${++scopeUid}`;
    selector = `[data-sv-world="w${scopeUid}"]`;
    opts.scope!.setAttribute('data-sv-world', `w${scopeUid}`);
  } else {
    id = `${layer}:document`;
    selector = ':root';
  }

  // Same-id re-apply replaces content instead of stacking sheets.
  const existing = registry.get(id);
  if (existing) {
    existing.update(theme);
    return { ok: true, value: existing };
  }

  const strategy = opts.strategy ?? 'auto';
  const useConstructed =
    strategy === 'constructed' || (strategy === 'auto' && supportsConstructed(doc));
  const target = useConstructed ? makeConstructedTarget(doc) : makeElementTarget(doc, id);

  const scopeEl = opts.scope;
  const uidAttr = scoped ? selector.slice('[data-sv-world="'.length, -2) : null;
  let removed = false;
  let wroteCache = false;
  let currentTheme = theme;

  const render = (t: WorldTheme): void => {
    const css = worldThemeToCss(t, { selector, layer });
    target.setCss(css);
    if (!scoped) {
      doc.documentElement.setAttribute('data-theme', t.manifest.extends);
      doc.getElementById(BOOT_STYLE_ID)?.remove();
      if (writeCache) {
        try {
          storageOf(doc)?.setItem(
            THEME_STORAGE.worldCss,
            JSON.stringify({ v: 1, name: t.manifest.name, extends: t.manifest.extends, css })
          );
          wroteCache = true;
        } catch {
          /* cache is an optimization, never a failure */
        }
      }
    }
  };

  const handle: InternalHandle = {
    id,
    get theme() {
      return currentTheme;
    },
    update(next: WorldTheme) {
      if (removed) return;
      currentTheme = next;
      render(next);
    },
    remove() {
      if (removed) return;
      removed = true;
      target.remove();
      if (scopeEl && uidAttr !== null && scopeEl.getAttribute('data-sv-world') === uidAttr) {
        scopeEl.removeAttribute('data-sv-world');
      }
      if (wroteCache) {
        try {
          storageOf(doc)?.removeItem(THEME_STORAGE.worldCss);
        } catch {
          /* ignore */
        }
      }
      registry.delete(id);
    }
  };

  render(theme);
  registry.set(id, handle);
  return { ok: true, value: handle };
};

export interface SwitchWorldThemeOptions extends ApplyWorldThemeOptions {
  /** Animate via the View Transitions API when available (default true;
   * skipped under prefers-reduced-motion). */
  transition?: boolean;
}

const prefersReducedMotion = (doc: Document): boolean => {
  try {
    return doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
};

/**
 * Document-scope world switcher: applies `next` (or clears with null),
 * replacing whatever world is active on that layer. New CSS lands before the
 * old sheet is removed — within one layer the later sheet wins, so there is
 * never a frame showing the bare built-in theme between worlds. Always
 * resolves; transition failures fall back to an instant switch.
 */
export const switchWorldTheme = async (
  next: WorldTheme | null,
  opts: SwitchWorldThemeOptions = {}
): Promise<Result<WorldThemeHandle | null, ThemeIssue>> => {
  const doc = opts.document ?? globalThis.document;
  if (!doc) return err('E_NO_DOM', 'no document — switchWorldTheme needs a DOM');
  const layer = opts.layer ?? 'world';
  const registry = registries.get(doc);
  const current = registry?.get(`${layer}:document`) ?? null;

  const mutate = (): Result<WorldThemeHandle | null, ThemeIssue> => {
    if (next === null) {
      current?.remove();
      try {
        storageOf(doc)?.removeItem(THEME_STORAGE.worldCss);
      } catch {
        /* ignore */
      }
      return { ok: true, value: null };
    }
    // Same handle id — applyWorldTheme updates in place.
    return applyWorldTheme(next, { ...opts, scope: undefined });
  };

  const startViewTransition = (doc as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<unknown> };
  }).startViewTransition;

  if (opts.transition !== false && typeof startViewTransition === 'function' && !prefersReducedMotion(doc)) {
    let result: Result<WorldThemeHandle | null, ThemeIssue> | null = null;
    try {
      await startViewTransition.call(doc, () => {
        result = mutate();
      }).finished;
    } catch {
      /* transition interrupted — the mutation still ran */
    }
    return result ?? mutate();
  }
  return mutate();
};

/** Remove active world themes (both layers), the boot style, and caches. */
export const clearWorldTheme = (opts: { document?: Document } = {}): void => {
  const doc = opts.document ?? globalThis.document;
  if (!doc) return;
  const registry = registries.get(doc);
  registry?.get('world:document')?.remove();
  registry?.get('user:document')?.remove();
  doc.getElementById(BOOT_STYLE_ID)?.remove();
  try {
    storageOf(doc)?.removeItem(THEME_STORAGE.worldCss);
  } catch {
    /* ignore */
  }
};
