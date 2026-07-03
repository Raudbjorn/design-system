<script lang="ts">
  interface Props {
    code: string;
    html?: string;
    filename?: string;
    showLineNumbers?: boolean;
  }

  // showLineNumbers: reserved styling hook, surfaced as data-numbered below.
  // v1 renders no gutter — the prop reserves the interface for a future line-number treatment.
  let { code, html, filename, showLineNumbers = false }: Props = $props();
  let copied = $state(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<!-- data-numbered: reserved styling hook; no gutter rendered in v1 -->
<figure data-sv="codeblock" data-numbered={showLineNumbers}>
  <figcaption>
    <span class="name">{filename ?? ''}</span>
    <button type="button" onclick={copy} aria-label="Copy code">
      {copied ? 'Copied' : 'Copy'}
    </button>
  </figcaption>
  <pre><code>{#if html}{@html html}{:else}{code}{/if}</code></pre>
</figure>

<style>
  [data-sv='codeblock'] {
    margin: 0;
    background: var(--sv-surface-3);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    overflow: hidden;
  }
  figcaption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sv-space-2) var(--sv-space-3);
    border-bottom: 1px solid var(--sv-border);
    background: var(--sv-surface-2);
  }
  .name { font-family: var(--sv-font-mono); font-size: var(--sv-fs-xs); color: var(--sv-text-muted); }
  figcaption button {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-muted);
    background: transparent;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    padding: 0.1em 0.5em;
    cursor: pointer;
  }
  figcaption button:hover { color: var(--sv-accent); border-color: var(--sv-accent); }
  figcaption button:focus-visible { outline: 2px solid var(--sv-accent); outline-offset: 2px; }
  pre {
    margin: 0;
    padding: var(--sv-space-4);
    overflow-x: auto;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-sm);
    line-height: var(--sv-lh-relaxed);
    color: var(--sv-text);
  }
  /* Token classes emitted by the build-time highlighter map onto syntax tokens. */
  :global([data-sv='codeblock'] .tok-keyword) { color: var(--sv-syn-keyword); }
  :global([data-sv='codeblock'] .tok-string) { color: var(--sv-syn-string); }
  :global([data-sv='codeblock'] .tok-var) { color: var(--sv-syn-var); }
  :global([data-sv='codeblock'] .tok-func) { color: var(--sv-syn-func); }
  :global([data-sv='codeblock'] .tok-comment) { color: var(--sv-syn-comment); }
  :global([data-sv='codeblock'] .tok-number) { color: var(--sv-syn-number); }
</style>
