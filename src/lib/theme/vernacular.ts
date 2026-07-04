// The vernacular half of a "world as a data package" (tokens + strings).
// Worlds freeze one catalog each — batch-generated, human-reviewed — and
// spread it into components. Absent keys fall back to the components'
// English defaults, giving the world → English fallback chain for free.
import type { ComponentProps } from 'svelte';
import type CodeBlock from '../components/molecules/CodeBlock.svelte';
import type NavBar from '../components/molecules/NavBar.svelte';

export interface Vernacular {
  /** Spread into CodeBlock: `<CodeBlock {...vernacular.codeBlock} … />` */
  codeBlock?: Pick<ComponentProps<typeof CodeBlock>, 'copyLabel' | 'copiedLabel' | 'copyAriaLabel'>;
  /** Spread into NavBar: `<NavBar {...vernacular.navBar} … />` */
  navBar?: Pick<ComponentProps<typeof NavBar>, 'navLabel' | 'menuLabel'>;
}
