<script lang="ts">
  import Eyebrow from './Eyebrow.svelte';

  interface Props {
    /** Token suffixes, e.g. 'accent' for --sv-accent. */
    names: string[];
    title?: string;
  }

  let { names, title }: Props = $props();

  // Chips display what the active theme actually computes — flip the toolbar
  // theme and the hexes follow. The divergence between themes is the point.
  let hex = $state<Record<string, string>>({});

  function read() {
    const cs = getComputedStyle(document.documentElement);
    hex = Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--sv-${n}`).trim()]));
  }

  $effect(() => {
    void names;
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  });
</script>

<div>
  {#if title}<Eyebrow>{title}</Eyebrow>{/if}
  <div class="row">
    {#each names as n (n)}
      <div class="chip">
        <div class="swatch" style:background={`var(--sv-${n})`}></div>
        <span class="label">--sv-{n}</span>
        <span class="hex">{hex[n]}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sv-space-3);
  }
  .chip {
    display: flex;
    flex-direction: column;
    gap: var(--sv-space-1);
    padding: var(--sv-space-2);
    min-width: 9.5rem;
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
  }
  .swatch {
    height: 2.25rem;
    border-radius: var(--sv-radius-sm);
    border: 1px solid var(--sv-border);
  }
  .label {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text);
  }
  .hex {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    /* muted, not faint — faint only clears AA on bg, and chips sit on surface-1 */
    color: var(--sv-text-muted);
  }
</style>
