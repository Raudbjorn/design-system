// PySide6 runtime helper contract (bin/sv_design_qt.py) exercised through real
// python3 subprocesses. PySide6 is NEVER imported for real here: a fake
// PySide6.QtGui is injected via sys.modules so setColor/QFontDatabase behavior
// is observable, and `sys.modules['PySide6'] = None` proves the module import
// itself stays stdlib-only. Mirrors proxmox-install.test.mjs's spawnSync +
// temporary-fixture convention.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const HELPER = join(ROOT, 'bin/sv_design_qt.py');
const QT_DIR = join(ROOT, 'src/lib/qt');
const QSS_DIR = join(ROOT, 'src/lib/qss');
const PALETTE_NAMES = ['dark', 'light', 'amber'];

const runPython = (code) =>
  spawnSync('python3', ['-c', code], { encoding: 'utf8', timeout: 30_000 });

// Loads the helper the documented way (importlib from a path) and binds it to
// `m`. Placed first in every probe so a load failure surfaces as a traceback.
const LOAD = `import importlib.util
spec = importlib.util.spec_from_file_location("sv_design_qt", ${JSON.stringify(HELPER)})
m = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(m)
`;

let tmp;

afterEach(() => {
  if (tmp) {
    rmSync(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

const tmpFile = (name, contents) => {
  if (!tmp) tmp = mkdtempSync(join(tmpdir(), 'sv-design-qt-'));
  const path = join(tmp, name);
  writeFileSync(path, contents);
  return path;
};

// ── Fake PySide6.QtGui ────────────────────────────────────────────────────
// Records every setColor/QFontDatabase interaction so the tests can assert
// counts and ordering without a real Qt runtime.
const FAKE_QT_GUI = `
import sys, types

class _ColorGroup:
    Active = 'Active'
    Inactive = 'Inactive'
    Disabled = 'Disabled'

class _ColorRole:
    def __init__(self, name): self._n = name
    def __repr__(self): return self._n

ROLE_NAMES = ${JSON.stringify(
    [
      'Window',
      'WindowText',
      'Base',
      'AlternateBase',
      'Text',
      'Button',
      'ButtonText',
      'ToolTipBase',
      'ToolTipText',
      'Highlight',
      'HighlightedText',
      'PlaceholderText',
      'Link',
      'BrightText'
    ]
  )}

class _Palette:
    ColorGroup = _ColorGroup
    ColorRole = types.SimpleNamespace(**{n: _ColorRole(n) for n in ROLE_NAMES})
    def __init__(self): self.calls = []
    def setColor(self, group, role, color): self.calls.append((group, repr(role), color))

class _QColor:
    def __init__(self, value): self.value = value

class _FontDatabase:
    calls = []
    families = {}
    next_id = None
    @staticmethod
    def addApplicationFont(path):
        _FontDatabase.calls.append(path)
        if _FontDatabase.next_id is not None:
            return _FontDatabase.next_id.pop(0) if isinstance(_FontDatabase.next_id, list) else _FontDatabase.next_id
        return path.rsplit('.', 1)[0].endswith('reject') and -1 or len(_FontDatabase.calls)
    @staticmethod
    def applicationFontFamilies(font_id):
        return list(_FontDatabase.families.get(font_id, []))

qtgui = types.ModuleType('PySide6.QtGui')
qtgui.QPalette = _Palette
qtgui.QColor = _QColor
qtgui.QFontDatabase = _FontDatabase
pyside = types.ModuleType('PySide6')
pyside.QtGui = qtgui
sys.modules['PySide6'] = pyside
sys.modules['PySide6.QtGui'] = qtgui
`;

describe('sv_design_qt.py import surface', () => {
  it('imports with PySide6 blocked from sys.modules and prints ok', () => {
    const code = `import sys
sys.modules['PySide6'] = None
${LOAD}print("ok")
`;
    const result = runPython(code);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });
});

describe('sv_design_qt.py parse_palette against the committed artifacts', () => {
  for (const name of PALETTE_NAMES) {
    it(`parses the committed ${name} palette`, () => {
      const path = join(QT_DIR, `${name}.palette.json`);
      const code = `${LOAD}text = open(${JSON.stringify(path)}, encoding="utf-8").read()
doc = m.parse_palette(text)
assert doc["name"] == ${JSON.stringify(name)}, doc["name"]
print("ok")
`;
      const result = runPython(code);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.trim()).toBe('ok');
    });
  }
});

// Mutations run inside the child against the real dark document so each
// failure is isolated to exactly one corrupted field.
const mutate = (expr) => {
  const darkPath = join(QT_DIR, 'dark.palette.json');
  return `${LOAD}import json
text = open(${JSON.stringify(darkPath)}, encoding="utf-8").read()
doc = json.loads(text)
${expr}
mutated = json.dumps(doc)
try:
    m.parse_palette(mutated)
except ValueError as e:
    print("REJECTED:", e)
else:
    print("ACCEPTED")
`;
};

describe('sv_design_qt.py parse_palette rejects corrupted documents', () => {
  it('rejects invalid JSON with a precise ValueError', () => {
    const code = `${LOAD}try:
    m.parse_palette("{not json")
except ValueError as e:
    print("REJECTED:", e)
else:
    print("ACCEPTED")
`;
    const result = runPython(code);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('REJECTED:');
    expect(result.stdout).not.toContain('ACCEPTED');
  });

  it('rejects a non-object root with a precise ValueError', () => {
    const code = `${LOAD}for text in ('["a"]', '"str"', '42', 'null'):
    try:
        m.parse_palette(text)
    except ValueError as e:
        print("REJECTED:", e)
    else:
        print("ACCEPTED", text)
`;
    const result = runPython(code);
    expect(result.status).toBe(0);
    expect(result.stdout.match(/REJECTED:/g)).toHaveLength(4);
    expect(result.stdout).not.toContain('ACCEPTED');
  });

  const cases = [
    ['a missing top-level field (status)', `del doc["status"]`],
    ['an extra top-level field', `doc["extra"] = {}`],
    ['a bad marker', `doc["$generated"] = "edited by hand"`],
    ['a bad name', `doc["name"] = "Dark"`],
    ['an unsafe name', `doc["name"] = "../escape"`],
    ['a non-bool meta.isDark', `doc["meta"]["isDark"] = "yes"`],
    ['an extra meta key', `doc["meta"]["extra"] = True`],
    ['a missing group', `del doc["groups"]["disabled"]`],
    ['an extra group', `doc["groups"]["hover"] = dict(doc["groups"]["active"])`],
    ['a missing role', `del doc["groups"]["active"]["Base"]`],
    ['an extra role', `doc["groups"]["active"]["Hover"] = "#123456"`],
    ['a missing status key', `del doc["status"]["info-bg"]`],
    ['an extra status key', `doc["status"]["accent"] = "#123456"`],
    ['a non-hex color', `doc["groups"]["active"]["Window"] = "#GGGGGG"`],
    ['an uppercase hex color', `doc["groups"]["active"]["Window"] = "#1A2B3C"`]
  ];

  for (const [label, expr] of cases) {
    it(`rejects ${label}`, () => {
      const result = runPython(mutate(expr));
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout, `${label} must be rejected`).toContain('REJECTED:');
      expect(result.stdout).not.toContain('ACCEPTED');
    });
  }

  it('collects multiple structural issues into one ValueError', () => {
    const result = runPython(mutate(`del doc["status"]
doc["meta"]["isDark"] = 1`));
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('REJECTED: palette JSON:');
    expect(result.stdout).toContain(';');
  });
});

describe('sv_design_qt.py palette_from_json with a fake PySide6.QtGui', () => {
  it('issues 42 setColor calls, one per group/role, none skipped', () => {
    const darkPath = join(QT_DIR, 'dark.palette.json');
    const code = `${FAKE_QT_GUI}
${LOAD}palette = m.palette_from_json(${JSON.stringify(darkPath)})
calls = palette.calls
assert len(calls) == 42, len(calls)
seen = {(g, r) for g, r, _ in calls}
expected = {(g, r) for g in ('Active', 'Inactive', 'Disabled') for r in ROLE_NAMES}
assert seen == expected, expected - seen
for g, r, color in calls:
    assert color.value.startswith('#'), (g, r, color.value)
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });
});

describe('sv_design_qt.py apply ordering and preflight', () => {
  it('pre-reads both files then calls Fusion, palette, stylesheet in order', () => {
    const qssPath = join(QSS_DIR, 'dark.qss');
    const palettePath = join(QT_DIR, 'dark.palette.json');
    const code = `${FAKE_QT_GUI}
${LOAD}import json as _json

events = []

class FakeApp:
    def setStyle(self, name): events.append(('setStyle', name))
    def setPalette(self, palette): events.append(('setPalette', len(palette.calls)))
    def setStyleSheet(self, sheet): events.append(('setStyleSheet', len(sheet)))

# Wrap Path.read_text to prove both artifacts are read before any app mutation.
from pathlib import Path as _Path
_real_read_text = _Path.read_text
def _tracking_read_text(self, *args, **kwargs):
    events.append(('read', self.name))
    return _real_read_text(self, *args, **kwargs)
_Path.read_text = _tracking_read_text

app = FakeApp()
m.apply(app, ${JSON.stringify(qssPath)}, ${JSON.stringify(palettePath)})
_Path.read_text = _real_read_text

kinds = [e[0] for e in events]
assert kinds.count('read') == 2, kinds
assert kinds.index('read') < kinds.index('setStyle'), kinds
ops = [e for e in events if e[0] != 'read']
assert ops == [('setStyle', 'Fusion'), ('setPalette', 42), ('setStyleSheet', len(_real_read_text(_Path(${JSON.stringify(qssPath)}), encoding='utf-8')))], ops
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });

  it('produces no app mutation when the QSS file is missing', () => {
    const palettePath = join(QT_DIR, 'dark.palette.json');
    const code = `${FAKE_QT_GUI}
${LOAD}calls = []

class FakeApp:
    def setStyle(self, name): calls.append('setStyle')
    def setPalette(self, palette): calls.append('setPalette')
    def setStyleSheet(self, sheet): calls.append('setStyleSheet')

app = FakeApp()
try:
    m.apply(app, ${JSON.stringify(join(ROOT, 'definitely-missing.qss'))}, ${JSON.stringify(palettePath)})
except (OSError, FileNotFoundError):
    pass
assert calls == [], calls
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });

  it('produces no app mutation when the palette document is invalid', () => {
    const qssPath = join(QSS_DIR, 'dark.qss');
    const bad = tmpFile('bad.palette.json', '{"nope": true}');
    const code = `${FAKE_QT_GUI}
${LOAD}calls = []

class FakeApp:
    def setStyle(self, name): calls.append('setStyle')
    def setPalette(self, palette): calls.append('setPalette')
    def setStyleSheet(self, sheet): calls.append('setStyleSheet')

app = FakeApp()
try:
    m.apply(app, ${JSON.stringify(qssPath)}, ${JSON.stringify(bad)})
except ValueError:
    pass
assert calls == [], calls
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });
});

describe('sv_design_qt.py set_variant', () => {
  it('calls setProperty, unpolish, polish, update in order', () => {
    const code = `${FAKE_QT_GUI}
${LOAD}ops = []

class FakeStyle:
    def unpolish(self, widget): ops.append(('unpolish', widget))
    def polish(self, widget): ops.append(('polish', widget))

class FakeWidget:
    def __init__(self): self.style_obj = FakeStyle(); self.props = {}
    def setProperty(self, name, value): ops.append(('setProperty', name, value)); self.props[name] = value
    def style(self): return self.style_obj
    def update(self): ops.append(('update',))

w = FakeWidget()
m.set_variant(w, "primary")
assert w.props['class'] == 'primary', w.props
assert [o[0] for o in ops] == ['setProperty', 'unpolish', 'polish', 'update'], ops
assert ops[1][1] is w and ops[2][1] is w
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });
});

describe('sv_design_qt.py watch_color_scheme', () => {
  it('returns False without colorSchemeChanged and connects nothing', () => {
    const code = `${FAKE_QT_GUI}
${LOAD}connected = []

class NoSignalHints:
    pass

class FakeApp:
    def styleHints(self): return NoSignalHints()

assert m.watch_color_scheme(FakeApp(), lambda scheme: connected.append(scheme)) is False
assert connected == []
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });

  it('connects the supplied callback exactly once when the signal exists', () => {
    const code = `${FAKE_QT_GUI}
${LOAD}connections = []

class FakeSignal:
    def connect(self, cb): connections.append(cb)

class WithSignalHints:
    colorSchemeChanged = FakeSignal()

class FakeApp:
    def styleHints(self): return WithSignalHints()

cb = lambda scheme: None
assert m.watch_color_scheme(FakeApp(), cb) is True
assert connections == [cb], connections
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });
});

describe('sv_design_qt.py load_fonts', () => {
  it('loads sorted ttf/otf/woff2, ignores other suffixes, skips -1 ids', () => {
    if (!tmp) tmp = mkdtempSync(join(tmpdir(), 'sv-design-qt-'));
    const fontsDir = join(tmp, 'fonts');
    spawnSync('mkdir', ['-p', fontsDir]);
    // Creation order deliberately differs from sorted order.
    for (const name of ['zeta.woff2', 'alpha.ttf', 'mid.otf', 'notes.txt', 'skipme.css']) {
      writeFileSync(join(fontsDir, name), 'font-bytes');
    }
    const code = `${FAKE_QT_GUI}
${LOAD}from PySide6.QtGui import QFontDatabase
QFontDatabase.next_id = [10, -1, 30]
QFontDatabase.families = {10: ['Zeta Sans'], 30: ['Mid Serif']}
families = m.load_fonts(${JSON.stringify(fontsDir)})
assert QFontDatabase.calls == [
    ${JSON.stringify(join(fontsDir, 'alpha.ttf'))},
    ${JSON.stringify(join(fontsDir, 'mid.otf'))},
    ${JSON.stringify(join(fontsDir, 'zeta.woff2'))}
], QFontDatabase.calls
assert families == ['Zeta Sans', 'Mid Serif'], families
print("ok")
`;
    const result = runPython(code);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
  });
});
