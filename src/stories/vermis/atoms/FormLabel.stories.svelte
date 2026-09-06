<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisFormLabel, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/FormLabel',
    component: VermisFormLabel,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" asChild>
  <VermisFormLabel for="pilgrim-name">Name of the pilgrim</VermisFormLabel>
</Story>

<Story name="Paired with input" asChild>
  <VermisStack direction="column" gap={2}>
    <VermisFormLabel for="reliquary-note">Note for the reliquary keeper</VermisFormLabel>
    <input id="reliquary-note" type="text" />
  </VermisStack>
</Story>
