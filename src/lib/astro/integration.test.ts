// The integration is the only place in the library that throws instead of
// returning a Result, and the only place a bad theme package can reach a
// production build. Both branches are exercised here, along with each option's
// off switch — an injection that fires when it was disabled is invisible in a
// consumer's output until they wonder why their <head> has a script in it.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { themeBootScript } from '../theme/boot.ts';
import svDesign, { STYLES_SPECIFIER } from './integration.ts';
import { VIRTUAL_WORLD_CSS, virtualWorldCss } from './virtual-css.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORLD = JSON.parse(
  readFileSync(join(HERE, '../theme/fixtures/grimdark.json'), 'utf8')
) as Record<string, unknown>;

interface Injected {
  stage: string;
  content: string;
}

/** Minimal stand-in for the astro:config:setup payload. */
const setup = async (
  integration: ReturnType<typeof svDesign>,
  existing: { name: string }[] = []
) => {
  const injected: Injected[] = [];
  const updates: Record<string, unknown>[] = [];
  const warnings: string[] = [];
  const config = { integrations: existing };

  await integration.hooks['astro:config:setup']?.({
    config,
    updateConfig: (next: Record<string, unknown>) => {
      updates.push(next);
      // Astro merges into the live config; the renderer check reads it back.
      if (Array.isArray(next.integrations)) config.integrations.push(...next.integrations);
      return config;
    },
    injectScript: (stage: string, content: string) => injected.push({ stage, content }),
    logger: { warn: (m: string) => warnings.push(m) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial hook payload
  } as any);

  return { injected, updates, warnings, config };
};

const stages = (injected: Injected[]) => injected.map((i) => i.stage);

describe('svDesign', () => {
  it('injects the stylesheet, the boot script, and the Svelte renderer by default', async () => {
    const { injected, config } = await setup(svDesign());

    expect(injected).toContainEqual({ stage: 'page-ssr', content: `import '${STYLES_SPECIFIER}';` });
    const boot = injected.find((i) => i.stage === 'head-inline');
    expect(boot?.content).toBe(themeBootScript);
    expect(config.integrations.map((i) => i.name)).toContain('@astrojs/svelte');
  });

  it('seeds data-theme before the boot script so a stored choice still wins', async () => {
    const { injected } = await setup(svDesign({ mode: 'dark' }));
    const boot = injected.find((i) => i.stage === 'head-inline')?.content ?? '';

    expect(boot.indexOf("setAttribute('data-theme','dark')")).toBeLessThan(
      boot.indexOf(themeBootScript)
    );
    expect(boot.endsWith(themeBootScript)).toBe(true);
  });

  it('treats mode "system" as no seed at all', async () => {
    const { injected } = await setup(svDesign({ mode: 'system' }));
    expect(injected.find((i) => i.stage === 'head-inline')?.content).toBe(themeBootScript);
  });

  it.each([
    ['styles', { styles: false }, (i: Injected) => i.content.includes(STYLES_SPECIFIER)],
    ['boot', { boot: false }, (i: Injected) => i.stage === 'head-inline']
  ])('suppresses exactly the %s injection when disabled', async (_name, options, matches) => {
    const { injected } = await setup(svDesign(options));
    expect(injected.filter(matches)).toEqual([]);
    // The other injections are untouched.
    expect(injected.length).toBeGreaterThan(0);
  });

  it('does not add the renderer twice', async () => {
    const { config, updates } = await setup(svDesign(), [{ name: '@astrojs/svelte' }]);
    expect(config.integrations.filter((i) => i.name === '@astrojs/svelte')).toHaveLength(1);
    expect(updates.some((u) => 'integrations' in u)).toBe(false);
  });

  it('leaves the renderer alone when svelte: false', async () => {
    const { config } = await setup(svDesign({ svelte: false }));
    expect(config.integrations).toEqual([]);
  });

  describe('world themes', () => {
    it('serves gated CSS from the virtual module', async () => {
      const { injected, updates } = await setup(svDesign({ world: WORLD, svelte: false }));

      expect(injected).toContainEqual({
        stage: 'page-ssr',
        content: `import '${VIRTUAL_WORLD_CSS}';`
      });
      // After the token stylesheet: the world layer beats sv.theme regardless,
      // but load order should not be an accident either.
      expect(stages(injected).indexOf('page-ssr')).toBe(0);
      expect(injected.findIndex((i) => i.content.includes(VIRTUAL_WORLD_CSS))).toBe(1);

      const plugin = updates
        .flatMap((u) => (u.vite as { plugins?: unknown[] } | undefined)?.plugins ?? [])
        .find(Boolean) as { load: (id: string) => string | null };
      const css = plugin.load(`\0${VIRTUAL_WORLD_CSS}`) ?? '';
      expect(css).toContain('@layer sv.world');
      expect(css).toContain('--sv-accent: #c9a227;');
    });

    it('fails the build on a package that cannot be parsed, naming the issues', async () => {
      await expect(setup(svDesign({ world: { name: 'x' }, svelte: false }))).rejects.toThrow(
        /was rejected[\s\S]*E_MANIFEST/
      );
    });

    it('fails the build on a contrast failure under the strict policy', async () => {
      const unreadable = {
        ...WORLD,
        tokens: { ...(WORLD.tokens as object), text: { $value: '#151310' } }
      };
      await expect(
        setup(
          svDesign({
            world: unreadable,
            worldOptions: { onContrastFailure: 'reject' },
            svelte: false
          })
        )
      ).rejects.toThrow(/E_CONTRAST/);
    });

    it('reports reverted tokens rather than shipping them silently', async () => {
      const unreadable = {
        ...WORLD,
        tokens: { ...(WORLD.tokens as object), text: { $value: '#151310' } }
      };
      const { warnings } = await setup(svDesign({ world: unreadable, svelte: false }));
      expect(warnings.join('\n')).toMatch(/W_CONTRAST_REVERTED/);
    });

    it('injects nothing world-related when no package is given', async () => {
      const { injected, updates } = await setup(svDesign({ svelte: false }));
      expect(injected.some((i) => i.content.includes(VIRTUAL_WORLD_CSS))).toBe(false);
      expect(updates.some((u) => 'vite' in u)).toBe(false);
    });
  });
});

describe('virtualWorldCss', () => {
  // Vite types the hooks as ObjectHook (function | {handler}); ours are plain
  // functions, so narrow once here rather than at every call.
  const plugin = virtualWorldCss('.x { color: red }') as unknown as {
    resolveId: (id: string) => string | null;
    load: (id: string) => string | null;
  };

  it('resolves only its own specifier', () => {
    expect(plugin.resolveId(VIRTUAL_WORLD_CSS)).toBe(`\0${VIRTUAL_WORLD_CSS}`);
    expect(plugin.resolveId('other.css')).toBeNull();
  });

  it('serves the CSS from the resolved id only', () => {
    expect(plugin.load(`\0${VIRTUAL_WORLD_CSS}`)).toBe('.x { color: red }');
    expect(plugin.load(VIRTUAL_WORLD_CSS)).toBeNull();
  });

  it('keeps the .css suffix, which is what routes it into Vite’s CSS pipeline', () => {
    expect(VIRTUAL_WORLD_CSS.endsWith('.css')).toBe(true);
  });
});
