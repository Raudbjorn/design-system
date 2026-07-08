// Mirrors src/stories/atoms/Alert.stories.svelte
import * as React from 'react';
import { Alert, Stack } from '@svnbjrn/design';

export const Tones = () => (
  <Stack gap={3}>
    <Alert tone="info">DNS zones reloaded from /etc/named.conf</Alert>
    <Alert tone="success" title="Healthy">tailscale mesh — 3 peers online</Alert>
    <Alert tone="warning">Sonarr RSS sync &gt; 3 min; consider increasing interval</Alert>
    <Alert tone="error" title="Down">OpenVINO Model Server — Arc A770 plugin fault</Alert>
  </Stack>
);
