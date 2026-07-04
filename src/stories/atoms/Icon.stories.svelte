<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Icon, Stack, Text } from '../../lib/index';

  // Nerd-Font PUA glyphs the Iosevka subset keeps (U+F000–F2FF) — written as
  // escapes so an editor can't silently drop the private-use characters.
  const TERMINAL = '\uf120';
  const CODE = '\uf121';
  const GITHUB = '\uf09b';

  const { Story } = defineMeta({
    title: 'Atoms/Icon',
    component: Icon,
    args: { glyph: TERMINAL, size: 'md', label: 'Terminal' },
    argTypes: {
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      glyph: { control: 'text' },
      label: { control: 'text' }
    },
    parameters: {
      docs: {
        description: {
          component:
            'Glyph-as-text: the Iosevka subset keeps the Nerd-Font PUA range (U+F000–F2FF), so ' +
            'icons are just characters — no SVG pipeline. Pass `label` for meaningful icons; ' +
            'omit it and the glyph is `aria-hidden` decoration.'
        }
      }
    }
  });

  const glyphs = [
    { glyph: TERMINAL, name: 'terminal · U+F120' },
    { glyph: CODE, name: 'code · U+F121' },
    { glyph: GITHUB, name: 'github · U+F09B' }
  ];
</script>

<Story name="Default" />

<Story name="Glyph set" asChild>
  <Stack direction="row" gap={6} align="center" wrap>
    {#each glyphs as g (g.name)}
      <Stack gap={1} align="center">
        <Icon glyph={g.glyph} label={g.name} size="lg" />
        <Text size="xs" tone="faint" as="span">{g.name}</Text>
      </Stack>
    {/each}
  </Stack>
</Story>

<Story name="Sizes" asChild>
  <Stack direction="row" gap={4} align="center">
    <Icon glyph={TERMINAL} label="Terminal, small" size="sm" />
    <Icon glyph={TERMINAL} label="Terminal, medium" size="md" />
    <Icon glyph={TERMINAL} label="Terminal, large" size="lg" />
  </Stack>
</Story>
