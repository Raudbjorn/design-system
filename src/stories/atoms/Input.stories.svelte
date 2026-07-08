<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Input } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Input',
    component: Input,
    args: { id: 'input', label: 'Hostname' },
    argTypes: {
      oninput: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Input {...args} placeholder="vinbonesjr" />
  {/snippet}
</Story>

<Story name="WithHint" asChild>
  <Input id="hint-demo" label="Host" hint="FQDN or Tailscale hostname" />
</Story>

<Story name="Error" asChild>
  <Input id="err" label="Port" error="Port out of range" />
</Story>
