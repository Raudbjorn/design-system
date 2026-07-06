<!--
  CaseFile — the dossier card. A folder tab in the tone color sits atop a
  paper sheet holding the case body. Falls back to caseNo + title when no
  header snippet is given; optional footer routing line.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Tone = "primary" | "danger" | "warning";

  interface Props {
    /** Folder tab label. */
    tab?: string;
    /** Case number, shown in the default header. */
    caseNo?: string;
    /** Case title, shown in the default header. */
    title?: string;
    /** Tab and top-border color. */
    tone?: Tone;
    /** Apply a torn bottom edge to the sheet. */
    torn?: boolean;
    /** Overrides the default caseNo/title header. */
    header?: Snippet;
    /** Case body. */
    children?: Snippet;
    /** Routing line / muted caption. */
    footer?: Snippet;
  }

  let {
    tab = "FILE",
    caseNo,
    title,
    tone = "primary",
    torn = true,
    header,
    children,
    footer
  }: Props = $props();
</script>

<article class="case-file" data-tone={tone}>
  <div class="tab">{tab}</div>
  <div class="sheet" class:carter-torn={torn} class:sheet--torn={torn}>
    {#if header}
      {@render header()}
    {:else if caseNo || title}
      <header class="default-header">
        {#if caseNo}<span class="case-no carter-label">{caseNo}</span>{/if}
        {#if title}<h3 class="title">{title}</h3>{/if}
      </header>
    {/if}
    <div class="body">
      {@render children?.()}
    </div>
    {#if footer}
      <footer class="footer carter-caption">
        {@render footer()}
      </footer>
    {/if}
  </div>
</article>

<style>
  .case-file {
    display: flex;
    flex-direction: column;
  }

  .tab {
    align-self: flex-start;
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    font-size: var(--carter-fs-2xs);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
    padding: 0.35em 1em 0.55em;
    clip-path: polygon(0 0, 100% 0, 92% 100%, 0% 100%);
    margin-bottom: -1px;
    color: var(--carter-primary-ink);
    background: var(--carter-primary);
  }
  .case-file[data-tone="danger"] .tab {
    color: var(--carter-danger-ink);
    background: var(--carter-danger);
  }
  .case-file[data-tone="warning"] .tab {
    color: var(--carter-warning-ink);
    background: var(--carter-warning);
  }

  .sheet {
    background: var(--carter-surface);
    border-top: var(--carter-border-slab) solid var(--carter-primary);
    border-radius: 0 var(--carter-radius-panel) var(--carter-radius-panel);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
    padding: var(--carter-space-5);
  }
  .case-file[data-tone="danger"] .sheet { border-top-color: var(--carter-danger); }
  .case-file[data-tone="warning"] .sheet { border-top-color: var(--carter-warning); }
  .sheet--torn {
    padding-bottom: calc(var(--carter-space-5) + var(--carter-space-3));
  }

  .default-header {
    display: flex;
    flex-direction: column;
    gap: var(--carter-space-1);
    margin-bottom: var(--carter-space-4);
  }
  .case-no { color: var(--carter-text-muted); }
  .title {
    margin: 0;
    font-family: var(--carter-font-display);
    font-weight: var(--carter-h3-weight);
    font-size: var(--carter-h3-size);
    letter-spacing: var(--carter-h3-tracking);
    line-height: var(--carter-lh-tight);
    text-transform: uppercase;
    color: var(--carter-text);
  }

  .body {
    color: var(--carter-text);
  }

  .footer {
    margin-top: var(--carter-space-4);
    padding-top: var(--carter-space-3);
    border-top: var(--carter-border-hair) solid var(--carter-border);
    color: var(--carter-text-faint);
  }
</style>
