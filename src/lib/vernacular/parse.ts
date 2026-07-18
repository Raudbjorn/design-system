// parseVernacular — the single entry point from untrusted JSON to a validated
// catalog. Pure (no DOM). Mirrors theme/parse.ts: byte cap, manifest checks,
// collect-all-then-fail, recoverable per-key drops. Strings are NOT run through
// the DTCG resolver — `{count}` is a placeholder, not a `{group.token}` alias.

import { VERNACULAR_REGISTRY } from './registry.ts';
import { parseSafeString } from './grammar.ts';
import { diffPlaceholders, extractPlaceholders } from './placeholders.ts';
import type {
  ParseVernacularOptions,
  Result,
  VernacularCatalog,
  VernacularIssue,
  VernacularManifest
} from './types.ts';

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^\d+\.\d+\.\d+/;
const MAX_INPUT_BYTES = 64 * 1024;
const MAX_META_ENTRIES = 32;
const MAX_META_VALUE_LENGTH = 256;
const MAX_STRINGS = 200;
const MAX_UNKNOWN_REPORTS = 20;
// `tokens` and `extends` are the theme engine's keys — tolerated (not warned)
// so a single {tokens, strings} world bundle parses cleanly through both.
const KNOWN_TOP_LEVEL = new Set(['$schema', 'name', 'version', 'meta', 'strings', 'tokens', 'extends']);

const MAX_OBJECT_INPUT_DEPTH = 32;
const textEncoder = new TextEncoder();

/**
 * Bound traversal and allocation before flattening an already-parsed object.
 * Every visited node consumes budget, while strings consume their UTF-8 size;
 * depth, cycles, accessors, and non-JSON values are rejected.
 */
