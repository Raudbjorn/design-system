<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    external?: boolean;
    children: Snippet;
  }

  let { href, external = false, children }: Props = $props();
</script>

<a
  {href}
  data-sv="link"
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
>
  {@render children()}{#if external}<span aria-hidden="true" class="ext">↗</span>{/if}
</a>

<style>
  [data-sv='link'] {
    color: var(--sv-accent);
    text-decoration: none;
    border-bottom: 1px solid transparent;
  }
  [data-sv='link']:hover {
    border-bottom-color: color-mix(in oklab, var(--sv-accent), transparent 50%);
  }
  [data-sv='link']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
    border-radius: var(--sv-radius-sm);
  }
  .ext { margin-inline-start: 0.15em; font-size: 0.85em; }
</style>
