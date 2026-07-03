<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    brand?: Snippet;
    children: Snippet;
  }

  let { brand, children }: Props = $props();
  let open = $state(false);
  const linksId = $props.id();
</script>

<nav aria-label="Primary" data-sv="navbar">
  <div class="brand">{#if brand}{@render brand()}{/if}</div>
  <button
    type="button"
    class="toggle"
    aria-label="Menu"
    aria-expanded={open}
    aria-controls={linksId}
    onclick={() => (open = !open)}
  >≡</button>
  <div id={linksId} class="links" data-open={open}>
    {@render children()}
  </div>
</nav>

<style>
  [data-sv='navbar'] {
    display: flex;
    align-items: center;
    gap: var(--sv-space-4);
    padding: var(--sv-space-3) var(--sv-space-4);
    background: var(--sv-surface-1);
    border-bottom: 1px solid var(--sv-border);
    position: sticky;
    top: 0;
    z-index: var(--sv-z-sticky);
  }
  .brand { font-family: var(--sv-font-sans); font-weight: 650; color: var(--sv-text-strong); }
  .links { display: flex; gap: var(--sv-space-4); margin-inline-start: auto; }
  .toggle {
    display: none;
    margin-inline-start: auto;
    background: transparent;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    color: var(--sv-text);
    font-size: var(--sv-fs-lg);
    line-height: 1;
    padding: 0 0.4em;
    cursor: pointer;
  }
  .toggle:focus-visible { outline: 2px solid var(--sv-accent); outline-offset: 2px; }
  /* Below --sv-bp-md (768px): collapse links behind the toggle. */
  @media (max-width: 767px) {
    .toggle { display: inline-block; }
    .links {
      display: none;
      position: absolute;
      inset-inline: 0;
      top: 100%;
      flex-direction: column;
      background: var(--sv-surface-1);
      border-bottom: 1px solid var(--sv-border);
      padding: var(--sv-space-3) var(--sv-space-4);
      z-index: var(--sv-z-dropdown);
    }
    .links[data-open='true'] { display: flex; }
  }
</style>
