<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Link, Text } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Link',
    component: Link,
    args: { href: '#', external: false },
    argTypes: {
      href: { control: 'text' },
      children: { table: { disable: true } }
    }
  });
</script>

<Story name="Internal">
  {#snippet template({ children: _, ...args })}
    <Text>
      Tokens are generated from a single source — see
      <Link {...args}>palette.ts</Link> for the ramp.
    </Text>
  {/snippet}
</Story>

<Story name="External" args={{ href: 'https://sveinbjorn.dev', external: true }}>
  {#snippet template({ children: _, ...args })}
    <Text>
      External links get the arrow and <Text as="span" mono size="sm">rel="noopener"</Text>:
      <Link {...args}>sveinbjorn.dev</Link>
    </Text>
  {/snippet}
</Story>
