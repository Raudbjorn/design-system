<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisBadge, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/Badge',
    component: VermisBadge,
    args: {
      icon: 'spiral-sigil' as const,
      shape: 'circle' as const,
      size: 'md' as const,
      emphasis: 'active' as const,
      ariaLabel: 'Spiral sigil'
    },
    argTypes: {
      icon: {
        control: 'select',
        options: [
          'spiral-sigil',
          'radiating-burst',
          'eye-in-circle',
          'skull-border-tile',
          'crescent-moon',
          'serpentine-divider',
          'rosette'
        ]
      },
      shape: { control: 'inline-radio', options: ['circle', 'square'] },
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      emphasis: { control: 'inline-radio', options: ['active', 'muted'] },
      label: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="Icons" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisBadge icon="spiral-sigil" ariaLabel="Spiral sigil" />
    <VermisBadge icon="radiating-burst" ariaLabel="Radiating burst" />
    <VermisBadge icon="eye-in-circle" ariaLabel="Eye in circle" />
    <VermisBadge icon="skull-border-tile" ariaLabel="Skull border tile" />
    <VermisBadge icon="crescent-moon" ariaLabel="Crescent moon" />
    <VermisBadge icon="serpentine-divider" ariaLabel="Serpentine divider" />
    <VermisBadge icon="rosette" ariaLabel="Rosette" />
  </VermisStack>
</Story>

<Story name="With label" asChild>
  <VermisStack direction="row" gap={3} align="center" wrap>
    <VermisBadge icon="crescent-moon">
      {#snippet label()}Waning{/snippet}
    </VermisBadge>
    <VermisBadge icon="skull-border-tile" emphasis="muted">
      {#snippet label()}Interred{/snippet}
    </VermisBadge>
  </VermisStack>
</Story>
