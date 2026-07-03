<script lang="ts">
  interface Props {
    code: string;
    html?: string;
    filename?: string;
    showLineNumbers?: boolean;
  }

  let { code, html, filename, showLineNumbers = false }: Props = $props();
  let copied = $state(false);

  // Gutter rows count from `code` (the copy source), not `html` — build-time
  // highlighters preserve line count per the documented contract. One trailing
  // newline is ignored so 'a\nb\n' numbers 2 lines.
  const lines = $derived(code.replace(/\n$/, '').split('\n'));

  async function copy() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<figure data-sv="codeblock" data-numbered={showLineNumbers}>
  <figcaption>
    <span class="name">{filename ?? ''}</span>
    <button type="button" onclick={copy} aria-label="Copy code">
      {copied ? 'Copied' : 'Copy'}
    </button>
  </figcaption>
  <div class="body">
    {#if showLineNumbers}
      <div class="gutter" aria-hidden="true">
        {#each lines as _, i}<span>{i + 1}</span>{/each}
      </div>
    {/if}
    <pre><code>{#if html}{@html html}{:else}{code}{/if}</code></pre>
  </div>
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
  .body { display: flex; }
  /* Gutter font metrics must match pre exactly so rows align 1:1. */
  .gutter {
    flex-shrink: 0;
    padding: var(--sv-space-4) var(--sv-space-2) var(--sv-space-4) var(--sv-space-3);
    border-right: 1px solid var(--sv-border);
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-sm);
    line-height: var(--sv-lh-relaxed);
    color: var(--sv-text-faint);
    text-align: right;
    user-select: none;
  }
  .gutter span { display: block; }
  pre {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: var(--sv-space-4);
    overflow-x: auto;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-sm);
    line-height: var(--sv-lh-relaxed);
    color: var(--sv-text);
  }
  /* UA stylesheets set `code { font-family: monospace }`, which beats
     inheritance and swaps in the system mono — wrong face AND taller line
     boxes that drift out of alignment with the gutter. */
  pre code { font: inherit; }
  /* Token classes emitted by the build-time highlighter map onto syntax tokens. */
  :global([data-sv='codeblock'] .tok-keyword) { color: var(--sv-syn-keyword); }
  :global([data-sv='codeblock'] .tok-string) { color: var(--sv-syn-string); }
  :global([data-sv='codeblock'] .tok-var) { color: var(--sv-syn-var); }
  :global([data-sv='codeblock'] .tok-func) { color: var(--sv-syn-func); }
  :global([data-sv='codeblock'] .tok-comment) { color: var(--sv-syn-comment); }
  :global([data-sv='codeblock'] .tok-number) { color: var(--sv-syn-number); }
</style>
