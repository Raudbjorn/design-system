"""Qt 6 runtime helper for @svnbjrn/design palettes.

Applies the committed QPalette JSON documents (src/lib/qt/<name>.palette.json)
and Qt Style Sheets (src/lib/qss/<name>.qss) to a PySide6 application in the
documented order: Fusion style, then the generated palette underlay, then the
generated QSS.

The module import is stdlib-only (json, re, pathlib). PySide6 is imported
lazily, inside the Qt-dependent functions, so importing this file — and every
pure validation function — works without PySide6 installed.

The palette schema is closed: parse_palette() rejects anything that is not
exactly what scripts/build-tokens.mjs emits. A corrupted or hand-edited
document never becomes a partially applied palette.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

# Closed schema — keep in sync with src/lib/qt/emit.ts (QT_ROLES) and the
# emitted document shape.
_MARKER = "by scripts/build-tokens.mjs — do not edit"
_TOP_KEYS = ("$generated", "name", "meta", "groups", "status")
_GROUPS = ("active", "inactive", "disabled")
_ROLES = (
    "Window",
    "WindowText",
    "Base",
    "AlternateBase",
    "Text",
    "Button",
    "ButtonText",
    "ToolTipBase",
    "ToolTipText",
    "Highlight",
    "HighlightedText",
    "PlaceholderText",
    "Link",
    "BrightText",
)
_STATUS_KEYS = (
    "success",
    "error",
    "warning",
    "info",
    "success-bg",
    "error-bg",
    "warning-bg",
    "info-bg",
)
_NAME_RE = re.compile(r"^[a-z][a-z0-9-]{0,63}$")
_HEX_RE = re.compile(r"^#[0-9a-f]{6}$")
_FONT_SUFFIXES = (".ttf", ".otf", ".woff2")


def _check_hex(issues: list[str], label: str, value: object) -> None:
    if not isinstance(value, str):
        issues.append(f"{label} is not a string: {value!r}")
        return
    if not _HEX_RE.fullmatch(value):
        issues.append(f"{label} is not a lowercase #rrggbb color: {value!r}")


def parse_palette(text: str) -> dict:
    """Validate a committed palette document and return it.

    Closed schema: exactly the emitted top-level keys, marker, groups, roles,
    and status keys, with lowercase six-digit hex everywhere. All structural
    issues are collected and raised as one ValueError; invalid JSON or a
    non-object root raises immediately.
    """
    try:
        doc = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"palette JSON: invalid JSON: {exc.msg} (line {exc.lineno})") from exc
    if not isinstance(doc, dict):
        raise ValueError(f"palette JSON: root must be an object, got {type(doc).__name__}")

    issues: list[str] = []

    keys = tuple(doc.keys())
    if set(keys) != set(_TOP_KEYS):
        issues.append(f"top-level keys must be exactly {list(_TOP_KEYS)}, got {list(keys)}")

    if doc.get("$generated") != _MARKER:
        issues.append(f"$generated marker mismatch: {doc.get('$generated')!r}")

    name = doc.get("name")
    if not isinstance(name, str) or not _NAME_RE.fullmatch(name):
        issues.append(f"name must be lowercase kebab-case, got {name!r}")

    meta = doc.get("meta")
    if isinstance(meta, dict):
        if tuple(meta.keys()) != ("isDark",):
            issues.append(f"meta must contain exactly 'isDark', got {list(meta.keys())}")
        elif not isinstance(meta["isDark"], bool):
            issues.append(f"meta.isDark must be a boolean, got {type(meta['isDark']).__name__}")
    else:
        issues.append("meta must be an object")

    groups = doc.get("groups")
    if isinstance(groups, dict):
        if set(groups.keys()) != set(_GROUPS):
            issues.append(f"groups must be exactly {list(_GROUPS)}, got {sorted(groups.keys())}")
        for group_name, group in groups.items():
            if group_name not in _GROUPS:
                continue
            if not isinstance(group, dict):
                issues.append(f"groups.{group_name} must be an object")
                continue
            if set(group.keys()) != set(_ROLES):
                missing = sorted(set(_ROLES) - set(group.keys()))
                extra = sorted(set(group.keys()) - set(_ROLES))
                detail = f"groups.{group_name} roles wrong"
                if missing:
                    detail += f"; missing {missing}"
                if extra:
                    detail += f"; unknown {extra}"
                issues.append(detail)
            for role, value in group.items():
                if role in _ROLES:
                    _check_hex(issues, f"groups.{group_name}.{role}", value)
    else:
        issues.append("groups must be an object")

    status = doc.get("status")
    if isinstance(status, dict):
        if set(status.keys()) != set(_STATUS_KEYS):
            missing = sorted(set(_STATUS_KEYS) - set(status.keys()))
            extra = sorted(set(status.keys()) - set(_STATUS_KEYS))
            detail = "status keys wrong"
            if missing:
                detail += f"; missing {missing}"
            if extra:
                detail += f"; unknown {extra}"
            issues.append(detail)
        for key, value in status.items():
            if key in _STATUS_KEYS:
                _check_hex(issues, f"status.{key}", value)
    else:
        issues.append("status must be an object")

    if issues:
        raise ValueError("palette JSON: " + "; ".join(issues))
    return doc


def _qt_gui():
    """Lazily import PySide6.QtGui; convert a missing package into a clear error."""
    try:
        from PySide6 import QtGui
    except ImportError as exc:  # missing package or the sys.modules=None block
        raise RuntimeError("PySide6 >= 6.5 is required for Qt runtime functions") from exc
    return QtGui


def palette_from_json(path: str | Path):
    """Build a QPalette from a validated palette document.

    Every group/role is set explicitly — an enum member that does not exist in
    the installed PySide6 fails loudly instead of being skipped.
    """
    QtGui = _qt_gui()
    doc = parse_palette(Path(path).read_text(encoding="utf-8"))
    palette = QtGui.QPalette()
    group_map = {
        "active": QtGui.QPalette.ColorGroup.Active,
        "inactive": QtGui.QPalette.ColorGroup.Inactive,
        "disabled": QtGui.QPalette.ColorGroup.Disabled,
    }
    for group_name, group in doc["groups"].items():
        qgroup = group_map[group_name]
        for role_name, value in group.items():
            role = getattr(QtGui.QPalette.ColorRole, role_name, None)
            if role is None:
                raise RuntimeError(
                    f"QPalette.ColorRole.{role_name} is missing — "
                    "PySide6 >= 6.5 is required for Qt runtime functions"
                )
            palette.setColor(qgroup, role, QtGui.QColor(value))
    return palette


def apply(app, qss_path: str | Path, palette_path: str | Path) -> None:
    """Apply Fusion, the generated palette, then the generated QSS.

    Both files are read and the palette is validated before the first app
    mutation, so a missing QSS or bad palette leaves the application untouched.
    QSS still wins where it defines a widget; the palette is the deliberate
    best-effort underlay for Qt-owned widgets the sheet does not reach.
    """
    qss_text = Path(qss_path).read_text(encoding="utf-8")
    palette = palette_from_json(palette_path)
    app.setStyle("Fusion")
    app.setPalette(palette)
    app.setStyleSheet(qss_text)


def set_variant(widget, value: str, prop: str = "class") -> None:
    """Flip a QSS variant property and re-polish the widget.

    Matches the committed QSS idiom (`QLabel[class="…"]`): set the dynamic
    property, then unpolish/polish so the style re-evaluates selectors, then
    update for the repaint. No stylesheet reset.
    """
    widget.setProperty(prop, value)
    style = widget.style()
    style.unpolish(widget)
    style.polish(widget)
    widget.update()


def watch_color_scheme(app, callback) -> bool:
    """Connect callback to the OS color-scheme signal when available.

    Returns True when QStyleHints.colorSchemeChanged exists and the callback
    was connected. Returns False on older bindings without raising. The
    callback owns dark/light artifact selection and reapplication — amber
    stays explicit.
    """
    signal = getattr(app.styleHints(), "colorSchemeChanged", None)
    if signal is None:
        return False
    signal.connect(callback)
    return True


def load_fonts(directory: str | Path) -> list[str]:
    """Best-effort registration of the fonts in one directory level.

    Scans sorted *.ttf / *.otf / *.woff2, ignores other suffixes, skips ids Qt
    rejected (-1), and returns the registered family names. Qt only guarantees
    TrueType/OpenType; WOFF2 registers where the platform font engine decodes
    it (FreeType with brotli — standard on Linux) and takes the -1 path
    elsewhere. Returns [] when the directory is absent (fonts were not
    vendored) or Qt accepts nothing — the QSS system-font stack remains the
    fallback either way.
    """
    QtGui = _qt_gui()
    db = QtGui.QFontDatabase
    families: list[str] = []
    root = Path(directory)
    if not root.is_dir():
        return families
    for entry in sorted(root.iterdir(), key=lambda p: p.name):
        if not entry.is_file() or entry.suffix.lower() not in _FONT_SUFFIXES:
            continue
        font_id = db.addApplicationFont(str(entry))
        if font_id == -1:
            continue
        families.extend(db.applicationFontFamilies(font_id))
    return families
