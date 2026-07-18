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
      {tabItems.map((tab) => (
        <div
          key={tab.id}
          id={tab.panelId}
          role="tabpanel"
          aria-labelledby={tab.tabId}
          hidden={active !== tab.id}
          style={{ padding: '1rem' }}
        >
          {tab.id === 'overview' && (
            <Text>Service overview — uptime, peers, traffic.</Text>
          )}
          {tab.id === 'logs' && <Text>journalctl -u nginx — last 100 lines.</Text>}
          {tab.id === 'config' && <Text>/etc/named.conf — current zone list.</Text>}
        </div>
      ))}
    </div>
  );
};
