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
  // newline is ignored so 'a\nb\n' numbers 2 lines; empty/undefined code gets no gutter.
  const lines = $derived(!code ? [] : code.replace(/\r?\n$/, '').split(/\r?\n/));
  const numbered = $derived(showLineNumbers && lines.length > 0);

  // Dev-only guard on the documented contract: `html` must preserve `code`'s
  // line count, or the gutter numbers drift off the rendered lines.
  // Runtime lookup (not `import.meta.env.DEV` directly): svelte-package ships
  // this source untransformed, so non-Vite consumers must resolve to undefined.
  const dev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
  $effect(() => {
    if (
      dev &&
      html &&
      showLineNumbers &&
      lines.length > 0 &&
      html.replace(/\r?\n$/, '').split(/\r?\n/).length !== lines.length
    ) {
      console.warn('[CodeBlock] `html` line count differs from `code`; gutter numbers may misalign.');
    }
  });

  async function copy() {
    // Clipboard API is unavailable outside secure contexts (plain-HTTP staging,
    // some webviews); guard so the copy button never throws on click.
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // Clipboard write can reject on permission denial; leave the label unchanged.
    }
  }
</script>

<figure data-sv="codeblock" data-numbered={numbered}>
  <figcaption>
    <span class="name">{filename ?? ''}</span>
    <button type="button" onclick={copy} aria-label="Copy code">
      {copied ? 'Copied' : 'Copy'}
    </button>
  </figcaption>
  <div class="body" class:numbered>
    {#if numbered}
      <ol class="gutter" aria-hidden="true">
        {#each lines as _, i}<li>{i + 1}</li>{/each}
      </ol>
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
  .body.numbered {
    /* Two-column grid: gutter | code, so long lines wrap inside the code column only. */
    display: grid;
    grid-template-columns: auto 1fr;
  }
  /* Semantic ordered list for the numbers; gutter font metrics must match `pre`
     exactly so rows align 1:1. */
  .gutter {
    margin: 0;
    padding: var(--sv-space-4) var(--sv-space-2) var(--sv-space-4) var(--sv-space-3);
    list-style: none;
    text-align: right;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-sm);
    line-height: var(--sv-lh-relaxed);
    /* muted, not faint — faint only clears AA against bg, and the gutter
       sits on surface-2 (faint there is ~3.9:1, below the 4.5:1 AA bar). */
    color: var(--sv-text-muted);
    background: var(--sv-surface-2);
    border-right: 1px solid var(--sv-border);
    user-select: none;
  }
  /* min-width keeps single- and double-digit numbers on the same right edge. */
  .gutter li { min-width: 2ch; }
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
