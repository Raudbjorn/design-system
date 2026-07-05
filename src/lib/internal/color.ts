// sRGB ↔ OKLab/OKLCH conversion, gamut clamping, and oklab mixing.
//
// Hand-rolled from Björn Ottosson's published matrices (the same math CSS
// Color 4 specifies for oklch() and color-mix(in oklab, …)) so the package
// stays dependency-free. Cross-validated against culori in color.test.ts —
// if you touch a matrix constant, the oracle test is what catches the typo.

export interface Rgb {
  r: number; // 0–255 integer
  g: number;
  b: number;
}

export interface Rgba extends Rgb {
  a: number; // 0–1
}

export interface Oklch {
  l: number; // 0–1
  c: number; // >= 0 (sRGB tops out well under 0.4)
  h: number; // degrees, [0, 360)
}

interface Lab {
  l: number;
  a: number;
  b: number;
}

const srgbToLinear = (u: number): number =>
  u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);

const linearToSrgb = (u: number): number =>
  u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055;

const linearSrgbToOklab = (r: number, g: number, b: number): Lab => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  };
};

const oklabToLinearSrgb = (lab: Lab): { r: number; g: number; b: number } => {
  const l = (lab.l + 0.3963377774 * lab.a + 0.2158037573 * lab.b) ** 3;
  const m = (lab.l - 0.1055613458 * lab.a - 0.0638541728 * lab.b) ** 3;
  const s = (lab.l - 0.0894841775 * lab.a - 1.291485548 * lab.b) ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  };
};

const rgbToLab = ({ r, g, b }: Rgb): Lab =>
  linearSrgbToOklab(srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));

const labToLch = (lab: Lab): Oklch => {
  const c = Math.hypot(lab.a, lab.b);
  const h = c < 1e-7 ? 0 : ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;
  return { l: lab.l, c, h };
};

const lchToLab = ({ l, c, h }: Oklch): Lab => {
  const rad = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(rad), b: c * Math.sin(rad) };
};

export const rgbToOklch = (rgb: Rgb): Oklch => labToLch(rgbToLab(rgb));

// Slightly generous so 8-bit round-trips don't flap at the gamut edge.
const GAMUT_EPS = 1e-6;

const inGamut = (lin: { r: number; g: number; b: number }): boolean =>
  lin.r >= -GAMUT_EPS &&
  lin.r <= 1 + GAMUT_EPS &&
  lin.g >= -GAMUT_EPS &&
  lin.g <= 1 + GAMUT_EPS &&
  lin.b >= -GAMUT_EPS &&
  lin.b <= 1 + GAMUT_EPS;

/**
 * Largest chroma at this (l, h) that stays inside sRGB — chroma bisection at
 * fixed lightness and hue, so clamping never shifts a color's perceived
 * lightness (contrast ratios solved upstream keep holding downstream).
 *
 * This is the strict-L/H-preserving variant. `gamutMapOklch` is the default
 * MINDE gamut map used by `oklchToRgb`; it trades up to a JND of L/H for a
 * little more chroma. Use this one only when exact L/H must be preserved.
 */
export const clampChromaToGamut = (color: Oklch): Oklch => {
  const l = Math.min(1, Math.max(0, color.l));
  const h = ((color.h % 360) + 360) % 360;
  const c = Math.max(0, color.c);
  if (inGamut(oklabToLinearSrgb(lchToLab({ l, c, h })))) return { l, c, h };
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklabToLinearSrgb(lchToLab({ l, c: mid, h })))) lo = mid;
    else hi = mid;
  }
  return { l, c: lo, h };
};

const clamp01 = (u: number): number => Math.min(1, Math.max(0, u));

const linearToChannel = (u: number): number => Math.round(clamp01(linearToSrgb(clamp01(u))) * 255);

/** ΔEok — Euclidean distance in Oklab. Equals CSS Color 4's deltaEOK and
 * culori's differenceEuclidean('oklch'). */
const deltaEOK = (a: Lab, b: Lab): number => Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);

/** CSS "clip to sRGB": clamp linear channels to [0, 1] (monotonicity makes
 * this identical to clamping gamma channels), returned in Oklab. Continuous —
 * NOT 8-bit rounded, because the ΔE test must run pre-rounding to match the
 * browser / culori. */
const clipToSrgbLab = (lab: Lab): Lab => {
  const lin = oklabToLinearSrgb(lab);
  return linearSrgbToOklab(clamp01(lin.r), clamp01(lin.g), clamp01(lin.b));
};

