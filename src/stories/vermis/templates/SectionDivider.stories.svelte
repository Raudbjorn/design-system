<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisSectionDivider } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Templates/SectionDivider',
    component: VermisSectionDivider,
    argTypes: {
      hero: { table: { disable: true } },
      subtitle: { table: { disable: true } }
    },
    parameters: { ...argosSingleMode, layout: 'fullscreen' }
  });
</script>

<Story name="Default" asChild>
  <VermisSectionDivider title="III. The Salt Wardens">
    {#snippet hero()}
      <div
        style="min-height: 16rem; display: flex; align-items: center; justify-content: center;"
      >
        (hero art placeholder)
      </div>
    {/snippet}
    {#snippet subtitle()}Wherein the tideline is kept and its debts are counted{/snippet}
  </VermisSectionDivider>
</Story>

<Story name="Mortal" asChild>
  <VermisSectionDivider title="VII. The Last Sacrament" tone="mortal">
    {#snippet hero()}
      <div
        style="min-height: 16rem; display: flex; align-items: center; justify-content: center;"
      >
        (hero art placeholder)
      </div>
    {/snippet}
    {#snippet subtitle()}A chapter no living reader was meant to finish{/snippet}
  </VermisSectionDivider>
</Story>
