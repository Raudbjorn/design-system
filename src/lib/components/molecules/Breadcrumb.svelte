<script lang="ts">
  interface Crumb {
    label: string;
    href?: string;
  }

  interface Props {
    items: Crumb[];
    'aria-label'?: string;
  }

  let { items, 'aria-label': ariaLabel = 'Breadcrumb' }: Props = $props();
</script>

<nav data-sv="breadcrumb" aria-label={ariaLabel}>
  <ol>
    {#each items as crumb, i (i)}
      {@const current = i === items.length - 1}
      <li>
        {#if current}
          <span data-sv="crumb" data-current="true" aria-current="page">
            <span data-sv="crumb-label">{crumb.label}</span>
          </span>
        {:else}
          <a data-sv="crumb" href={crumb.href ?? '#'}>
            <span data-sv="crumb-label">{crumb.label}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  [data-sv='breadcrumb'] ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    gap: var(--sv-space-2);
  }
  [data-sv='breadcrumb'] li { display: inline-block; }
  /* Skewed solid parallelogram block; label counter-skewed to stay upright. */
  [data-sv='crumb'] {
    display: inline-block;
    box-sizing: border-box;
    text-decoration: none;
    cursor: pointer;
    transform: skewX(-9deg);
    background: var(--sv-surface-2);
    padding: var(--sv-space-2) var(--sv-space-6);
    transition: background 0.25s cubic-bezier(0.445, 0.05, 0.55, 0.95);
    overflow: hidden;
  }
  [data-sv='crumb-label'] {
    display: inline-block;
    transform: skewX(9deg);
    font-family: var(--sv-font-sans);
    font-weight: var(--sv-font-weight-semibold);
    font-size: var(--sv-fs-sm);
    line-height: 18px;
    color: var(--sv-text);
    transition: color 0.25s cubic-bezier(0.445, 0.05, 0.55, 0.95);
  }
  a[data-sv='crumb']:hover { background: var(--sv-accent); }
  a[data-sv='crumb']:hover [data-sv='crumb-label'] { color: var(--sv-bg); }
  [data-current='true'] { background: var(--sv-accent); }
  [data-current='true'] [data-sv='crumb-label'] { color: var(--sv-bg); }
  a[data-sv='crumb']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
  }
</style>
