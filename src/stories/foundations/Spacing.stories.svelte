<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/Spacing & Radius',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'An 8-step spacing scale on a 0.25rem base (steps 5, 7 and 9–11 intentionally absent — ' +
            'the gaps force rhythm), three radii, and two shadows. `Stack` consumes the same ' +
            '`--sv-space-*` steps as its `gap` prop.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Stack, Text } from '../../lib/index';

  const steps = [0, 1, 2, 3, 4, 6, 8, 12] as const;
  const radii = ['sm', 'md', 'lg'] as const;
  const shadows = ['sm', 'md'] as const;
</script>

<Story name="Scale" asChild>
  <Stack gap={12}>
    <section>
      <h3 class="eyebrow">--sv-space-* · 0.25rem base</h3>
      <Stack gap={3}>
        {#each steps as s (s)}
          <div class="row">
            <span class="label">--sv-space-{s}</span>
            <div class="bar" style:width={`var(--sv-space-${s})`}></div>
          </div>
        {/each}
      </Stack>
    </section>

    <section>
      <h3 class="eyebrow">--sv-radius-*</h3>
      <div class="swatch-row">
        {#each radii as r (r)}
          <div class="radius-card" style:border-radius={`var(--sv-radius-${r})`}>
            <span class="label">{r}</span>
          </div>
        {/each}
      </div>
    </section>

    <section>
      <h3 class="eyebrow">--sv-shadow-*</h3>
      <div class="swatch-row">
        {#each shadows as s (s)}
          <div class="shadow-card" style:box-shadow={`var(--sv-shadow-${s})`}>
            <span class="label">{s}</span>
          </div>
        {/each}
      </div>
      <Text size="sm" tone="muted"
        >Shadows are tuned for dark surfaces — on the light paper theme they read softer by design.</Text
      >
    </section>
  </Stack>
</Story>

<style>
  .eyebrow {
    margin: 0 0 var(--sv-space-4);
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    font-weight: var(--sv-font-weight-normal);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sv-text-muted);
  }
  .row {
    display: grid;
    grid-template-columns: 8rem 1fr;
    align-items: center;
    gap: var(--sv-space-4);
  }
  .label {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }
  .bar {
    height: var(--sv-space-4);
    min-width: 1px;
    background: var(--sv-accent);
    border-radius: 1px;
  }
  .swatch-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sv-space-4);
    margin-block-end: var(--sv-space-3);
  }
  .radius-card,
  .shadow-card {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 7rem;
    height: 4.5rem;
    background: var(--sv-surface-2);
    border: 1px solid var(--sv-border);
  }
  .shadow-card {
    border-radius: var(--sv-radius-md);
    background: var(--sv-surface-1);
  }
</style>
