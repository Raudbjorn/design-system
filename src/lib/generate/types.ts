// Public types for @svnbjrn/design/generate.

import type { Oklch } from '../internal/color.ts';
import type { ContrastCheck } from '../internal/invariants.ts';
import type { Result, WorldThemePackage } from '../theme/types.ts';

export type { Result, WorldThemePackage };

export type Mode = 'dark' | 'light';

export interface GenerateOptions {
  /** 1–5 seed colors ('#rgb' or '#rrggbb'), e.g. K-Means dominants from
   * uploaded art. Order matters only for ties. */
  seeds: string[];
  /** Kebab-case world id — becomes the package manifest name. */
  name: string;
  /** 'auto' (default) infers from seed lightness; hints may bias auto. */
  mode?: Mode | 'auto';
  /** Atmosphere keywords (see HINT_ONTOLOGY). Unknown hints warn, never fail. */
  hints?: string[];
}

export type GenError =
  | { kind: 'no-seeds' }
  | { kind: 'too-many-seeds'; count: number; max: number }
  | { kind: 'invalid-seed'; seed: string; index: number }
  | { kind: 'invalid-name'; name: string }
  | { kind: 'invalid-mode'; mode: string };

export type GenerationWarning =
  | { kind: 'achromatic-seeds' }
  | { kind: 'seed-unused'; seed: string; index: number; reason: string }
  | { kind: 'extreme-seed-lightness'; seed: string; l: number }
  | { kind: 'chroma-clamped'; token: string; requested: number; effective: number }
  | { kind: 'target-missed'; token: string; target: number; achieved: number }
  | { kind: 'hue-collision'; tokens: [string, string]; deltaH: number }
  | { kind: 'unknown-hint'; hint: string }
  | { kind: 'hint-conflict'; field: string; hints: string[] };

export type SeedRole = 'accent' | 'accent-2' | 'accent-rust' | 'atmosphere';

export interface SeedUsage {
  seed: string;
  index: number;
  role: SeedRole;
  oklch: Oklch;
}

export interface GenerationReport {
  mode: Mode;
  seedUsage: SeedUsage[];
  /** Every gated pair with its achieved ratio (checkThemeAA output). */
  checks: ContrastCheck[];
  warnings: GenerationWarning[];
}
