<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterDesk, CarterCaseFile, CarterCallout } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Layout/Desk',
    component: CarterDesk,
    args: { columns: 2, gap: 5, padded: true },
    argTypes: {
      columns: { control: { type: 'number', min: 1, max: 6, step: 1 } },
      gap: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] },
      padded: { control: 'boolean' },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <CarterDesk {...args}>
      <CarterCaseFile caseNo="DG-1181" title="Incident at Innsmouth Reach" tone="primary">
        <p>Fishing crew reports lights beneath the tideline. Three refuse further questioning.</p>
      </CarterCaseFile>
      <CarterCaseFile caseNo="DG-1182" title="Harbor Master's Statement" tone="warning">
        <p>Logbook entries for the missing week are present but written in an unknown hand.</p>
      </CarterCaseFile>
    </CarterDesk>
  {/snippet}
</Story>

<Story name="Three columns" asChild>
  <CarterDesk columns={3} gap={4}>
    <CarterCaseFile caseNo="DG-1181" title="Innsmouth Reach" tone="primary">
      <p>Case opened on referral from local PD.</p>
    </CarterCaseFile>
    <CarterCaseFile caseNo="DG-1183" title="Missing Trawler" tone="danger">
      <p>No wreckage recovered. Beacon last pinged inside the reach.</p>
    </CarterCaseFile>
    <CarterCaseFile caseNo="DG-1184" title="Church Register" tone="warning">
      <p>Baptismal records predate the founding of the parish by forty years.</p>
    </CarterCaseFile>
  </CarterDesk>
</Story>

<Story name="Mixed exhibits" asChild>
  <CarterDesk columns={2} gap={5}>
    <CarterCaseFile caseNo="DG-1181" title="Incident at Innsmouth Reach" tone="primary">
      <p>Full field report attached. Photographs pending lab return.</p>
    </CarterCaseFile>
    <CarterCallout kind="unnatural" title="Handler's Note">
      Second witness describes the same silhouette independently. Escalating to Majestic review.
    </CarterCallout>
  </CarterDesk>
</Story>

<Story name="Unpadded" asChild>
  <CarterDesk columns={2} gap={3} padded={false}>
    <CarterCaseFile caseNo="DG-1185" title="Coastal Patrol Log" tone="primary" torn={false}>
      <p>Routine sweep, filed for completeness.</p>
    </CarterCaseFile>
    <CarterCaseFile caseNo="DG-1186" title="Anonymous Tip" tone="danger" torn={false}>
      <p>Caller hung up before giving a name. Trace inconclusive.</p>
    </CarterCaseFile>
  </CarterDesk>
</Story>
