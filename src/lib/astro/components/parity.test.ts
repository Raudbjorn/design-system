// The .astro ports are a second markup and CSS source of truth for components
// that already have one. A review checkbox will not hold that: this renders
// both implementations and compares the output.
//
// The comparison is structural (parse both, compare tag / attributes / text)
// rather than string equality, because the two compilers legitimately differ
// on attribute order, whitespace, scoping mechanism (Svelte adds a
// `svelte-<hash>` class, Astro a `data-astro-cid-<hash>` attribute) and
// hydration markers (Svelte 5 SSR emits `<!--[-->`, Astro emits nothing). A
// missing attribute, a wrong default, or a dropped element is not absorbed.

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { beforeAll, describe, expect, it } from 'vitest';

import SvAlert from '../../components/atoms/Alert.svelte';
import SvAvatar from '../../components/atoms/Avatar.svelte';
import SvBadge from '../../components/atoms/Badge.svelte';
import SvButton from '../../components/atoms/Button.svelte';
import SvHeading from '../../components/atoms/Heading.svelte';
import SvIcon from '../../components/atoms/Icon.svelte';
import SvKbd from '../../components/atoms/Kbd.svelte';
import SvLink from '../../components/atoms/Link.svelte';
import SvProgress from '../../components/atoms/Progress.svelte';
import SvSpinner from '../../components/atoms/Spinner.svelte';
import SvText from '../../components/atoms/Text.svelte';
import SvStack from '../../components/layout/Stack.svelte';
import SvBreadcrumb from '../../components/molecules/Breadcrumb.svelte';
import SvCard from '../../components/molecules/Card.svelte';
import SvStatCard from '../../components/molecules/StatCard.svelte';
import SvTable from '../../components/molecules/Table.svelte';
import SvTimeline from '../../components/molecules/Timeline.svelte';

import AsAlert from './Alert.astro';
import AsAvatar from './Avatar.astro';
import AsBadge from './Badge.astro';
import AsBreadcrumb from './Breadcrumb.astro';
import AsButton from './Button.astro';
import AsCard from './Card.astro';
import AsHeading from './Heading.astro';
import AsIcon from './Icon.astro';
import AsKbd from './Kbd.astro';
import AsLink from './Link.astro';
import AsProgress from './Progress.astro';
import AsSpinner from './Spinner.astro';
import AsStack from './Stack.astro';
import AsStatCard from './StatCard.astro';
import AsTable from './Table.astro';
import AsText from './Text.astro';
import AsTimeline from './Timeline.astro';

import { UNSUPPORTED_PROPS } from './unsupported.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SVELTE_ROOT = join(HERE, '../../components');

/** Slot/snippet payload. Deliberately an element, not bare text: a raw snippet
 *  needs a single root, and both sides then carry the same node shape. */
const SLOT = '<span>slot content</span>';
const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

interface Case {
  /** Label for the test name. */
  name: string;
  props?: Record<string, unknown>;
  /** Named slots beyond the default one. */
  slots?: Record<string, string>;
  /** Component takes no children. */
  void?: boolean;
}

interface Port {
  name: string;
  svelte: unknown;
  astro: unknown;
  source: string;
  cases: Case[];
}

