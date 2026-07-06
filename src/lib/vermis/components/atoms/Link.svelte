<!--
  Implements layform Pattern 58 (Link Component — Interactive State Set),
  Pattern 84 (Hover Color-Shift Step Size — One Fixed Perceptual Delta),
  Pattern 2 (Outer Double-Line Border as Document Boundary Marker — reused
  here only for its double-line outline token, exactly as Pattern 58's own
  Solution text specifies, not for whole-document boundary framing).
  See patterns/{02-component,03-element,
  01-document}-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    children: Snippet;
  }

  let { href, children }: Props = $props();
</script>

<a {href} data-sv="link">{@render children()}</a>

<style>
  [data-sv='link'] {
    color: var(--layform-accent);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.15em;
    transition:
      color 0.12s ease,
      text-decoration-thickness 0.12s ease;
  }
  [data-sv='link']:hover {
    color: color-mix(in oklab, var(--layform-accent), var(--layform-ink) 10%);
    text-decoration-thickness: 2px;
  }
  [data-sv='link']:focus-visible {
    outline: var(--layform-border-thin) solid var(--layform-accent);
    outline-offset: 2px;
  }
  [data-sv='link']:visited {
    color: var(--layform-accent-crimson-2);
  }
</style>
