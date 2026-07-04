// DTCG (W3C Design Tokens 2025.10) subset parser + resolver.
//
// One resolver, two consumers, two levels:
//   - resolveDtcgTree(subtree)  → structural resolution only (groups
//     flattened, group $type inherited, {alias} refs substituted with cycle
//     detection, values left raw). The runtime theme engine consumes this and
//     applies its own strict untrusted-value grammar on top.
//   - resolveTokens(document)   → structural + typed value parsing into
//     TokenValue unions. The token build consumes this.
//
// Supported subset (fail-closed — anything else is a TokenError):
//   $value / $type / $description; group-level $type inheritance; aliases
//   "{dot.path}" as a full $value or as a string field inside a shadow
//   composite; color as "#hex" string or 2025.10 srgb object form; dimension
//   as {value, unit: px|rem} or "4px"/"0.25rem" string. $extensions,
//   $deprecated and $schema are tolerated and ignored; behavior is never
//   driven by them. Explicitly rejected: JSON-pointer $ref, math expressions,
//   non-srgb color spaces.
//
// Errors are values: every entry point returns Result<T, TokenError[]> and
// collects all errors in a pass rather than bailing at the first.

// Explicit .ts extension: this module runs under plain node (the token build
// imports it directly with type stripping); svelte-package rewrites the
// specifier to .js in dist.
import { parseColor, toHex6, toHex8 } from '../internal/color.ts';
import type { Rgba } from '../internal/color.ts';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const TOKEN_TYPES = [
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'number',
  'shadow'
] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

export interface TokenError {
  kind:
    | 'invalid-document'
    | 'invalid-name'
    | 'missing-type'
    | 'unknown-type'
    | 'invalid-value'
    | 'unknown-alias'
    | 'alias-cycle'
    | 'type-mismatch';
  /** Dot-joined token path where the error was detected; '' = document level. */
  path: string;
  message: string;
  /** alias-cycle only: the reference chain, first repeated entry closes the loop. */
  chain?: string[];
}

export interface TokenNode {
  kind: 'token';
  /** Declared $type on the token itself (uninherited); null when absent. */
  type: string | null;
  value: unknown;
  description?: string;
}

export interface GroupNode {
  kind: 'group';
  type: string | null;
  description?: string;
  children: Map<string, TokenNode | GroupNode>;
}

export interface TokenDocument {
  root: GroupNode;
  /** Provenance label used in error messages (file name, 'inline', …). */
  source?: string;
}

export type DimensionUnit = 'px' | 'rem';

/** Kept raw (not pre-serialized) so toCss/toQt can each apply their own
 * unit rules — a rem offset must flatten to px for Qt but stay rem in CSS. */
export type ShadowDimension = { value: number; unit: DimensionUnit };

export interface ShadowLayer {
  /** Normalized #rrggbb / #rrggbbaa. */
  color: string;
  offsetX: ShadowDimension;
  offsetY: ShadowDimension;
  blur: ShadowDimension;
  spread: ShadowDimension;
  inset: boolean;
}

export type TokenValue =
  | { kind: 'color'; hex: string }
  | { kind: 'dimension'; value: number; unit: DimensionUnit }
  | { kind: 'fontFamily'; families: string[] }
  | { kind: 'fontWeight'; weight: number }
  | { kind: 'number'; value: number }
  | { kind: 'shadow'; layers: ShadowLayer[] };

export interface ResolvedToken {
  /** Dot-joined path, e.g. 'color.syn-keyword'. */
  path: string;
  type: TokenType;
  value: TokenValue;
  description?: string;
  /** Terminal alias target when the value arrived through {refs}. */
  aliasOf?: string;
}

export type ResolvedTokens = ReadonlyMap<string, ResolvedToken>;

/** Structural resolution output: raw values, no grammar applied. */
export interface RawResolvedToken {
  path: string[];
  /** Effective $type (own or nearest ancestor group's); null when none. */
  type: string | null;
  value: unknown;
  description?: string;
  aliasOf?: string;
}

// ── Parsing ──────────────────────────────────────────────────────────────

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const IGNORED_DOLLAR_KEYS = new Set(['$extensions', '$deprecated', '$schema']);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const err = (
  kind: TokenError['kind'],
  path: string[],
  message: string,
  source?: string
): TokenError => ({
  kind,
  path: path.join('.'),
  message: source ? `${message} (in ${source})` : message
});

