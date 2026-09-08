<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterCaseFile, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Molecules/CaseFile',
    component: CarterCaseFile,
    args: {
      tab: 'FILE',
      caseNo: 'DG-1181',
      title: 'Incident at Innsmouth Reach',
      tone: 'primary',
      torn: true
    },
    argTypes: {
      tone: { control: 'inline-radio', options: ['primary', 'danger', 'warning'] },
      torn: { control: 'boolean' },
      header: { table: { disable: true } },
      children: { table: { disable: true } },
      footer: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template({ header: _h, children: _c, footer: _f, ...args })}
    <CarterCaseFile {...args}>
      <p>Witness reports overlapping and contradictory. Recommend Agent dispatch before local PD closes the scene.</p>
    </CarterCaseFile>
  {/snippet}
</Story>

<Story name="Tones" asChild>
  <CarterStack direction="row" gap={4} align="start" wrap>
    <CarterCaseFile caseNo="DG-1181" title="Routine Filing" tone="primary">
      <p>Standard intake, no follow-up required.</p>
    </CarterCaseFile>
    <CarterCaseFile caseNo="DG-1182" title="Missing Trawler" tone="danger">
      <p>Beacon last pinged inside the reach. Search suspended.</p>
    </CarterCaseFile>
    <CarterCaseFile caseNo="DG-1183" title="Church Register" tone="warning">
      <p>Baptismal records predate the parish by forty years.</p>
    </CarterCaseFile>
  </CarterStack>
</Story>

<Story name="With footer" asChild>
  <CarterCaseFile caseNo="DG-1184" title="Harbor Master's Statement" tone="primary">
    <p>Logbook entries for the missing week are present but written in an unknown hand.</p>
    {#snippet footer()}
      Filed by Agent Reyes — 04:12 EST
    {/snippet}
  </CarterCaseFile>
</Story>

<Story name="Custom header" asChild>
  <CarterCaseFile tone="danger">
    {#snippet header()}
      <div style="display:flex; justify-content:space-between; align-items:baseline;">
        <span class="carter-label">DG-1187 — EYES ONLY</span>
        <span class="carter-caption">MAJESTIC-12</span>
      </div>
    {/snippet}
    <p>Distribution restricted. Do not duplicate this file.</p>
  </CarterCaseFile>
</Story>

<Story name="Squared edge" asChild>
  <CarterCaseFile caseNo="DG-1188" title="Coastal Patrol Log" tone="primary" torn={false}>
    <p>Routine sweep, filed for completeness. No anomalies noted.</p>
  </CarterCaseFile>
</Story>
