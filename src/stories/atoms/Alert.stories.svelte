<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Alert, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Alert',
    component: Alert,
    argTypes: { children: { table: { disable: true } } }
  });
</script>

<Story name="Tones" asChild>
  <Stack gap={3}>
    <Alert tone="info">DNS zones reloaded from /etc/named.conf</Alert>
    <Alert tone="success" title="Healthy">tailscale mesh — 3 peers online</Alert>
    <Alert tone="warning">Sonarr RSS sync > 3 min; consider increasing interval</Alert>
    <Alert tone="error" title="Down">OpenVINO Model Server — Arc A770 plugin fault</Alert>
  </Stack>
</Story>
