// Public runtime theme engine — `@svnbjrn/design/theme`.
// Framework-agnostic and import-safe on the server: parseWorldTheme and
// worldThemeToCss are pure; the DOM appliers no-op into typed errors without
// a document. The Svelte wrapper lives at `@svnbjrn/design/theme/svelte`.

export { parseWorldTheme } from './parse.ts';
export { worldThemeToCss, CSS_SENTINEL } from './css.ts';
export type { WorldThemeCssOptions } from './css.ts';
export { applyWorldTheme, switchWorldTheme, clearWorldTheme } from './apply.ts';
export type {
  ApplyWorldThemeOptions,
  SwitchWorldThemeOptions,
  WorldThemeHandle
} from './apply.ts';
export { getThemeMode, setThemeMode, themeBootScript, THEME_STORAGE, BOOT_STYLE_ID } from './boot.ts';
export type { ThemeMode } from './boot.ts';
export { SV_TOKEN_REGISTRY, CONTRAST_RULES } from './registry.ts';
export type { TokenSpec, ContrastRule, ContrastCheck } from './registry.ts';
export type {
  ParseWorldThemeOptions,
  Result,
  ThemeIssue,
  ThemeIssueCode,
  WorldTheme,
  WorldThemeManifest,
  WorldThemePackage
} from './types.ts';
