<script lang="ts">
  import { Button, Badge, Card, CodeBlock, StatCard, NavBar, Stack, Heading, Text } from './lib/index';
  let theme = $state<'dark' | 'light'>('dark');
  $effect(() => document.documentElement.setAttribute('data-theme', theme));
</script>

<NavBar>
  {#snippet brand()}svnbjrn{/snippet}
  <button onclick={() => (theme = theme === 'dark' ? 'light' : 'dark')}>Toggle theme</button>
</NavBar>

<Stack gap={6}>
  <Heading level={1}>Components</Heading>
  <Stack direction="row" gap={2}>
    <Button>Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </Stack>
  <Stack direction="row" gap={2}>
    <Badge>neutral</Badge>
    <Badge tone="success">pass</Badge>
    <Badge tone="error">fail</Badge>
    <Badge tone="accent">accent</Badge>
  </Stack>
  <Stack direction="row" gap={4}>
    <StatCard value="128" label="Deploys" />
    <StatCard value="9" label="Open PRs" tone="accent-2" />
  </Stack>
  <Card>
    {#snippet header()}<Text tone="strong">A card</Text>{/snippet}
    <Text>Body text in the card.</Text>
  </Card>
  <CodeBlock code={'const x = 1;\nconsole.log(x);'} filename="demo.ts" />
  <CodeBlock
    code={'function greet(name: string) {\n  return `hi ${name}`;\n}\n\ngreet("svnbjrn");'}
    filename="numbered.ts"
    showLineNumbers
  />
</Stack>

<style>
  :global(body) { margin: 0; padding: var(--sv-space-6); background: var(--sv-bg); }
</style>
