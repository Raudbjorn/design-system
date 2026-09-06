<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterButton, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Button',
    component: CarterButton,
    args: { variant: 'default', size: 'md', disabled: false, loading: false },
    argTypes: {
      variant: { control: 'select', options: ['default', 'primary', 'danger', 'ghost'] },
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      href: { control: 'text' },
      children: { table: { disable: true } },
      onclick: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <CarterButton {...args}>Open the case file</CarterButton>
  {/snippet}
</Story>

<Story name="Variants" asChild>
  <CarterStack direction="row" gap={3} align="center" wrap>
    <CarterButton variant="default">Default</CarterButton>
    <CarterButton variant="primary">Primary</CarterButton>
    <CarterButton variant="danger">Danger</CarterButton>
    <CarterButton variant="ghost">Ghost</CarterButton>
  </CarterStack>
</Story>

<Story name="Sizes" asChild>
  <CarterStack direction="row" gap={3} align="center" wrap>
    <CarterButton size="sm">Small</CarterButton>
    <CarterButton size="md">Medium</CarterButton>
    <CarterButton size="lg">Large</CarterButton>
  </CarterStack>
</Story>

<Story name="States" asChild>
  <CarterStack direction="row" gap={3} align="center" wrap>
    <CarterButton disabled>Disabled</CarterButton>
    <CarterButton loading>Loading…</CarterButton>
  </CarterStack>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack direction="row" gap={3} align="center" wrap>
      <CarterButton variant="primary">Primary</CarterButton>
      <CarterButton variant="danger">Danger</CarterButton>
      <CarterButton variant="ghost">Ghost</CarterButton>
    </CarterStack>
  </div>
</Story>
