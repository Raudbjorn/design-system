<!--
  Implements layform Pattern 71 (Form Label — Plain Reading Voice, Not
  Title Voice). See patterns/02-component-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    for: string;
    children: Snippet;
  }

  // `for` is a reserved word in a destructuring binding position — alias it.
  let { for: htmlFor, children }: Props = $props();
</script>

<label for={htmlFor} data-sv="form-label">{@render children()}</label>

<style>
  /* Plain reading voice only — never the display/title voice, and never
     even Pattern 66's lighter hand-lettered caption style. */
  [data-sv='form-label'] {
    display: inline-block;
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-body);
    color: var(--layform-ink);
  }
</style>
