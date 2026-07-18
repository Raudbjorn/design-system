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
const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
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
 * Clone an untrusted JSON-like object into inert data while enforcing the same
 * structural budget for string and object inputs. Only ordinary/null-prototype
 * objects, arrays, primitives, and enumerable own data properties survive.
 */
const sanitizeObjectInput = (value: unknown): Record<string, unknown> | null => {
  const invalid = Symbol('invalid input');
  let remaining = MAX_INPUT_BYTES;
  const ancestors = new WeakSet<object>();

  const visit = (current: unknown, depth: number): unknown | typeof invalid => {
    if (depth > MAX_OBJECT_INPUT_DEPTH || --remaining < 0) return invalid;
    if (typeof current === 'string') {
      if (current.length > remaining) return invalid;
      remaining -= textEncoder.encode(current).length;
      return remaining >= 0 ? current : invalid;
    }
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) return invalid;
      remaining -= String(current).length;
      return remaining >= 0 ? current : invalid;
    }
    if (typeof current !== 'object' || ancestors.has(current)) return invalid;

    const array = Array.isArray(current);
    const prototype = Object.getPrototypeOf(current);
    if (
      (array && prototype !== Array.prototype) ||
      (!array && prototype !== Object.prototype && prototype !== null) ||
      (array && current.length > remaining)
    ) {
      return invalid;
    }

    ancestors.add(current);
    const out: unknown[] | Record<string, unknown> = array ? [] : Object.create(null);
    for (const key in current) {
      if (!Object.hasOwn(current, key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!descriptor || !('value' in descriptor)) {
        ancestors.delete(current);
        return invalid;
      }
      const safeKey = visit(key, depth + 1);
      const safeValue = visit(descriptor.value, depth + 1);
      if (safeKey === invalid || safeValue === invalid) {
        ancestors.delete(current);
        return invalid;
      }
      Object.defineProperty(out, safeKey as string, {
        value: safeValue,
        enumerable: true,
        writable: true,
        configurable: true
      });
    }
    ancestors.delete(current);
    return out;
  };

  try {
    if (value && typeof value === 'object') {
      for (const key of ['name', 'version', 'strings', 'meta']) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor && (!descriptor.enumerable || !('value' in descriptor))) return null;
      }
    }
    const safe = visit(value, 0);
    return safe !== invalid && isRecord(safe) ? safe : null;
  } catch {
    return null;
  }
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

/** Flatten nested-by-component or flat-dotted `strings` to dotted keys without
 * materializing the caller's whole object. At most MAX_STRINGS leaves or
 * malformed component entries are retained. */
