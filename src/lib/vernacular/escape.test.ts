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
  it('emits flat, sorted, resolved JSON from a catalog', () => {
    const json = vernacularToJson(catalog({ 'navBar.navLabel': 'Ways', 'codeBlock.copyLabel': 'Copy it' }));
    const obj = JSON.parse(json);
    expect(obj).toEqual({ 'codeBlock.copyLabel': 'Copy it', 'navBar.navLabel': 'Ways' });
    // sorted: codeBlock.* before navBar.*
    expect(json.indexOf('codeBlock')).toBeLessThan(json.indexOf('navBar'));
  });

  it('escape: html encodes every value; the raw form is left untouched', () => {
    const cat = catalog({ 'navBar.navLabel': 'Fire & Ice' });
    expect(JSON.parse(vernacularToJson(cat))['navBar.navLabel']).toBe('Fire & Ice');
    expect(JSON.parse(vernacularToJson(cat, { escape: 'html' }))['navBar.navLabel']).toBe('Fire &amp; Ice');
  });

  it('works from a resolved Vernacular too, and no </style> survives html emit', () => {
    // A label of literal markup survives the grammar (kept raw) but is neutralized here.
    const v = resolveVernacular(catalog({ 'navBar.navLabel': '</style>' }));
    const json = vernacularToJson(v, { escape: 'html' });
    expect(json).not.toContain('</style>');
    expect(JSON.parse(json)['navBar.navLabel']).toBe('&lt;/style&gt;');
  });
});
