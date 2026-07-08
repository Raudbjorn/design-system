// Mirrors src/stories/atoms/Radio.stories.svelte
import * as React from 'react';
import { Radio, Stack } from '@svnbjrn/design';

export const Group = () => {
  const [group, setGroup] = React.useState('sycl');
  return (
    <Stack gap={3}>
      <Radio group={group} onchange={setGroup} name="backend" value="sycl">
        SYCL (Arc A770)
      </Radio>
      <Radio group={group} onchange={setGroup} name="backend" value="vulkan">
        Vulkan
      </Radio>
      <Radio group={group} onchange={setGroup} name="backend" value="cpu">
        CPU
      </Radio>
    </Stack>
  );
};