/**
 * CSS Color 4 / colorjs.io MINDE gamut map (minimum delta-E): binary-search
 * chroma in OKLCH at fixed L/H; accept the sRGB-clipped candidate once it is
 * within the JND of the reduced-chroma candidate — retaining marginally more
 * chroma than pure reduction. Mirrors culori's toGamut('rgb', 'oklch').
 */
export const gamutMapOklch = (color: Oklch): Oklch => {
  const l = clamp01(color.l);
  const h = ((color.h % 360) + 360) % 360;
  const c0 = Math.max(0, color.c);
  if (l >= 1) return { l: 1, c: 0, h }; // white pole (culori parity)
  if (l <= 0) return { l: 0, c: 0, h }; // black pole
  if (inGamut(oklabToLinearSrgb(lchToLab({ l, c: c0, h })))) return { l, c: c0, h };

  const JND = 0.02;
  const EPSILON = 0.0001; // (0.4 - 0) / 4000, culori's oklch chroma step
  let start = 0;
  let end = c0;
  let mid = c0;
  let clippedLab: Lab = clipToSrgbLab(lchToLab({ l, c: c0, h }));
  while (end - start > EPSILON) {
    mid = (start + end) / 2;
    const candLab = lchToLab({ l, c: mid, h });
    const inG = inGamut(oklabToLinearSrgb(candLab));
    clippedLab = clipToSrgbLab(candLab);
    if (inG || deltaEOK(candLab, clippedLab) <= JND) start = mid;
    else end = mid;
  }
  return inGamut(oklabToLinearSrgb(lchToLab({ l, c: mid, h })))
    ? { l, c: mid, h }
    : labToLch(clippedLab);
};

/** OKLCH → sRGB, MINDE gamut-mapped and rounded to 8-bit. */
export const oklchToRgb = (color: Oklch): Rgb => {
  const lin = oklabToLinearSrgb(lchToLab(gamutMapOklch(color)));
  return { r: linearToChannel(lin.r), g: linearToChannel(lin.g), b: linearToChannel(lin.b) };
};

const hex2 = (n: number): string => n.toString(16).padStart(2, '0');

export const toHex6 = ({ r, g, b }: Rgb): string => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

export const toHex8 = ({ r, g, b, a }: Rgba): string =>
  `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(Math.round(clamp01(a) * 255))}`;

export const oklchToHex = (color: Oklch): string => toHex6(oklchToRgb(color));

export const hexToOklch = (hex: string): Oklch | null => {
  const parsed = parseColor(hex);
  return parsed ? rgbToOklch(parsed) : null;
};

// ── Parsing ──────────────────────────────────────────────────────────────
// A deliberate subset of CSS color syntax: hex, rgb()/rgba(), oklch().
// Everything else (named colors, var(), color-mix(), escapes) returns null —
// callers treat null as "rejected", so the grammar is the security boundary.

const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;

// Plain decimal only — no exponents, no infinities. Optional % or deg unit.
const NUM_RE = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(%|deg)?$/;

interface NumToken {
  value: number;
  unit: '' | '%' | 'deg';
}

const parseNum = (token: string): NumToken | null => {
  const m = NUM_RE.exec(token);
  if (!m || m[1] === undefined) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  return { value, unit: (m[2] as NumToken['unit'] | undefined) ?? '' };
};

const parseHex = (s: string): Rgba | null => {
  const m = HEX_RE.exec(s);
  const body = m?.[1];
  if (body === undefined) return null;
  if (body.length === 3 || body.length === 4) {
    const digits = body.split('').map((d) => parseInt(d + d, 16));
    const [r, g, b, a] = digits;
    if (r === undefined || g === undefined || b === undefined) return null;
    return { r, g, b, a: a === undefined ? 1 : a / 255 };
  }
  const r = parseInt(body.slice(0, 2), 16);
  const g = parseInt(body.slice(2, 4), 16);
  const b = parseInt(body.slice(4, 6), 16);
  const a = body.length === 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
};

const channel255 = (token: string): number | null => {
  const n = parseNum(token);
  if (!n || n.unit === 'deg') return null;
  const raw = n.unit === '%' ? (n.value / 100) * 255 : n.value;
  return Math.round(Math.min(255, Math.max(0, raw)));
};

const alpha01 = (token: string): number | null => {
  const n = parseNum(token);
  if (!n || n.unit === 'deg') return null;
  const raw = n.unit === '%' ? n.value / 100 : n.value;
  return clamp01(raw);
};

const splitWs = (s: string): string[] => s.split(/\s+/).filter((t) => t.length > 0);

