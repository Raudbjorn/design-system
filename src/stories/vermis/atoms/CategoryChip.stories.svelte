<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisCategoryChip, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/CategoryChip',
    component: VermisCategoryChip,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" asChild>
  <VermisCategoryChip>Bestiary</VermisCategoryChip>
</Story>

<Story name="Pressed states" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisCategoryChip>Marginalia</VermisCategoryChip>
    <VermisCategoryChip pressed>Reliquary</VermisCategoryChip>
  </VermisStack>
</Story>
