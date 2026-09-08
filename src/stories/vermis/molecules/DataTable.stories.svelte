<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisDataTable } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const columns = [
    { key: 'name', label: 'Name', kind: 'text' as const },
    { key: 'entry', label: 'Entry', kind: 'marginalia' as const },
    { key: 'threat', label: 'Threat', kind: 'meter' as const, max: 10 },
    { key: 'sightings', label: 'Sightings', kind: 'numeric' as const }
  ];

  const rows = [
    { name: 'The Wick-Eyed Hound', entry: 'MS. 14v', threat: 7, sightings: 42 },
    { name: 'Marrowlight Moth', entry: 'MS. 22r', threat: 3, sightings: 118 },
    { name: 'The Unspoken Tenant', entry: 'MS. 3v', threat: 9, sightings: 6 },
    { name: 'Pale Cartographer', entry: 'MS. 41r', threat: 5, sightings: 27 }
  ];

  // Exercises StatMeter's own clamping: 0 draws no filled segments, and a
  // value past `max` (11 against a max of 10) clamps rather than overflowing.
  const extremeRows = [
    { name: 'The Unwritten Margin', entry: 'MS. 1r', threat: 0, sightings: 0 },
    { name: 'The Devouring Colophon', entry: 'MS. 99v', threat: 11, sightings: 3 }
  ];

  const { Story } = defineMeta({
    title: 'Vermis/Molecules/DataTable',
    component: VermisDataTable,
    args: { 'aria-label': 'Bestiary ledger' },
    argTypes: {
      columns: { table: { disable: true } },
      rows: { table: { disable: true } },
      'aria-label': { control: 'text' }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <VermisDataTable {...args} {columns} {rows} />
  {/snippet}
</Story>

<Story name="Meter clamping" args={{ 'aria-label': 'Bestiary ledger, boundary entries' }}>
  {#snippet template(args)}
    <VermisDataTable {...args} {columns} rows={extremeRows} />
  {/snippet}
</Story>
