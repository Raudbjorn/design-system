<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    VermisStack,
    VermisButton,
    VermisCategoryChip,
    VermisCreditChip,
    VermisStatusTag
  } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  // Single source for Vermis's own gap scale (--layform-space-*) — distinct
  // from core's and from Carter's — drives both the control and the
  // "Gap scale" story below, so they can't drift apart.
  const steps = [0, 1, 2, 3, 4, 6, 8, 12] as const;

  const { Story } = defineMeta({
    title: 'Vermis/Layout/Stack',
    component: VermisStack,
    args: { direction: 'column', gap: 4, align: 'stretch', justify: 'start', wrap: false },
    argTypes: {
      direction: { control: 'inline-radio', options: ['column', 'row'] },
      gap: { control: 'select', options: [...steps] },
      align: { control: 'inline-radio', options: ['start', 'center', 'end', 'stretch'] },
      justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
      wrap: { control: 'boolean' },
      children: { table: { disable: true } }
    },
    parameters: {
      ...argosSingleMode,
      docs: {
        description: {
          component:
            'The Vermis layout primitive. `gap` takes steps against ' +
            "`--layform-space-*` — Vermis's own scale, narrower than core's and " +
            "different from Carter's — not pixels."
        }
      }
    }
  });
</script>

<!-- Stack's only required prop is `children`, and none of its other props are
     interesting behind a single Controls-driven preview — every story here
     goes straight to `asChild`, same as core's NavBar.stories.svelte. -->

<Story name="Column" asChild>
  <VermisStack gap={3}>
    <VermisStatusTag status="draft">Unglossed marginalia</VermisStatusTag>
    <VermisCategoryChip>Bestiary</VermisCategoryChip>
    <VermisCreditChip>trans. anonymous, 3rd hand</VermisCreditChip>
  </VermisStack>
</Story>

<Story name="Row" asChild>
  <VermisStack direction="row" gap={3} align="center">
    <VermisCategoryChip>Marginalia</VermisCategoryChip>
    <VermisStatusTag status="deprecated">superseded rite</VermisStatusTag>
    <VermisButton size="sm" variant="callout">Consult the index</VermisButton>
  </VermisStack>
</Story>

<!-- The dashed frame is part of the demo: it is the box the chips wrap in,
     making the wrap point intentional rather than an artifact of whatever
     width the canvas happens to have. -->
<Story name="Wrapping" asChild>
  <div class="frame">
    <VermisStack direction="row" gap={2} wrap>
      <VermisCategoryChip>Bestiary</VermisCategoryChip>
      <VermisCategoryChip>Marginalia</VermisCategoryChip>
      <VermisCategoryChip>Reliquary</VermisCategoryChip>
      <VermisCategoryChip>Wayfinding</VermisCategoryChip>
      <VermisCategoryChip>Sigilwork</VermisCategoryChip>
      <VermisCategoryChip>Threshold rite</VermisCategoryChip>
      <VermisCategoryChip>Cartulary</VermisCategoryChip>
    </VermisStack>
  </div>
</Story>

<Story name="Gap scale" asChild>
  <VermisStack gap={6}>
    {#each steps as step (step)}
      <div class="gap-row">
        <span class="gap-label">{`gap={${step}}`}</span>
        <VermisStack direction="row" gap={step}>
          <VermisCategoryChip>sigil</VermisCategoryChip>
          <VermisCategoryChip>rosette</VermisCategoryChip>
          <VermisCategoryChip>threshold</VermisCategoryChip>
        </VermisStack>
      </div>
    {/each}
  </VermisStack>
</Story>

<style>
  .frame {
    max-width: 24rem;
    padding: var(--layform-space-3);
    border: var(--layform-border-hairline) solid var(--layform-ink);
    border-radius: var(--layform-radius-panel);
  }
  .gap-row {
    display: grid;
    grid-template-columns: 6rem 1fr;
    align-items: center;
    gap: var(--layform-space-4);
  }
  .gap-label {
    font-family: var(--layform-font-marginalia);
    font-size: 0.8125rem;
    color: var(--layform-ink);
  }
</style>
