import { describe, expect, it } from 'vitest';
import { parseVernacular } from './parse';
import type { VernacularIssueCode } from './types';
import foundry from './fixtures/foundry.json';

const pkg = (strings: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  name: 'test-world',
  version: '1.0.0',
  strings,
  ...extra
});
const codes = (issues: readonly { code: VernacularIssueCode }[]) => issues.map((i) => i.code);

describe('input + manifest', () => {
  it('rejects non-objects and unparseable JSON', () => {
    for (const bad of [42, null, [], 'not json {']) {
      const r = parseVernacular(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(codes(r.error)).toContain('E_VERN_INPUT');
    }
  });

  it('rejects a payload over the byte cap', () => {
    const big = JSON.stringify(pkg({ 'navBar.navLabel': 'x'.repeat(70_000) }));
    const r = parseVernacular(big);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(codes(r.error)).toContain('E_VERN_INPUT');
  });

  it('rejects an object payload over the structural byte budget', () => {
    const r = parseVernacular(pkg({ 'navBar.navLabel': 'x'.repeat(70_000) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(codes(r.error)).toContain('E_VERN_INPUT');
  });

  it('applies structural depth limits after parsing JSON strings', () => {
    let nested: Record<string, unknown> = {};
    for (let depth = 0; depth < 34; depth++) nested = { child: nested };
    const r = parseVernacular(JSON.stringify(pkg({}, { tokens: nested })));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(codes(r.error)).toContain('E_VERN_INPUT');
  });

  it('rejects accessor and inherited-property objects without invoking getters', () => {
    let invoked = false;
    const inherited = Object.create({
      get name() {
        invoked = true;
        throw new Error('must not run');
      }
    }) as Record<string, unknown>;
    inherited.version = '1.0.0';
    inherited.strings = {};

    const accessor = pkg({});
    Object.defineProperty(accessor, 'name', {
      enumerable: false,
      get() {
        invoked = true;
        throw new Error('must not run');
      }
    });

    for (const input of [inherited, accessor]) {
      const r = parseVernacular(input);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(codes(r.error)).toContain('E_VERN_INPUT');
    }
    expect(invoked).toBe(false);
  });

  it('rejects object catalogs over the flat-entry cap before diagnostics fan out', () => {
    const strings = Object.fromEntries(
      Array.from({ length: 201 }, (_, index) => [`unknown.${index}`, 'x'])
    );
    const r = parseVernacular(pkg(strings), { unknownKeys: 'reject' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(codes(r.error)).toContain('E_VERN_INPUT');
      expect(r.error.length).toBe(1);
    }
  });

  it('accepts SemVer suffixes but rejects trailing garbage and extra components', () => {
    for (const version of ['1.2.3', '1.2.3-beta.1', '1.2.3+build.7', '1.2.3-beta+build']) {
      expect(parseVernacular(pkg({}, { version })).ok).toBe(true);
    }
    for (const version of ['1.0.0garbage', '1.2.3<script', '1.2.3.4', '01.2.3']) {
      const r = parseVernacular(pkg({}, { version }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(codes(r.error)).toContain('E_VERN_MANIFEST');
    }
  });

  it('collects bad name and version together', () => {
    const r = parseVernacular({ name: 'Bad Name!', version: 'one', strings: {} });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(codes(r.error).filter((c) => c === 'E_VERN_MANIFEST')).toHaveLength(2);
  });

  it('caps meta and flags unknown top-level keys (but tolerates tokens)', () => {
    const r = parseVernacular(
      pkg({ 'navBar.navLabel': 'Ways' }, { meta: { a: 'x', b: 42 }, tokens: {}, surprise: true })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.manifest.meta).toEqual({ a: 'x' });
    // one info for the dropped meta value, one for `surprise`; NONE for `tokens`.
    const infos = codes(r.value.issues).filter((c) => c === 'I_VERN_META_IGNORED');
    expect(infos.length).toBe(2);
  });
});

describe('string processing', () => {
  it('accepts flat dotted keys and nested-by-component equivalently', () => {
    const flat = parseVernacular(pkg({ 'codeBlock.copyLabel': 'Transcribe' }));
    const nested = parseVernacular(pkg({ codeBlock: { copyLabel: 'Transcribe' } }));
    expect(flat.ok && nested.ok).toBe(true);
    if (!flat.ok || !nested.ok) return;
    expect(flat.value.strings.get('codeBlock.copyLabel')).toBe('Transcribe');
    expect(nested.value.strings.get('codeBlock.copyLabel')).toBe('Transcribe');
  });

  it('skips unknown keys (warning) or rejects them under unknownKeys: reject', () => {
    const input = pkg({ 'codeBlock.nope': 'x', 'navBar.navLabel': 'Ways' });
    const skip = parseVernacular(input);
    expect(skip.ok).toBe(true);
    if (skip.ok) expect(codes(skip.value.issues)).toContain('W_VERN_UNKNOWN_KEY');

    const reject = parseVernacular(input, { unknownKeys: 'reject' });
    expect(reject.ok).toBe(false);
    if (!reject.ok) expect(codes(reject.error)).toContain('E_VERN_UNKNOWN_KEY');
  });

  it('caps unknown-key diagnostics under the reject policy', () => {
    const strings = Object.fromEntries(
      Array.from({ length: 200 }, (_, index) => [`unknown.${index}`, 'x'])
    );
    const r = parseVernacular(pkg(strings), { unknownKeys: 'reject' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(codes(r.error).filter((code) => code === 'E_VERN_UNKNOWN_KEY')).toHaveLength(21);
  });

  it('drops one bad value while siblings survive (collect-all)', () => {
    const r = parseVernacular(
      pkg({ 'codeBlock.copyLabel': 'x'.repeat(50), 'navBar.navLabel': 'Ways' })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(codes(r.value.issues)).toContain('E_VERN_LENGTH');
    expect(r.value.strings.has('codeBlock.copyLabel')).toBe(false);
    expect(r.value.strings.get('navBar.navLabel')).toBe('Ways');
  });

  it('rejects Unicode line and paragraph separators in single-line labels', () => {
    for (const separator of ['\u2028', '\u2029']) {
      const r = parseVernacular(pkg({ 'navBar.navLabel': `Way${separator}points` }));
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(codes(r.value.issues)).toContain('E_VERN_CONTROL');
      expect(r.value.strings.has('navBar.navLabel')).toBe(false);
    }
  });

  it('rejects labels made only from default-ignorable joiners', () => {
    for (const value of ['\u200c', '\u200d', '\u200c\u200d', ' \u200d ']) {
      const r = parseVernacular(pkg({ 'navBar.navLabel': value }));
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(codes(r.value.issues)).toContain('E_VERN_EMPTY');
      expect(r.value.strings.has('navBar.navLabel')).toBe(false);
    }
    const joinedEmoji = parseVernacular(pkg({ 'navBar.navLabel': '👩‍💻 tools' }));
    expect(joinedEmoji.ok).toBe(true);
    if (joinedEmoji.ok) expect(joinedEmoji.value.strings.get('navBar.navLabel')).toBe('👩‍💻 tools');
  });

  it('flags a malformed component shape', () => {
    const r = parseVernacular(pkg({ codeBlock: 'not-a-group' }));
    expect(r.ok).toBe(true); // recoverable
    if (!r.ok) return;
    expect(codes(r.value.issues)).toContain('E_VERN_TYPE');
  });

  it('warns when a key is given in both dotted and nested form (last wins)', () => {
    const r = parseVernacular(
      pkg({ 'codeBlock.copyLabel': 'A', codeBlock: { copyLabel: 'B' } })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(codes(r.value.issues)).toContain('W_VERN_DUPLICATE_KEY');
    expect(r.value.strings.get('codeBlock.copyLabel')).toBe('B'); // later wins
  });

  it('drops an earlier valid duplicate when the later value is malformed', () => {
    const r = parseVernacular(
      pkg({ 'codeBlock.copyLabel': 'Copy', codeBlock: { copyLabel: 'x'.repeat(50) } })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(codes(r.value.issues)).toContain('W_VERN_DUPLICATE_KEY');
    expect(codes(r.value.issues)).toContain('E_VERN_LENGTH');
    expect(r.value.strings.has('codeBlock.copyLabel')).toBe(false);
  });

  it('warns on an all-skipped (empty) catalog', () => {
    const r = parseVernacular(pkg({ 'unknown.key': 'x' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(codes(r.value.issues)).toContain('W_VERN_EMPTY_CATALOG');
  });

  it('parses the foundry fixture clean', () => {
    const r = parseVernacular(foundry);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(r.value.strings.get('navBar.menuLabel')).toBe('Waypoints');
  });
});
