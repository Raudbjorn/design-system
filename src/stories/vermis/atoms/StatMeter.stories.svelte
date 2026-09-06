<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisStatMeter, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/StatMeter',
    component: VermisStatMeter,
    args: { value: 3, max: 10, label: 'Fortitude' },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="Variants" asChild>
  <VermisStack direction="column" gap={2}>
    <VermisStatMeter value={2} max={10} label="Wariness" />
    <VermisStatMeter value={9} max={10} label="Ruin" />
  </VermisStack>
</Story>
