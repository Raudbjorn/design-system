<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/Theming',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'Themes are **data**: `defineTheme` validates a partial palette override ' +
            '(known token names, 6-digit hex only — a CSS-injection guard for machine-extracted ' +
            'palettes) and re-checks every WCAG pairing the base palettes guarantee. ' +
            'The result renders to plain `--sv-*` custom properties via `themeCss`, here scoped ' +
            'to a wrapper; `applyTheme` does the same document-wide. Rejections come back as an ' +
            'issue list, never a stylesheet. `defineTheme` also accepts an ordered array of ' +
            'layers (base → world → activity → user-override); later layers win.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Badge, Button, Card, Heading, Stack, StatCard, Text, defineTheme, themeCss } from '../../lib/index';
  import Eyebrow from './Eyebrow.svelte';

  // Two "world" palettes as an extraction pipeline might hand them over.
  // Both are asserted valid at module init — a story that ships a rejected
  // theme should fail loudly, not render mystery defaults.
  const emberOverrides = {
    bg: '#16120c',
    'surface-1': '#1c1710',
    'surface-2': '#221c13',
    'surface-3': '#2a2318',
    border: '#4a3c26',
    text: '#e0d3bd',
    'text-strong': '#f5ecd9',
    accent: '#ff9d45',
    'accent-2': '#d96c5f'
  };
  const ember = defineTheme(emberOverrides);
  const verdant = defineTheme(
    {
      bg: '#e9f0dc',
      'surface-1': '#e0ead0',
      'surface-2': '#d8e3c5',
      'surface-3': '#cfdcb9',
      border: '#a8bb8a',
      text: '#2e3b24',
      'text-strong': '#1f2a17',
      accent: '#2c6e49',
      'accent-2': '#a04b3c'
    },
    { base: 'light' }
  );
  // Layered composition: the ember world layer plus a user-preference layer
  // (brighter parchment-gold accent) — later layer wins per token.
  const emberUser = defineTheme([emberOverrides, { accent: '#ffd27d' }]);
  if (!ember.ok || !verdant.ok || !emberUser.ok) throw new Error('story preset failed its theme gates');

  const worlds = [
    { id: 'ember', base: 'dark', title: 'Ember Hollow', note: 'grimdark · over the dark base', css: themeCss(ember.theme, "[data-world='ember']") },
    { id: 'verdant', base: 'light', title: 'Verdant Reach', note: 'solarpunk · over the light base', css: themeCss(verdant.theme, "[data-world='verdant']") },
    { id: 'ember-user', base: 'dark', title: 'Ember Hollow · user layer', note: 'world + user override · later layer wins', css: themeCss(emberUser.theme, "[data-world='ember-user']") }
  ];

  // The gate at work: an "LLM-extracted" override with an injection attempt,
  // an unknown token, and illegible ink. Nothing here reaches a stylesheet.
  const hostile = defineTheme({
    accent: 'url(javascript:alert(1))',
    banner: '#ff0000',
    text: '#3a3a3a'
  });
  const issues = hostile.ok ? [] : hostile.issues;

  const describe = (issue: (typeof issues)[number]): string => {
    switch (issue.kind) {
      case 'unknown-token':
        return `unknown token "${issue.token}" — not in the --sv-* allowlist`;
      case 'invalid-color':
        return `invalid color for "${issue.token}": ${issue.value} — only 6-digit hex passes`;
      case 'invalid-layer':
        return `layer ${issue.index} is not an object — every layer must be a token map`;
      case 'missing-token':
        return `custom base is missing "${issue.token}" — a base palette must be complete`;
      case 'contrast':
        return `contrast ${issue.fg}/${issue.bg} is ${issue.ratio.toFixed(2)}:1 — needs ${issue.min}:1`;
    }
  };
</script>

<Story name="Worlds as data" asChild>
  <Stack gap={8}>
    {#each worlds as world (world.id)}
      {@html `<style>${world.css}</style>`}
      <section data-world={world.id} data-theme={world.base} class="world">
        <Stack gap={4}>
          <Eyebrow>{world.title} · {world.note}</Eyebrow>
          <Stack direction="row" gap={4} align="center">
            <Button variant="primary">Venture forth</Button>
            <Button variant="secondary">Hold</Button>
            <Badge tone="accent">quest</Badge>
          </Stack>
          <Stack direction="row" gap={4}>
            <StatCard value="1289" label="Souls accounted" tone="accent" />
            <StatCard value="7" label="Wards standing" tone="accent-2" />
          </Stack>
          <Card padding="md">
            <Stack gap={2}>
              <Heading level={3}>Same components, different world</Heading>
              <Text tone="muted">
                Only tokens changed: this cluster is styled by the scoped override block above it.
              </Text>
            </Stack>
          </Card>
        </Stack>
      </section>
    {/each}
  </Stack>
</Story>

<Story name="Rejected themes" asChild>
  <Stack gap={4}>
    <Eyebrow>defineTheme returns issues, not a stylesheet</Eyebrow>
    <Text tone="muted">
      Override: accent = url(javascript:alert(1)) · banner = #ff0000 · text = #3a3a3a
    </Text>
    <ul class="issues">
      {#each issues as issue}
        <li><Text size="sm" mono>{describe(issue)}</Text></li>
      {/each}
    </ul>
  </Stack>
</Story>

<style>
  .world {
    background: var(--sv-bg);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    padding: var(--sv-space-6);
  }
  .issues {
    margin: 0;
    padding-inline-start: var(--sv-space-6);
    display: grid;
    gap: var(--sv-space-2);
    color: var(--sv-error);
  }
</style>