const parseNode = (
  raw: Record<string, unknown>,
  path: string[],
  errors: TokenError[],
  source?: string
): TokenNode | GroupNode => {
  const type = typeof raw.$type === 'string' ? raw.$type : null;
  if (raw.$type !== undefined && type === null) {
    errors.push(err('invalid-document', path, '$type must be a string', source));
  }
  const description = typeof raw.$description === 'string' ? raw.$description : undefined;
  if (raw.$description !== undefined && description === undefined) {
    errors.push(err('invalid-document', path, '$description must be a string', source));
  }

  for (const key of Object.keys(raw)) {
    if (key.startsWith('$')) {
      if (
        key !== '$type' &&
        key !== '$description' &&
        key !== '$value' &&
        !IGNORED_DOLLAR_KEYS.has(key)
      ) {
        errors.push(err('invalid-document', path, `unsupported property "${key}"`, source));
      }
    }
  }

  if ('$value' in raw) {
    for (const key of Object.keys(raw)) {
      if (!key.startsWith('$')) {
        errors.push(
          err('invalid-document', [...path, key], 'a token cannot contain child tokens', source)
        );
      }
    }
    return { kind: 'token', type, value: raw.$value, description };
  }

  const children = new Map<string, TokenNode | GroupNode>();
  for (const [key, child] of Object.entries(raw)) {
    if (key.startsWith('$')) continue;
    if (!NAME_RE.test(key)) {
      errors.push(
        err(
          'invalid-name',
          [...path, key],
          `invalid token/group name "${key}" (want kebab-case: ^[a-z][a-z0-9]*(-[a-z0-9]+)*$)`,
          source
        )
      );
      continue;
    }
    if (!isRecord(child)) {
      errors.push(
        err('invalid-document', [...path, key], 'expected a group or token object', source)
      );
      continue;
    }
    children.set(key, parseNode(child, [...path, key], errors, source));
  }
  return { kind: 'group', type, description, children };
};

export const parseTokenDocument = (
  json: unknown,
  source?: string
): Result<TokenDocument, TokenError[]> => {
  if (!isRecord(json)) {
    return {
      ok: false,
      error: [err('invalid-document', [], 'token document must be a JSON object', source)]
    };
  }
  const errors: TokenError[] = [];
  const root = parseNode(json, [], errors, source);
  if (root.kind === 'token') {
    errors.push(err('invalid-document', [], 'document root cannot be a token', source));
  }
  if (errors.length > 0) return { ok: false, error: errors };
  return { ok: true, value: { root: root as GroupNode, source } };
};

// ── Merging ──────────────────────────────────────────────────────────────

const mergeGroups = (base: GroupNode, over: GroupNode): GroupNode => {
  const children = new Map(base.children);
  for (const [key, overChild] of over.children) {
    const baseChild = children.get(key);
    if (baseChild && baseChild.kind === 'group' && overChild.kind === 'group') {
      children.set(key, mergeGroups(baseChild, overChild));
    } else {
      // Token nodes replace wholesale; kind mismatches resolve to the later doc.
      children.set(key, overChild);
    }
  }
  return {
    kind: 'group',
    type: over.type ?? base.type,
    description: over.description ?? base.description,
    children
  };
};

/** Per-token-path deep merge; later documents win. */
export const mergeDocuments = (docs: TokenDocument[]): TokenDocument => {
  let root: GroupNode = { kind: 'group', type: null, children: new Map() };
  for (const doc of docs) root = mergeGroups(root, doc.root);
  return { root, source: docs.map((d) => d.source ?? 'inline').join(' + ') };
};

// ── Structural resolution (flatten + inherit + aliases + cycles) ─────────

const ALIAS_RE = /^\{([^{}]+)\}$/;

const aliasTarget = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const m = ALIAS_RE.exec(value);
  const target = m?.[1]?.trim();
  return target && target.length > 0 ? target : null;
};

interface FlatToken {
  path: string[];
  type: string | null;
  value: unknown;
  description?: string;
}

const flatten = (
  group: GroupNode,
  path: string[],
  inheritedType: string | null,
  out: Map<string, FlatToken>
): void => {
  const groupType = group.type ?? inheritedType;
  for (const [key, child] of group.children) {
    const childPath = [...path, key];
    if (child.kind === 'token') {
      out.set(childPath.join('.'), {
        path: childPath,
        type: child.type ?? groupType,
        value: child.value,
        description: child.description
      });
    } else {
      flatten(child, childPath, groupType, out);
    }
  }
};

interface AliasResolution {
  value: unknown;
  /** Effective type after following the chain (terminal wins when local is null). */
  type: string | null;
  aliasOf?: string;
}

