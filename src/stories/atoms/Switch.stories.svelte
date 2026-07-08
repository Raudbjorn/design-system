<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Switch, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Switch',
    component: Switch,
    args: { checked: false, disabled: false },
    argTypes: {
      children: { table: { disable: true } },
      onchange: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <Switch {...args} />
  {/snippet}
</Story>

<Story name="WithLabel" asChild>
  <Switch>Enable telemetry</Switch>
</Story>
