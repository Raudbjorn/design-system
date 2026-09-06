<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisLink, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/Link',
    component: VermisLink,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" asChild>
  <VermisLink href="#reliquary">Open the reliquary</VermisLink>
</Story>

<Story name="Multiple hrefs" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisLink href="#codex">the codex</VermisLink>
    <VermisLink href="#marginalia">the marginalia</VermisLink>
    <VermisLink href="https://example.com/vermis">the external gloss</VermisLink>
  </VermisStack>
</Story>
