<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button, Tooltip } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Tooltip',
    component: Tooltip,
    args: { content: 'Copy to clipboard', placement: 'top' },
    argTypes: {
      children: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <Tooltip {...args}>
      <Button variant="ghost" size="sm">Copy</Button>
    </Tooltip>
  {/snippet}
</Story>
