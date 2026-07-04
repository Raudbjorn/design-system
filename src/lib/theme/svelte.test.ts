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
