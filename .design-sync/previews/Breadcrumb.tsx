// Mirrors src/stories/molecules/Breadcrumb.stories.svelte
import * as React from 'react';
import { Breadcrumb } from '@svnbjrn/design';

const items = [
  { label: 'services', href: '/' },
  { label: 'media', href: '/media' },
  { label: 'jellyfin' }
];

export const Default = () => <Breadcrumb items={items} />;
