<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisCoverPage } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Templates/CoverPage',
    component: VermisCoverPage,
    argTypes: {
      hero: { table: { disable: true } }
    },
    parameters: { ...argosSingleMode, layout: 'fullscreen' }
  });
</script>

<Story name="Default" asChild>
  <VermisCoverPage
    kicker="Book the Second"
    title="The Coastal Chapters"
    subtitle="Being an account of the drowned parishes and what still keeps their hours"
    credit="Transcribed by the Custodian of the Low Archive"
    volume="II"
    categories={['guide', 'reference', 'archive']}
  >
    {#snippet hero()}
      <div
        style="min-height: 16rem; display: flex; align-items: center; justify-content: center;"
      >
        (hero art placeholder)
      </div>
    {/snippet}
  </VermisCoverPage>
</Story>

<Story name="Minimal" asChild>
  <VermisCoverPage title="Fragments of the Ninth Vigil">
    {#snippet hero()}
      <div
        style="min-height: 16rem; display: flex; align-items: center; justify-content: center;"
      >
        (hero art placeholder)
      </div>
    {/snippet}
  </VermisCoverPage>
</Story>
