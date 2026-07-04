// Mirrors src/stories/atoms/Icon.stories.svelte
import * as React from 'react';
import { Icon, Stack, Text } from '@svnbjrn/design';

// Nerd-Font PUA glyphs the Iosevka subset keeps (U+F000–F2FF) — written as
// escapes so an editor can't silently drop the private-use characters.
const TERMINAL = '';
const CODE = '';
const GITHUB = '';

const glyphs = [
  { glyph: TERMINAL, name: 'terminal · U+F120' },
  { glyph: CODE, name: 'code · U+F121' },
  { glyph: GITHUB, name: 'github · U+F09B' },
];

export const Default = () => <Icon glyph={TERMINAL} size="md" label="Terminal" />;

export const GlyphSet = () => (
  <Stack direction="row" gap={6} align="center" wrap>
    {glyphs.map((g) => (
      <Stack key={g.name} gap={1} align="center">
        <Icon glyph={g.glyph} label={g.name} size="lg" />
        <Text size="xs" tone="faint" as="span">{g.name}</Text>
      </Stack>
    ))}
  </Stack>
);

export const Sizes = () => (
  <Stack direction="row" gap={4} align="center">
    <Icon glyph={TERMINAL} label="Terminal, small" size="sm" />
    <Icon glyph={TERMINAL} label="Terminal, medium" size="md" />
    <Icon glyph={TERMINAL} label="Terminal, large" size="lg" />
  </Stack>
);
