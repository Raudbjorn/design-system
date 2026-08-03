// Ambient types for `.astro` imports, for THIS repo's type-check only.
//
// Deliberately outside src/lib so it is never published: consumers get the
// same declaration from their own `astro sync` output, and a second global
// `declare module '*.astro'` arriving from a dependency would collide with it.

declare module '*.astro' {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