const resolveTokenAliases = (
  flat: Map<string, FlatToken>
): Result<Map<string, AliasResolution>, TokenError[]> => {
  const errors: TokenError[] = [];
  const resolved = new Map<string, AliasResolution>();
  const state = new Map<string, 'in-progress' | 'done'>();

  const resolve = (key: string, stack: string[]): AliasResolution | null => {
    // 'done' with no resolved entry = already failed; don't re-report.
    if (state.get(key) === 'done') return resolved.get(key) ?? null;
    if (state.get(key) === 'in-progress') {
      errors.push({
        kind: 'alias-cycle',
        path: stack[0] ?? key,
        message: `alias cycle: ${[...stack, key].join(' → ')}`,
        chain: [...stack, key]
      });
      return null;
    }
    const token = flat.get(key);
    if (!token) return null; // caller reports unknown-alias with context
    state.set(key, 'in-progress');

    let result: AliasResolution | null;
    const target = aliasTarget(token.value);
    if (target !== null) {
      if (!flat.has(target)) {
        errors.push({
          kind: 'unknown-alias',
          path: key,
          message: `alias "{${target}}" does not match any token`
        });
        result = null;
      } else {
        const terminal = resolve(target, [...stack, key]);
        if (terminal === null) {
          result = null;
        } else {
          if (token.type !== null && terminal.type !== null && token.type !== terminal.type) {
            errors.push({
              kind: 'type-mismatch',
              path: key,
              message: `token has $type "${token.type}" but alias target "{${target}}" resolves to "${terminal.type}"`
            });
          }
          result = {
            value: terminal.value,
            type: token.type ?? terminal.type,
            aliasOf: terminal.aliasOf ?? target
          };
        }
      }
    } else {
      // Aliases are also legal as string fields inside composite values
      // (e.g. a shadow layer's color) — substitute them through the same
      // cycle-aware resolution.
      const nested = substituteNested(token.value, key, [...stack, key]);
      result = nested.failed ? null : { value: nested.value, type: token.type };
    }

    state.set(key, 'done');
    if (result !== null) resolved.set(key, result);
    return result;
  };

  const substituteNested = (
    value: unknown,
    ownerKey: string,
    stack: string[]
  ): { value: unknown; failed: boolean } => {
    const target = aliasTarget(value);
    if (target !== null) {
      if (!flat.has(target)) {
        errors.push({
          kind: 'unknown-alias',
          path: ownerKey,
          message: `alias "{${target}}" inside a composite value does not match any token`
        });
        return { value, failed: true };
      }
      const terminal = resolve(target, stack);
      return terminal === null ? { value, failed: true } : { value: terminal.value, failed: false };
    }
    if (Array.isArray(value)) {
      let failed = false;
      const items = value.map((item) => {
        const sub = substituteNested(item, ownerKey, stack);
        failed = failed || sub.failed;
        return sub.value;
      });
      return { value: items, failed };
    }
    if (isRecord(value)) {
      let failed = false;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        const sub = substituteNested(v, ownerKey, stack);
        failed = failed || sub.failed;
        out[k] = sub.value;
      }
      return { value: out, failed };
    }
    return { value, failed: false };
  };

  for (const key of flat.keys()) resolve(key, []);
  if (errors.length > 0) return { ok: false, error: errors };
  return { ok: true, value: resolved };
};

const structuralResolve = (doc: TokenDocument): Result<RawResolvedToken[], TokenError[]> => {
  const flat = new Map<string, FlatToken>();
  flatten(doc.root, [], null, flat);
  const aliased = resolveTokenAliases(flat);
  if (!aliased.ok) return aliased;
  const out: RawResolvedToken[] = [];
  for (const [key, token] of flat) {
    const res = aliased.value.get(key);
    if (!res) continue; // unreachable when aliased.ok, kept for type safety
    const raw: RawResolvedToken = {
      path: token.path,
      type: res.type,
      value: res.value
    };
    if (token.description !== undefined) raw.description = token.description;
    if (res.aliasOf !== undefined) raw.aliasOf = res.aliasOf;
    out.push(raw);
  }
  return { ok: true, value: out };
};

/**
 * Parse + structurally resolve an untrusted DTCG subtree: groups flattened,
 * $type inherited, aliases substituted (cycles detected), values left RAW.
 * The runtime theme engine's per-$type grammar runs on the output.
 */
export const resolveDtcgTree = (
  subtree: unknown,
  source?: string
): Result<RawResolvedToken[], TokenError[]> => {
  const doc = parseTokenDocument(subtree, source);
  if (!doc.ok) return doc;
  return structuralResolve(doc.value);
};

// ── Typed value parsing (build path) ─────────────────────────────────────

const isTokenType = (t: string): t is TokenType => (TOKEN_TYPES as readonly string[]).includes(t);

