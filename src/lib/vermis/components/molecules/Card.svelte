<!--
  Implements layform Pattern 49 (Card Primitive — The Framed Content Unit).
  Implements layform Pattern 50 (Rosette Corner as Featured-Card Accent).
  Implements layform Pattern 54 (Callout / Inscription Box — Accent-Bordered Quoted Aside).
  Implements layform Pattern 55 (Reversed-Fill Narrative Panel).
  Implements layform Pattern 113 (Aside Reveal — Border-First, Content-Second Expansion).
  See patterns/02-component-patterns.md (Patterns 49/50/54/55),
  patterns/04-detail-patterns.md (Pattern 113), and the applied
  composition at templates/8.4-callout-card.md, which this
  component's markup/CSS anatomy translates 1:1 into scoped `--layform-*` styles.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'plain' | 'callout' | 'reversed';
    featured?: boolean;
    collapsible?: boolean;
    defaultOpen?: boolean;
    media?: Snippet;
    heading?: Snippet;
    footer?: Snippet;
    /** Optional — header/media-only cards are legal (see collapsible body guard). */
    children?: Snippet;
  }

  let {
    variant = 'plain',
    featured = false,
    collapsible = false,
    defaultOpen = true,
    media,
    heading,
    footer,
    children
  }: Props = $props();

  // Pattern 113: a single [data-state] toggle drives both the border-fade
  // and grid-template-rows expansion stages via CSS transition alone.
  // `defaultOpen` is intentionally read only once, to seed the initial
  // open/closed state — not tracked reactively thereafter.
  // svelte-ignore state_referenced_locally
  let open = $state(defaultOpen);

  function toggle() {
    open = !open;
  }

  // Resolved against this module's real runtime URL (Vite's "New URL" asset
  // pattern) — a plain relative string here would be resolved by the
  // BROWSER against the consuming page's own URL instead, and 404 as soon
  // as this component is used from anywhere but its own source directory.
  const ROSETTE_HREF = `${new URL('../../assets/ornate-frame-border.svg', import.meta.url).href}#rosette`;
</script>

<article
  data-sv="card"
  data-variant={variant}
  data-featured={featured}
  data-collapsible={collapsible}
  data-state={collapsible ? (open ? 'open' : 'closed') : undefined}
>
  {#if featured}
    <!-- Pattern 50: at most one rosette accent, opt-in via `featured`, never a per-card default. -->
    <svg data-sv="card-rosette" aria-hidden="true">
      <use href={ROSETTE_HREF} />
    </svg>
  {/if}

  {#if media}
    <div data-sv="card-media">{@render media()}</div>
  {/if}

  {#if collapsible}
    <button
      type="button"
      data-sv="card-trigger"
      aria-expanded={open}
      onclick={toggle}
    >
      {#if heading}<span data-sv="card-heading">{@render heading()}</span>{/if}
    </button>
    <div data-sv="card-body-wrapper">
      <div data-sv="card-body">
        {#if children}{@render children()}{/if}
      </div>
      {#if footer}<footer data-sv="card-footer">{@render footer()}</footer>{/if}
    </div>
  {:else}
    {#if heading}<h3 data-sv="card-heading">{@render heading()}</h3>{/if}
    {#if children}<div data-sv="card-body">{@render children()}</div>{/if}
    {#if footer}<footer data-sv="card-footer">{@render footer()}</footer>{/if}
  {/if}
</article>

<style>
  [data-sv='card'] {
    position: relative;
    display: grid;
    grid-template-areas: 'media' 'heading' 'body' 'footer-meta';
    gap: var(--layform-space-2);
    padding: var(--layform-space-3);
    border-radius: var(--layform-radius-panel);
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-body);
    color: var(--layform-ink);
  }

  [data-collapsible='true'] {
    grid-template-areas: 'media' 'heading' 'content';
  }

  [data-sv='card-media'] {
    grid-area: media;
  }
  [data-sv='card-heading'] {
    grid-area: heading;
    display: block;
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-strong);
    color: inherit;
    text-align: start;
  }
  [data-sv='card-body'] {
    grid-area: body;
  }
  [data-sv='card-footer'] {
    grid-area: footer-meta;
  }

  /* Pattern 49: base anatomy — a neutral bordered panel per document-tier
     Pattern 4's default rounded-rectangle shape (no callout/reversed skin). */
  [data-variant='plain'] {
    background: var(--layform-register-body);
    border: var(--layform-border-hairline) solid var(--layform-ink);
  }

  /* Pattern 54: border-only callout skin — same fill as surrounding content,
     no solid fill, italicized body copy. */
  [data-variant='callout'] {
    background: transparent;
    border: var(--layform-border-thin) solid var(--layform-accent);
  }
  [data-variant='callout'] [data-sv='card-body'] {
    font-style: italic;
  }

  /* Pattern 55: louder reversed-fill alternate skin, contrast-verified pair
     (see /home/svnbjrn/dev/vermis-design/CONTRAST.md). */
  [data-variant='reversed'] {
    background: var(--layform-accent-large);
    border: none;
    color: var(--layform-parchment-1);
  }

  /* Pattern 50: rosette overlay, mounted independent of the grid-area order,
     stacked at the ornament tier so it always sits above the card's own fill. */
  [data-sv='card-rosette'] {
    position: absolute;
    top: 0;
    inset-inline-start: 0;
    width: var(--layform-icon-lg);
    height: var(--layform-icon-lg);
    transform: translate(-30%, -30%);
    z-index: var(--layform-z-ornament);
  }

  /* Pattern 113: two-stage collapsed/expanded reveal, reusing Pattern 54's
     own border token rather than a new color. */
  [data-collapsible='true'][data-variant='callout'] {
    transition: border-color 120ms ease-out;
  }
  [data-collapsible='true'][data-variant='callout'][data-state='closed'] {
    border-color: transparent;
  }

  [data-sv='card-trigger'] {
    all: unset;
    grid-area: heading;
    display: block;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
  }
  [data-sv='card-trigger']:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  [data-sv='card-trigger']:focus-visible {
    outline: var(--layform-border-thin) solid var(--layform-accent);
    outline-offset: 2px;
  }

  [data-sv='card-body-wrapper'] {
    grid-area: content;
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 180ms ease-out;
  }
  [data-sv='card-body-wrapper'] > * {
    min-height: 0;
  }
  [data-state='open'] [data-sv='card-body-wrapper'] {
    grid-template-rows: 1fr;
  }
</style>
