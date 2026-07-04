import { afterEach, describe, expect, it } from 'vitest';
import { createWorldTheme } from './svelte.svelte';
import { clearWorldTheme } from './apply';
import { THEME_STORAGE } from './boot';
import grimdark from './fixtures/grimdark.json';

afterEach(() => {
  clearWorldTheme();
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
});

describe('createWorldTheme', () => {
  it('loads a valid theme: idle → active with issues exposed', async () => {
    const state = createWorldTheme({ transition: false });
    expect(state.status).toBe('idle');
    const ok = await state.load(grimdark);
    expect(ok).toBe(true);
    expect(state.status).toBe('active');
    expect(state.current?.manifest.name).toBe('grimdark-hive');
    expect(state.issues.every((i) => i.severity !== 'error')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('rejects invalid input: → failed with issues, returns false', async () => {
    const state = createWorldTheme({ transition: false });
    const ok = await state.load({ name: 'Bad!' });
    expect(ok).toBe(false);
    expect(state.status).toBe('failed');
    expect(state.issues.length).toBeGreaterThan(0);
    expect(state.current).toBeNull();
  });

  it('clear() returns to idle and removes the sheet', async () => {
    const state = createWorldTheme({ transition: false });
    await state.load(grimdark);
    await state.clear();
    expect(state.status).toBe('idle');
    expect(state.current).toBeNull();
    expect(document.head.querySelector('style[data-sv-theme]')).toBeNull();
  });

  it('an older load() resolving after a newer one does not clobber the newer state', async () => {
    const other = {
      name: 'other-world',
      version: '1.0.0',
      extends: 'light',
      tokens: { accent: { $value: '#2b6a5e' } }
    };
    // Route switchWorldTheme through the View Transition path so each call's
    // completion can be released independently and out of order.
    const docAny = document as unknown as Record<string, unknown>;
    const release: Record<number, () => void> = {};
    let call = 0;
    docAny.startViewTransition = (cb: () => void) => {
      const mine = ++call;
      return {
        finished: new Promise<void>((resolve) => {
          release[mine] = () => {
            cb();
            resolve();
          };
        })
      };
    };

    const state = createWorldTheme();
    const p1 = state.load(grimdark); // call 1 (stale)
    const p2 = state.load(other); // call 2 (latest)

    // Resolve the newer call first, then the stale one — simulating
    // out-of-order completion.
    release[2]?.();
    await p2;
    release[1]?.();
    await p1;

    expect(state.current?.manifest.name).toBe('other-world');
    expect(state.status).toBe('active');

    delete docAny.startViewTransition;
  });

  it('mode setter flips data-theme and persists', () => {
    const state = createWorldTheme();
    state.mode = 'light';
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE.mode)).toBe('light');
    expect(state.mode).toBe('light');
    state.mode = 'system';
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
