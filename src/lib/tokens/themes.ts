// Built-in theme registry — the single place a new compiled-in theme is
// declared. The token build iterates this list; adding a theme is one
// .tokens.json file plus one entry here. (Runtime world themes don't live
// here — they arrive as data through @svnbjrn/design/theme.)
//
// Node's native type-stripping runs this file directly from the build script,
// so keep the syntax erasable (no enums, no parameter properties).

export interface ThemeSpec {
  /** data-theme attribute value and output file stem. */
  name: string;
  /** Token documents merged over primitives + scale; later files win. */
  files: string[];
  /** Emitted at :root (exactly one theme must set this). */
  default?: boolean;
  /** Also emitted under a prefers-color-scheme media query for auto switching. */
  prefersColorScheme?: 'light' | 'dark';
}

export const themes: readonly ThemeSpec[] = [
  { name: 'dark', files: ['dark.tokens.json'], default: true },
  { name: 'light', files: ['light.tokens.json'], prefersColorScheme: 'light' }
];
