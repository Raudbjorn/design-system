// `@svnbjrn/design/astro/components` — native .astro ports.
//
// These are the components that have no state and no event handlers, so they
// render to static HTML with no client runtime at all. Everything interactive
// (Checkbox, CodeBlock, Input, Modal, NavBar, Radio, Select, Sheet, Switch,
// Tabs, Tooltip) stays Svelte-only: import it from `@svnbjrn/design` and give
// it a `client:` directive.
//
// Markup and styles here are ports of the .svelte sources, kept honest by
// src/lib/astro/components/parity.test.ts, which renders both and compares.
// Change one, change the other.

export { default as Alert } from './Alert.astro';
export { default as Avatar } from './Avatar.astro';
export { default as Badge } from './Badge.astro';
export { default as Breadcrumb } from './Breadcrumb.astro';
export { default as Button } from './Button.astro';
export { default as Card } from './Card.astro';
export { default as Heading } from './Heading.astro';
export { default as Icon } from './Icon.astro';
export { default as Kbd } from './Kbd.astro';
export { default as Link } from './Link.astro';
export { default as Progress } from './Progress.astro';
export { default as Spinner } from './Spinner.astro';
export { default as Stack } from './Stack.astro';
export { default as StatCard } from './StatCard.astro';
export { default as Table } from './Table.astro';
export { default as Text } from './Text.astro';
export { default as Timeline } from './Timeline.astro';

export type {
  AlertProps,
  AvatarProps,
  BadgeProps,
  BreadcrumbProps,
  ButtonProps,
  CardProps,
  Column,
  Crumb,
  HeadingProps,
  IconProps,
  KbdProps,
  LinkProps,
  ProgressProps,
  SpinnerProps,
  StackProps,
  StatCardProps,
  TableProps,
  TextProps,
  TimelineItem,
  TimelineProps
} from './props.ts';

export { UNSUPPORTED_PROPS } from './unsupported.ts';
