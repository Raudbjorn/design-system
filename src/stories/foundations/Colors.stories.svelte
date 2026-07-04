<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/Colors',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'Every color is a `--sv-*` custom property generated from the DTCG token source (`src/lib/tokens/*.tokens.json`). ' +
            'The chips read the **computed** values off the document root — switch the toolbar ' +
            'theme and watch them diverge from the dark excerpt in the code block.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { CodeBlock, Stack } from '../../lib/index';
  import TokenChips from './TokenChips.svelte';

  // Token groups, mirroring palette.ts key order.
  const accents = ['accent', 'accent-2', 'accent-rust'];
  const status = ['success', 'warning', 'error'];
  const neutrals = ['bg', 'surface-1', 'surface-2', 'surface-3', 'border'];
  const inks = ['text', 'text-strong', 'text-muted', 'text-faint'];
  const syntax = ['syn-keyword', 'syn-string', 'syn-var', 'syn-func', 'syn-comment', 'syn-number'];

  // The dark palette shown through the system's own signature component.
  // `code` is the copy source; `html` is the same text pre-tokenized the way
  // a build-time highlighter would emit it (line counts must match).
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
</script>

<Story name="Palette" asChild>
  <Stack gap={8}>
    <CodeBlock code={paletteCss} html={paletteHtml} filename="colors.css" showLineNumbers />
    <TokenChips title="accents · teal is interactive, coral is emphasis" names={accents} />
    <TokenChips title="status" names={status} />
    <TokenChips title="neutral ramp" names={neutrals} />
    <TokenChips title="ink" names={inks} />
    <TokenChips title="syntax · --sv-syn-*" names={syntax} />
  </Stack>
</Story>
