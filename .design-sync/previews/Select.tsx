// Mirrors src/stories/atoms/Select.stories.svelte
import * as React from 'react';
import { Select } from '@svnbjrn/design';

const options = [
  { value: 'sveinbjorn', label: 'sveinbjorn' },
  { value: 'vinbonesjr', label: 'vinbonesjr' },
  { value: 'd4ll', label: 'd4ll' }
];

export const Default = () => (
  <Select id="host" label="Target host" options={options} />
);
