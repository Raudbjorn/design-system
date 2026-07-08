// Mirrors src/stories/molecules/Table.stories.svelte
import * as React from 'react';
import { Badge, Table, type TableColumn } from '@svnbjrn/design';

const columns: TableColumn[] = [
  { key: 'service', header: 'Service', width: '180px' },
  { key: 'host', header: 'Host', mono: true },
  { key: 'p95', header: 'p95', align: 'right' },
  { key: 'status', header: 'Status' }
];

const rows = [
  { service: 'nginx', host: 'vinbonesjr', p95: '12ms', status: 'healthy' },
  { service: 'sonarr', host: 'sveinbjorn', p95: '340ms', status: 'degraded' },
  { service: 'jellyfin', host: 'd4ll', p95: '1.2s', status: 'down' }
];

export const Default = () => <Table columns={columns} rows={rows} />;

export const RichCells = () => (
  <Table
    columns={columns}
    rows={rows}
    cell={({ column, value }) =>
      column.key === 'status' ? (
        <Badge
          tone={
            value === 'healthy'
              ? 'success'
              : value === 'degraded'
                ? 'warning'
                : 'error'
          }
        >
          {String(value)}
        </Badge>
      ) : (
        <>{String(value)}</>
      )
    }
  />
);