const fitsObjectInputBudget = (value: unknown): boolean => {
  let remaining = MAX_INPUT_BYTES;
  const ancestors = new WeakSet<object>();

  const visit = (current: unknown, depth: number): boolean => {
    if (depth > MAX_OBJECT_INPUT_DEPTH || --remaining < 0) return false;
    if (typeof current === 'string') {
      if (current.length > remaining) return false;
      remaining -= textEncoder.encode(current).length;
      return remaining >= 0;
    }
    if (current === null || typeof current === 'boolean') return true;
    if (typeof current === 'number') {
      remaining -= Number.isFinite(current) ? String(current).length : 4;
      return remaining >= 0;
    }
    if (typeof current !== 'object' || ancestors.has(current)) return false;
    if (Array.isArray(current) && current.length > remaining) return false;

    ancestors.add(current);
    for (const key in current) {
      if (!Object.hasOwn(current, key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (
        !descriptor ||
        !('value' in descriptor) ||
        !visit(key, depth + 1) ||
        !visit(descriptor.value, depth + 1)
      ) {
        ancestors.delete(current);
        return false;
      }
    }
    ancestors.delete(current);
    return true;
  };

  return visit(value, 0);
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const preview = (value: unknown): string => {
  let text: string;
  try {
    const json = JSON.stringify(value);
    text = json === undefined ? String(value) : json;
  } catch {
    text = String(value);
  }
  return text.length > 64 ? `${text.slice(0, 64)}…` : text;
};

/** Flatten nested-by-component or flat-dotted `strings` to dotted keys. Depth
 * capped at 2 ({ component: { prop: value } }); anything deeper or a non-record
 * intermediate is a typed value error, not a throw. */
const flatten = (
  strings: Record<string, unknown>
): { entries: Array<[string, unknown]>; badShape: string[]; duplicates: string[] } => {
  const entries: Array<[string, unknown]> = [];
  const badShape: string[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const record = (flatKey: string, value: unknown): void => {
    // The same key given in both dotted and nested form is ambiguous in an
    // untrusted catalog — flag it rather than silently last-wins.
    if (seen.has(flatKey)) duplicates.push(flatKey);
    seen.add(flatKey);
    entries.push([flatKey, value]);
  };
  for (const [key, value] of Object.entries(strings)) {
    if (key.includes('.')) {
      record(key, value);
    } else if (isRecord(value)) {
      for (const [prop, leaf] of Object.entries(value)) {
        record(`${key}.${prop}`, leaf);
      }
    } else {
      // A bare non-record under a component name is malformed shape.
      badShape.push(key);
    }
  }
  return { entries, badShape, duplicates };
};

export const parseVernacular = (
  input: unknown,
  opts: ParseVernacularOptions = {}
): Result<VernacularCatalog, VernacularIssue[]> => {
  const unknownPolicy = opts.unknownKeys ?? 'skip';
  const issues: VernacularIssue[] = [];
  const fail = (): Result<VernacularCatalog, VernacularIssue[]> => ({ ok: false, error: issues });

  // ── input ──────────────────────────────────────────────────────────────
  let raw: unknown = input;
  if (typeof input === 'string') {
    // UTF-8 byte length is always >= UTF-16 code-unit length, so a cheap
    // .length check short-circuits the TextEncoder allocation for huge inputs.
    if (input.length > MAX_INPUT_BYTES || new TextEncoder().encode(input).length > MAX_INPUT_BYTES) {
      issues.push({ severity: 'error', code: 'E_VERN_INPUT', message: `catalog exceeds ${MAX_INPUT_BYTES} bytes` });
      return fail();
    }
    try {
      raw = JSON.parse(input);
    } catch {
      issues.push({ severity: 'error', code: 'E_VERN_INPUT', message: 'not parseable as JSON' });
      return fail();
    }
  }
  if (!isRecord(raw)) {
    issues.push({ severity: 'error', code: 'E_VERN_INPUT', message: 'catalog must be an object' });
    return fail();
  }
  if (typeof input !== 'string' && !fitsObjectInputBudget(raw)) {
    issues.push({ severity: 'error', code: 'E_VERN_INPUT', message: `catalog exceeds the safe ${MAX_INPUT_BYTES}-byte structural budget` });
    return fail();
  }

  // ── manifest ─────────────────────────────────────────────────────────────
  const name = typeof raw.name === 'string' && NAME_RE.test(raw.name) ? raw.name : null;
  if (name === null) {
    issues.push({ severity: 'error', code: 'E_VERN_MANIFEST', message: `"name" must match ${NAME_RE} (got ${preview(raw.name)})` });
  }
  const version = typeof raw.version === 'string' && VERSION_RE.test(raw.version) ? raw.version : null;
  if (version === null) {
    issues.push({ severity: 'error', code: 'E_VERN_MANIFEST', message: `"version" must be semver-ish (got ${preview(raw.version)})` });
  }
  if (!isRecord(raw.strings)) {
    issues.push({ severity: 'error', code: 'E_VERN_MANIFEST', message: '"strings" object is required' });
  }

  let meta: Record<string, string> | undefined;
  if (raw.meta !== undefined) {
    if (!isRecord(raw.meta)) {
      issues.push({ severity: 'info', code: 'I_VERN_META_IGNORED', message: '"meta" is not an object' });
    } else {
      meta = {};
      let dropped = 0;
      for (const [key, value] of Object.entries(raw.meta)) {
        if (typeof value === 'string' && value.length <= MAX_META_VALUE_LENGTH && Object.keys(meta).length < MAX_META_ENTRIES) {
          meta[key] = value;
        } else {
          dropped++;
        }
      }
      if (dropped > 0) {
        issues.push({ severity: 'info', code: 'I_VERN_META_IGNORED', message: `${dropped} meta entr${dropped === 1 ? 'y' : 'ies'} dropped` });
      }
    }
  }
  for (const key of Object.keys(raw)) {
    if (!KNOWN_TOP_LEVEL.has(key)) {
      issues.push({ severity: 'info', code: 'I_VERN_META_IGNORED', message: `unknown top-level property "${key}" ignored` });
    }
  }
  if (name === null || version === null || !isRecord(raw.strings)) return fail();
  const manifest: VernacularManifest = meta ? { name, version, meta } : { name, version };

  // ── strings ──────────────────────────────────────────────────────────────
  const { entries, badShape, duplicates } = flatten(raw.strings);
  for (const key of badShape) {
    issues.push({ severity: 'error', code: 'E_VERN_TYPE', key, message: `"${key}" must be a string or a { prop: string } group` });
  }
  for (const key of duplicates) {
    issues.push({ severity: 'warning', code: 'W_VERN_DUPLICATE_KEY', key, message: `"${key}" is given in both dotted and nested form — the later value wins` });
  }

  const strings = new Map<string, string>();
  let unknownCount = 0;
  let unknownFatal = false;
  for (const [key, value] of entries) {
    const replaced = strings.delete(key);
    if (!replaced && strings.size >= MAX_STRINGS) break;
    const spec = VERNACULAR_REGISTRY.get(key);
    if (!spec) {
      unknownCount++;
      if (unknownPolicy === 'reject') {
        unknownFatal = true;
        issues.push({ severity: 'error', code: 'E_VERN_UNKNOWN_KEY', key, message: `"${key}" is not a themeable string` });
      } else if (unknownCount <= MAX_UNKNOWN_REPORTS) {
        issues.push({ severity: 'warning', code: 'W_VERN_UNKNOWN_KEY', key, message: `"${key}" is not a themeable string — skipped` });
      }
      continue;
    }
    const parsed = parseSafeString(value, spec.maxLen);
    if (!parsed.ok) {
      issues.push({ severity: 'error', code: parsed.code, key, message: `"${key}": ${describeReject(parsed.code, spec.maxLen)}` });
      continue;
    }
    const { missing, extra } = diffPlaceholders(spec.placeholders, extractPlaceholders(parsed.value.text));
    if (missing.length > 0 || extra.length > 0) {
      issues.push({
        severity: 'error',
        code: 'E_VERN_PLACEHOLDER',
        key,
        message: `"${key}" placeholder set differs from the slot's required set`,
        detail: { missing, extra }
      });
      continue;
    }
    strings.set(key, parsed.value.text);
  }
  if (unknownCount > MAX_UNKNOWN_REPORTS && unknownPolicy === 'skip') {
    issues.push({ severity: 'warning', code: 'W_VERN_UNKNOWN_KEY', message: `${unknownCount - MAX_UNKNOWN_REPORTS} further unknown keys skipped unreported` });
  }
  if (unknownFatal) return fail();

  if (strings.size === 0) {
    issues.push({ severity: 'warning', code: 'W_VERN_EMPTY_CATALOG', message: 'catalog has zero surviving strings — resolving it is a no-op' });
  }

  return { ok: true, value: { manifest, strings, issues } };
};

const describeReject = (code: string, maxLen: number): string => {
  switch (code) {
    case 'E_VERN_TYPE':
      return 'value is not a string';
    case 'E_VERN_CONTROL':
      return 'contains a control character';
    case 'E_VERN_BIDI':
      return 'contains a bidirectional override character (Trojan Source)';
    case 'E_VERN_FORMAT':
      return 'contains an invisible format character';
    case 'E_VERN_EMPTY':
      return 'is blank after trimming';
    case 'E_VERN_LENGTH':
      return `exceeds ${maxLen} code points`;
    default:
      return 'is invalid';
  }
};
