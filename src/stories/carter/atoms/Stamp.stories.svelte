<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterStamp, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Stamp',
    component: CarterStamp,
    args: { label: 'CLASSIFIED', tone: 'stamp', angle: -8, double: true },
    argTypes: {
      tone: { control: 'select', options: ['stamp', 'primary', 'ink'] },
      angle: { control: { type: 'range', min: -45, max: 45, step: 1 } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" args={{ label: 'CLASSIFIED' }} />

<Story name="Tones" asChild>
  <CarterStack direction="row" gap={4} align="center" wrap>
    <CarterStamp label="CLASSIFIED" tone="stamp" />
    <CarterStamp label="APPROVED" tone="primary" />
    <CarterStamp label="ARCHIVED" tone="ink" />
  </CarterStack>
</Story>

<Story name="Single ruled" args={{ label: 'BURN AFTER READING', double: false, angle: 4 }} />

<Story name="Steep angle" args={{ label: 'DO NOT DISTRIBUTE', angle: -22 }} />
