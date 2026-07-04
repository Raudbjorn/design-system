import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { argosVitestPlugin } from '@argos-ci/storybook/vitest-plugin';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      // Co-located component/token unit tests (jsdom), as before.
      {
        plugins: [svelte(), svelteTesting()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest-setup.ts'],
          include: ['src/**/*.test.ts'],
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.svelte-kit/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
          ]
        }
      },
      // Storybook visual tests: every story renders in real Chromium; Argos
      // captures one screenshot per story per mode (dark/light) into
      // ./screenshots and uploads them from CI. Auth: ARGOS_TOKEN env when
      // present; on fork PRs (where GitHub withholds secrets) the SDK falls
      // back to tokenless GitHub Actions auth automatically — public repo, so
      // uploads still work. Do NOT gate uploadToArgos on ARGOS_TOKEN presence.
      {
        plugins: [
          // The svelte-vite framework does NOT bring vite-plugin-svelte itself —
          // in `storybook dev` it comes from vite.config.ts, which Vitest
          // ignores here — so the compiler must be added explicitly.
          svelte(),
          // Runs the stories from .storybook/main.ts as Vitest tests.
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
          argosVitestPlugin({ uploadToArgos: !!process.env.CI })
        ],
        test: {
          name: 'storybook',
          // Explicit annotations setup (matches the Argos SDK's own e2e config);
          // the addon's auto-provisioned setup module 404s in browser mode here.
          setupFiles: ['.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              // Deterministic text rendering across machines/CI — prevents the
              // most common source of flaky diffs (subpixel AA, font hinting).
              launchOptions: { args: ['--disable-lcd-text', '--font-render-hinting=none'] }
            }),
            // Note: the capture viewport is NOT set here — addon-vitest resizes
            // the tester iframe per story from parameters.viewport, which is
            // configured in .storybook/vitest.setup.ts for test runs only.
            instances: [{ browser: 'chromium' }]
          }
        }
      }
    ]
  }
});
