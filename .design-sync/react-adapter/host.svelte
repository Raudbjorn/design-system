<script>
  // Generic host: renders the real compiled Svelte component with a reactive
  // props bag (see state.svelte.js). The React wrapper replaces bag.v on prop
  // changes; the spread re-renders through Svelte's own reactivity.
  let { component: C, bag } = $props();
</script>

<C {...bag.v} />
