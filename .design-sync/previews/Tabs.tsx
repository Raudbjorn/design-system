// Mirrors src/stories/molecules/Tabs.stories.svelte
import * as React from 'react';
import { Tabs, Text } from '@svnbjrn/design';

const tabItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'logs', label: 'Logs' },
  { id: 'config', label: 'Config' }
];

export const Default = () => {
  const [active, setActive] = React.useState('overview');
  return (
    <div>
      <Tabs tabs={tabItems} value={active} onchange={setActive} />
      <div style={{ padding: '1rem' }}>
        {active === 'overview' && (
          <Text>Service overview — uptime, peers, traffic.</Text>
        )}
        {active === 'logs' && <Text>journalctl -u nginx — last 100 lines.</Text>}
        {active === 'config' && <Text>/etc/named.conf — current zone list.</Text>}
      </div>
    </div>
  );
};
