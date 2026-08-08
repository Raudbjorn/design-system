// Public surface of the Astro adapter (`@svnbjrn/design/astro`).
//
// This entry is the *integration* — it is imported by astro.config.mjs and
// must stay free of component markup. The .astro components live behind
// `@svnbjrn/design/astro/components`.

export { default, default as svDesign, STYLES_SPECIFIER } from './integration.ts';
export type { SvDesignOptions } from './integration.ts';
export { VIRTUAL_WORLD_CSS, virtualWorldCss } from './virtual-css.ts';
