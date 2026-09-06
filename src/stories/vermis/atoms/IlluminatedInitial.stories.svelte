<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisIlluminatedInitial, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/IlluminatedInitial',
    component: VermisIlluminatedInitial,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" asChild>
  <VermisIlluminatedInitial firstLetter="T">he reliquary keeper cataloged each relic by lantern-light, ink still wet in the margin.</VermisIlluminatedInitial>
</Story>

<Story name="First letters" asChild>
  <VermisStack direction="column" gap={4}>
    <VermisIlluminatedInitial firstLetter="O">nce the seal was broken, the vermin-script unspooled across the page.</VermisIlluminatedInitial>
    <VermisIlluminatedInitial firstLetter="A">bove the transept, illuminated capitals kept their own calendar of saints.</VermisIlluminatedInitial>
  </VermisStack>
</Story>
