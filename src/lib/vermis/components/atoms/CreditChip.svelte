<!--
  Implements layform Pattern 56 (Credit / Meta Chip).
  See patterns/02-component-patterns.md (Pattern 56) and the
  applied composition at templates/8.4-callout-card.md, whose
  `.layform-chip` CSS block this component's scoped style translates verbatim.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<span data-sv="credit-chip">{@render children()}</span>

<style>
  [data-sv='credit-chip'] {
    display: inline-block;
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
    color: var(--layform-ink);
    border: var(--layform-border-hairline) solid var(--layform-accent);
    border-radius: 999px;
    padding: 0.125em 0.75em;
  }
</style>
