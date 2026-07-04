<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/Theme Lab',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'The full world-theming loop, live: pick seed colors (stand-ins for K-Means dominants ' +
            'extracted from uploaded art), pick a mood, and `@svnbjrn/design/generate` builds a ' +
            'complete theme package — contrast targets are inputs to the solver, so every pairing ' +
            'ships AA **by construction**. The result is validated and applied through the runtime ' +
            'engine to the scoped pane below; the tables are the generator’s own report.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Badge, Button, Card, CodeBlock, Heading, Stack, StatCard, Text } from '../../lib/index';
  import { generateTheme, HINT_ONTOLOGY } from '../../lib/generate/index';
  import type { GenerateOptions } from '../../lib/generate/index';
  import { applyWorldTheme, parseWorldTheme } from '../../lib/theme/index';
  import type { WorldThemeHandle } from '../../lib/theme/index';

  let seedInputs = $state(['#c9a227', '#b5473a']);
  let mode = $state<'auto' | 'dark' | 'light'>('auto');
  let hints = $state<string[]>(['grimdark']);

  const options = $derived<GenerateOptions>({
    seeds: seedInputs,
    name: 'theme-lab',
    mode,
    hints
  });
  const generated = $derived(generateTheme(options));

  let pane = $state<HTMLElement | null>(null);
  let handle: WorldThemeHandle | null = null;

  // Mount/unmount only: depends solely on `pane`, so its cleanup doesn't run
  // on every theme change and clobber `handle` before the update effect
  // below can reuse it.
  $effect(() => {
    if (!pane) return;
    return () => {
      handle?.remove();
      handle = null;
    };
  });

  // Reactive update: creates the handle on first successful generation,
  // then calls handle.update() on every subsequent change. No cleanup here
  // — `handle` must survive across re-runs for the update path to matter.
  $effect(() => {
    if (!pane || !generated.ok) return;
    const parsed = parseWorldTheme(generated.value.theme);
    if (!parsed.ok) return;
    if (handle) {
      handle.update(parsed.value);
    } else {
      const applied = applyWorldTheme(parsed.value, { scope: pane });
      handle = applied.ok ? applied.value : null;
    }
  });

  const addSeed = () => {
    if (seedInputs.length < 5) seedInputs = [...seedInputs, '#4ec9b0'];
  };
  const removeSeed = (index: number) => {
    if (seedInputs.length > 1) seedInputs = seedInputs.filter((_, i) => i !== index);
  };
  const toggleHint = (hint: string) => {
    hints = hints.includes(hint) ? hints.filter((h) => h !== hint) : [...hints, hint];
  };

  const sampleCode = `for world in library.worlds:\n    theme = generate(world.seeds)  # AA by construction`;
  const sampleHtml = `<span class="tok-keyword">for</span> world <span class="tok-keyword">in</span> library.worlds:\n    theme = <span class="tok-func">generate</span>(world.seeds)  <span class="tok-comment"># AA by construction</span>`;
</script>

<Story name="Generate from seeds">
  <Stack gap={6}>
    <Stack gap={3}>
      <Heading level={2}>Theme Lab</Heading>
      <div class="controls">
        <fieldset>
          <legend>Seeds</legend>
          {#each seedInputs as seed, i (i)}
            <span class="seed">
              <input
                type="color"
                value={seed}
                oninput={(e) => {
                  const value = e.currentTarget.value;
                  seedInputs = seedInputs.map((s, j) => (j === i ? value : s));
                }}
              />
              <code>{seed}</code>
              {#if seedInputs.length > 1}
                <button type="button" onclick={() => removeSeed(i)} aria-label="remove seed">×</button>
              {/if}
            </span>
          {/each}
          {#if seedInputs.length < 5}
            <button type="button" onclick={addSeed}>+ seed</button>
          {/if}
        </fieldset>
        <fieldset>
          <legend>Mode</legend>
          {#each ['auto', 'dark', 'light'] as m (m)}
            <label><input type="radio" name="mode" value={m} bind:group={mode} /> {m}</label>
          {/each}
        </fieldset>
        <fieldset>
          <legend>Mood</legend>
          {#each Object.keys(HINT_ONTOLOGY) as hint (hint)}
            <label>
              <input type="checkbox" checked={hints.includes(hint)} onchange={() => toggleHint(hint)} />
              {hint}
            </label>
          {/each}
        </fieldset>
      </div>
    </Stack>

    {#if generated.ok}
      <div class="world-pane" bind:this={pane}>
        <Stack gap={4}>
          <Stack direction="row" gap={2}>
            <Badge tone="accent">generated</Badge>
            <Badge>{generated.value.report.mode}</Badge>
            <Badge tone="success">
              {generated.value.report.checks.filter((c) => c.pass).length}/{generated.value.report.checks.length} AA
            </Badge>
          </Stack>
          <Heading level={3}>Every world gets its own light</Heading>
          <Text>
            This pane re-skins from the seeds above. Body text, surfaces, accents, status and the
            full syntax palette are solved to the same contrast architecture as the built-in themes.
          </Text>
          <Stack direction="row" gap={3}>
            <Button variant="primary">Primary</Button>
            <Button>Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </Stack>
          <Stack direction="row" gap={3}>
            <StatCard label="Checks" value={String(generated.value.report.checks.length)} />
            <StatCard label="Warnings" value={String(generated.value.report.warnings.length)} />
          </Stack>
          <Card>
            <Text tone="muted">Seeds in play:</Text>
            <Stack direction="row" gap={2}>
              {#each generated.value.report.seedUsage as usage (usage.index)}
                <span class="seed-chip">
                  <span class="swatch" style:background={usage.seed}></span>
                  <code>{usage.seed}</code>
                  <Badge>{usage.role}</Badge>
                </span>
              {/each}
            </Stack>
          </Card>
          <CodeBlock filename="worlds.py" code={sampleCode} html={sampleHtml} />
        </Stack>
      </div>

      <Stack gap={2}>
        <Heading level={3}>Contrast report</Heading>
        <table class="report">
          <thead>
            <tr><th>pair</th><th>ratio</th><th>floor</th><th>tier</th><th></th></tr>
          </thead>
          <tbody>
            {#each generated.value.report.checks as check (check.fg + check.bg)}
              <tr>
                <td><code>{check.fg}</code> on <code>{check.bg}</code></td>
                <td>{check.ratio.toFixed(2)}:1</td>
                <td>{check.floor}:1</td>
                <td>{check.tier}</td>
                <td>{check.pass ? '✓' : '✗'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if generated.value.report.warnings.length > 0}
          <Heading level={3}>Warnings</Heading>
          <ul>
            {#each generated.value.report.warnings as warning, i (i)}
              <li><code>{JSON.stringify(warning)}</code></li>
            {/each}
          </ul>
        {/if}
      </Stack>
    {:else}
      <Card>
        <Text tone="muted">Generation error: <code>{JSON.stringify(generated.error)}</code></Text>
      </Card>
    {/if}
  </Stack>
</Story>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sv-space-4);
  }
  fieldset {
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    padding: var(--sv-space-2) var(--sv-space-3);
    display: flex;
    align-items: center;
    gap: var(--sv-space-3);
    flex-wrap: wrap;
  }
  legend {
    color: var(--sv-text-muted);
    font-size: var(--sv-fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 var(--sv-space-1);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: var(--sv-space-1);
    color: var(--sv-text);
    font-size: var(--sv-fs-sm);
  }
  .seed {
    display: inline-flex;
    align-items: center;
    gap: var(--sv-space-1);
    font-size: var(--sv-fs-sm);
  }
  .seed input[type='color'] {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    background: none;
    padding: 0;
  }
  .seed button,
  fieldset > button {
    background: var(--sv-surface-2);
    color: var(--sv-text);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    padding: 2px 8px;
    cursor: pointer;
    font-size: var(--sv-fs-sm);
  }
  .world-pane {
    background: var(--sv-bg);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    padding: var(--sv-space-6);
  }
  .seed-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sv-space-1);
    font-size: var(--sv-fs-sm);
  }
  .swatch {
    display: inline-block;
    width: 1em;
    height: 1em;
    border-radius: 3px;
    border: 1px solid var(--sv-border);
  }
  .report {
    border-collapse: collapse;
    font-size: var(--sv-fs-sm);
  }
  .report th,
  .report td {
    text-align: left;
    padding: var(--sv-space-1) var(--sv-space-3);
    border-bottom: 1px solid var(--sv-border);
    color: var(--sv-text);
  }
  .report th {
    color: var(--sv-text-muted);
    font-weight: var(--sv-font-weight-semibold);
  }
  ul {
    color: var(--sv-text-muted);
    font-size: var(--sv-fs-sm);
    padding-left: var(--sv-space-6);
  }
</style>