const normalizeRgba = (rgba: Rgba): string => (rgba.a >= 1 ? toHex6(rgba) : toHex8(rgba));

/** Accepts "#hex"/"rgb()"/"oklch()" strings and the 2025.10 srgb object form. */
const parseColorValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const parsed = parseColor(value);
    return parsed ? normalizeRgba(parsed) : null;
  }
  if (isRecord(value)) {
    if (value.colorSpace !== undefined && value.colorSpace !== 'srgb') return null;
    if (typeof value.hex === 'string') {
      const parsed = parseColor(value.hex);
      return parsed ? normalizeRgba(parsed) : null;
    }
    if (Array.isArray(value.components) && value.components.length === 3) {
      const [r, g, b] = value.components;
      if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') return null;
      if (![r, g, b].every((u) => Number.isFinite(u) && u >= 0 && u <= 1)) return null;
      const alpha = value.alpha === undefined ? 1 : value.alpha;
      if (typeof alpha !== 'number' || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
        return null;
      }
      return normalizeRgba({
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a: alpha
      });
    }
  }
  return null;
};

const DIMENSION_STRING_RE = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)$/;

const parseDimensionValue = (value: unknown): { value: number; unit: DimensionUnit } | null => {
  if (typeof value === 'string') {
    const m = DIMENSION_STRING_RE.exec(value);
    if (!m || m[1] === undefined || m[2] === undefined) return null;
    const num = Number(m[1]);
    if (!Number.isFinite(num)) return null;
    return { value: num, unit: m[2] as DimensionUnit };
  }
  if (isRecord(value)) {
    const { value: num, unit } = value;
    if (typeof num !== 'number' || !Number.isFinite(num)) return null;
    if (unit !== 'px' && unit !== 'rem') return null;
    return { value: num, unit };
  }
  return null;
};

const parseFontFamilyValue = (value: unknown): string[] | null => {
  const list = typeof value === 'string' ? [value] : Array.isArray(value) ? value : null;
  if (!list || list.length === 0) return null;
  const families: string[] = [];
  for (const entry of list) {
    if (typeof entry !== 'string' || entry.trim().length === 0) return null;
    families.push(entry.trim());
  }
  return families;
};

const parseFontWeightValue = (value: unknown): number | null => {
  if (value === 'normal') return 400;
  if (value === 'bold') return 700;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < 1 || value > 1000) return null;
  return value;
};

const parseNumberValue = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

// CSS-idiomatic zero: lengths of 0 serialize unitless.
const serializeDimension = (d: { value: number; unit: DimensionUnit }): string =>
  d.value === 0 ? '0' : `${d.value}${d.unit}`;

const parseShadowLayer = (value: unknown): ShadowLayer | null => {
  if (!isRecord(value)) return null;
  // Shadow colors keep their authored string form (validated parseable) so
  // hand-tuned notations like `rgb(0 0 0 / 0.3)` survive emission byte-exact;
  // object-form colors normalize to hex.
  const color =
    typeof value.color === 'string' && parseColor(value.color) !== null
      ? value.color.trim()
      : parseColorValue(value.color);
  if (color === null) return null;
  const offsetX = parseDimensionValue(value.offsetX);
  const offsetY = parseDimensionValue(value.offsetY);
  const blur = parseDimensionValue(value.blur);
  if (!offsetX || !offsetY || !blur) return null;
  const spread = value.spread === undefined ? { value: 0, unit: 'px' as const } : parseDimensionValue(value.spread);
  if (!spread) return null;
  const inset = value.inset === undefined ? false : value.inset;
  if (typeof inset !== 'boolean') return null;
  return {
    color,
    offsetX,
    offsetY,
    blur,
    spread,
    inset
  };
};

const parseShadowValue = (value: unknown): ShadowLayer[] | null => {
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0) return null;
  const layers: ShadowLayer[] = [];
  for (const entry of list) {
    const layer = parseShadowLayer(entry);
    if (!layer) return null;
    layers.push(layer);
  }
  return layers;
};

const parseTokenValue = (type: TokenType, value: unknown): TokenValue | null => {
  switch (type) {
    case 'color': {
      const hex = parseColorValue(value);
      return hex === null ? null : { kind: 'color', hex };
    }
    case 'dimension': {
      const dim = parseDimensionValue(value);
      return dim === null ? null : { kind: 'dimension', ...dim };
    }
    case 'fontFamily': {
      const families = parseFontFamilyValue(value);
      return families === null ? null : { kind: 'fontFamily', families };
    }
    case 'fontWeight': {
      const weight = parseFontWeightValue(value);
      return weight === null ? null : { kind: 'fontWeight', weight };
    }
    case 'number': {
      const num = parseNumberValue(value);
      return num === null ? null : { kind: 'number', value: num };
    }
    case 'shadow': {
      const layers = parseShadowValue(value);
      return layers === null ? null : { kind: 'shadow', layers };
    }
  }
};

