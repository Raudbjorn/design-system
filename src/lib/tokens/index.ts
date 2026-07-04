// Public token API — `@svnbjrn/design/tokens`.
// The CSS itself ships as `@svnbjrn/design/styles.css`; this module is the
// TypeScript view: palettes, the DTCG resolver, and the theme registry.

export * from './palette.ts';
export * from './resolver.ts';
export { themes } from './themes.ts';
export type { ThemeSpec } from './themes.ts';
