<!--
  Implements layform Pattern 34 (Full-Bleed Hero Frame — see
  patterns/01-document-patterns.md), Pattern 115
  (Illustration-Frame Scroll Reveal — Single-Stage, Observer-Gated), Pattern 15
  (Mixed-Media Reconciliation — photo filter), Pattern 105 (Halftone-Dot Field) and
  Pattern 106 (Cross-Hatch Shading) as optional overlay textures, Pattern 66
  (Frame-and-Caption Compound). Detail-tier patterns (115, 105, 106) are in
  patterns/04-detail-patterns.md; direct worked CSS/markup
  precedent is templates/8.5-full-bleed-illustration-frame.md.

  Integration requirement, not a bug: Pattern 34's own solution text specifies "a
  named `full-bleed` track in a CSS Grid template" — this component sets
  `grid-column: full-bleed` on its root but has no way to define that named grid
  line itself; the CONSUMING PAGE must declare a `full-bleed` column in its own
  grid-template-columns for this to take effect. Outside such a grid this rule is
  simply inert (Pattern 41's standard content-column context).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    kind?: 'illustration' | 'photo';
    textureOverlay?: 'halftone-1' | 'halftone-2' | 'halftone-3' | 'hatch-medium';
    caption?: Snippet;
  }

  let { children, kind = 'illustration', textureOverlay, caption }: Props = $props();

  // Pattern 115: single-stage, observer-gated, fire-once reveal.
  let visible = $state(false);
  let root: HTMLElement | undefined = $state();

  $effect(() => {
    if (!root) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Pattern 115's own text: render in the final resting state with zero
      // transition when reduced motion is requested — never observe at all.
      visible = true;
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      // Graceful degrade for an environment with no IntersectionObserver
      // support: show the frame immediately rather than leaving it hidden.
      visible = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible = true;
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(root);

    return () => observer.disconnect();
  });
</script>

<figure bind:this={root} data-sv="hero-frame" data-kind={kind} data-visible={visible}>
  <div data-sv="hero-frame-art">
    {@render children()}
    {#if textureOverlay}
      <div data-sv="hero-frame-texture" data-texture={textureOverlay} aria-hidden="true"></div>
    {/if}
  </div>
  {#if caption}
    <figcaption data-sv="hero-frame-caption">
      {@render caption()}
    </figcaption>
  {/if}
</figure>

<style>
  [data-sv='hero-frame'] {
    display: block;
    margin: 0;
    /* Pattern 34: full inline width, no margin/border, one per section — the
       named line itself must be declared by the consuming page's own grid. */
    grid-column: full-bleed;
  }

  [data-sv='hero-frame-art'] {
    position: relative;
    display: block;
  }
  [data-sv='hero-frame-art'] :global(svg),
  [data-sv='hero-frame-art'] :global(img) {
    display: block;
    width: 100%;
    background-color: var(--layform-threshold-bg);
  }

  /* Pattern 15: photograph reconciliation filter, applied only to the photo case */
  [data-kind='photo'] [data-sv='hero-frame-art'] :global(svg),
  [data-kind='photo'] [data-sv='hero-frame-art'] :global(img) {
    filter: sepia(0.35) saturate(1.1) contrast(1.05);
    mix-blend-mode: multiply;
    background-color: var(--layform-parchment-2);
  }

  /* Patterns 105/106: at most one background-zone texture unit (Pattern 112's
     budget), overlaid absolutely rather than baked into the illustration SVG
     itself, so illustration and hatch/halftone assets stay independently
     authored. Opacity matches the 8.5 template's own worked example. */
  [data-sv='hero-frame-texture'] {
    position: absolute;
    inset: 0;
    z-index: var(--layform-z-ornament);
    pointer-events: none;
    background-repeat: repeat;
    opacity: 0.35;
  }
  [data-sv='hero-frame-texture'][data-texture='halftone-1'] {
    background-image: url('../../assets/texture-overlay.svg#halftone-1');
  }
  [data-sv='hero-frame-texture'][data-texture='halftone-2'] {
    background-image: url('../../assets/texture-overlay.svg#halftone-2');
  }
  [data-sv='hero-frame-texture'][data-texture='halftone-3'] {
    background-image: url('../../assets/texture-overlay.svg#halftone-3');
  }
  [data-sv='hero-frame-texture'][data-texture='hatch-medium'] {
    background-image: url('../../assets/texture-overlay.svg#hatch-medium');
  }

  /* Pattern 115: single-stage, observer-gated scroll reveal */
  [data-sv='hero-frame'][data-visible='false'] {
    opacity: 0;
    transform: translateY(12px);
    transition:
      opacity 240ms ease-out,
      transform 240ms ease-out;
  }
  [data-sv='hero-frame'][data-visible='true'] {
    opacity: 1;
    transform: translateY(0);
  }
  @media (prefers-reduced-motion: reduce) {
    [data-sv='hero-frame'][data-visible='false'] {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }

  /* Pattern 66: caption band, border-bonded, present only when figcaption exists */
  [data-sv='hero-frame-caption'] {
    margin: 0;
    border-block-start: var(--layform-border-medium) solid var(--layform-accent-primary-3);
    background-color: var(--layform-parchment-1);
    padding-inline: var(--layform-space-3);
    padding-block: var(--layform-space-2);
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-body);
    color: var(--layform-ink);
  }
</style>
