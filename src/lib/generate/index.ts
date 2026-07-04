// Public generation API — `@svnbjrn/design/generate`.
// Seed colors (extracted from content elsewhere — SAM/K-Means live in the
// consumer) → a complete, WCAG-AA-guaranteed world-theme package plus a
// machine-readable generation report. Deterministic; browser- and node-safe.

export { generateTheme, GENERATOR_VERSION } from './generate.ts';
export { HINT_ONTOLOGY } from './hints.ts';
export type { HintSpec } from './hints.ts';
export { solveLightness } from './solve.ts';
export type { SolveOptions, SolveResult } from './solve.ts';
export type {
  GenerateOptions,
  GenerationReport,
  GenerationWarning,
  GenError,
  Mode,
  Result,
  SeedRole,
  SeedUsage,
  WorldThemePackage
} from './types.ts';
