<!--
  Implements layform Pattern 51 (Icon Badge — The Solo Roundel).
  Implements layform Pattern 62 (SVG Symbol Sprite as Shared Icon Substrate).
  Implements layform Pattern 63 (Icon-Label Baseline Pairing).
  Implements layform Pattern 64 (Icon Emphasis State — Active vs. Muted Rendering).
  Implements layform Pattern 89 (Icon Construction Canvas — 24x24, referenced via
  --layform-icon-md in tokens/scale.css).
  See patterns/02-component-patterns.md (Patterns 51/62/63/64).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  type BadgeIcon =
    | 'spiral-sigil'
    | 'radiating-burst'
    | 'eye-in-circle'
    | 'skull-border-tile'
    | 'crescent-moon'
    | 'serpentine-divider'
    | 'rosette';

  interface Props {
    icon: BadgeIcon;
    shape?: 'circle' | 'square';
    size?: 'sm' | 'md' | 'lg';
    emphasis?: 'active' | 'muted';
    label?: Snippet;
  }

  let { icon, shape = 'circle', size = 'md', emphasis = 'active', label }: Props = $props();

  // Pattern 62: one shared sprite substrate per symbol family — the six real
  // divider-glyph-set IDs plus the ornate-frame-border rosette, referenced via
  // `<use href="...">`. A plain relative string ("../../assets/x.svg#id")
  // would be resolved by the BROWSER against the consuming page's own URL,
  // not this file's location — confirmed by direct testing, it 404s as soon
  // as this component is used from anywhere but its own source directory.
  // `new URL(..., import.meta.url)` resolves against THIS module's real
  // runtime URL instead (Vite's documented "New URL" asset pattern), works
  // identically in dev, in this package's own build, and once published.
  const DIVIDER_GLYPH_SET_URL = new URL('../../assets/divider-glyph-set.svg', import.meta.url).href;
  const ORNATE_FRAME_BORDER_URL = new URL('../../assets/ornate-frame-border.svg', import.meta.url).href;

  const ICON_HREF: Record<BadgeIcon, string> = {
    'spiral-sigil': `${DIVIDER_GLYPH_SET_URL}#icon-spiral-sigil`,
    'radiating-burst': `${DIVIDER_GLYPH_SET_URL}#icon-radiating-burst`,
    'eye-in-circle': `${DIVIDER_GLYPH_SET_URL}#icon-eye-in-circle`,
    'skull-border-tile': `${DIVIDER_GLYPH_SET_URL}#icon-skull-border-tile`,
    'crescent-moon': `${DIVIDER_GLYPH_SET_URL}#icon-crescent-moon`,
    'serpentine-divider': `${DIVIDER_GLYPH_SET_URL}#icon-serpentine-divider`,
    rosette: `${ORNATE_FRAME_BORDER_URL}#rosette`
  };

  const iconHref = $derived(ICON_HREF[icon]);
</script>

{#if label}
  <!-- Pattern 63: 1em/vertical-center icon+label pairing. -->
  <span data-sv="icon-label">
    <svg data-sv="badge" data-shape={shape} data-size={size} data-emphasis={emphasis} aria-hidden="true">
      <use href={iconHref} />
    </svg>
    <span data-sv="badge-label">{@render label()}</span>
  </span>
{:else}
  <svg data-sv="badge" data-shape={shape} data-size={size} data-emphasis={emphasis} aria-hidden="true">
    <use href={iconHref} />
  </svg>
{/if}

<style>
  [data-sv='badge'] {
    display: inline-block;
    flex-shrink: 0;
  }
  [data-size='sm'] {
    width: var(--layform-icon-sm);
    height: var(--layform-icon-sm);
  }
  [data-size='md'] {
    width: var(--layform-icon-md);
    height: var(--layform-icon-md);
  }
  [data-size='lg'] {
    width: var(--layform-icon-lg);
    height: var(--layform-icon-lg);
  }

  [data-shape='circle'] {
    border-radius: 50%;
    border: var(--layform-border-hairline) solid var(--layform-accent-secondary);
  }
  [data-shape='square'] {
    border-radius: var(--layform-radius-none);
    border: var(--layform-border-hairline) solid var(--layform-accent-secondary);
  }

  [data-emphasis='active'] {
    opacity: 1;
  }
  /* Pattern 64: a fixed opacity value verified against a contrast floor for
     the surrounding background, never an arbitrary eyeballed reduction. 0.6
     was chosen empirically to keep a dark-ink glyph at >=3:1 against
     --layform-register-body (light parchment) — see
     scripts/check-contrast.mjs for the underlying WCAG math this was
     sanity-checked against (icon opacity is not one of that script's 7
     gated color-pair contrast checks). */
  [data-emphasis='muted'] {
    opacity: 0.6;
  }

  [data-sv='icon-label'] {
    display: inline-flex;
    align-items: center;
    gap: 1ch;
  }
  [data-sv='badge-label'] {
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-body);
    color: var(--layform-ink);
  }
</style>
