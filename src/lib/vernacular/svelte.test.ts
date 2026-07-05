import { describe, expect, it } from 'vitest';
import { createVernacular } from './svelte.svelte';
import foundry from './fixtures/foundry.json';

describe('createVernacular', () => {
  it('starts empty and English by default', () => {
    const v = createVernacular();
    expect(v.current).toEqual({});
    expect(v.issues).toEqual([]);
    expect(v.plainLanguage).toBe(false);
  });

  it('load() adopts a valid catalog and exposes its resolved strings + issues', () => {
    const v = createVernacular();
    expect(v.load(foundry)).toBe(true);
    expect(v.current.navBar?.menuLabel).toBe('Waypoints');
    expect(v.issues.every((i) => i.severity !== 'error')).toBe(true);
  });

  it('load() returns false and surfaces issues on a rejected catalog', () => {
    const v = createVernacular();
    expect(v.load({ name: 'Bad Name!' })).toBe(false);
    expect(v.issues.length).toBeGreaterThan(0);
    expect(v.current).toEqual({}); // nothing adopted
  });

  it('the plainLanguage setter re-derives current to English defaults', () => {
    const v = createVernacular();
    v.load(foundry);
    expect(v.current.navBar?.menuLabel).toBe('Waypoints');
    v.plainLanguage = true;
    expect(v.current).toEqual({}); // forced back to component defaults
    v.plainLanguage = false;
    expect(v.current.navBar?.menuLabel).toBe('Waypoints');
  });

  it('clear() drops the catalog and its issues', () => {
    const v = createVernacular();
    v.load(foundry);
    v.clear();
    expect(v.current).toEqual({});
    expect(v.issues).toEqual([]);
  });
});
