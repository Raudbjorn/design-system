// parseWorldTheme — the single entry point from untrusted JSON to a
// validated WorldTheme. Pure (no DOM), safe on the server and in tests.
//
// Pipeline: input check → manifest check → DTCG structural resolution
// (shared resolver: groups, aliases, cycles) → registry + per-$type grammar
// (parse-don't-validate) → contrast gate on the effective palette.

import { resolveDtcgTree } from '../tokens/resolver.ts';
import { palettes } from '../tokens/palette.ts';
import { SV_TOKEN_REGISTRY } from './registry.ts';
import { validateTokenValue } from './validate.ts';
import { applyContrastGate } from './gate.ts';
import type {
  ParseWorldThemeOptions,
  Result,
  ThemeIssue,
  WorldTheme,
  WorldThemeManifest
} from './types.ts';

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VERSION_RE = /^\d+\.\d+\.\d+/;
const MAX_INPUT_BYTES = 256 * 1024;
const MAX_META_ENTRIES = 32;
const MAX_META_VALUE_LENGTH = 256;
const MAX_UNKNOWN_REPORTS = 20;
// 'strings' is tolerated (not warned) so a single world bundle can carry both
// `tokens` (this engine) and `strings` (@svnbjrn/design/vernacular) — each
// parser reads its own half and ignores the other's.
const KNOWN_TOP_LEVEL = new Set(['$schema', 'name', 'version', 'extends', 'meta', 'tokens', 'strings']);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const preview = (value: unknown): string => {
  // `input` need not have come through JSON.parse — callers may pass an
  // already-built object directly, so a circular reference or a BigInt
  // anywhere inside it would otherwise throw out of this error-message path.
  let text: string;
  try {
    const json = JSON.stringify(value);
    text = json === undefined ? String(value) : json;
  } catch {
    text = String(value);
  }
  return text.length > 64 ? `${text.slice(0, 64)}…` : text;
};

