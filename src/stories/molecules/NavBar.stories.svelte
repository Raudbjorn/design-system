<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Badge, Link, NavBar } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Molecules/NavBar',
    component: NavBar,
    argTypes: {
      brand: { table: { disable: true } },
      children: { table: { disable: true } }
    },
    parameters: {
      layout: 'fullscreen',
      docs: {
        description: {
          component:
            'Sticky, surface-1, one hairline. Below 768px (`--sv-bp-md`) the links collapse ' +
            'behind a `≡` toggle — shrink the canvas to see it.'
        }
      }
    }
  });
</script>

<Story name="Default" asChild>
  <NavBar>
    {#snippet brand()}svnbjrn{/snippet}
    <Link href="#docs">docs</Link>
    <Link href="#tokens">tokens</Link>
    <Link href="#components">components</Link>
    <Badge tone="accent">v0.0.0</Badge>
  </NavBar>
</Story>
