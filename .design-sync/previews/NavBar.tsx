// Mirrors src/stories/molecules/NavBar.stories.svelte
import * as React from 'react';
import { Badge, Link, NavBar } from '@svnbjrn/design';

export const Default = () => (
  <NavBar brand="svnbjrn">
    <Link href="#docs">docs</Link>
    <Link href="#tokens">tokens</Link>
    <Link href="#components">components</Link>
    <Badge tone="accent">v0.0.0</Badge>
  </NavBar>
);
