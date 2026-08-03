// `@svnbjrn/design/astro` — the Astro integration.
//
// Astro has no app.html, so a consumer otherwise hand-wires the pre-paint boot
// script into every layout or accepts a dark-mode flash. This wires it once,
// and adds the two things a static-output framework can do that a SPA cannot:
// ship the token CSS as a render-blocking <link>, and bake a world theme into
// the build instead of applying it after hydration.
//
// Note on error handling: this module THROWS. The rest of the library returns
// errors as values, but a config hook has no caller to return a Result to, and
// the failure mode it guards — a production build that silently ships
// unthemed or contrast-failing CSS — is worse than a failed build. Same call
// the QSS and ExtJS emitters make.

import type { AstroIntegration } from 'astro';
import { themeBootScript } from '../theme/boot.ts';
import { worldThemeToCss } from '../theme/css.ts';
import { parseWorldTheme } from '../theme/parse.ts';
import type { ParseWorldThemeOptions, ThemeIssue } from '../theme/types.ts';
import { VIRTUAL_WORLD_CSS, virtualWorldCss } from './virtual-css.ts';

/** Import specifier injected for the core token stylesheet. */
export const STYLES_SPECIFIER = '@svnbjrn/design/styles.css';

const SVELTE_INTEGRATION = '@astrojs/svelte';

export interface SvDesignOptions {
  /** Inject `@svnbjrn/design/styles.css` into every page. Default true. */
  styles?: boolean;
  /** Inject the pre-paint theme boot script into <head>. Default true. */
  boot?: boolean;
  /**
   * Default appearance when the visitor has no stored preference. Omit (or
   * 'system') to defer to prefers-color-scheme. A stored choice always wins:
   * the boot script runs after this and overwrites it.
   */
  mode?: 'dark' | 'light' | 'system';
  /**
   * A world theme package to bake into the build. Parsed and contrast-gated
   * here; a fatal issue fails the build rather than shipping a bad palette.
   */
  world?: unknown;
  /** Parse policy for `world` (lockedTokens, onContrastFailure, …). */
  worldOptions?: ParseWorldThemeOptions;
  /** Add `@astrojs/svelte` when the project has not. Default true. */
  svelte?: boolean;
}

const formatIssues = (issues: readonly ThemeIssue[]): string =>
  issues.map((i) => `  ${i.severity} ${i.code}${i.token ? ` [${i.token}]` : ''}: ${i.message}`).join('\n');

/** `data-theme` seed that runs before the boot script, so a stored choice wins. */
const modePrefix = (mode: SvDesignOptions['mode']): string =>
  mode === 'dark' || mode === 'light'
    ? `document.documentElement.setAttribute('data-theme','${mode}');\n`
    : '';

/**
 * @example
 * ```js
 * import svDesign from '@svnbjrn/design/astro';
 * export default defineConfig({ integrations: [svDesign({ mode: 'dark' })] });
 * ```
 */
export default function svDesign(options: SvDesignOptions = {}): AstroIntegration {
  const { styles = true, boot = true, mode, world, worldOptions, svelte = true } = options;

  return {
    name: '@svnbjrn/design',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig, injectScript, logger }) => {
        if (styles) injectScript('page-ssr', `import '${STYLES_SPECIFIER}';`);

        if (world !== undefined) {
          const parsed = parseWorldTheme(world, worldOptions);
          if (!parsed.ok) {
            throw new Error(
              `@svnbjrn/design: the \`world\` theme package was rejected —\n${formatIssues(parsed.error)}`
            );
          }
          for (const issue of parsed.value.issues) {
            // Gate reverts are the documented degraded path, not build errors,
            // but they change what ships — say so once, at build time.
            logger.warn(`world theme "${parsed.value.manifest.name}": ${issue.code} ${issue.message}`);
          }
          updateConfig({ vite: { plugins: [virtualWorldCss(worldThemeToCss(parsed.value))] } });
          // After the token stylesheet, though @layer sv.world makes the
          // outcome independent of load order either way.
          injectScript('page-ssr', `import '${VIRTUAL_WORLD_CSS}';`);
        }

        if (boot) injectScript('head-inline', modePrefix(mode) + themeBootScript);

        if (svelte && !config.integrations.some((i) => i.name === SVELTE_INTEGRATION)) {
          let svelteIntegration: () => AstroIntegration;
          try {
            ({ default: svelteIntegration } = await import(SVELTE_INTEGRATION));
          } catch {
            throw new Error(
              `@svnbjrn/design: the Svelte components need the Svelte renderer. ` +
                `Run \`npx astro add svelte\`, or pass \`svDesign({ svelte: false })\` if ` +
                `you only use the .astro components.`
            );
          }
          updateConfig({ integrations: [svelteIntegration()] });
        }
      }
    }
  };
}
