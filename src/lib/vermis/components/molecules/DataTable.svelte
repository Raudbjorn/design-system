<!--
  Implements layform Pattern 13 (Bordered Containment for Reference-Density Pages),
  Pattern 26 (Monospace Marginalia), Pattern 37 (Structured-Reference Zone
  Allocation), Pattern 52 (Stat Meter — Segmented Gauge Bar), Pattern 53 (Reference
  Table — Ruled Rows), Pattern 77 (Tabular-Figure Numerals for Inline Data Values),
  Pattern 94 (Border-Weight Scale). See
  patterns/{02-component,03-element}-patterns.md and the
  literal worked example this component matches,
  templates/8.3-data-table.md.

  Pattern 37 boundary: this component makes NO layout-placement decision of its
  own — where a page positions this table relative to a narrative/illustration
  zone (Pattern 37's "reference zone" allocation) is the consuming page's own CSS
  Grid concern, not something a table component can decide about its own context.
-->
<script lang="ts">
  import StatMeter from '../atoms/StatMeter.svelte';

  interface Column {
    key: string;
    label: string;
    kind?: 'text' | 'numeric' | 'marginalia' | 'meter';
    max?: number;
  }

  interface Props {
    columns: Column[];
    rows: Array<Record<string, string | number>>;
  }

  let { columns, rows }: Props = $props();

  function cellValue(row: Record<string, string | number>, key: string): string | number {
    return row[key] ?? '';
  }

  // Pattern 52's meter feeds off a numeric cell value; a non-numeric or missing
  // cell degrades to 0 rather than throwing (StatMeter itself further clamps
  // against `max`).
  function meterValue(row: Record<string, string | number>, key: string): number {
    const raw = row[key];
    const numeric = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(numeric) ? numeric : 0;
  }
</script>

<div data-sv="data-table">
  <table data-sv="data-table-grid">
    <thead>
      <tr data-sv="data-table-header-row">
        {#each columns as column (column.key)}
          <th scope="col">{column.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, index (index)}
        <tr data-sv="data-table-row">
          {#each columns as column (column.key)}
            <td>
              {#if column.kind === 'meter'}
                <StatMeter
                  value={meterValue(row, column.key)}
                  max={column.max ?? 100}
                  label={column.label}
                />
              {:else if column.kind === 'marginalia'}
                <span data-sv="data-table-marginalia">{cellValue(row, column.key)}</span>
              {:else if column.kind === 'numeric'}
                <span data-sv="data-table-figure">{cellValue(row, column.key)}</span>
              {:else}
                {cellValue(row, column.key)}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* Pattern 13: plain bordered reference container, no ornament, right-angle
     corners — never Pattern 95's rounded `--layform-radius-panel`. */
  [data-sv='data-table'] {
    border: var(--layform-border-thin) solid var(--layform-ink);
    border-radius: var(--layform-radius-none);
    background: var(--layform-register-body);
  }

  [data-sv='data-table-grid'] {
    width: 100%;
    border-collapse: collapse;
  }

  /* Pattern 53: header row distinguished by weight/case only, no fill.
     Pattern 94: the header/body divider is the one rule permitted to step up
     to --layform-border-medium. */
  [data-sv='data-table-header-row'] th {
    font-family: var(--layform-font-display);
    font-weight: var(--layform-weight-display-h4);
    text-transform: uppercase;
    text-align: left;
    padding: var(--layform-space-2) var(--layform-space-3);
    border-bottom: var(--layform-border-medium) solid var(--layform-ink);
  }

  [data-sv='data-table-row'] td {
    padding: var(--layform-space-2) var(--layform-space-3);
    color: var(--layform-ink);
  }

  /* Pattern 53 + 94: hairline rule between body rows, never on the first row */
  [data-sv='data-table-row'] + [data-sv='data-table-row'] td {
    border-top: var(--layform-border-hairline) solid var(--layform-ink);
  }

  /* Pattern 77: tabular figures for plain numeric cells not routed through a
     Pattern 52 meter. */
  [data-sv='data-table-figure'] {
    font-variant-numeric: tabular-nums;
  }

  /* Pattern 26: monospace marginalia voice for ID/reference columns, one fixed
     small size that never scales with body type. */
  [data-sv='data-table-marginalia'] {
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
  }
</style>
