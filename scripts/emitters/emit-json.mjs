// Resolved-token JSON emitter — the flat, Jinja2-friendly per-theme map for
// non-JS consumers (BONES's Python side templates custom chrome from this).
// JSON has no comments, so the generated marker is a property.

export const emitResolvedJson = (theme) =>
  JSON.stringify(
    {
      $generated: 'by scripts/build-tokens.mjs — do not edit',
      name: theme.name,
      prefix: '--sv-',
      tokens: Object.fromEntries(
        [...theme.colors, ...theme.scaleFull].map((row) => [
          row.key,
          { type: row.type, css: row.css, qt: row.qt }
        ])
      ),
      derived: Object.fromEntries(theme.derived.map((d) => [d.key, d.css]))
    },
    null,
    2
  ) + '\n';
