<!--
  DataReadout — monospace evidence/stat table for case-file data. Header row
  is wide-tracked caps, rows are ruled with a dashed hairline and tint on
  hover, numeric cells use tabular figures. Defensive against empty data.
-->
<script lang="ts">
  type Align = "left" | "right" | "center";

  interface Column {
    key: string;
    label: string;
    align?: Align;
  }

  interface Props {
    /** Column definitions, rendered left to right in order. */
    columns?: Column[];
    /** Row data, one object per row, keyed by column key. */
    rows?: Record<string, string | number>[];
    /** Optional caption; also becomes the region's accessible name. */
    caption?: string;
  }

  let { columns = [], rows = [], caption }: Props = $props();
</script>

<div class="readout" role="region" aria-label={caption}>
  {#if caption}
    <div class="caption-bar carter-label">{caption}</div>
  {/if}
  <table>
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th scope="col" style:text-align={col.align ?? "left"}>{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, i (i)}
        <tr>
          {#each columns as col (col.key)}
            {@const value = row[col.key]}
            <td class:carter-tnum={typeof value === "number"} style:text-align={col.align ?? "left"}>
              {value ?? ""}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .readout {
    width: 100%;
  }

  .caption-bar {
    padding: var(--carter-space-2) var(--carter-space-3);
    border-bottom: var(--carter-border-rule) solid var(--carter-border-strong);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--carter-font-data);
    font-size: var(--carter-fs-sm);
    color: var(--carter-text);
  }

  th {
    padding: var(--carter-space-2) var(--carter-space-3);
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    font-size: var(--carter-fs-2xs);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
    color: var(--carter-text-muted);
    border-bottom: var(--carter-border-rule) solid var(--carter-border-strong);
  }

  td {
    padding: var(--carter-space-2) var(--carter-space-3);
    border-bottom: var(--carter-border-hair) dashed var(--carter-border);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover td {
    background: color-mix(in srgb, var(--carter-primary) 12%, transparent);
  }
</style>
