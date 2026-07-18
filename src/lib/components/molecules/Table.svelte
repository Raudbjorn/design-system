<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Column {
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'right' | 'center';
    mono?: boolean;
  }

  interface Props {
    columns: Column[];
    rows: Record<string, unknown>[];
    /** Stable identity field for rows recreated between updates; object identity is the fallback. */
    rowKey?: string;
    /** Optional custom cell renderer for rich content (e.g. Badge). */
    cell?: Snippet<[{ row: Record<string, unknown>; column: Column; value: unknown }]>;
  }

  let { columns, rows, rowKey, cell }: Props = $props();
</script>

<div data-sv="table-wrap">
  <table data-sv="table">
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th scope="col" data-align={col.align ?? 'left'} style:width={col.width}>{col.header}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row (rowKey ? row[rowKey] : row)}
        <tr>
          {#each columns as col (col.key)}
            <td data-align={col.align ?? 'left'} data-mono={col.mono || undefined}>
              {#if cell}
                {@render cell({ row, column: col, value: row[col.key] })}
              {:else}
                {row[col.key]}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  [data-sv='table-wrap'] {
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    overflow-x: auto;
  }
  [data-sv='table'] {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--sv-font-sans);
  }
  [data-sv='table'] th {
    text-align: left;
    padding: var(--sv-space-2) var(--sv-space-4);
    font-size: var(--sv-fs-xs);
    font-weight: var(--sv-font-weight-semibold);
    color: var(--sv-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    background: var(--sv-surface-2);
  }
  [data-sv='table'] td {
    padding: var(--sv-space-3) var(--sv-space-4);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
    border-top: 1px solid var(--sv-border);
  }
  [data-mono='true'] { font-family: var(--sv-font-mono); }
  [data-sv='table'] th[data-align='right'],
  [data-sv='table'] td[data-align='right'] { text-align: right; }
  [data-sv='table'] th[data-align='center'],
  [data-sv='table'] td[data-align='center'] { text-align: center; }
</style>
