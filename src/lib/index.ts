export { default as Text } from './components/atoms/Text.svelte';
export { default as Heading } from './components/atoms/Heading.svelte';
export { default as Button } from './components/atoms/Button.svelte';
export { default as Link } from './components/atoms/Link.svelte';
export { default as Badge } from './components/atoms/Badge.svelte';
export { default as Icon } from './components/atoms/Icon.svelte';
export { default as Kbd } from './components/atoms/Kbd.svelte';
export { default as Avatar } from './components/atoms/Avatar.svelte';
export { default as Stack } from './components/layout/Stack.svelte';
export { default as Card } from './components/molecules/Card.svelte';
export { default as CodeBlock } from './components/molecules/CodeBlock.svelte';
export { default as NavBar } from './components/molecules/NavBar.svelte';
export { default as StatCard } from './components/molecules/StatCard.svelte';

// Forms
export { default as Input } from './components/atoms/Input.svelte';
export { default as Select } from './components/atoms/Select.svelte';
export { default as Checkbox } from './components/atoms/Checkbox.svelte';
export { default as Radio } from './components/atoms/Radio.svelte';
export { default as Switch } from './components/atoms/Switch.svelte';

// Feedback
export { default as Alert } from './components/atoms/Alert.svelte';
export { default as Tooltip } from './components/atoms/Tooltip.svelte';
export { default as Spinner } from './components/atoms/Spinner.svelte';
export { default as Progress } from './components/atoms/Progress.svelte';

// Navigation / data
export { default as Tabs } from './components/molecules/Tabs.svelte';
export { default as Table } from './components/molecules/Table.svelte';
export { default as Timeline } from './components/molecules/Timeline.svelte';
export { default as Breadcrumb } from './components/molecules/Breadcrumb.svelte';
export { default as Modal } from './components/molecules/Modal.svelte';
export { default as Sheet } from './components/molecules/Sheet.svelte';

export { applyTheme, contrastGates, defineTheme, swapTheme, themeCss } from './theme/theme.js';
export type {
  ApplyThemeOptions,
  DefineThemeOptions,
  SwapThemeOptions,
  Theme,
  ThemeIssue,
  ThemeResult
} from './theme/theme.js';
export {
  parseVernacular,
  resolveVernacular,
  pseudoLocalize,
  checkTerminology,
  vernacularToJson,
  VERNACULAR_REGISTRY
} from './vernacular/index.js';
export type {
  Vernacular,
  VernacularCatalog,
  VernacularIssue,
  VernacularIssueCode,
  VernacularManifest,
  VernacularPackage,
  ParseVernacularOptions,
  Glossary,
  TermRule,
  TerminologyReport
} from './vernacular/index.js';
export { contrastRatio } from './internal/contrast.js';
export { dark, light } from './tokens/palette.js';
export type { Palette, TokenName } from './tokens/palette.js';

// Vermis alternative design language — occult-ornate component set from the
// layform pattern language (Vermis I/II). Consumes `--layform-*` tokens via
// `@svnbjrn/design/vermis/styles.css`. Re-exported as a namespace so the
// default `--sv-*` components stay the primary API and vermis is an explicit
// opt-in: `import { vermis } from '@svnbjrn/design'` or
// `import { VermisButton } from '@svnbjrn/design/vermis'`.
export * as vermis from './vermis/index.js';
