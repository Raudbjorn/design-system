import { afterEach, describe, expect, it } from 'vitest';
import { BOOT_STYLE_ID, getThemeMode, setThemeMode, THEME_STORAGE, themeBootScript } from './boot';
import { worldThemeToCss } from './css';
import { parseWorldTheme } from './parse';
import grimdark from './fixtures/grimdark.json';

const runBoot = () => new Function(themeBootScript)();

const validCss = (() => {
  const parsed = parseWorldTheme(grimdark);
  if (!parsed.ok) throw new Error('fixture must parse');
  return worldThemeToCss(parsed.value);
})();

const cache = (envelope: unknown) =>
  window.localStorage.setItem(
    THEME_STORAGE.worldCss,
    typeof envelope === 'string' ? envelope : JSON.stringify(envelope)
  );

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.getElementById(BOOT_STYLE_ID)?.remove();
});

describe('themeBootScript', () => {
  it('is inline-safe and compiles', () => {
    expect(themeBootScript).not.toContain('</script>');
    expect(() => new Function(themeBootScript)).not.toThrow();
  });

  it('restores the persisted mode', () => {
    window.localStorage.setItem(THEME_STORAGE.mode, 'light');
    runBoot();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('injects a valid cached world theme and sets data-theme from extends', () => {
    cache({ v: 1, name: 'grimdark-hive', extends: 'dark', css: validCss });
    runBoot();
    const el = document.getElementById(BOOT_STYLE_ID);
    expect(el?.textContent).toContain('--sv-bg: #141210;');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persisted mode wins over the cached theme extends', () => {
    window.localStorage.setItem(THEME_STORAGE.mode, 'light');
    cache({ v: 1, name: 'grimdark-hive', extends: 'dark', css: validCss });
    runBoot();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.getElementById(BOOT_STYLE_ID)).not.toBeNull();
  });

  it('discards and self-heals every poisoned cache variant', () => {
    const poisons: unknown[] = [
      'not json {',
      { v: 2, css: validCss },
      { v: 1, css: `${validCss}<img src=x>` },
      { v: 1, css: validCss.replace('/*sv-world*/', '') },
      { v: 1, css: `/*sv-world*/@layer x;@import "evil.css";` },
      { v: 1, css: `/*sv-world*/@layer x;:root{background:url(//evil)}` },
      { v: 1, css: `/*sv-world*/@layer x;:root{--x:\\75rl}` },
      { v: 1, css: `/*sv-world*/@layer ${'x'.repeat(40000)}` }
    ];
    for (const poison of poisons) {
      cache(poison);
      runBoot();
      expect(
        document.getElementById(BOOT_STYLE_ID),
        `must not inject: ${JSON.stringify(poison).slice(0, 60)}`
      ).toBeNull();
      expect(window.localStorage.getItem(THEME_STORAGE.worldCss)).toBeNull();
    }
  });

  it('does nothing quietly with an empty cache', () => {
    runBoot();
    expect(document.getElementById(BOOT_STYLE_ID)).toBeNull();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('setThemeMode / getThemeMode', () => {
  it('round-trips explicit modes and clears on system', () => {
    setThemeMode('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE.mode)).toBe('light');
    expect(getThemeMode()).toBe('light');
    setThemeMode('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE.mode)).toBeNull();
    expect(getThemeMode()).toBe('system');
  });
});
