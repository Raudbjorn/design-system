<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Tabs, Text } from '../../lib/index';

  const tabItems = [
    { id: 'overview', label: 'Overview', tabId: 'overview-tab', panelId: 'overview-panel' },
    { id: 'logs', label: 'Logs', tabId: 'logs-tab', panelId: 'logs-panel' },
    { id: 'config', label: 'Config', tabId: 'config-tab', panelId: 'config-panel' }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/Tabs',
    component: Tabs,
    argTypes: { onchange: { table: { disable: true } } }
  });
</script>

<script lang="ts">
  let active = $state('overview');
</script>

<Story name="Default" asChild>
  <div>
    <Tabs tabs={tabItems} bind:value={active} />
    <div
      id={`${active}-panel`}
      role="tabpanel"
      aria-labelledby={`${active}-tab`}
      style="padding: 1rem;"
    >
      {#if active === 'overview'}
        <Text>Service overview — uptime, peers, traffic.</Text>
      {:else if active === 'logs'}
        <Text>journalctl -u nginx — last 100 lines.</Text>
      {:else}
        <Text>/etc/named.conf — current zone list.</Text>
      {/if}
    </div>
  </div>
</Story>
