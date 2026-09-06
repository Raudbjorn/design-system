<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterBriefingLayout } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Templates/BriefingLayout',
    component: CarterBriefingLayout,
    argTypes: {
      nav: { table: { disable: true } },
      notes: { table: { disable: true } },
      children: { table: { disable: true } }
    },
    parameters: { ...argosSingleMode, layout: 'fullscreen' }
  });
</script>

<Story name="Default" asChild>
  <CarterBriefingLayout
    title="Coldwater Relay — Situation Briefing"
    caveat="SAR-DELTA GREEN"
    nav={[
      { label: 'Overview', href: '#overview', active: true },
      { label: 'Timeline', href: '#timeline' },
      { label: 'Personnel', href: '#personnel' },
      { label: 'Evidence log', href: '#evidence' }
    ]}
  >
    <p>
      At 02:14 the Coldwater relay station stopped transmitting. The last routine check-in, thirty-two
      minutes earlier, reported nothing unusual. A recovery team reached the site at 06:40 and found the
      station intact but unmanned.
    </p>
    <p>
      Two magnetic tapes were recovered from the second recorder. Transcripts are attached as Exhibits 3
      and 7. Field agents are advised to review the margin annotations before proceeding to Volume II.
    </p>
    {#snippet notes()}
      <p><strong>Margin note:</strong> Compare tape 2 against the Bellhaven incident, 1971.</p>
      <p><strong>Margin note:</strong> Do not brief local liaison until Volume II is cleared.</p>
    {/snippet}
  </CarterBriefingLayout>
</Story>

<Story name="Without annotations" asChild>
  <CarterBriefingLayout
    title="Coldwater Relay — Situation Briefing"
    nav={[
      { label: 'Overview', href: '#overview', active: true },
      { label: 'Timeline', href: '#timeline' }
    ]}
  >
    <p>
      At 02:14 the Coldwater relay station stopped transmitting. A recovery team reached the site at
      06:40 and found the station intact but unmanned.
    </p>
  </CarterBriefingLayout>
</Story>
