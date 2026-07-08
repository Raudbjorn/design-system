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
});
