<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Stack } from '../../lib/index';

  // Single source for the gap scale — drives both the control and the
  // "Gap scale" story, so they can't drift apart.
  const steps = [0, 1, 2, 3, 4, 6, 8, 12] as const;

  const { Story } = defineMeta({
    title: 'Layout/Stack',
    component: Stack,
    args: { as: 'div', direction: 'column', gap: 4, align: 'stretch', justify: 'start', wrap: false },
    argTypes: {
      as: {
        control: 'select',
        options: [
          'div',
          'section',
          'article',
          'nav',
          'header',
          'footer',
          'main',
          'aside',
          'form',
          'ul',
          'ol'
        ]
      },
      direction: { control: 'inline-radio', options: ['column', 'row'] },
      gap: { control: 'select', options: [...steps] },
      align: { control: 'select', options: ['start', 'center', 'end', 'stretch', 'baseline'] },
      justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
      wrap: { control: 'boolean' },
      children: { table: { disable: true } }
    },
    parameters: {
      docs: {
        description: {
          component:
            'The only layout primitive. `gap` takes spacing-scale *steps* (`--sv-space-*`), ' +
            'not pixels — the missing steps are missing on purpose. Renders a `div` unless ' +
            '`as` says otherwise (`ul`/`ol` lose their list chrome). Extra attributes ' +
            '(`class`, `style`, `aria-*`) pass through, but the flex contract always beats ' +
            'a colliding consumer `style`.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Avatar, Badge, Button, Kbd, StatCard, Text } from '../../lib/index';
  import SpecRow from '../foundations/SpecRow.svelte';
</script>

<!-- Four children with strongly different intrinsic sizes, so every knob
     visibly acts: stretch vs start is dramatic in column mode; justify reads
     best with direction: row, where the stack spans the preview. -->
<Story name="Playground">
  {#snippet template({ children: _, ...args })}
    <Stack {...args}>
      <StatCard value="128" label="Deploys" />
      <Button variant="secondary">View logs</Button>
      <Badge tone="success">healthy</Badge>
      <Text size="sm" tone="muted">last push 3m ago · <Kbd>d</Kbd> to deploy</Text>
    </Stack>
  {/snippet}
</Story>

<!-- Five distinct heights and baselines: flipping align between center,
     baseline and start is immediately legible; justify=between spreads a
     plausible toolbar. -->
<Story name="Row" args={{ direction: 'row', gap: 3, align: 'center' }}>
  {#snippet template({ children: _, ...args })}
    <Stack {...args}>
      <Avatar alt="Jellyfin" size="sm" />
      <Text mono size="sm">jellyfin :8096</Text>
      <Badge tone="success">up 41 days</Badge>
      <Text size="xs" tone="faint">v10.9 · hw transcode</Text>
      <Button size="sm" variant="ghost">Restart</Button>
    </Stack>
  {/snippet}
</Story>

<!-- The dashed frame is part of the demo: it is the box the chips wrap in,
     making the wrap point intentional rather than an artifact of whatever
     width the canvas happens to have. -->
<Story name="Wrapping" args={{ direction: 'row', gap: 2, wrap: true }}>
  {#snippet template({ children: _, ...args })}
    <div class="frame">
      <Stack {...args}>
        <Badge tone="accent">x265</Badge>
        <Badge>1080p</Badge>
        <Badge>bluray</Badge>
        <Badge>dts-hd</Badge>
        <Badge>hdr10</Badge>
        <Badge>atmos</Badge>
        <Badge>remux</Badge>
        <Badge>web-dl</Badge>
        <Badge>10bit</Badge>
        <Badge tone="warning">proper</Badge>
        <Badge>repack</Badge>
        <Badge>multi-sub</Badge>
        <Badge>truehd</Badge>
        <Badge>dv</Badge>
      </Stack>
    </div>
  {/snippet}
</Story>

<Story name="Gap scale" asChild>
  <Stack gap={6}>
    {#each steps as step (step)}
      <SpecRow label={`gap={${step}}`} labelWidth="6rem" align="center">
        <Stack direction="row" gap={step}>
          <Badge>sonarr</Badge>
          <Badge>radarr</Badge>
          <Badge>prowlarr</Badge>
        </Stack>
      </SpecRow>
    {/each}
  </Stack>
</Story>

<style>
  .frame {
    max-width: 24rem;
    padding: var(--sv-space-3);
    border: 1px dashed var(--sv-border);
    border-radius: var(--sv-radius-md);
  }
</style>
