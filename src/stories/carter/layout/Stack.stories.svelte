<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterStack, CarterButton, CarterCheckbox, CarterKicker, CarterTimestamp } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  // Single source for Carter's own gap scale (--carter-space-*) — distinct
  // from core's and from Vermis's — drives both the control and the
  // "Gap scale" story below, so they can't drift apart.
  const steps = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const;

  const { Story } = defineMeta({
    title: 'Carter/Layout/Stack',
    component: CarterStack,
    args: { direction: 'column', gap: 4, align: 'stretch', justify: 'start', wrap: false },
    argTypes: {
      direction: { control: 'inline-radio', options: ['column', 'row'] },
      gap: { control: 'select', options: [...steps] },
      align: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
      justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
      wrap: { control: 'boolean' },
      children: { table: { disable: true } }
    },
    parameters: {
      ...argosSingleMode,
      docs: {
        description: {
          component:
            "Carter's layout primitive. `gap` takes steps against " +
            "`--carter-space-*` — Carter's own scale, distinct from core's and " +
            "from Vermis's — not pixels."
        }
      }
    }
  });
</script>

<!-- Three children with strongly different intrinsic sizes, so every knob
     visibly acts: stretch vs start is dramatic in column mode; justify reads
     best with direction: row, where the stack spans the preview. -->
<Story name="Playground">
  {#snippet template({ children: _, ...args })}
    <CarterStack {...args}>
      <CarterKicker tone="primary">FILE 04-B</CarterKicker>
      <CarterCheckbox label="Chain of custody confirmed" checked />
      <CarterButton size="sm">Open the case file</CarterButton>
    </CarterStack>
  {/snippet}
</Story>

<Story name="Row" asChild>
  <CarterStack direction="row" gap={3} align="center">
    <CarterKicker tone="danger">CONTAINMENT BREACH</CarterKicker>
    <CarterTimestamp prefix="Logged:" value="1927-07-17T02:14:00" />
    <CarterButton size="sm" variant="ghost">Acknowledge</CarterButton>
  </CarterStack>
</Story>

<!-- The dashed frame is part of the demo: it is the box the tags wrap in,
     making the wrap point intentional rather than an artifact of whatever
     width the canvas happens to have. -->
<Story name="Wrapping" asChild>
  <div class="frame">
    <CarterStack direction="row" gap={2} wrap>
      <CarterButton size="sm" variant="ghost">04-A</CarterButton>
      <CarterButton size="sm" variant="ghost">04-B</CarterButton>
      <CarterButton size="sm" variant="ghost">04-C</CarterButton>
      <CarterButton size="sm" variant="ghost">05-A</CarterButton>
      <CarterButton size="sm" variant="ghost">05-B</CarterButton>
      <CarterButton size="sm" variant="ghost">06-A</CarterButton>
      <CarterButton size="sm" variant="ghost">06-B</CarterButton>
    </CarterStack>
  </div>
</Story>

<Story name="Gap scale" asChild>
  <CarterStack gap={6}>
    {#each steps as step (step)}
      <div class="gap-row">
        <span class="gap-label">{`gap={${step}}`}</span>
        <CarterStack direction="row" gap={step}>
          <CarterButton size="sm" variant="ghost">Mulder</CarterButton>
          <CarterButton size="sm" variant="ghost">Scully</CarterButton>
          <CarterButton size="sm" variant="ghost">Skinner</CarterButton>
        </CarterStack>
      </div>
    {/each}
  </CarterStack>
</Story>

<style>
  .frame {
    max-width: 24rem;
    padding: var(--carter-space-3);
    border: var(--carter-border-hair) dashed var(--carter-border-strong);
    border-radius: var(--carter-radius-sm);
  }
  .gap-row {
    display: grid;
    grid-template-columns: 6rem 1fr;
    align-items: center;
    gap: var(--carter-space-4);
  }
  .gap-label {
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-xs);
    color: var(--carter-text-muted);
  }
</style>
