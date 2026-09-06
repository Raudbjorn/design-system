<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterDossierCover } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Templates/DossierCover',
    component: CarterDossierCover,
    args: {
      title: 'Operation Coldwater',
      subtitle: 'A field report on the Coldwater relay incident and the recordings that followed.',
      classification: 'TOP SECRET',
      caveat: 'SAR-DELTA GREEN',
      volume: 'VOL. II',
      caseNo: 'CASE NO. 41-B',
      stamps: ['EYES ONLY', 'DO NOT DUPLICATE']
    },
    argTypes: {
      stamps: { table: { disable: true } },
      focal: { table: { disable: true } }
    },
    parameters: { ...argosSingleMode, layout: 'fullscreen' }
  });
</script>

<Story name="Default" />

<Story name="Minimal" asChild>
  <CarterDossierCover title="Operation Coldwater" />
</Story>

<Story name="With focal art" asChild>
  <CarterDossierCover
    title="Operation Coldwater"
    subtitle="A field report on the Coldwater relay incident and the recordings that followed."
    volume="VOL. II"
    caseNo="CASE NO. 41-B"
    stamps={['EYES ONLY']}
  >
    {#snippet focal()}
      <div style="min-height: 22rem; display: flex; align-items: center; justify-content: center;">
        (site photograph, redacted)
      </div>
    {/snippet}
  </CarterDossierCover>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="background: var(--carter-bg); color: var(--carter-text); min-height: 100%;">
    <CarterDossierCover
      title="Operation Coldwater"
      subtitle="A field report on the Coldwater relay incident and the recordings that followed."
      volume="VOL. II"
      caseNo="CASE NO. 41-B"
      stamps={['EYES ONLY', 'DO NOT DUPLICATE']}
    />
  </div>
</Story>
