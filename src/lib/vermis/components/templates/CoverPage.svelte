<!--
  Implements layform document-tier Patterns 1 (Cover as Single Dominant Focal
  Panel), 2 (Outer Double-Line Border as Document Boundary Marker), 10
  (Cover-Weight Opening, Plain-Weight Interior), 23 (Title-Block Assembly), 24
  (Two-Voice Page Header), 29 (Volume/Edition Badge), 30 (Category Icon Strip
  as Document Classifier). See patterns/01-document-
  patterns.md and the direct worked spec this component is a 1:1 translation
  of: /home/svnbjrn/dev/layform/templates/8.1-cover-page.md.

  Honesty note — category icon mapping (Pattern 30). layform's own asset set
  (assets/7.5-divider-glyph-set.svg) never built a dedicated category-
  classifier icon sprite; its six real symbols are bound to document-state/
  lore occasions (loading, empty-state, error, mortal-content, nocturnal
  accent, section-banner divider — see that file's own header comment), not
  a "guide/reference/report/changelog/archive" taxonomy. The CATEGORY_ICON
  map below is a digital-scope invention pairing the five example category
  names from this template's own frontmatter schema onto five of the six
  real glyphs (icon-skull-border-tile is deliberately excluded — its own
  header comment reserves it exclusively for Pattern 117's mortal-content
  gate). An unrecognized category name falls back to 'radiating-burst'
  rather than throwing.

  Honesty note — volume badge (Pattern 29). The plan's own text suggests
  reusing Badge.svelte for this marker, but Badge's `icon` prop is a closed
  union of the six lore glyphs plus 'rosette' — none of which mean anything
  as a "volume number" marker. Forcing an unrelated glyph onto a numeral
  badge would misrepresent Pattern 62's shared-sprite discipline (a glyph
  reference should mean something), so this template renders the volume
  badge directly as a plain circular numeral chip instead of routing it
  through Badge.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Badge from '../atoms/Badge.svelte';

  interface Props {
    kicker?: string;
    title: string;
    subtitle?: string;
    credit?: string;
    volume?: string;
    volumeAccent?: string;
    category?: string;
    categories?: string[];
    borderAccent?: string;
    hero: Snippet;
  }

  let {
    kicker,
    title,
    subtitle,
    credit,
    volume,
    volumeAccent = 'primary-2',
    category,
    categories,
    borderAccent = 'accent-primary-1',
    hero
  }: Props = $props();

  // Pattern 29: `volume_accent` is a bare suffix onto the accent family
  // (e.g. "primary-2" -> --layform-accent-primary-2), matching the
  // template's own frontmatter example verbatim.
  const volumeAccentVar = $derived(`var(--layform-accent-${volumeAccent})`);
  // Pattern 2: `border_accent` already carries the "accent-" segment (e.g.
  // "accent-primary-1" -> --layform-accent-primary-1), also matching the
  // template's own frontmatter example verbatim — the two props resolve
  // through different prefixing rules on purpose, not an inconsistency.
  const borderAccentVar = $derived(`var(--layform-${borderAccent})`);

  // Pattern 30: icons column is present only when a category is set; it
  // collapses to zero width (not merely hidden) otherwise.
  const activeCategories = $derived(categories ?? (category ? [category] : []));
  const hasIcons = $derived(activeCategories.length > 0);

  type CoverBadgeIcon =
    | 'spiral-sigil'
    | 'radiating-burst'
    | 'eye-in-circle'
    | 'crescent-moon'
    | 'serpentine-divider';

  const CATEGORY_ICON: Record<string, CoverBadgeIcon> = {
    guide: 'spiral-sigil',
    reference: 'eye-in-circle',
    report: 'radiating-burst',
    changelog: 'serpentine-divider',
    archive: 'crescent-moon'
  };

  function categoryIcon(name: string): CoverBadgeIcon {
    return CATEGORY_ICON[name] ?? 'radiating-burst';
  }
</script>

<div
  data-sv="cover-page"
  style:grid-template-columns={hasIcons ? '3.5rem 1fr' : '0 1fr'}
  style:--cover-border-accent={borderAccentVar}
>
  {#if hasIcons}
    <!-- Pattern 30: active category at full accent opacity, the rest of the
         fixed set at reduced opacity — a single accent family, two steps. -->
    <div data-sv="cover-icons">
      {#each activeCategories as name (name)}
        <Badge
          icon={categoryIcon(name)}
          shape="square"
          size="sm"
          emphasis={name === category ? 'active' : 'muted'}
        />
      {/each}
    </div>
  {/if}

  {#if volume}
    <!-- Pattern 29: adjacent to, not inside, the title-block proper. -->
    <div data-sv="cover-badge" style:--badge-accent={volumeAccentVar}>{volume}</div>
  {/if}

  {#if kicker}
    <p data-sv="cover-kicker">{kicker}</p>
  {/if}

  <h1 data-sv="cover-title">{title}</h1>

  {#if subtitle}
    <p data-sv="cover-subtitle">{subtitle}</p>
  {/if}

  <div data-sv="cover-hero">{@render hero()}</div>

  {#if credit}
    <p data-sv="cover-credit">{credit}</p>
  {/if}
</div>

<style>
  /* Pattern 1/2/23: single CSS grid, one 1fr hero row absorbing all
     remaining space, outer double-line boundary applied once at the root. */
  [data-sv='cover-page'] {
    display: grid;
    grid-template-rows: auto auto auto auto 1fr auto;
    grid-template-areas:
      'icons badge'
      'icons kicker'
      'icons title'
      'icons subtitle'
      'hero hero'
      'credit credit';
    outline: var(--layform-border-hairline) solid var(--cover-border-accent);
    border: var(--layform-border-medium) solid transparent;
    background: var(--layform-register-threshold);
    padding: var(--layform-space-4);
    gap: var(--layform-space-2);
  }

  [data-sv='cover-icons'] {
    grid-area: icons;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--layform-space-2);
  }

  [data-sv='cover-badge'] {
    grid-area: badge;
    justify-self: start;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--layform-icon-lg);
    height: var(--layform-icon-lg);
    border-radius: 50%;
    border: var(--layform-border-thin) solid var(--badge-accent);
    color: var(--badge-accent);
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
  }

  /* Pattern 24: functional/categorical text — marginalia voice. */
  [data-sv='cover-kicker'] {
    grid-area: kicker;
    margin: 0;
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
    color: var(--layform-parchment-2);
  }

  /* Pattern 24: ornamental title text — display voice. */
  [data-sv='cover-title'] {
    grid-area: title;
    margin: 0;
    font-family: var(--layform-font-display);
    font-weight: var(--layform-weight-display-h1);
    color: var(--layform-parchment-1);
  }
  [data-sv='cover-subtitle'] {
    grid-area: subtitle;
    margin: 0;
    font-family: var(--layform-font-display);
    font-weight: var(--layform-weight-display-h3);
    color: var(--layform-parchment-2);
  }

  [data-sv='cover-hero'] {
    grid-area: hero;
  }

  [data-sv='cover-credit'] {
    grid-area: credit;
    margin: 0;
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
    color: var(--layform-parchment-2);
  }
</style>
