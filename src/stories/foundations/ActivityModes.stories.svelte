<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/Activity Modes',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'An **activity mode** (combat / exploration / social) is a sparse token layer the user ' +
            'explicitly selects, composed on top of the world theme via `defineTheme([world, mode])` ' +
            'and applied with `swapTheme` (View Transitions where available). This is *adaptable*, not ' +
            '*adaptive*: modes are user-chosen (never telemetry or timers), fully reversible (the ' +
            '**Default** button returns exactly to the world), and transparent (the active mode is ' +
            'always shown). Modes swap **tokens only** — the control set is identical in every mode, ' +
            'so nothing is ever hidden or moved (the failure mode that sank adaptive menus). Illegible ' +
            'modes cannot be selected: the contrast gate rejects them before they apply.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Badge, Button, Card, Heading, Stack, StatCard, Text, defineTheme, swapTheme } from '../../lib/index';
  // Native <button aria-pressed> for the toggle group — the DS Button is a
  // closed prop set (no aria-pressed), and a mode toggle is a distinct
  // pressed-state affordance from an action button.
  import Eyebrow from './Eyebrow.svelte';

  const SELECTOR = "[data-activity-demo]";
  const base = 'dark';

  // The active campaign's world theme (what a per-setting extraction produced).
  const world = {
    accent: '#c9a227',
    'surface-1': '#1a1714',
    'surface-2': '#211d18'
  };

  // Each mode is a SPARSE token override — a handful of color tokens, nothing
  // structural. No mode adds or removes a control; they only re-tint.
  const modes: Record<string, Record<string, string>> = {
    combat: { accent: '#e06c75', 'surface-1': '#241416' },
    exploration: { accent: '#4ec9b0', 'surface-1': '#132420' },
    social: { accent: '#9cdcfe', 'surface-1': '#141c24' }
  };
  const modeIds = Object.keys(modes);

  let active = $state<string | null>(null);
  let dispose: (() => void) | null = null;
  let mounted = false;

  // User-driven ONLY: called from click handlers, never a timer/observer/telemetry.
  async function select(mode: string | null): Promise<void> {
    const layers = mode ? [world, modes[mode]!] : [world];
    const result = defineTheme(layers, { base });
    if (!result.ok) return; // gate governs — an illegible mode never applies
    const next = await swapTheme(result.theme, { selector: SELECTOR, dispose: dispose ?? undefined });
    // If we were unmounted while swapTheme was in flight, dispose the orphan
    // sheet immediately rather than leaking it (the disposer would otherwise
    // never be reached).
    if (!mounted) {
      next();
      return;
    }
    dispose = next;
    active = mode;
  }

  // Initialise the pane with the world (no activity) on mount; dispose on unmount
  // so the demo leaves no stylesheet behind — every application stays reversible.
  $effect(() => {
    mounted = true;
    void select(null);
    return () => {
      mounted = false;
      dispose?.();
    };
  });
</script>

<Story name="User-selected modes" asChild>
  <Stack gap={6}>
    <Stack gap={3}>
      <Eyebrow>adaptable, not adaptive · tokens only · reversible</Eyebrow>
      <div class="toggles" role="group" aria-label="Activity mode">
        <button type="button" class="toggle" aria-pressed={active === null} onclick={() => select(null)}>
          Default
        </button>
        {#each modeIds as id (id)}
          <button type="button" class="toggle" aria-pressed={active === id} onclick={() => select(id)}>
            {id}
          </button>
        {/each}
        <Badge tone="accent">mode: {active ?? 'none'}</Badge>
      </div>
    </Stack>

    <section data-activity-demo class="pane">
      <Stack gap={4}>
        <Heading level={3}>Same controls, different mode</Heading>
        <Text tone="muted">
          Only tokens change between modes — this exact cluster of controls is present in every
          mode. Nothing is hidden or relocated.
        </Text>
        <Stack direction="row" gap={4} align="center">
          <Button variant="primary">Act</Button>
          <Button variant="secondary">Wait</Button>
          <Badge tone="accent">turn 3</Badge>
        </Stack>
        <Stack direction="row" gap={4}>
          <StatCard value="17" label="Initiative" tone="accent" />
          <StatCard value="4" label="Conditions" tone="accent-2" />
        </Stack>
        <Card padding="md">
          <Text tone="muted">
            Switch modes above and watch the accent and surfaces re-tint via a View Transition.
            Return to Default to restore the world exactly.
          </Text>
        </Card>
      </Stack>
    </section>
  </Stack>
</Story>

<style>
  .toggles {
    display: flex;
    gap: var(--sv-space-2);
    align-items: center;
    flex-wrap: wrap;
  }
  .toggle {
    font: inherit;
    padding: var(--sv-space-1) var(--sv-space-3);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    background: var(--sv-surface-2);
    color: var(--sv-text);
    cursor: pointer;
  }
  .toggle:hover {
    border-color: var(--sv-accent);
  }
  .toggle[aria-pressed='true'] {
    background: var(--sv-accent);
    color: var(--sv-bg);
    border-color: var(--sv-accent);
  }
  .pane {
    background: var(--sv-bg);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    padding: var(--sv-space-6);
  }
</style>
