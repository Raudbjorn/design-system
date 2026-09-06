<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisButton, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/Button',
    component: VermisButton,
    args: { variant: 'primary', size: 'md', disabled: false, loading: false },
    argTypes: {
      variant: { control: 'select', options: ['primary', 'callout'] },
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      type: { control: 'inline-radio', options: ['button', 'submit'] },
      href: { control: 'text' },
      children: { table: { disable: true } },
      onclick: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Primary">
  {#snippet template({ children: _, ...args })}
    <VermisButton {...args}>Enter the reliquary</VermisButton>
  {/snippet}
</Story>

<Story name="Variants" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisButton variant="primary">Primary</VermisButton>
    <VermisButton variant="callout">Callout</VermisButton>
  </VermisStack>
</Story>

<Story name="Sizes" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisButton size="sm">Small</VermisButton>
    <VermisButton size="md">Medium</VermisButton>
    <VermisButton size="lg">Large</VermisButton>
  </VermisStack>
</Story>

<Story name="States" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisButton disabled>Disabled</VermisButton>
    <VermisButton loading>Loading…</VermisButton>
  </VermisStack>
</Story>
