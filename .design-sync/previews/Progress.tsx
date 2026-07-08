// Mirrors src/stories/atoms/Progress.stories.svelte
import * as React from 'react';
import { Progress } from '@svnbjrn/design';

export const Determinate = () => <Progress value={60} label="Syncing" />;

export const Indeterminate = () => (
  <Progress indeterminate label="Compiling SYCL kernels" />
);
