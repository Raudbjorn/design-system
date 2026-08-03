// Prop contracts for the .astro ports.
//
// Defined here rather than inline in each frontmatter so the published .d.ts
// has real types to point at, and so a prop rename is one edit instead of two.
// These mirror the `interface Props` of the matching .svelte source; the
// parity test compares the two name-for-name, minus the documented gaps in
// ./unsupported.ts.

export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  /** Glyph override; defaults to a tone-appropriate mark. */
  icon?: string;
}

export interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface BadgeProps {
  tone?: 'neutral' | 'success' | 'error' | 'warning' | 'accent';
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
}

export interface HeadingProps {
  level?: 1 | 2 | 3 | 4;
}

export interface IconProps {
  glyph: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export type KbdProps = Record<never, never>;

export interface LinkProps {
  href: string;
  external?: boolean;
}

interface ProgressShared {
  value?: number;
  indeterminate?: boolean;
  tone?: 'accent' | 'accent-2';
}

/** Labelled visibly or labelled for assistive tech — never neither, never both. */
export type ProgressProps =
  | (ProgressShared & { label: string; 'aria-label'?: never })
  | (ProgressShared & { label?: never; 'aria-label': string });

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible name for the busy state. */
  label?: string;
}

export interface TextProps {
  size?: 'xs' | 'sm' | 'base' | 'lg';
  tone?: 'default' | 'strong' | 'muted' | 'faint';
  mono?: boolean;
  as?: 'p' | 'span' | 'div';
}

export interface StackProps {
  /** Semantic element for the flex container. Lists lose their chrome. */
  as?:
    | 'div'
    | 'section'
    | 'article'
    | 'nav'
    | 'header'
    | 'footer'
    | 'main'
    | 'aside'
    | 'form'
    | 'ul'
    | 'ol';
  direction?: 'column' | 'row';
  gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  [attribute: string]: unknown;
}

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: Crumb[];
  'aria-label'?: string;
}

export interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  elevated?: boolean;
}

export interface StatCardProps {
  value: string;
  label: string;
  tone?: 'accent' | 'accent-2' | 'default';
}

export interface Column {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
}

export interface TableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
}

export interface TimelineItem {
  content: string;
  title?: string;
  /** Semantic token key or any CSS color. accent | success | warning | error | accent-2 */
  color?: 'accent' | 'success' | 'warning' | 'error' | 'accent-2' | string;
  loading?: boolean;
  placement?: 'start' | 'end';
}

export interface TimelineProps {
  items: TimelineItem[];
  mode?: 'start' | 'alternate' | 'end';
  variant?: 'filled' | 'outlined';
  reverse?: boolean;
}