export const parseWorldTheme = (
  input: unknown,
  opts: ParseWorldThemeOptions = {}
): Result<WorldTheme, ThemeIssue[]> => {
  const policy = opts.onContrastFailure ?? 'revert';
  const unknownPolicy = opts.unknownTokens ?? 'skip';
  const lockedByCaller = new Set(opts.lockedTokens ?? []);
  const issues: ThemeIssue[] = [];
  const fail = (): Result<WorldTheme, ThemeIssue[]> => ({ ok: false, error: issues });

  // ── input ────────────────────────────────────────────────────────────
  let raw: unknown = input;
  if (typeof input === 'string') {
    // `.length` counts UTF-16 code units, not bytes — a CJK-heavy payload
    // can be up to ~3x MAX_INPUT_BYTES in real (UTF-8) size and still pass.
    if (new TextEncoder().encode(input).length > MAX_INPUT_BYTES) {
      issues.push({
        severity: 'error',
        code: 'E_INPUT',
        message: `theme package exceeds ${MAX_INPUT_BYTES} bytes`
      });
      return fail();
    }
    try {
      raw = JSON.parse(input);
    } catch {
      issues.push({ severity: 'error', code: 'E_INPUT', message: 'not parseable as JSON' });
      return fail();
    }
  }
  if (!isRecord(raw)) {
    issues.push({ severity: 'error', code: 'E_INPUT', message: 'theme package must be an object' });
    return fail();
  }

  // ── manifest ─────────────────────────────────────────────────────────
  const name = typeof raw.name === 'string' && NAME_RE.test(raw.name) ? raw.name : null;
  if (name === null) {
    issues.push({
      severity: 'error',
      code: 'E_MANIFEST',
      message: `"name" must match ${NAME_RE} (got ${preview(raw.name)})`
    });
  }
  const version =
    typeof raw.version === 'string' && VERSION_RE.test(raw.version) ? raw.version : null;
  if (version === null) {
    issues.push({
      severity: 'error',
      code: 'E_MANIFEST',
      message: `"version" must be semver-ish (got ${preview(raw.version)})`
    });
  }
  const extendsName =
    raw.extends === undefined ? 'dark' : raw.extends === 'dark' || raw.extends === 'light' ? raw.extends : null;
  if (extendsName === null) {
    issues.push({
      severity: 'error',
      code: 'E_MANIFEST',
      message: `"extends" must be 'dark' or 'light' (got ${preview(raw.extends)})`
    });
  }
  if (!isRecord(raw.tokens)) {
    issues.push({
      severity: 'error',
      code: 'E_MANIFEST',
      message: '"tokens" object is required'
    });
  }

  let meta: Record<string, string> | undefined;
  if (raw.meta !== undefined) {
    if (!isRecord(raw.meta)) {
      issues.push({ severity: 'info', code: 'I_META_IGNORED', message: '"meta" is not an object' });
    } else {
      meta = {};
      let dropped = 0;
      for (const [key, value] of Object.entries(raw.meta)) {
        if (
          typeof value === 'string' &&
          value.length <= MAX_META_VALUE_LENGTH &&
          Object.keys(meta).length < MAX_META_ENTRIES
        ) {
          meta[key] = value;
        } else {
          dropped++;
        }
      }
      if (dropped > 0) {
        issues.push({
          severity: 'info',
          code: 'I_META_IGNORED',
          message: `${dropped} meta entr${dropped === 1 ? 'y' : 'ies'} dropped (non-string, too long, or over the ${MAX_META_ENTRIES}-entry cap)`
        });
      }
    }
  }
  for (const key of Object.keys(raw)) {
    if (!KNOWN_TOP_LEVEL.has(key)) {
      issues.push({
        severity: 'info',
        code: 'I_META_IGNORED',
        message: `unknown top-level property "${key}" ignored`
      });
    }
  }
  if (name === null || version === null || extendsName === null || !isRecord(raw.tokens)) {
    return fail();
  }
  const manifest: WorldThemeManifest = meta
    ? { name, version, extends: extendsName, meta }
    : { name, version, extends: extendsName };

  // ── structural resolution (shared DTCG resolver) ─────────────────────
  const structural = resolveDtcgTree(raw.tokens, `${name}@${version}`);
  if (!structural.ok) {
    for (const error of structural.error) {
      issues.push({
        severity: 'error',
        code: 'E_DTCG',
        path: error.path,
        message: error.message
      });
    }
    return fail();
  }

  // ── registry + grammar ───────────────────────────────────────────────
  const validated = new Map<string, { css: string; type: string }>();
  let unknownCount = 0;
  let unknownFatal = false;
  for (const token of structural.value) {
    const key = token.path.join('-');
    const spec = SV_TOKEN_REGISTRY.get(key);
    if (!spec) {
      unknownCount++;
      if (unknownPolicy === 'reject') {
        unknownFatal = true;
        issues.push({
          severity: 'error',
          code: 'E_UNKNOWN_TOKEN',
          token: key,
          message: `"${key}" is not a themeable token`
        });
      } else if (unknownCount <= MAX_UNKNOWN_REPORTS) {
        issues.push({
          severity: 'warning',
          code: 'W_UNKNOWN_TOKEN',
          token: key,
          message: `"${key}" is not a themeable token — skipped`
        });
      }
      continue;
    }
    if (spec.locked || lockedByCaller.has(key)) {
      issues.push({
        severity: 'warning',
        code: 'W_LOCKED_TOKEN',
        token: key,
        message: `"${key}" is locked${spec.locked ? '' : ' by the application'} — skipped`
      });
      continue;
    }
    if (token.type !== null && token.type !== spec.type) {
      issues.push({
        severity: 'error',
        code: 'E_TYPE_MISMATCH',
        token: key,
        message: `"${key}" declares $type "${token.type}" but the contract says "${spec.type}" — skipped`
      });
      continue;
    }
    const result = validateTokenValue(spec.type, token.value);
    if (result === null) {
      issues.push({
        severity: 'error',
        code: 'E_VALUE',
        token: key,
        message: `value ${preview(token.value)} is not a valid ${spec.type} — skipped`
      });
      continue;
    }
    if (result.hasAlpha && !spec.alphaAllowed) {
      issues.push({
        severity: 'error',
        code: 'E_ALPHA_ON_GATED',
        token: key,
        message: `"${key}" cannot carry alpha (contrast ratios are undefined against an unknown backdrop) — skipped`
      });
      continue;
    }
    if (key === 'mix-target') {
      issues.push({
        severity: 'info',
        code: 'I_MIX_TARGET_OVERRIDE',
        token: key,
        message: 'mix-target changes hover derivation for every interactive color'
      });
    }
    validated.set(key, { css: result.css, type: spec.type });
  }
  if (unknownCount > MAX_UNKNOWN_REPORTS && unknownPolicy === 'skip') {
    issues.push({
      severity: 'warning',
      code: 'W_UNKNOWN_TOKEN',
      message: `${unknownCount - MAX_UNKNOWN_REPORTS} further unknown tokens skipped unreported`
    });
  }
  if (unknownFatal) return fail();

  // ── contrast gate (colors only, on the effective palette) ────────────
  const colorOverrides = new Map<string, string>();
  for (const [key, value] of validated) {
    if (value.type === 'color') colorOverrides.set(key, value.css);
  }
  const gate = applyContrastGate(colorOverrides, palettes[extendsName], policy);
  issues.push(...gate.issues);
  if (gate.fatal) return fail();

  const tokens = new Map<string, string>();
  for (const [key, value] of validated) {
    if (value.type === 'color' && !gate.overrides.has(key)) continue;
    tokens.set(key, value.css);
  }
  if (tokens.size === 0) {
    issues.push({
      severity: 'warning',
      code: 'W_EMPTY',
      message: 'theme parsed but has zero surviving overrides — applying it is a no-op'
    });
  }

  return { ok: true, value: { manifest, tokens, issues } };
};
