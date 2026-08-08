// Separate project for the Astro adapter: the Container API needs Astro's own
// Vite plugin to compile .astro, which getViteConfig() assembles. Kept out of
// the `unit` project so the fast jsdom suite stays free of an Astro config
// resolution, and so a broken .astro cannot take the whole suite down.
//
// Referenced from vitest.config.ts `projects` — `pnpm test` runs both.

import { getViteConfig } from 'astro/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { TestUserConfig } from 'vitest/config';

const test: TestUserConfig = {
  name: 'astro',
  environment: 'node',
  include: ['src/lib/astro/**/*.test.ts']
};

export default getViteConfig(
  // Vitest 4 no longer augments Vite's UserConfig with `test`, and
  // getViteConfig takes the plain Vite type — hence one cast at the boundary.
  // The block above is still checked against Vitest's own TestUserConfig.
  {
    test,
    // The parity test renders each component BOTH ways, so this project needs
    // the Svelte compiler as well as Astro's.
    plugins: [svelte()]
  } as Parameters<typeof getViteConfig>[0],
  // This repo is a library, not a site: Astro's "missing src/pages" warning is
  // structural here and would print on every run.
  { logLevel: 'error' }
);
