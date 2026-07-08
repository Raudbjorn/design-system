<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Badge, Table } from '../../lib/index';

  type Column = {
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'right' | 'center';
    mono?: boolean;
  };

  const columns: Column[] = [
    { key: 'service', header: 'Service', width: '180px' },
    { key: 'host', header: 'Host', mono: true },
    { key: 'p95', header: 'p95', align: 'right' },
    { key: 'status', header: 'Status' }
  ];

  const defaultRows = [
    { service: 'nginx', host: 'vinbonesjr', p95: '12ms', status: 'healthy' },
    { service: 'sonarr', host: 'sveinbjorn', p95: '340ms', status: 'degraded' },
    { service: 'jellyfin', host: 'd4ll', p95: '1.2s', status: 'down' }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/Table',
    component: Table,
    argTypes: { cell: { table: { disable: true } } }
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Table {...args} {columns} rows={defaultRows} />
  {/snippet}
</Story>

<Story name="RichCells">
  {#snippet template(args)}
    <Table
      {...args}
      {columns}
      rows={defaultRows}
    >
      {#snippet cell({ column, value })}
        {#if column.key === 'status'}
          <Badge
            tone={
              value === 'healthy'
                ? 'success'
                : value === 'degraded'
                  ? 'warning'
                  : 'error'
            }
          >{value}</Badge>
        {:else}
          {value}
        {/if}
      {/snippet}
    </Table>
  {/snippet}
</Story>
