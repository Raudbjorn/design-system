<!--
  Implements layform document-tier Patterns 6 (Section Divider: Full-Bleed
  Threshold Spread), 7 (Two-Tier Section Hierarchy: Divider vs. Banner), 8
  (Title-Banner as Primary Heading Landmark), 9 (Density Tier Scale), 10
  (Cover-Weight Opening, Plain-Weight Interior), and component-tier Pattern
  117 (Skull Motif: Content-Gated Border Strip, `tone="mortal"` only). See
  patterns/01-document-patterns.md (Patterns
  6/7/8/9/10) and the direct worked spec this component translates 1:1,
  /home/svnbjrn/dev/layform/templates/8.2-section-divider.md.

  Frontmatter-level gating (Pattern 6/7's "only legal at h1 depth") is a
  page-authoring-tool concern outside this component's own runtime — a
  Svelte component has no visibility into the document's own outline depth,
  so no runtime check is added here; document that boundary rather than
  fake-enforcing it.

  Pattern 117 asset correction: the plan's own text names
  `assets/7.7-border-techniques.svg`'s "skull tile" for the mortal-content
  border strip, but that file (Patterns 99/101/102: braid, distress-marks,
  scallop) has no skull symbol. The actual skull-motif tile is
  `icon-skull-border-tile` in `assets/7.5-divider-glyph-set.svg` — that
  file's own header comment reserves it "gated behind an explicit
  content-type flag ... applied only to document-tier Pattern 6's full-bleed
  Section Divider ... never a general-purpose icon," which is exactly this
  prop's own gate. Rendered as a fixed-count repeating `<use>` strip (no
  CSS-only way to auto-tile a `<symbol>`, as opposed to an SVG `<pattern>`,
  along an edge without JS measuring the container).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Heading from '../atoms/Heading.svelte';

  interface Props {
    title: string;
    subtitle?: Snippet;
    tone?: 'mortal';
    hero: Snippet;
  }

  let { title, subtitle, tone, hero }: Props = $props();

  const SKULL_TILE_COUNT = 16;
  const skullTiles = Array.from({ length: SKULL_TILE_COUNT });
  // Resolved against this module's real runtime URL — a plain relative
  // string would be resolved by the browser against the consuming page's
  // own URL instead, and 404 as soon as this component is used from
  // anywhere but its own source directory.
  const SKULL_TILE_HREF = `${new URL('../../assets/divider-glyph-set.svg', import.meta.url).href}#icon-skull-border-tile`;
</script>

<section data-sv="section-divider" data-tone={tone}>
  {#if tone === 'mortal'}
    <!-- Pattern 117: content-gated border strip, tinted crimson (the
         subordinate red-magenta register), never the primary orange-coral
         accent — keeps the motif visually distinct from the divider's
         default accent border. -->
    <div data-sv="section-divider-skull-strip" aria-hidden="true">
      {#each skullTiles as _, i (i)}
        <svg data-sv="section-divider-skull-tile">
          <use href={SKULL_TILE_HREF} />
        </svg>
      {/each}
    </div>
  {/if}

  <div data-sv="section-divider-hero">{@render hero()}</div>

  <div data-sv="section-divider-titleband">
    <Heading level={2}>{title}</Heading>
    {#if subtitle}
      <p data-sv="section-divider-subtitle">{@render subtitle()}</p>
    {/if}
  </div>
</section>

<style>
  /* Pattern 6: a single dominant CSS Grid block, not the body's
     multi-column grid. Background on the threshold register, never reused
     as body text color in the same context. */
  [data-sv='section-divider'] {
    position: relative;
    display: grid;
    grid-template-rows: 1fr auto;
    background: var(--layform-register-threshold);
    /* Pattern 10 at density 3: full multi-color opening treatment — primary
       accent for the main rule, large-area attenuated step for the frame. */
    border: var(--layform-border-heavy) solid var(--layform-accent-primary-1);
    outline: var(--layform-border-thin) solid var(--layform-accent-large);
    outline-offset: calc(var(--layform-border-heavy) * -1);
  }

  [data-sv='section-divider-hero'] {
    grid-row: 1;
  }

  [data-sv='section-divider-titleband'] {
    grid-row: 2;
    padding: var(--layform-space-4);
    color: var(--layform-parchment-1);
  }

  /* Pattern 24 (via Heading.svelte's own display-voice styling) plus this
     template's own marginalia-voice subtitle. */
  [data-sv='section-divider-subtitle'] {
    margin: 0;
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
    color: var(--layform-parchment-2);
  }

  [data-sv='section-divider-skull-strip'] {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    display: flex;
    justify-content: space-evenly;
    padding-block: var(--layform-space-1);
    background: var(--layform-ink-1);
    z-index: var(--layform-z-ornament);
  }
  [data-sv='section-divider-skull-tile'] {
    width: var(--layform-icon-sm);
    height: var(--layform-icon-sm);
    color: var(--layform-accent-crimson-1);
  }
</style>
