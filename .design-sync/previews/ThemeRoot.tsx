// Mirrors the ThemeRoot contract in .design-sync/react-adapter/index.d.ts
import * as React from 'react';
import { Heading, Stack, Text, ThemeRoot } from '@svnbjrn/design';

const themes = ['dark', 'light', 'amber'] as const;

export const AllThemes = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
    {themes.map((theme) => (
      <ThemeRoot key={theme} theme={theme}>
        <Stack gap={2}>
          <Heading level={4}>{theme}</Heading>
          <Text size="sm">ThemeRoot forwards data-theme="{theme}".</Text>
        </Stack>
      </ThemeRoot>
    ))}
  </div>
);
