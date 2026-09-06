<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterCheckbox, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Checkbox',
    component: CarterCheckbox,
    args: { label: 'Confirm chain of custody', checked: false, disabled: false },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="Checked" args={{ checked: true }} />

<Story name="States" asChild>
  <CarterStack gap={3}>
    <CarterCheckbox checked label="Chain of custody confirmed" />
    <CarterCheckbox label="Evidence bag sealed" />
    <CarterCheckbox disabled label="Polygraph administered — pending" />
  </CarterStack>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack gap={3}>
      <CarterCheckbox checked label="Chain of custody confirmed" />
      <CarterCheckbox label="Evidence bag sealed" />
      <CarterCheckbox disabled label="Polygraph administered — pending" />
    </CarterStack>
  </div>
</Story>