const PORTS: Port[] = [
  {
    name: 'Alert',
    svelte: SvAlert,
    astro: AsAlert,
    source: 'atoms/Alert.svelte',
    cases: [
      { name: 'defaults' },
      { name: 'error with title', props: { tone: 'error', title: 'Boom' } },
      { name: 'icon override', props: { tone: 'warning', icon: '☠' } }
    ]
  },
  {
    name: 'Avatar',
    svelte: SvAvatar,
    astro: AsAvatar,
    source: 'atoms/Avatar.svelte',
    cases: [
      { name: 'initials', props: { alt: 'Ada Lovelace' }, void: true },
      { name: 'image', props: { alt: 'Ada', src: '/a.png', size: 'lg' }, void: true },
      { name: 'single word', props: { alt: 'Prince' }, void: true }
    ]
  },
  {
    name: 'Badge',
    svelte: SvBadge,
    astro: AsBadge,
    source: 'atoms/Badge.svelte',
    cases: [{ name: 'defaults' }, { name: 'accent', props: { tone: 'accent' } }]
  },
  {
    name: 'Breadcrumb',
    svelte: SvBreadcrumb,
    astro: AsBreadcrumb,
    source: 'molecules/Breadcrumb.svelte',
    cases: [
      {
        name: 'linked + plain + current',
        props: {
          items: [{ label: 'Root', href: '/' }, { label: 'Section' }, { label: 'Here' }]
        },
        void: true
      },
      { name: 'single crumb', props: { items: [{ label: 'Only' }] }, void: true }
    ]
  },
  {
    name: 'Button',
    svelte: SvButton,
    astro: AsButton,
    source: 'atoms/Button.svelte',
    cases: [
      { name: 'defaults' },
      { name: 'submit, disabled', props: { type: 'submit', disabled: true } },
      { name: 'loading', props: { loading: true, variant: 'danger', size: 'lg' } },
      { name: 'as link', props: { href: '/go', variant: 'ghost' } },
      { name: 'link, disabled', props: { href: '/go', disabled: true } }
    ]
  },
  {
    name: 'Card',
    svelte: SvCard,
    astro: AsCard,
    source: 'molecules/Card.svelte',
    cases: [
      { name: 'body only' },
      { name: 'elevated, lg', props: { elevated: true, padding: 'lg' } },
      { name: 'header + footer', slots: { header: '<b>H</b>', footer: '<i>F</i>' } }
    ]
  },
  {
    name: 'Heading',
    svelte: SvHeading,
    astro: AsHeading,
    source: 'atoms/Heading.svelte',
    cases: [{ name: 'default level' }, { name: 'level 3', props: { level: 3 } }]
  },
  {
    name: 'Icon',
    svelte: SvIcon,
    astro: AsIcon,
    source: 'atoms/Icon.svelte',
    cases: [
      { name: 'decorative', props: { glyph: '★' }, void: true },
      { name: 'labelled', props: { glyph: '★', label: 'Star', size: 'lg' }, void: true }
    ]
  },
  {
    name: 'Kbd',
    svelte: SvKbd,
    astro: AsKbd,
    source: 'atoms/Kbd.svelte',
    cases: [{ name: 'defaults' }]
  },
  {
    name: 'Link',
    svelte: SvLink,
    astro: AsLink,
    source: 'atoms/Link.svelte',
    cases: [
      { name: 'internal', props: { href: '/x' } },
      { name: 'external', props: { href: 'https://x.test', external: true } }
    ]
  },
  {
    name: 'Progress',
    svelte: SvProgress,
    astro: AsProgress,
    source: 'atoms/Progress.svelte',
    cases: [
      { name: 'labelled', props: { label: 'Sync', value: 42 }, void: true },
      { name: 'aria-labelled', props: { 'aria-label': 'Sync', value: 42 }, void: true },
      { name: 'indeterminate', props: { label: 'Sync', indeterminate: true }, void: true },
      { name: 'clamps over', props: { label: 'Sync', value: 140 }, void: true },
      { name: 'clamps under', props: { label: 'Sync', value: -3, tone: 'accent-2' }, void: true },
      { name: 'non-finite', props: { label: 'Sync', value: Number.NaN }, void: true }
    ]
  },
  {
    name: 'Spinner',
    svelte: SvSpinner,
    astro: AsSpinner,
    source: 'atoms/Spinner.svelte',
    cases: [
      { name: 'defaults', void: true },
      { name: 'labelled sm', props: { size: 'sm', label: 'Fetching' }, void: true }
    ]
  },
  {
    name: 'Stack',
    svelte: SvStack,
    astro: AsStack,
    source: 'layout/Stack.svelte',
    cases: [
      { name: 'defaults' },
      { name: 'row, wrapped', props: { direction: 'row', gap: 8, wrap: true, justify: 'between' } },
      { name: 'as list', props: { as: 'ul', align: 'baseline' } },
      { name: 'passthrough attribute', props: { id: 'x', 'aria-label': 'Group' } }
    ]
  },
  {
    name: 'StatCard',
    svelte: SvStatCard,
    astro: AsStatCard,
    source: 'molecules/StatCard.svelte',
    cases: [
      { name: 'defaults', props: { value: '42', label: 'Nodes' }, void: true },
      { name: 'accent-2', props: { value: '7', label: 'Alerts', tone: 'accent-2' }, void: true }
    ]
  },
  {
    name: 'Table',
    svelte: SvTable,
    astro: AsTable,
    source: 'molecules/Table.svelte',
    cases: [
      {
        name: 'columns + rows',
        props: {
          columns: [
            { key: 'name', header: 'Name' },
            { key: 'n', header: 'Count', align: 'right', mono: true, width: '6rem' }
          ],
          rows: [
            { name: 'alpha', n: 1 },
            { name: 'beta', n: 2 }
          ]
        },
        void: true
      },
      { name: 'empty rows', props: { columns: [{ key: 'a', header: 'A' }], rows: [] }, void: true }
    ]
  },
  {
    name: 'Text',
    svelte: SvText,
    astro: AsText,
    source: 'atoms/Text.svelte',
    cases: [
      { name: 'defaults' },
      { name: 'mono span', props: { mono: true, as: 'span', size: 'sm', tone: 'muted' } }
    ]
  },
  {
    name: 'Timeline',
    svelte: SvTimeline,
    astro: AsTimeline,
    source: 'molecules/Timeline.svelte',
    cases: [
      {
        name: 'alternating',
        props: {
          items: [
            { content: 'first', title: 'One' },
            { content: 'second', color: 'success' },
            { content: 'third', loading: true }
          ]
        },
        void: true
      },
      {
        name: 'reversed, filled, end mode',
        props: {
          items: [
            { content: 'a', color: '#ff0000' },
            { content: 'b', placement: 'start' }
          ],
          mode: 'end',
          variant: 'filled',
          reverse: true
        },
        void: true
      }
    ]
  }
];

