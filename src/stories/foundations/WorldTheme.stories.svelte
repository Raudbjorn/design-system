<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/World Theme',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'The runtime theme engine (`@svnbjrn/design/theme`) ingests **world-theme packages** — ' +
            'sparse DTCG token overrides with a manifest — validates every value against a strict ' +
            'grammar, contrast-gates the result against WCAG AA, and applies it as CSS in ' +
            '`@layer sv.world`. This story applies the bundled *grimdark* fixture to a **scoped ' +
            'preview** (a `data-sv-world` subtree), so the page theme around it is untouched — ' +
            'flip the toolbar theme to see them coexist. The report table below is the engine’s ' +
            'own issue output.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Badge, Button, CodeBlock, Heading, Stack, StatCard, Text } from '../../lib/index';
  import { parseWorldTheme, applyWorldTheme } from '../../lib/theme/index';
  import type { WorldThemeHandle } from '../../lib/theme/index';
  import grimdark from '../../lib/theme/fixtures/grimdark.json';

  const parsed = parseWorldTheme(grimdark);
  const theme = parsed.ok ? parsed.value : null;
  const issues = parsed.ok ? parsed.value.issues : parsed.error;

  let pane = $state<HTMLElement | null>(null);
  let handle: WorldThemeHandle | null = null;

  $effect(() => {
    if (!pane || !theme) return;
    const applied = applyWorldTheme(theme, { scope: pane });
    handle = applied.ok ? applied.value : null;
    return () => handle?.remove();
  });

  const overrides = theme ? [...theme.tokens.entries()] : [];

  const sampleCode = `const world = await bones.themes.load('grimdark-hive');\nswitchWorldTheme(world); // gate-checked, layered, reversible`;
  const sampleHtml = `<span class="tok-keyword">const</span> world = <span class="tok-keyword">await</span> bones.themes.<span class="tok-func">load</span>(<span class="tok-string">'grimdark-hive'</span>);\n<span class="tok-func">switchWorldTheme</span>(world); <span class="tok-comment">// gate-checked, layered, reversible</span>`;
</script>

<Story name="Scoped preview">
  <Stack gap={6}>
    <Stack gap={2}>
      <Heading level={2}>A world inside the page</Heading>
      <Text tone="muted">
        Everything inside the framed pane renders under the <code>grimdark-hive</code> package;
        everything outside stays on the active built-in theme.
      </Text>
    </Stack>

    <div class="world-pane" bind:this={pane}>
      <Stack gap={4}>
        <Stack direction="row" gap={2}>
          <Badge tone="accent">Hive Primus</Badge>
          <Badge>campaign</Badge>
          <Badge tone="success">AA gated</Badge>
        </Stack>
        <Heading level={3}>Ashes of Armageddon</Heading>
        <Text>
          The hive's spires vanish into brown haze. Every surface below this line takes its color
          from tokens extracted out of the uploaded fiction — accents included.
        </Text>
        <Stack direction="row" gap={3}>
          <Button variant="primary">Inscribe</Button>
          <Button>Archive</Button>
          <Button variant="ghost">Dismiss</Button>
        </Stack>
        <Stack direction="row" gap={3}>
          <StatCard label="Initiative" value="17" />
          <StatCard label="Threat" value="Extreme" />
        </Stack>
        <CodeBlock filename="world.ts" code={sampleCode} html={sampleHtml} />
      </Stack>
    </div>

    <Stack gap={2}>
      <Heading level={3}>Surviving overrides</Heading>
      <table class="report">
        <thead>
          <tr><th>token</th><th>value</th></tr>
        </thead>
        <tbody>
          {#each overrides as [token, value] (token)}
            <tr>
              <td><code>--sv-{token}</code></td>
              <td>
                {#if value.startsWith('#')}<span class="swatch" style:background={value}></span>{/if}
                <code>{value}</code>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </Stack>

    <Stack gap={2}>
      <Heading level={3}>Engine report</Heading>
      {#if issues.length === 0}
        <Text tone="muted">No issues — every override cleared the gate.</Text>
      {:else}
        <table class="report">
          <thead>
            <tr><th>severity</th><th>code</th><th>token</th><th>message</th></tr>
          </thead>
          <tbody>
            {#each issues as issue, i (i)}
              <tr>
                <td>{issue.severity}</td>
                <td><code>{issue.code}</code></td>
                <td><code>{issue.token ?? '—'}</code></td>
                <td>{issue.message}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </Stack>
  </Stack>
</Story>

<style>
  .world-pane {
    background: var(--sv-bg);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    padding: var(--sv-space-6);
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
  .swatch {
    display: inline-block;
    width: 0.9em;
    height: 0.9em;
    border-radius: 3px;
    border: 1px solid var(--sv-border);
    margin-right: var(--sv-space-1);
    vertical-align: -0.1em;
  }
</style>
