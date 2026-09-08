<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisFormField, VermisFormLabel, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Molecules/FormField',
    component: VermisFormField,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<!-- `children` is required and not a meaningful Controls target — every
     story here goes straight to `asChild`, same as core's NavBar.stories.svelte. -->

<Story name="Default" asChild>
  <VermisFormField>
    <input
      id="pilgrim-name"
      type="text"
      placeholder="Name of the pilgrim"
      aria-label="Name of the pilgrim"
    />
  </VermisFormField>
</Story>

<Story name="Paired with label" asChild>
  <VermisStack direction="column" gap={2}>
    <VermisFormLabel for="reliquary-note">Note for the reliquary keeper</VermisFormLabel>
    <VermisFormField>
      <input id="reliquary-note" type="text" />
    </VermisFormField>
  </VermisStack>
</Story>

<Story name="Select" asChild>
  <VermisFormField>
    <select id="rite-choice" aria-label="Choice of rite">
      <option>Rite of Threshold</option>
      <option>Rite of Sealing</option>
      <option>Rite of Unbinding</option>
    </select>
  </VermisFormField>
</Story>
