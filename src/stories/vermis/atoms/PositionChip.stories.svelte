<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisPositionChip, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/PositionChip',
    component: VermisPositionChip,
    args: { current: 2, total: 5 },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="Variants" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisPositionChip current={2} total={5} />
    <VermisPositionChip current={5} total={5} />
  </VermisStack>
</Story>
