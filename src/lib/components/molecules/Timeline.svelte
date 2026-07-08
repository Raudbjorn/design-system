<script lang="ts">
  interface Item {
    content: string;
    title?: string;
    /** Semantic token key or any CSS color. accent | success | warning | error | accent-2 */
    color?: 'accent' | 'success' | 'warning' | 'error' | 'accent-2' | string;
    loading?: boolean;
    placement?: 'start' | 'end';
  }

  interface Props {
    items: Item[];
    mode?: 'start' | 'alternate' | 'end';
    variant?: 'filled' | 'outlined';
    reverse?: boolean;
  }

  let { items, mode = 'alternate', variant = 'outlined', reverse = false }: Props = $props();

  const known = new Set(['accent', 'success', 'warning', 'error', 'accent-2']);
  const dotColor = (c?: string) => (c ? (known.has(c) ? `var(--sv-${c})` : c) : 'var(--sv-accent)');

  const ordered = $derived(reverse ? [...items].reverse() : items);

  function side(item: Item, i: number): 'start' | 'end' {
    if (item.placement) return item.placement;
    if (mode === 'end') return 'end';
    if (mode === 'alternate') return i % 2 === 0 ? 'start' : 'end';
    return 'start';
  }
</script>

<div data-sv="timeline" data-mode={mode}>
  {#each ordered as item, i (i)}
    <div data-sv="tl-item" data-side={side(item, i)} data-last={i === ordered.length - 1 || undefined}>
      <div data-sv="tl-content-start">
        {#if side(item, i) === 'start'}
          {#if item.title}<span data-sv="tl-title">{item.title}</span>{/if}
          <span data-sv="tl-text">{item.content}</span>
        {/if}
      </div>
      <div data-sv="tl-axis">
        {#if item.loading}
          <span data-sv="tl-spinner"></span>
        {:else}
          <span
            data-sv="tl-dot"
            data-variant={variant}
            style:--dot={dotColor(item.color)}
          ></span>
        {/if}
        {#if i < ordered.length - 1}<span data-sv="tl-rail"></span>{/if}
      </div>
      <div data-sv="tl-content-end">
        {#if side(item, i) === 'end'}
          {#if item.title}<span data-sv="tl-title">{item.title}</span>{/if}
          <span data-sv="tl-text">{item.content}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  [data-sv='timeline'] { display: flex; flex-direction: column; }
  /* start/end modes collapse the unused side column. */
  [data-mode='start'] [data-sv='tl-item'] { grid-template-columns: 1fr 14px 0; }
  [data-mode='end'] [data-sv='tl-item'] { grid-template-columns: 0 14px 1fr; }
  [data-mode='alternate'] [data-sv='tl-item'] { grid-template-columns: 1fr 14px 1fr; }

  [data-sv='tl-item'] {
    display: grid;
    gap: var(--sv-space-4);
    align-items: stretch;
  }
  [data-sv='tl-content-start'] { text-align: right; padding-bottom: var(--sv-space-6); }
  [data-sv='tl-content-end'] { text-align: left; padding-bottom: var(--sv-space-6); }
  [data-sv='tl-title'] {
    display: block;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
    margin-bottom: 3px;
  }
  [data-sv='tl-text'] {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
  }
  [data-sv='tl-axis'] {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  [data-sv='tl-dot'] {
    flex: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    box-sizing: border-box;
  }
  [data-variant='outlined'] { border: 2px solid var(--dot); background: var(--sv-surface-1); }
  [data-variant='filled'] {
    background: var(--dot);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--dot), transparent 82%);
  }
  [data-sv='tl-spinner'] {
    flex: none;
    width: 14px;
    height: 14px;
    box-sizing: border-box;
    border-radius: 50%;
    border: 2px solid var(--sv-border);
    border-top-color: var(--sv-accent);
    animation: sv-tl-spin 0.7s linear infinite;
  }
  [data-sv='tl-rail'] {
    width: 2px;
    flex: 1;
    background: var(--sv-border);
    margin-top: 3px;
    min-height: 14px;
  }
  @keyframes sv-tl-spin { to { transform: rotate(360deg); } }
</style>
