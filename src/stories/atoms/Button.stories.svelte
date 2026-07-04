<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Button',
    component: Button,
    args: { variant: 'primary', size: 'md', disabled: false, loading: false },
    argTypes: {
      variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      type: { control: 'inline-radio', options: ['button', 'submit'] },
      href: { control: 'text' },
      children: { table: { disable: true } },
      onclick: { table: { disable: true } }
    },
    parameters: {
      docs: {
        description: {
          component:
            'Renders an `<a>` when `href` is set, a `<button>` otherwise. `loading` sets ' +
            '`aria-busy` and disables the button element.'
        }
      }
    }
  });
</script>

<Story name="Primary">
  {#snippet template({ children: _, ...args })}
    <Button {...args}>Deploy</Button>
  {/snippet}
</Story>

<Story name="Variants" asChild>
  <Stack direction="row" gap={3} align="center" wrap>
    <Button variant="primary">Deploy</Button>
    <Button variant="secondary">Dry run</Button>
    <Button variant="ghost">View logs</Button>
    <Button variant="danger">Destroy droplet</Button>
  </Stack>
</Story>

<Story name="Sizes" asChild>
  <Stack direction="row" gap={3} align="center" wrap>
    <Button size="sm">Retry</Button>
    <Button size="md">Retry</Button>
    <Button size="lg">Retry</Button>
  </Stack>
</Story>

<Story name="States" asChild>
  <Stack direction="row" gap={3} align="center" wrap>
    <Button disabled>Deploy</Button>
    <Button loading>Deploying…</Button>
  </Stack>
</Story>

<Story name="As link" args={{ href: '#docs', variant: 'secondary' }}>
  {#snippet template({ children: _, ...args })}
    <Button {...args}>Read the docs</Button>
  {/snippet}
</Story>
