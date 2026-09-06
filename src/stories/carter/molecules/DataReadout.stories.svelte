<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterDataReadout } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const columns = [
    { key: 'site', label: 'Site' },
    { key: 'signal', label: 'Signal', align: 'right' as const },
    { key: 'anomaly', label: 'Anomaly Index', align: 'right' as const },
    { key: 'status', label: 'Status' }
  ];

  const rows = [
    { site: 'Sector 7', signal: 42.6, anomaly: 8.1, status: 'ACTIVE' },
    { site: 'Sector 12', signal: 3.2, anomaly: 0.4, status: 'NOMINAL' },
    { site: 'Sector 19', signal: 91.8, anomaly: 14.7, status: 'CRITICAL' },
    { site: 'Sector 4', signal: 12.0, anomaly: 1.1, status: 'NOMINAL' }
  ];

  const { Story } = defineMeta({
    title: 'Carter/Molecules/DataReadout',
    component: CarterDataReadout,
    args: { caption: 'Sensor Readings — Perimeter Array' },
    argTypes: {
      caption: { control: 'text' },
      columns: { table: { disable: true } },
      rows: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <CarterDataReadout {...args} {columns} {rows} />
  {/snippet}
</Story>

<Story name="No caption">
  {#snippet template({ caption: _, ...args })}
    <CarterDataReadout {...args} {columns} {rows} />
  {/snippet}
</Story>
