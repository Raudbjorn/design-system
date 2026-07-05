// Placeholder integrity — the i18n QA check that a world override preserves
// exactly the interpolation variables its slot requires. Simple named
// `{identifier}` only; ICU plural/select is a documented non-goal (no current
// key has placeholders). When the first plural key lands, evolve
// VernacularSpec.placeholders to a signature type and plug a parseIcuSubset
// here — diffPlaceholders is the exact insertion point.

const PLACEHOLDER_RE = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g; // {count} yes; {} and {1} ignored

/** Unique placeholder names, in first-seen order. */
export const extractPlaceholders = (text: string): string[] => {
  const seen = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const name = match[1];
    if (name !== undefined) seen.add(name);
  }
  return [...seen];
};

export interface PlaceholderDiff {
  /** In the required set but not the override — a substitution hole. */
  missing: string[];
  /** In the override but not required — renders literally / never filled. */
  extra: string[];
}

export const diffPlaceholders = (
  required: readonly string[],
  found: readonly string[]
): PlaceholderDiff => ({
  missing: required.filter((r) => !found.includes(r)),
  extra: found.filter((f) => !required.includes(f))
});