const flatten = (
  strings: Record<string, unknown>
): {
  entries: Array<[string, unknown]>;
  badShape: string[];
  duplicates: string[];
  tooMany: boolean;
} => {
  const entries: Array<[string, unknown]> = [];
  const badShape: string[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  let visited = 0;
  let tooMany = false;

  const record = (flatKey: string, value: unknown): boolean => {
    if (visited >= MAX_STRINGS) {
      tooMany = true;
      return false;
    }
    visited++;
    if (seen.has(flatKey)) duplicates.push(flatKey);
    seen.add(flatKey);
    entries.push([flatKey, value]);
    return true;
  };

  outer: for (const key in strings) {
    if (!Object.hasOwn(strings, key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(strings, key);
    if (!descriptor || !('value' in descriptor)) continue;
    const value = descriptor.value;
    if (key.includes('.')) {
      if (!record(key, value)) break;
    } else if (isRecord(value)) {
      for (const prop in value) {
        if (!Object.hasOwn(value, prop)) continue;
        const leafDescriptor = Object.getOwnPropertyDescriptor(value, prop);
        if (!leafDescriptor || !('value' in leafDescriptor)) continue;
        if (!record(`${key}.${prop}`, leafDescriptor.value)) break outer;
      }
    } else {
      if (visited >= MAX_STRINGS) {
        tooMany = true;
        break;
      }
      visited++;
      badShape.push(key);
    }
  }
  return { entries, badShape, duplicates, tooMany };
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
  const record = sanitizeObjectInput(raw);
  if (record === null) {
    issues.push({ severity: 'error', code: 'E_VERN_INPUT', message: `catalog exceeds the safe ${MAX_INPUT_BYTES}-byte structural budget or is not inert JSON data` });
    return fail();
  }

  // ── manifest ─────────────────────────────────────────────────────────────
  const nameInput = record.name;
  const name = typeof nameInput === 'string' && NAME_RE.test(nameInput) ? nameInput : null;
  if (name === null) {
    issues.push({ severity: 'error', code: 'E_VERN_MANIFEST', message: `"name" must match ${NAME_RE} (got ${preview(nameInput)})` });
  }
  const versionInput = record.version;
  const version = typeof versionInput === 'string' && VERSION_RE.test(versionInput) ? versionInput : null;
  if (version === null) {
    issues.push({ severity: 'error', code: 'E_VERN_MANIFEST', message: `"version" must be semver-ish (got ${preview(versionInput)})` });
  }
  const stringsInput = record.strings;
  if (!isRecord(stringsInput)) {
    issues.push({ severity: 'error', code: 'E_VERN_MANIFEST', message: '"strings" object is required' });
  }

  let meta: Record<string, string> | undefined;
  const metaInput = record.meta;
  if (metaInput !== undefined) {
    if (!isRecord(metaInput)) {
      issues.push({ severity: 'info', code: 'I_VERN_META_IGNORED', message: '"meta" is not an object' });
    } else {
      meta = {};
      let kept = 0;
      let dropped = 0;
      for (const key in metaInput) {
        if (!Object.hasOwn(metaInput, key)) continue;
        const value = metaInput[key];
        if (typeof value === 'string' && value.length <= MAX_META_VALUE_LENGTH && kept < MAX_META_ENTRIES) {
          meta[key] = value;
          kept++;
        } else {
          dropped++;
        }
      }
      if (dropped > 0) {
        issues.push({ severity: 'info', code: 'I_VERN_META_IGNORED', message: `${dropped} meta entr${dropped === 1 ? 'y' : 'ies'} dropped` });
      }
    }
  }
  for (const key in record) {
    if (Object.hasOwn(record, key) && !KNOWN_TOP_LEVEL.has(key)) {
      issues.push({ severity: 'info', code: 'I_VERN_META_IGNORED', message: `unknown top-level property "${key}" ignored` });
    }
  }
  if (name === null || version === null || !isRecord(stringsInput)) return fail();
  const manifest: VernacularManifest = meta ? { name, version, meta } : { name, version };

  // ── strings ──────────────────────────────────────────────────────────────
  const { entries, badShape, duplicates, tooMany } = flatten(stringsInput);
  if (tooMany) {
    issues.push({ severity: 'error', code: 'E_VERN_INPUT', message: `catalog contains more than ${MAX_STRINGS} string entries` });
    return fail();
  }
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
      if (unknownCount <= MAX_UNKNOWN_REPORTS) {
        issues.push({
          severity: unknownPolicy === 'reject' ? 'error' : 'warning',
          code: unknownPolicy === 'reject' ? 'E_VERN_UNKNOWN_KEY' : 'W_VERN_UNKNOWN_KEY',
          key,
          message:
            unknownPolicy === 'reject'
              ? `"${key}" is not a themeable string`
              : `"${key}" is not a themeable string — skipped`
        });
      }
      if (unknownPolicy === 'reject') unknownFatal = true;
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
  if (unknownCount > MAX_UNKNOWN_REPORTS) {
    const omitted = unknownCount - MAX_UNKNOWN_REPORTS;
    issues.push({
      severity: unknownPolicy === 'reject' ? 'error' : 'warning',
      code: unknownPolicy === 'reject' ? 'E_VERN_UNKNOWN_KEY' : 'W_VERN_UNKNOWN_KEY',
      message:
        unknownPolicy === 'reject'
          ? `${omitted} further unknown keys rejected unreported`
          : `${omitted} further unknown keys skipped unreported`
    });
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
