// Public vernacular runtime — `@svnbjrn/design/vernacular`.
// Ingest untrusted world-vernacular catalogs, resolve them into the spreadable
// Vernacular shape with world → English → key fallback and a plain-language
// toggle, plus CI helpers (terminology metric, pseudo-localization) and the
// non-Svelte escaped-JSON emit.

export { parseVernacular } from './parse.ts';
export { resolveVernacular } from './resolve.ts';
export type { ResolveVernacularOptions } from './resolve.ts';
export { VERNACULAR_REGISTRY } from './registry.ts';
export type { VernacularSpec } from './registry.ts';
export { escapeHtml, vernacularToJson } from './escape.ts';
export type { VernacularJsonOptions } from './escape.ts';
export { checkTerminology } from './terminology.ts';
export type { Glossary, TermRule, TerminologyReport } from './terminology.ts';
export { pseudoLocalize, pseudoLocalizeString } from './pseudo.ts';
export { extractPlaceholders, diffPlaceholders } from './placeholders.ts';
export type { PlaceholderDiff } from './placeholders.ts';
export type {
  Result,
  Vernacular,
  VernacularCatalog,
  VernacularIssue,
  VernacularIssueCode,
  VernacularManifest,
  VernacularPackage,
  ParseVernacularOptions
} from './types.ts';