const describeValue = (value: unknown): string => {
  const json = JSON.stringify(value);
  if (json === undefined) return String(value);
  return json.length > 64 ? `${json.slice(0, 64)}…` : json;
};

/**
 * Full resolution for the token build: structural pass + typed value parsing.
 * Every token must end up with a known $type and a value its type's parser
 * accepts — anything else is an error (fail-closed), and all errors across
 * the document are collected before failing.
 */
export const resolveTokens = (doc: TokenDocument): Result<ResolvedTokens, TokenError[]> => {
  const structural = structuralResolve(doc);
  if (!structural.ok) return structural;

  const errors: TokenError[] = [];
  const out = new Map<string, ResolvedToken>();
  for (const raw of structural.value) {
    const path = raw.path.join('.');
    if (raw.type === null) {
      errors.push({
        kind: 'missing-type',
        path,
        message: 'token has no $type (own or inherited from a group)'
      });
      continue;
    }
    if (!isTokenType(raw.type)) {
      errors.push({
        kind: 'unknown-type',
        path,
        message: `unsupported $type "${raw.type}" (supported: ${TOKEN_TYPES.join(', ')})`
      });
      continue;
    }
    const value = parseTokenValue(raw.type, raw.value);
    if (value === null) {
      errors.push({
        kind: 'invalid-value',
        path,
        message: `value ${describeValue(raw.value)} is not a valid ${raw.type}`
      });
      continue;
    }
    const token: ResolvedToken = { path, type: raw.type, value };
    if (raw.description !== undefined) token.description = raw.description;
    if (raw.aliasOf !== undefined) token.aliasOf = raw.aliasOf;
    out.set(path, token);
  }

  if (errors.length > 0) return { ok: false, error: errors };
  return { ok: true, value: out };
};

// ── Serialization ────────────────────────────────────────────────────────

const GENERIC_FAMILIES = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'system-ui',
  'ui-monospace',
  'ui-sans-serif',
  'ui-serif',
  'cursive',
  'fantasy'
]);

const cssFamily = (name: string): string =>
  GENERIC_FAMILIES.has(name) ? name : `'${name}'`;

const shadowLayerCss = (l: ShadowLayer): string => {
  const spreadCss = serializeDimension(l.spread);
  const spread = spreadCss === '0' ? '' : ` ${spreadCss}`;
  return `${l.inset ? 'inset ' : ''}${serializeDimension(l.offsetX)} ${serializeDimension(l.offsetY)} ${serializeDimension(l.blur)}${spread} ${l.color}`;
};

/** Serialize a resolved value for CSS custom properties. */
export const toCss = (v: TokenValue): string => {
  switch (v.kind) {
    case 'color':
      return v.hex;
    case 'dimension':
      return serializeDimension(v);
    case 'fontFamily':
      return v.families.map(cssFamily).join(', ');
    case 'fontWeight':
      return String(v.weight);
    case 'number':
      return String(v.value);
    case 'shadow':
      return v.layers.map(shadowLayerCss).join(', ');
  }
};

/** Pixels-per-rem used when flattening dimensions for Qt (QSS has no rem). */
export const QT_PX_PER_REM = 16;

const qtLength = (value: number, unit: DimensionUnit): string =>
  value === 0 ? '0' : unit === 'rem' ? `${value * QT_PX_PER_REM}px` : `${value}px`;

const shadowLayerQt = (l: ShadowLayer): string => {
  const spreadQt = qtLength(l.spread.value, l.spread.unit);
  const spread = spreadQt === '0' ? '' : ` ${spreadQt}`;
  return `${l.inset ? 'inset ' : ''}${qtLength(l.offsetX.value, l.offsetX.unit)} ${qtLength(l.offsetY.value, l.offsetY.unit)} ${qtLength(l.blur.value, l.blur.unit)}${spread} ${l.color}`;
};

/** Serialize a resolved value for QSS / Qt consumers (rem flattened to px). */
export const toQt = (v: TokenValue): string => {
  switch (v.kind) {
    case 'dimension':
      return qtLength(v.value, v.unit);
    case 'fontFamily':
      return v.families.map((f) => (GENERIC_FAMILIES.has(f) ? f : `"${f}"`)).join(', ');
    case 'shadow':
      return v.layers.map(shadowLayerQt).join(', ');
    default:
      return toCss(v);
  }
};