const parseRgbFunc = (s: string): Rgba | null => {
  const open = s.indexOf('(');
  if (open < 0 || !s.endsWith(')')) return null;
  const inner = s.slice(open + 1, -1).trim();
  if (inner.length === 0) return null;

  let channelTokens: string[];
  let alphaToken: string | undefined;
  if (inner.includes(',')) {
    // legacy: rgb(r, g, b) / rgba(r, g, b, a)
    const parts = inner.split(',').map((p) => p.trim());
    if (parts.length !== 3 && parts.length !== 4) return null;
    channelTokens = parts.slice(0, 3);
    alphaToken = parts[3];
  } else {
    // modern: rgb(r g b [/ a])
    const [channels, alpha, extra] = inner.split('/').map((p) => p.trim());
    if (extra !== undefined || channels === undefined) return null;
    channelTokens = splitWs(channels);
    if (channelTokens.length !== 3) return null;
    alphaToken = alpha;
  }

  const [r, g, b] = channelTokens.map(channel255);
  if (r === null || g === null || b === null || r === undefined || g === undefined || b === undefined) {
    return null;
  }
  let a = 1;
  if (alphaToken !== undefined) {
    const parsed = alpha01(alphaToken);
    if (parsed === null) return null;
    a = parsed;
  }
  return { r, g, b, a };
};

const parseOklchFunc = (s: string): Rgba | null => {
  const open = s.indexOf('(');
  if (open < 0 || !s.endsWith(')')) return null;
  const inner = s.slice(open + 1, -1).trim();
  const [channels, alpha, extra] = inner.split('/').map((p) => p.trim());
  if (extra !== undefined || channels === undefined) return null;
  const tokens = splitWs(channels);
  if (tokens.length !== 3) return null;
  const [lTok, cTok, hTok] = tokens;
  if (lTok === undefined || cTok === undefined || hTok === undefined) return null;

  const lNum = parseNum(lTok);
  if (!lNum || lNum.unit === 'deg') return null;
  const l = clamp01(lNum.unit === '%' ? lNum.value / 100 : lNum.value);

  const cNum = parseNum(cTok);
  if (!cNum || cNum.unit === 'deg') return null;
  // Percentage chroma is defined as % of 0.4 in CSS Color 4.
  const c = Math.min(0.5, Math.max(0, cNum.unit === '%' ? (cNum.value / 100) * 0.4 : cNum.value));

  const hNum = parseNum(hTok);
  if (!hNum || hNum.unit === '%') return null;
  const h = ((hNum.value % 360) + 360) % 360;

  let a = 1;
  if (alpha !== undefined) {
    const parsed = alpha01(alpha);
    if (parsed === null) return null;
    a = parsed;
  }
  const rgb = oklchToRgb({ l, c, h });
  return { ...rgb, a };
};

/**
 * Parse a color from the accepted subset (hex 3/4/6/8, rgb()/rgba(),
 * oklch()). Returns null for anything else — including named colors, var(),
 * color-mix(), escapes, and oversized input. oklch() input is gamut-clamped
 * to sRGB during conversion.
 */
export const parseColor = (input: string): Rgba | null => {
  if (typeof input !== 'string') return null;
  if (input.length === 0 || input.length > 64) return null;
  const s = input.trim().toLowerCase();
  if (s.startsWith('#')) return parseHex(s);
  if (s.startsWith('rgb(') || s.startsWith('rgba(')) return parseRgbFunc(s);
  if (s.startsWith('oklch(')) return parseOklchFunc(s);
  return null;
};

/**
 * Mirror of CSS `color-mix(in oklab, a, b weightB)` for opaque colors:
 * rectangular-oklab lerp, then channel-clipped back to sRGB. Clipping (vs the
 * browser's paint-time handling) agrees within ±1/255 for mixes of in-gamut
 * endpoints. Throws on unparseable input — build-time inputs are already
 * validated, so a bad hex here is a programmer error, not user data.
 */
export const mixOklab = (hexA: string, hexB: string, weightB: number): string => {
  const pa = parseColor(hexA);
  const pb = parseColor(hexB);
  if (!pa) throw new TypeError(`mixOklab: unparseable color "${hexA}"`);
  if (!pb) throw new TypeError(`mixOklab: unparseable color "${hexB}"`);
  const w = clamp01(weightB);
  const la = rgbToLab(pa);
  const lb = rgbToLab(pb);
  const lin = oklabToLinearSrgb({
    l: la.l * (1 - w) + lb.l * w,
    a: la.a * (1 - w) + lb.a * w,
    b: la.b * (1 - w) + lb.b * w
  });
  return toHex6({ r: linearToChannel(lin.r), g: linearToChannel(lin.g), b: linearToChannel(lin.b) });
};
