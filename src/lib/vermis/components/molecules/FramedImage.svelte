<!--
  Implements layform Pattern 65 (Framed Image — Routine Inset Panel), Pattern 66
  (Frame-and-Caption Compound), Pattern 67 (Frame Aspect-Ratio Discipline for Grid
  Contexts). See patterns/02-component-patterns.md.

  v1 scope note: Pattern 65's solution text says "implemented as a <figure> wrapping
  an <img>/inline SVG," but this component's prop surface (src/alt/ratio/caption/
  accent) has no `children` slot for inline SVG content. Supporting both an `src`
  image path AND an inline-SVG snippet would require slot-priority rules no drafted
  pattern text specifies, so inline-SVG framed images are a deliberate non-goal for
  this pass — `src`/`alt` only.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    src?: string;
    alt: string;
    ratio?: '1/1' | '4/3' | '3/4';
    caption?: Snippet;
    accent?: string;
  }

  let { src, alt, ratio, caption, accent = 'var(--layform-accent)' }: Props = $props();
</script>

<figure data-sv="framed-image" style:--frame-accent={accent}>
  {#if src}
    <img
      {src}
      {alt}
      data-sv="framed-image-media"
      data-ratio={ratio}
      style:aspect-ratio={ratio}
    />
  {/if}
  {#if caption}
    <figcaption data-sv="framed-image-caption">
      {@render caption()}
    </figcaption>
  {/if}
</figure>

<style>
  [data-sv='framed-image'] {
    display: inline-block;
    margin: 0;
    border: var(--layform-border-medium) solid var(--frame-accent);
    border-radius: var(--layform-radius-panel);
    overflow: hidden;
    background: var(--layform-register-body);
  }

  /* Pattern 65: sized-to-content default, not full-bleed */
  [data-sv='framed-image-media'] {
    display: block;
    width: 100%;
  }

  /* Pattern 67: aspect-ratio discipline applies only when a ratio is set; single
     running-text instances (no `ratio` prop) stay unconstrained. object-fit is
     always `contain`, never `cover`, so hand-drawn detail is never cropped away. */
  [data-sv='framed-image-media'][data-ratio] {
    object-fit: contain;
  }

  /* Pattern 66: caption band shares the frame's border color/weight on the
     touching edge via the `--frame-accent` custom property set once on the
     <figure> root, rather than being redrawn as a freestanding element. */
  [data-sv='framed-image-caption'] {
    margin: 0;
    border-top: var(--layform-border-medium) solid var(--frame-accent);
    background: var(--layform-parchment-1);
    padding: var(--layform-space-2) var(--layform-space-3);
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-body);
    color: var(--layform-ink);
  }
</style>
