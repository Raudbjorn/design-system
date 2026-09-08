<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisCreditChip, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/CreditChip',
    component: VermisCreditChip,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" asChild>
  <VermisCreditChip>Illustrated by M. Vex, 1897</VermisCreditChip>
</Story>

<Story name="Variants" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisCreditChip>Trans. from the Latin</VermisCreditChip>
    <VermisCreditChip>Plate VII, restored</VermisCreditChip>
    <VermisCreditChip>Anonymous marginal hand</VermisCreditChip>
  </VermisStack>
</Story>
