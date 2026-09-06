<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisHeading, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/Heading',
    component: VermisHeading,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Levels" asChild>
  <VermisStack gap={4}>
    <VermisHeading level={1}>The Vermis Compendium</VermisHeading>
    <VermisHeading level={2}>Rites of the Hollow Choir</VermisHeading>
    <VermisHeading level={3}>Marginalia &amp; Glosses</VermisHeading>
    <VermisHeading level={4}>A Note on Provenance</VermisHeading>
  </VermisStack>
</Story>

<Story name="Kicker" asChild>
  <VermisStack gap={1} align="start">
    <VermisHeading level={4} kicker>Chapter II</VermisHeading>
    <VermisHeading level={2}>The Serpent's Ledger</VermisHeading>
  </VermisStack>
</Story>