// ── normalization ────────────────────────────────────────────────────────

const SCOPE_CLASS = /^svelte-[\w-]+$|^astro-[\w-]+$/;
const SCOPE_ATTR = /^data-astro-cid-/;

const normalizeStyle = (value: string): string =>
  value
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const at = d.indexOf(':');
      return at < 0 ? d : `${d.slice(0, at).trim()}:${d.slice(at + 1).trim()}`;
    })
    .sort()
    .join(';');

const normalizeClass = (value: string): string =>
  value
    .split(/\s+/)
    .filter((c) => c && !SCOPE_CLASS.test(c))
    .sort()
    .join(' ');

interface Node {
  tag: string;
  attrs: Record<string, string>;
  children: (Node | string)[];
}

const normalizeElement = (el: Element): Node => {
  const attrs: Record<string, string> = {};
  for (const { name, value } of [...el.attributes]) {
    if (SCOPE_ATTR.test(name)) continue;
    if (name === 'class') {
      const cls = normalizeClass(value);
      if (cls) attrs.class = cls;
      continue;
    }
    attrs[name] = name === 'style' ? normalizeStyle(value) : value;
  }
  return { tag: el.tagName.toLowerCase(), attrs, children: normalizeChildren(el) };
};

const normalizeChildren = (parent: ParentNode): (Node | string)[] => {
  const out: (Node | string)[] = [];
  for (const child of [...parent.childNodes]) {
    // 1 ELEMENT_NODE, 3 TEXT_NODE. Comments (8) are dropped: Svelte 5 SSR
    // emits hydration markers, Astro does not, and neither is rendered.
    if (child.nodeType === 1) out.push(normalizeElement(child as Element));
    else if (child.nodeType === 3) {
      const text = (child.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (text) out.push(text);
    }
  }
  return out;
};

const normalize = (html: string): (Node | string)[] =>
  normalizeChildren(JSDOM.fragment(html));

// ── prop extraction ──────────────────────────────────────────────────────

/** Split a destructuring pattern body on top-level commas only. */
const topLevelParts = (body: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c === '{' || c === '[' || c === '(') depth += 1;
    else if (c === '}' || c === ']' || c === ')') depth -= 1;
    else if (c === ',' && depth === 0) {
      parts.push(body.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(body.slice(start));
  return parts;
};

const destructuredNames = (body: string): Set<string> => {
  const names = new Set<string>();
  for (const raw of topLevelParts(body)) {
    const part = raw.replace(/\/\/.*$/gm, '').trim();
    if (!part || part.startsWith('...')) continue;
    const key = part.split(/[:=]/)[0]?.trim() ?? '';
    const unquoted = key.replace(/^['"]|['"]$/g, '');
    if (unquoted) names.add(unquoted);
  }
  return names;
};

const svelteProps = (source: string): Set<string> => {
  const match = /let\s*\{([\s\S]*?)\}\s*:\s*Props\s*=\s*\$props\(\)/.exec(source);
  return match?.[1] ? destructuredNames(match[1]) : new Set<string>();
};

const astroProps = (source: string): Set<string> => {
  const match = /const\s*\{([\s\S]*?)\}\s*=\s*\n?\s*Astro\.props/.exec(source);
  return match?.[1] ? destructuredNames(match[1]) : new Set<string>();
};

/** Props typed as Snippet — they map to slots, not to props. */
const snippetProps = (source: string): Set<string> =>
  new Set([...source.matchAll(/(\w+)\??\s*:\s*Snippet/g)].map((m) => m[1] as string));

const styleBlock = (source: string): string => {
  const match = /<style>([\s\S]*)<\/style>/.exec(source);
  if (!match?.[1]) throw new Error('no <style> block');
  return match[1].replace(/\s+/g, ' ').trim();
};

// ── the tests ────────────────────────────────────────────────────────────

let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe.each(PORTS)('$name', (port) => {
  const svelteSource = readFileSync(join(SVELTE_ROOT, port.source), 'utf8');
  const astroSource = readFileSync(join(HERE, `${port.name}.astro`), 'utf8');

  it.each(port.cases)('renders identically: $name', async (testCase) => {
    const props = { ...(testCase.props ?? {}) };
    const slots: Record<string, string> = { ...(testCase.slots ?? {}) };
    if (!testCase.void) slots.default = SLOT;

    const svelteProps_: Record<string, unknown> = { ...props };
    for (const [slotName, html] of Object.entries(slots)) {
      svelteProps_[slotName === 'default' ? 'children' : slotName] = snippet(html);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- component types differ by compiler
    const fromSvelte = render(port.svelte as any, { props: svelteProps_ }).body;
    const fromAstro = await container.renderToString(port.astro as never, { props, slots });

    expect(normalize(fromAstro)).toEqual(normalize(fromSvelte));
  });

  it('exposes every prop the Svelte component does', () => {
    const expected = new Set(svelteProps(svelteSource));
    for (const name of snippetProps(svelteSource)) expected.delete(name);
    for (const name of UNSUPPORTED_PROPS[port.name] ?? []) expected.delete(name);

    const actual = astroProps(astroSource);
    // Subset, not equality: a port may legitimately intercept a prop the
    // Svelte version takes through {...rest} (Stack does this with `style`).
    // The drift that matters is a Svelte prop silently vanishing.
    expect([...expected].filter((p) => !actual.has(p))).toEqual([]);
  });

  it('carries the same styles', () => {
    expect(styleBlock(astroSource)).toBe(styleBlock(svelteSource));
  });
});

describe('unsupported-prop declarations', () => {
  it.each(Object.entries(UNSUPPORTED_PROPS))(
    '%s names props that really exist on the Svelte component',
    (name, props) => {
      const port = PORTS.find((p) => p.name === name);
      expect(port, `${name} is not a ported component`).toBeDefined();
      const declared = new Set([
        ...svelteProps(readFileSync(join(SVELTE_ROOT, port!.source), 'utf8'))
      ]);
      expect(props.filter((p) => !declared.has(p))).toEqual([]);
    }
  );
});
