// FOUC prevention: theme mode persistence + the inline boot script.
//
// The boot script runs before first paint (inline in <head>, before
// stylesheet links). It restores the persisted dark/light mode onto
// data-theme and re-applies the cached world-theme CSS from localStorage.
// The cache is only ever written by applyWorldTheme AFTER full validation,
// so it is trusted-by-construction; the sentinel/substring/size checks below
// are belt-and-suspenders against localStorage poisoning, and textContent
// assignment cannot execute script regardless. A bad cache deletes itself.

export const THEME_STORAGE = {
  mode: 'sv:mode',
  worldCss: 'sv:world-css:v1'
} as const;

export const BOOT_STYLE_ID = 'sv-world-boot';

const MAX_CACHED_CSS = 32768;

export type ThemeMode = 'dark' | 'light' | 'system';

const docOf = (doc?: Document): Document | null => doc ?? globalThis.document ?? null;

const storageOf = (doc: Document): Storage | null => {
  try {
    return doc.defaultView?.localStorage ?? globalThis.localStorage ?? null;
  } catch {
    return null; // privacy mode / sandboxed iframe
  }
};

/** Set the built-in theme mode: data-theme attribute + persistence.
 * 'system' removes both, deferring to prefers-color-scheme. */
export const setThemeMode = (mode: ThemeMode, doc?: Document): void => {
  const document = docOf(doc);
  if (!document) return;
  const root = document.documentElement;
  const storage = storageOf(document);
  try {
    if (mode === 'system') {
      root.removeAttribute('data-theme');
      storage?.removeItem(THEME_STORAGE.mode);
    } else {
      root.setAttribute('data-theme', mode);
      storage?.setItem(THEME_STORAGE.mode, mode);
    }
  } catch {
    // storage quota/permission failures must never break theming
  }
};

export const getThemeMode = (doc?: Document): ThemeMode => {
  const document = docOf(doc);
  if (!document) return 'system';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  try {
    const stored = storageOf(document)?.getItem(THEME_STORAGE.mode);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* fall through */
  }
  return 'system';
};

/**
 * Inline <script> body for the document <head>, BEFORE stylesheet links:
 *
 *   <script>
 *     // paste `themeBootScript` here (SvelteKit: transformPageChunk or
 *     // a literal in app.html)
 *   </script>
 *
 * First-ever world application is inherently post-JS (user-triggered);
 * this makes repeat visits paint themed. For SSR-known themes, render
 * worldThemeToCss() into <svelte:head> instead — no cache needed.
 */
export const themeBootScript: string = `(function () { try {
  var d = document.documentElement, ls = window.localStorage;
  var m = ls.getItem('${THEME_STORAGE.mode}');
  if (m === 'dark' || m === 'light') d.setAttribute('data-theme', m);
  var raw = ls.getItem('${THEME_STORAGE.worldCss}');
  if (!raw) return;
  var env = null;
  try { env = JSON.parse(raw); } catch (pe) { ls.removeItem('${THEME_STORAGE.worldCss}'); return; }
  var css = env && env.v === 1 ? String(env.css) : '';
  var ok = css.lastIndexOf('/*sv-world*/@layer ', 0) === 0 &&
    css.length < ${MAX_CACHED_CSS} &&
    css.indexOf('<') < 0 && css.indexOf('\\\\') < 0 &&
    css.indexOf('@import') < 0 && css.indexOf('url(') < 0;
  if (ok) {
    if (!m && (env.extends === 'dark' || env.extends === 'light')) {
      d.setAttribute('data-theme', env.extends);
    }
    var s = document.createElement('style');
    s.id = '${BOOT_STYLE_ID}';
    s.textContent = css;
    document.head.appendChild(s);
  } else {
    ls.removeItem('${THEME_STORAGE.worldCss}');
  }
} catch (e) {} })();`;
