import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Table from './Table.svelte';

type CellArg = {
  row: Record<string, unknown>;
  column: { key: string; header: string };
  value: unknown;
};

describe('Table', () => {
  it('scopes headers and renders the parameterized cell snippet', () => {
    const { container } = render(Table, {
      columns: [{ key: 'k', header: 'H' }],
      rows: [{ k: 'v1' }, { k: 'v2' }],
      cell: createRawSnippet<[CellArg]>((arg) => ({
        render: () => `<b data-cell>${String(arg().value)}</b>`
      }))
    });
    const th = container.querySelector('th');
    expect(th).toHaveAttribute('scope', 'col');
    expect(th).toHaveTextContent('H');
    const cells = container.querySelectorAll('[data-cell]');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent('v1');
    expect(cells[1]).toHaveTextContent('v2');
  });

  it('preserves row DOM identity when recreated rows use rowKey', async () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const { container, rerender } = render(Table, {
      columns,
      rows: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' }
      ],
      rowKey: 'id'
    });
    const initialRows = container.querySelectorAll('tbody tr');
    const firstRow = initialRows[0];
    const secondRow = initialRows[1];
    await rerender({
      columns,
      rows: [
        { id: 'b', name: 'B updated' },
        { id: 'a', name: 'A updated' }
      ],
      rowKey: 'id'
    });
    const reorderedRows = container.querySelectorAll('tbody tr');
    expect(reorderedRows[0]).toBe(secondRow);
    expect(reorderedRows[1]).toBe(firstRow);
  });

  it('supports an empty-string row key field', async () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const { container, rerender } = render(Table, {
      columns,
      rows: [
        { '': 'a', name: 'A' },
        { '': 'b', name: 'B' }
      ],
      rowKey: ''
    });
    const initialRows = container.querySelectorAll('tbody tr');
    const firstRow = initialRows[0];
    const secondRow = initialRows[1];

    await rerender({
      columns,
      rows: [
        { '': 'b', name: 'B updated' },
        { '': 'a', name: 'A updated' }
      ],
      rowKey: ''
    });
    const reorderedRows = container.querySelectorAll('tbody tr');
    expect(reorderedRows[0]).toBe(secondRow);
    expect(reorderedRows[1]).toBe(firstRow);
  });

  it('falls back to row identity for missing or duplicate row keys', () => {
    const { container } = render(Table, {
      columns: [{ key: 'name', header: 'Name' }],
      rows: [
        { name: 'Missing A' },
        { name: 'Missing B' },
        { id: 'duplicate', name: 'Duplicate A' },
        { id: 'duplicate', name: 'Duplicate B' }
      ],
      rowKey: 'id'
    });
    const renderedRows = container.querySelectorAll('tbody tr');
    expect(renderedRows).toHaveLength(4);
    expect(renderedRows[0]).toHaveTextContent('Missing A');
    expect(renderedRows[3]).toHaveTextContent('Duplicate B');
  });

  it('replaces a unique row that is missing the configured key', async () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const { container, rerender } = render(Table, {
      columns,
      rows: [{ name: 'Missing' }],
      rowKey: 'id'
    });
    const initialRow = container.querySelector('tbody tr');

    await rerender({
      columns,
      rows: [{ name: 'Replacement' }],
      rowKey: 'id'
    });
    const replacementRow = container.querySelector('tbody tr');
    expect(replacementRow).not.toBe(initialRow);
    expect(replacementRow).toHaveTextContent('Replacement');
  });

  it('assigns distinct fallback keys to repeated row references', () => {
    const columns = [{ key: 'name', header: 'Name' }];
    const row = { id: 'same', name: 'Repeated' };

    for (const rowKey of [undefined, 'id']) {
      const { container, unmount } = render(Table, {
        columns,
        rows: [row, row],
        rowKey
      });
      expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
      unmount();
    }
  });

});
