<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Layout/Stack',
    component: Stack,
    args: { direction: 'column', gap: 4, align: 'stretch', justify: 'start', wrap: false },
    argTypes: {
      direction: { control: 'inline-radio', options: ['column', 'row'] },
      gap: { control: 'select', options: [0, 1, 2, 3, 4, 6, 8, 12] },
      align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
      justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
      children: { table: { disable: true } }
    },
    parameters: {
      docs: {
        description: {
          component:
            'The only layout primitive. `gap` takes spacing-scale *steps* (`--sv-space-*`), ' +
            'not pixels — the missing steps are missing on purpose.'
        }
      }
    }
  });
</script>

<Story name="Playground">
  {#snippet template({ children: _, ...args })}
    <Stack {...args}>
      <div class="box">one</div>
      <div class="box">two</div>
      <div class="box">three</div>
    </Stack>
  {/snippet}
</Story>

<Story name="Row" args={{ direction: 'row', gap: 3, align: 'center' }}>
  {#snippet template({ children: _, ...args })}
    <Stack {...args}>
      <div class="box">sonarr :8989</div>
      <div class="box">radarr :7878</div>
      <div class="box">jellyfin :8096</div>
    </Stack>
  {/snippet}
</Story>

<Story name="Wrapping" args={{ direction: 'row', gap: 2, wrap: true }}>
  {#snippet template({ children: _, ...args })}
    <Stack {...args}>
      {#each { length: 14 } as _, i (i)}
        <div class="box">chunk-{i}</div>
      {/each}
    </Stack>
  {/snippet}
</Story>

<style>
  .box {
    padding: var(--sv-space-2) var(--sv-space-3);
    background: var(--sv-surface-2);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
  }
</style>
