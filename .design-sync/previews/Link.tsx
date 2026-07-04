// Mirrors src/stories/atoms/Link.stories.svelte
import * as React from 'react';
import { Link, Text } from '@svnbjrn/design';

export const Internal = () => (
  <Text>
    Tokens are generated from a single source — see <Link href="#">palette.ts</Link> for the ramp.
  </Text>
);

export const External = () => (
  <Text>
    External links get the arrow and <Text as="span" mono size="sm">rel="noopener noreferrer"</Text>:{' '}
    <Link href="https://sveinbjorn.dev" external>sveinbjorn.dev</Link>
  </Text>
);
