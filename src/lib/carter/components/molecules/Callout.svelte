<!--
  Callout — margin annotation / handler's note. A left-border slab colored
  by kind, with a leading mark glyph and optional uppercase title.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Kind = "note" | "warning" | "unnatural" | "directive";

  const MARKS: Record<Kind, string> = {
    note: "//",
    warning: "!",
    unnatural: "☢",
    directive: "▸"
  };

  interface Props {
    /** Annotation intent. */
    kind?: Kind;
    /** Optional uppercase heading. */
    title?: string;
    /** Note body. */
    children?: Snippet;
  }

  let { kind = "note", title, children }: Props = $props();
</script>

<aside class="callout" data-kind={kind}>
  <span class="mark" aria-hidden="true">{MARKS[kind]}</span>
  <div class="content">
    {#if title}<p class="title carter-display">{title}</p>{/if}
    <div class="body carter-prose">
      {@render children?.()}
    </div>
  </div>
</aside>

<style>
  .callout {
    display: flex;
    align-items: flex-start;
    gap: var(--carter-space-3);
    padding: var(--carter-space-3) var(--carter-space-4);
    border-left: var(--carter-border-slab) solid var(--carter-text-muted);
    background: transparent;
  }

  .mark {
    flex: none;
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    font-size: var(--carter-fs-md);
    line-height: var(--carter-lh-tight);
    color: var(--carter-text-muted);
  }

  .title {
    font-size: var(--carter-fs-sm);
    margin: 0 0 var(--carter-space-1);
  }

  .body :global(p:last-child) {
    margin-bottom: 0;
  }

  .callout[data-kind="warning"] {
    border-left-color: var(--carter-warning);
  }
  .callout[data-kind="warning"] .mark { color: var(--carter-warning); }

  .callout[data-kind="unnatural"] {
    border-left-color: var(--carter-danger);
    background: color-mix(in srgb, var(--carter-danger) 10%, transparent);
  }
  .callout[data-kind="unnatural"] .mark { color: var(--carter-danger); }

  .callout[data-kind="directive"] {
    border-left-color: var(--carter-primary);
  }
  .callout[data-kind="directive"] .mark { color: var(--carter-primary); }
</style>
