// Props that exist on the .svelte component and deliberately do NOT exist on
// the .astro port.
//
// This is data, not a comment, because the parity test reads it: a prop that
// goes missing from a port without an entry here fails the build. Adding an
// entry is a visible, reviewable act.

export const UNSUPPORTED_PROPS: Readonly<Record<string, readonly string[]>> = {
  // .astro has no client runtime to hand a function to. A static Button is
  // still a <button type="submit"> or an <a href> — the two uses that do not
  // need JS. For an onclick, use the Svelte Button with a client: directive.
  Button: ['onclick'],
  // `cell`: Astro slots take no parameters, so a per-cell render callback
  // cannot cross the boundary. Cells render their raw value; rich cells are a
  // reason to reach for the Svelte Table.
  // `rowKey`: exists to give Svelte's keyed {#each} stable row identity across
  // updates. Static output has no updates. Accepting it would be a prop that
  // silently does nothing, so it is absent and typed as absent.
  Table: ['cell', 'rowKey']
} as const;
