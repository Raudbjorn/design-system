// Thin Svelte 5 rune wrapper over the framework-agnostic theme engine —
// `@svnbjrn/design/theme/svelte`.

import { parseWorldTheme } from './parse.ts';
import { switchWorldTheme } from './apply.ts';
import { getThemeMode, setThemeMode } from './boot.ts';
import type { ThemeMode } from './boot.ts';
import type { SwitchWorldThemeOptions } from './apply.ts';
import type { ParseWorldThemeOptions, ThemeIssue, WorldTheme } from './types.ts';

export interface WorldThemeState {
  /** The active world theme, null when none. */
  readonly current: WorldTheme | null;
  /** Issues from the last load attempt (parse + gate + apply). */
  readonly issues: readonly ThemeIssue[];
  readonly status: 'idle' | 'applying' | 'active' | 'failed';
  /** Built-in mode (dark/light/system) — reactive, persisted on set. */
  mode: ThemeMode;
  /** Parse + switch to a world theme. False = rejected (see issues). */
  load(json: unknown, opts?: ParseWorldThemeOptions): Promise<boolean>;
  /** Remove the active world theme. */
  clear(): Promise<void>;
}

export function createWorldTheme(opts: SwitchWorldThemeOptions = {}): WorldThemeState {
  let current = $state<WorldTheme | null>(null);
  let issues = $state<readonly ThemeIssue[]>([]);
  let status = $state<WorldThemeState['status']>('idle');
  let mode = $state<ThemeMode>(getThemeMode(opts.document));
  // Guards against out-of-order completion: an older load()/clear() call
  // resolving after a newer one must not clobber the newer call's state.
  let generation = 0;

  return {
    get current() {
      return current;
    },
    get issues() {
      return issues;
    },
    get status() {
      return status;
    },
    get mode() {
      return mode;
    },
    set mode(next: ThemeMode) {
      mode = next;
      setThemeMode(next, opts.document);
    },
    async load(json: unknown, parseOpts?: ParseWorldThemeOptions): Promise<boolean> {
      const gen = ++generation;
      const parsed = parseWorldTheme(json, parseOpts);
      if (!parsed.ok) {
        if (gen !== generation) return false;
        issues = parsed.error;
        status = 'failed';
        return false;
      }
      status = 'applying';
      const applied = await switchWorldTheme(parsed.value, opts);
      if (gen !== generation) return applied.ok;
      if (!applied.ok) {
        issues = [...parsed.value.issues, applied.error];
        status = 'failed';
        return false;
      }
      current = parsed.value;
      issues = parsed.value.issues;
      status = 'active';
      // A world theme pins data-theme to its `extends`; reflect that.
      mode = getThemeMode(opts.document);
      return true;
    },
    async clear(): Promise<void> {
      const gen = ++generation;
      await switchWorldTheme(null, opts);
      if (gen !== generation) return;
      current = null;
      issues = [];
      status = 'idle';
    }
  };
}
