// Mirrors src/stories/atoms/Input.stories.svelte
import * as React from 'react';
import { Input } from '@svnbjrn/design';

export const Default = () => (
  <Input id="input" label="Hostname" placeholder="vinbonesjr" />
);

export const WithHint = () => (
  <Input id="hint-demo" label="Host" hint="FQDN or Tailscale hostname" />
);

export const Error = () => (
  <Input id="err" label="Port" error="Port out of range" />
);
