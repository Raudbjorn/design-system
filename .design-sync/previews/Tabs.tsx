// Mirrors src/stories/molecules/Tabs.stories.svelte
import * as React from 'react';
import { Tabs, Text } from '@svnbjrn/design';

const tabItems = [
  { id: 'overview', label: 'Overview', tabId: 'overview-tab', panelId: 'overview-panel' },
  { id: 'logs', label: 'Logs', tabId: 'logs-tab', panelId: 'logs-panel' },
  { id: 'config', label: 'Config', tabId: 'config-tab', panelId: 'config-panel' }
];

export const Default = () => {
  const [active, setActive] = React.useState('overview');
  return (
    <div>
      <Tabs tabs={tabItems} value={active} onchange={setActive} />
      <div
        id={`${active}-panel`}
        role="tabpanel"
        aria-labelledby={`${active}-tab`}
        style={{ padding: '1rem' }}
      >
        {active === 'overview' && (
          <Text>Service overview — uptime, peers, traffic.</Text>
        )}
        {active === 'logs' && <Text>journalctl -u nginx — last 100 lines.</Text>}
        {active === 'config' && <Text>/etc/named.conf — current zone list.</Text>}
      </div>
    </div>
  );
};
