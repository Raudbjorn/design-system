<script lang="ts">
  import {
    Avatar,
    Badge,
    Button,
    Card,
    CodeBlock,
    Heading,
    Icon,
    Kbd,
    Link,
    NavBar,
    Stack,
    StatCard,
    Text
  } from './lib/index';

  let theme = $state<'dark' | 'light'>('dark');
  $effect(() => document.documentElement.setAttribute('data-theme', theme));

  // The dark palette from tokens/palette.ts, shown through the system's own
  // signature component. `code` is the copy source; `html` is the same text
  // pre-tokenized the way a build-time highlighter would emit it.
  const paletteCss = `:root {
  --sv-bg: #191919;
  --sv-surface-1: #1e1e1e;
  --sv-border: #3c3c3c;
  --sv-text: #d4d4d4;
  --sv-accent: #4ec9b0;   /* teal — everything interactive */
  --sv-accent-2: #e06c75; /* coral — one emphasis per view */
  --sv-success: #0c9138;
  --sv-warning: #ffa500;
  --sv-error: #f44430;
}`;
  const paletteHtml = `<span class="tok-func">:root</span> {
  <span class="tok-var">--sv-bg</span>: <span class="tok-string">#191919</span>;
  <span class="tok-var">--sv-surface-1</span>: <span class="tok-string">#1e1e1e</span>;
  <span class="tok-var">--sv-border</span>: <span class="tok-string">#3c3c3c</span>;
  <span class="tok-var">--sv-text</span>: <span class="tok-string">#d4d4d4</span>;
  <span class="tok-var">--sv-accent</span>: <span class="tok-string">#4ec9b0</span>;   <span class="tok-comment">/* teal — everything interactive */</span>
  <span class="tok-var">--sv-accent-2</span>: <span class="tok-string">#e06c75</span>; <span class="tok-comment">/* coral — one emphasis per view */</span>
  <span class="tok-var">--sv-success</span>: <span class="tok-string">#0c9138</span>;
  <span class="tok-var">--sv-warning</span>: <span class="tok-string">#ffa500</span>;
  <span class="tok-var">--sv-error</span>: <span class="tok-string">#f44430</span>;
}`;

  const colorChips = ['accent', 'accent-2', 'success', 'warning', 'error'];
  const neutralChips = ['bg', 'surface-1', 'surface-2', 'surface-3', 'border'];

  const headingRamp = [
    { token: '--sv-fs-3xl / h1', level: 1, sample: 'Sveinbjörn' },
    { token: '--sv-fs-2xl / h2', level: 2, sample: 'Þingvellir' },
    { token: '--sv-fs-xl / h3', level: 3, sample: 'Reykjavík' },
    { token: '--sv-fs-lg / h4', level: 4, sample: 'Ísafjörður' }
  ] as const;

  // Nerd-Font PUA glyphs the Iosevka subset keeps (U+F000–F2FF).
  const glyphs = { terminal: '', code: '', github: '' };
</script>

