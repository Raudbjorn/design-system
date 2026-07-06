<!--
  NavList — file-index navigation. A wide-tracked title over a ruled
  list of links; the active entry gets aria-current and a filled
  leading marker.
-->
<script lang="ts">
  interface NavItem {
    label: string;
    href: string;
    active?: boolean;
  }

  interface Props {
    /** Links to render, in order. */
    items?: NavItem[];
    /** Optional heading above the list; also used as the nav's label. */
    title?: string;
  }

  let { items = [], title }: Props = $props();
</script>

<nav class="nav-list" aria-label={title ?? "Navigation"}>
  {#if title}
    <p class="carter-label title">{title}</p>
  {/if}
  {#if items.length}
    <ol class="rows">
      {#each items as item (item.href)}
        <li class="row">
          <a
            class="entry"
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            data-active={item.active ? "true" : undefined}
          >
            <span class="marker" aria-hidden="true"></span>
            <span class="label">{item.label}</span>
          </a>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="carter-caption empty">No entries on file.</p>
  {/if}
</nav>

<style>
  .nav-list {
    display: flex;
    flex-direction: column;
    font-family: var(--carter-font-mono);
  }

  .title {
    margin: 0 0 var(--carter-space-2);
    padding-bottom: var(--carter-space-2);
    border-bottom: var(--carter-border-rule) solid var(--carter-border-strong);
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .row + .row {
    border-top: var(--carter-border-hair) solid var(--carter-border);
  }

  .entry {
    display: flex;
    align-items: center;
    gap: var(--carter-space-2);
    padding: var(--carter-space-2) var(--carter-space-1);
    font-size: var(--carter-fs-sm);
    color: var(--carter-text-muted);
    text-decoration: none;
    transition:
      color 90ms ease,
      background 90ms ease;
  }

  .entry:hover {
    color: var(--carter-text);
    background: var(--carter-surface);
  }

  .entry:focus-visible {
    outline: 2px solid var(--carter-focus);
    outline-offset: -2px;
  }

  .marker {
    flex: none;
    width: 0.5em;
    height: 0.5em;
    border: var(--carter-border-hair) solid var(--carter-border-strong);
  }

  .entry[data-active="true"] {
    color: var(--carter-text);
    font-weight: var(--carter-weight-strong);
  }

  .entry[data-active="true"] .marker {
    background: var(--carter-primary);
    border-color: var(--carter-primary);
  }

  .empty {
    margin: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .entry { transition: none; }
  }
</style>
