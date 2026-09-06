<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterSanityMeter, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/SanityMeter',
    component: CarterSanityMeter,
    args: { value: 7, max: 10, label: 'SAN', tone: 'primary' },
    argTypes: {
      value: { control: { type: 'number', min: 0, max: 20 } },
      max: { control: { type: 'number', min: 1, max: 20 } },
      tone: { control: 'select', options: ['primary', 'danger', 'warning'] }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="Critical" args={{ value: 2, tone: 'danger' }} />

<Story name="Tones" asChild>
  <CarterStack gap={3}>
    <CarterSanityMeter value={7} tone="primary" />
    <CarterSanityMeter value={4} tone="warning" />
    <CarterSanityMeter value={2} tone="danger" />
  </CarterStack>
</Story>

<Story name="Multiple gauges" asChild>
  <CarterStack gap={3}>
    <CarterSanityMeter value={9} label="SAN" tone="primary" />
    <CarterSanityMeter value={3} max={6} label="HP" tone="warning" />
    <CarterSanityMeter value={1} max={8} label="WP" tone="danger" />
  </CarterStack>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack gap={3}>
      <CarterSanityMeter value={7} tone="primary" />
      <CarterSanityMeter value={2} tone="danger" />
    </CarterStack>
  </div>
</Story>