<NavBar>
  {#snippet brand()}svnbjrn{/snippet}
  <button class="theme" onclick={() => (theme = theme === 'dark' ? 'light' : 'dark')}>
    {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
  </button>
</NavBar>

<main>
  <header class="hero">
    <h1><span class="at">@</span>svnbjrn/design</h1>
    <p class="deck">
      A personal, dark-first developer design system: two accents, a near-black ramp, and
      Iosevka as a feature — every value a <code>--sv-*</code> token.
    </p>
    <p class="meta">v0.0.0 · 13 components · Svelte 5 · MIT</p>
  </header>

  <Stack gap={12}>
    <section class="spec-section">
      <h2 class="eyebrow">--sv-* · tokens are the contract</h2>
      <Stack gap={4}>
        <CodeBlock code={paletteCss} html={paletteHtml} filename="colors.css" showLineNumbers />
        <div class="chip-row">
          {#each colorChips as chip (chip)}
            <div class="chip">
              <div class="swatch" style:background={`var(--sv-${chip})`}></div>
              <span class="chip-label">{chip}</span>
            </div>
          {/each}
        </div>
        <div class="chip-row">
          {#each neutralChips as chip (chip)}
            <div class="chip">
              <div class="swatch" style:background={`var(--sv-${chip})`}></div>
              <span class="chip-label">{chip}</span>
            </div>
          {/each}
        </div>
        <p class="chip-note">Swatches follow the active theme; :root above is the dark default.</p>
      </Stack>
    </section>

    <section class="spec-section" id="type">
      <h2 class="eyebrow">--sv-fs-* · type ramp</h2>
      <Stack gap={4}>
        {#each headingRamp as row (row.level)}
          <div class="ramp-row">
            <span class="ramp-label">{row.token}</span>
            <Heading level={row.level}>{row.sample}</Heading>
          </div>
        {/each}
        <div class="ramp-row">
          <span class="ramp-label">--sv-fs-base</span>
          <Text>Body runs in Inter with a 1.5 line height; ö, þ and ð set clean at every size.</Text>
        </div>
        <div class="ramp-row">
          <span class="ramp-label">--sv-fs-sm · muted</span>
          <Text size="sm" tone="muted">Secondary copy sits one step down, one tone quieter.</Text>
        </div>
        <div class="ramp-row">
          <span class="ramp-label">--sv-fs-xs · faint</span>
          <Text size="xs" tone="faint">Captions and metadata idle at the AA floor.</Text>
        </div>
        <div class="ramp-row">
          <span class="ramp-label">--sv-font-mono</span>
          <Text size="sm" mono>pnpm add github:Raudbjorn/design-system</Text>
        </div>
      </Stack>
    </section>

    <section class="spec-section">
      <h2 class="eyebrow">[data-sv="button"]</h2>
      <Stack gap={3}>
        <Stack direction="row" gap={2} wrap>
          <Button>Save changes</Button>
          <Button variant="secondary">Preview</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete token</Button>
        </Stack>
        <Stack direction="row" gap={2} align="center" wrap>
          <Button size="sm" variant="secondary">Small</Button>
          <Button size="lg" variant="secondary">Large</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Deploying…</Button>
        </Stack>
      </Stack>
    </section>

    <section class="spec-section">
      <h2 class="eyebrow">[data-sv="badge"] · [data-sv="statcard"]</h2>
      <Stack gap={4}>
        <Stack direction="row" gap={2} wrap>
          <Badge>queued</Badge>
          <Badge tone="success">passing</Badge>
          <Badge tone="error">failing</Badge>
          <Badge tone="warning">pending</Badge>
          <Badge tone="accent">deployed</Badge>
        </Stack>
        <Stack direction="row" gap={4} wrap>
          <StatCard value="128" label="Deploys" />
          <StatCard value="9" label="Open PRs" tone="accent-2" />
          <StatCard value="99.98%" label="Uptime" tone="default" />
        </Stack>
      </Stack>
    </section>

    <section class="spec-section">
      <div class="parts">
        <div class="cell">
          <span class="cell-label">[data-sv="link"]</span>
          <Text size="sm">
            <Link href="#type">Type ramp</Link> · <Link href="https://github.com/Raudbjorn/design-system" external>Source</Link>
          </Text>
        </div>
        <div class="cell">
          <span class="cell-label">[data-sv="kbd"]</span>
          <Text size="sm"><Kbd>Ctrl</Kbd> + <Kbd>K</Kbd></Text>
        </div>
        <div class="cell">
          <span class="cell-label">[data-sv="icon"]</span>
          <Stack direction="row" gap={3} align="center">
            <Icon glyph={glyphs.terminal} label="Terminal" size="lg" />
            <Icon glyph={glyphs.code} label="Code" size="lg" />
            <Icon glyph={glyphs.github} label="GitHub" size="lg" />
          </Stack>
        </div>
        <div class="cell">
          <span class="cell-label">[data-sv="avatar"]</span>
          <Stack direction="row" gap={2} align="center">
            <Avatar alt="Sveinbjörn Geirsson" size="sm" />
            <Avatar alt="Sveinbjörn Geirsson" />
            <Avatar alt="Sveinbjörn Geirsson" size="lg" />
          </Stack>
        </div>
      </div>
    </section>

    <section class="spec-section">
      <h2 class="eyebrow">[data-sv="card"]</h2>
      <Card>
        {#snippet header()}<Text size="xs" tone="muted" mono as="span">changelog · unreleased</Text>{/snippet}
        <Text>
          Line-number gutter on CodeBlock, a font-weight ramp, and a cleaner npm tarball.
        </Text>
        {#snippet footer()}
          <Stack direction="row" gap={2}>
            <Badge tone="success">tests 48/48</Badge>
            <Badge>svelte-check clean</Badge>
          </Stack>
        {/snippet}
      </Card>
    </section>
  </Stack>

  <footer class="page-footer">
    <span>MIT · Inter &amp; Iosevka under OFL-1.1</span>
    <Link href="https://github.com/Raudbjorn/design-system" external>Raudbjorn/design-system</Link>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--sv-bg);
    color: var(--sv-text);
    font-family: var(--sv-font-sans);
  }

  main {
    max-width: 44rem;
    margin-inline: auto;
    padding: var(--sv-space-8) var(--sv-space-4) var(--sv-space-12);
  }

  .hero { margin-bottom: var(--sv-space-12); }
  .hero h1 {
    margin: 0;
    font-family: var(--sv-font-mono);
    /* 700, not --sv-font-weight-bold: the Iosevka subset ships 400 + 700 static faces. */
    font-weight: 700;
    font-size: var(--sv-fs-3xl);
    line-height: var(--sv-lh-tight);
    color: var(--sv-text-strong);
  }
  .hero .at { color: var(--sv-accent); }
  .deck {
    margin: var(--sv-space-3) 0 0;
    max-width: 55ch;
    color: var(--sv-text-muted);
    line-height: var(--sv-lh-normal);
  }
  .deck code {
    font-family: var(--sv-font-mono);
    font-size: 0.9em;
    color: var(--sv-text-strong);
  }
  .meta {
    margin: var(--sv-space-3) 0 0;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }

  .spec-section {
    border-top: 1px solid var(--sv-border);
    padding-top: var(--sv-space-6);
  }
  .eyebrow {
    margin: 0 0 var(--sv-space-4);
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    font-weight: var(--sv-font-weight-normal);
    color: var(--sv-text-muted);
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sv-space-3);
  }
  .chip {
    display: flex;
    flex-direction: column;
    gap: var(--sv-space-1);
  }
  .swatch {
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
  }
  .chip-label {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }
  .chip-note {
    margin: 0;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }

  .ramp-row {
    display: grid;
    grid-template-columns: 10rem 1fr;
    align-items: baseline;
    gap: var(--sv-space-3);
  }
  .ramp-label {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }

  .parts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
    gap: var(--sv-space-6) var(--sv-space-4);
  }
  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--sv-space-3);
  }
  .cell-label {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-muted);
  }

  .theme {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-muted);
    background: transparent;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    padding: 0.35em 0.75em;
    cursor: pointer;
  }
  .theme:hover { color: var(--sv-accent); border-color: var(--sv-accent); }
  .theme:focus-visible { outline: 2px solid var(--sv-accent); outline-offset: 2px; }

  .page-footer {
    margin-top: var(--sv-space-12);
    border-top: 1px solid var(--sv-border);
    padding-top: var(--sv-space-4);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--sv-space-4);
    flex-wrap: wrap;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }

  /* --sv-bp-sm; custom props can't appear in @media conditions. */
  @media (max-width: 640px) {
    .hero h1 { font-size: var(--sv-fs-2xl); }
    .ramp-row { grid-template-columns: 1fr; gap: var(--sv-space-1); }
  }
</style>
