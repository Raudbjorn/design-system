<!--
  EvidencePhoto — a taped or pinned desk photo, slightly rotated. If
  `src` is omitted a "NO IMAGE ON FILE" placeholder renders instead,
  but `alt` still supplies the accessible name either way.
-->
<script lang="ts">
  import Stamp from "../atoms/Stamp.svelte";

  interface Props {
    /** Image source; omit to render a placeholder frame. */
    src?: string;
    /** Accessible name — required, used even without a source image. */
    alt: string;
    /** Caption printed below the photo. */
    caption?: string;
    /** Rubber-stamp overlay label, e.g. "EYES ONLY". */
    stamp?: string;
    /** Desk-photo tilt in degrees; clamped to a plausible range. */
    angle?: number;
    /** Pin the top corner instead of taping it. */
    pinned?: boolean;
  }

  let { src, alt, caption, stamp, angle = -2, pinned = false }: Props = $props();

  const clampedAngle = $derived(Math.max(-15, Math.min(15, angle)));
</script>

<figure class="photo" style={`--photo-angle: ${clampedAngle}deg;`}>
  <div class="frame">
    {#if src}
      <img {src} {alt} loading="lazy" />
    {:else}
      <div class="placeholder" role="img" aria-label={alt}>
        <span class="carter-label">No image on file</span>
      </div>
    {/if}

    {#if pinned}
      <span class="pin" aria-hidden="true"></span>
    {:else}
      <span class="carter-tape corner-left" aria-hidden="true"></span>
      <span class="carter-tape corner-right" aria-hidden="true"></span>
    {/if}

    {#if stamp}
      <div class="stamp-overlay">
        <Stamp label={stamp} />
      </div>
    {/if}
  </div>
  {#if caption}
    <figcaption class="carter-caption">{caption}</figcaption>
  {/if}
</figure>

<style>
  .photo {
    display: inline-flex;
    flex-direction: column;
    gap: var(--carter-space-2);
    max-width: 18rem;
    margin: 0;
    transform: rotate(var(--photo-angle));
    filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.35));
  }

  .frame {
    position: relative;
    padding: var(--carter-space-2);
    background: var(--carter-surface);
    border: var(--carter-border-hair) solid var(--carter-border-strong);
  }

  img {
    display: block;
    max-width: 100%;
    border: var(--carter-border-hair) solid var(--carter-border);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12rem;
    height: 9rem;
    max-width: 100%;
    padding: var(--carter-space-2);
    border: var(--carter-border-hair) dashed var(--carter-border-strong);
    background: var(--carter-bg-sunk);
    text-align: center;
  }

  .corner-left {
    top: -0.6rem;
    left: 0.75rem;
    transform: rotate(-6deg);
  }

  .corner-right {
    top: -0.6rem;
    right: 0.75rem;
    transform: rotate(5deg);
  }

  .pin {
    position: absolute;
    top: -0.35rem;
    left: 50%;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--carter-danger);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    transform: translateX(-50%);
  }

  .stamp-overlay {
    position: absolute;
    bottom: var(--carter-space-1);
    right: var(--carter-space-1);
    z-index: var(--carter-z-stamp);
    pointer-events: none;
  }

  figcaption {
    max-width: 100%;
  }
</style>
