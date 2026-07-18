import { describe, expect, it } from 'vitest';
import { escapeHtml, vernacularToJson } from './escape';
import { parseVernacular } from './parse';
import { resolveVernacular } from './resolve';
import type { VernacularCatalog } from './types';

const catalog = (strings: Record<string, unknown>): VernacularCatalog => {
  const r = parseVernacular({ name: 'w', version: '1.0.0', strings });
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
};

class TestReadonlyMap<K, V> implements ReadonlyMap<K, V> {
  readonly #delegate: Map<K, V>;

  constructor(entries: Iterable<readonly [K, V]>) {
    this.#delegate = new Map(entries);
  }

  get size(): number {
    return this.#delegate.size;
  }

  get(key: K): V | undefined {
    return this.#delegate.get(key);
  }

  has(key: K): boolean {
    return this.#delegate.has(key);
  }

  entries(): MapIterator<[K, V]> {
    return this.#delegate.entries();
  }

  keys(): MapIterator<K> {
    return this.#delegate.keys();
  }

  values(): MapIterator<V> {
    return this.#delegate.values();
  }

  forEach(callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown): void {
    this.#delegate.forEach((value, key) => callback.call(thisArg, value, key, this));
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
}

describe('escapeHtml', () => {
  it('encodes the HTML-significant characters', () => {
    expect(escapeHtml('Save & <Exit> "now" \'ok\'')).toBe(
      'Save &amp; &lt;Exit&gt; &quot;now&quot; &#39;ok&#39;'
    );
  });

  it('neutralizes a </style> / </script> breakout', () => {
    expect(escapeHtml('</style>')).toBe('&lt;/style&gt;');
    expect(escapeHtml('</script>')).not.toContain('</script>');
  });
});

describe('vernacularToJson', () => {
  it('emits every slot with catalog overrides layered over English defaults', () => {
    const json = vernacularToJson(catalog({ 'navBar.navLabel': 'Ways', 'codeBlock.copyLabel': 'Copy it' }));
    const obj = JSON.parse(json);
    expect(obj).toEqual({
      'codeBlock.copiedLabel': 'Copied',
      'codeBlock.copyAriaLabel': 'Copy code',
      'codeBlock.copyLabel': 'Copy it',
      'navBar.menuLabel': 'Menu',
      'navBar.navLabel': 'Ways'
    });
    expect(json.indexOf('codeBlock')).toBeLessThan(json.indexOf('navBar'));
  });

  it('keeps plain/accessibility text raw and emits English in plain-language mode', () => {
    const cat = catalog({ 'navBar.navLabel': 'Fire & Ice' });
    expect(JSON.parse(vernacularToJson(cat))['navBar.navLabel']).toBe('Fire & Ice');
    const plain = JSON.parse(vernacularToJson(cat, { plainLanguage: true }));
    expect(plain['navBar.navLabel']).toBe('Primary');
    expect(plain['codeBlock.copyAriaLabel']).toBe('Copy code');
  });

  it('accepts structural ReadonlyMap implementations and resolved Vernacular inputs', () => {
    const customCatalog: VernacularCatalog = {
      manifest: { name: 'w', version: '1.0.0' },
      strings: new TestReadonlyMap([['navBar.navLabel', 'Ways']]),
      issues: []
    };
    expect(JSON.parse(vernacularToJson(customCatalog))['navBar.navLabel']).toBe('Ways');

    const resolved = resolveVernacular(catalog({ 'navBar.navLabel': 'Paths' }));
    const obj = JSON.parse(vernacularToJson(resolved));
    expect(obj['navBar.navLabel']).toBe('Paths');
    expect(obj['navBar.menuLabel']).toBe('Menu');
  });
});
