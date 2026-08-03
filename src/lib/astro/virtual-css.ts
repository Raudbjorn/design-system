// The Vite side of build-time world themes.
//
// Astro has no "give me a stylesheet" hook — injectScript('page-ssr', …)
// injects an *import*, so the CSS has to be resolvable as a module. This
// plugin makes one up. Kept separate from integration.ts so it can be tested
// without constructing an Astro config.

import type { Plugin } from 'vite';

/** The specifier consumers' pages import. Vite convention: `virtual:` prefix,
 *  `\0` on the resolved id so other plugins leave it alone. */
export const VIRTUAL_WORLD_CSS = 'virtual:sv-world.css';
const RESOLVED_WORLD_CSS = `\0${VIRTUAL_WORLD_CSS}`;

/**
 * Serves `css` at {@link VIRTUAL_WORLD_CSS}.
 *
 * The `.css` suffix on the id is load-bearing: Vite dispatches its CSS
 * pipeline on the *extension*, so without it the string would be treated as
 * JavaScript and the build would fail on the first `{`.
 */
export const virtualWorldCss = (css: string): Plugin => ({
  name: '@svnbjrn/design:world-css',
  // Ahead of Vite's own CSS plugin, which would otherwise try to read the
  // virtual id off disk.
  enforce: 'pre',
  resolveId: (id) => (id === VIRTUAL_WORLD_CSS ? RESOLVED_WORLD_CSS : null),
  load: (id) => (id === RESOLVED_WORLD_CSS ? css : null)
});
